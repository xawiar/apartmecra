import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { encryptObject, decryptObject, SENSITIVE_FIELDS } from '../utils/crypto';

/**
 * Firebase Firestore Service
 * Tüm veriler şifrelenmiş olarak kaydedilir ve okunur
 */
class FirebaseService {
  /**
   * Authentication durumunu kontrol eder
   * @returns {Promise<boolean>} Kullanıcı authenticated mı?
   */
  static async checkAuth() {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        console.log('✅ User is authenticated:', auth.currentUser.uid);
        resolve(true);
      } else {
        // onAuthStateChanged ile kısa bir süre bekle
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
            console.log('✅ User authenticated:', user.uid);
            resolve(true);
          } else {
            console.warn('⚠️ User is NOT authenticated');
            resolve(false);
          }
        });
        
        // 1 saniye sonra timeout
        setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, 1000);
      }
    });
  }

  /**
   * Veriyi Firestore'a şifrelenmiş olarak kaydeder
   * Collection otomatik oluşturulur (Firestore özelliği)
   * @param {string} collectionName - Koleksiyon adı
   * @param {string} docId - Doküman ID (opsiyonel, yoksa otomatik oluşturulur)
   * @param {object} data - Kaydedilecek veri
   * @param {boolean} encrypt - Şifreleme yapılsın mı (default: true)
   * @returns {Promise<string>} Doküman ID
   */
  static async create(collectionName, docId, data, encrypt = true) {
    try {
      // Authentication kontrolü
      const isAuthenticated = await this.checkAuth();
      if (!isAuthenticated) {
        throw new Error('Kullanıcı giriş yapmamış. Lütfen önce giriş yapın.');
      }
      
      console.log('🔐 Current user:', auth.currentUser?.uid || 'No user');
      
      // Collection referansı oluştur (collection yoksa otomatik oluşturulur)
      const collectionRef = collection(db, collectionName);
      
      // Doküman ID'si yoksa otomatik oluştur (timestamp + random)
      const autoId = docId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(collectionRef, autoId);
      
      // Şifreleme yapılıyorsa hassas alanları şifrele
      const dataToSave = encrypt 
        ? encryptObject(data, SENSITIVE_FIELDS)
        : data;
      
      // Timestamp ve metadata ekle
      const finalData = {
        ...dataToSave,
        id: autoId, // ID'yi veri içinde de sakla
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        _collection: collectionName, // Hangi collection'da olduğunu işaretle
        _createdBy: auth.currentUser?.uid || null // Kim oluşturdu
      };
      
      // Dokümanı kaydet (collection yoksa otomatik oluşturulur)
      await setDoc(docRef, finalData);
      
      console.log(`✅ Document created in collection "${collectionName}" with ID: ${autoId}`);
      return autoId;
    } catch (error) {
      console.error(`❌ Error creating document in collection "${collectionName}":`, error);
      
      // Permission hatası için daha açıklayıcı mesaj
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        throw new Error('Firebase Security Rules hatası. Lütfen Firebase Console\'da Firestore Rules\'u güncelleyin. Detaylar için FIREBASE_SECURITY_RULES.md dosyasına bakın.');
      }
      
      throw error;
    }
  }

  /**
   * Dokümanı günceller
   * @param {string} collectionName - Koleksiyon adı
   * @param {string} docId - Doküman ID
   * @param {object} data - Güncellenecek veri
   * @param {boolean} encrypt - Şifreleme yapılsın mı
   * @returns {Promise<void>}
   */
  static async update(collectionName, docId, data, encrypt = true) {
    try {
      const docRef = doc(db, collectionName, docId);
      
      // Şifreleme yapılıyorsa hassas alanları şifrele
      const dataToUpdate = encrypt 
        ? encryptObject(data, SENSITIVE_FIELDS)
        : data;
      
      // ID ve collection bilgisini koru
      const finalData = {
        ...dataToUpdate,
        id: docId, // ID'yi koru
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, finalData);
      console.log(`✅ Document updated in collection "${collectionName}" with ID: ${docId}`);
    } catch (error) {
      console.error(`❌ Error updating document in collection "${collectionName}":`, error);
      throw error;
    }
  }

  /**
   * Dokümanı okur ve çözer
   * @param {string} collectionName - Koleksiyon adı
   * @param {string} docId - Doküman ID
   * @param {boolean} decrypt - Çözme yapılsın mı
   * @returns {Promise<object|null>} Doküman verisi
   */
  static async getById(collectionName, docId, decrypt = true) {
    try {
      // Ensure collectionName and docId are strings
      const safeCollectionName = String(collectionName || '').trim();
      const safeDocId = String(docId || '').trim();
      
      if (!safeCollectionName || !safeDocId) {
        throw new Error(`Invalid params for getById: collection="${safeCollectionName}", id="${safeDocId}"`);
      }
      
      if (typeof safeCollectionName !== 'string' || typeof safeDocId !== 'string') {
        throw new Error(`Params not strings for getById: collection type=${typeof safeCollectionName}, id type=${typeof safeDocId}`);
      }
      
      const docRef = doc(db, safeCollectionName, safeDocId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      let data = { 
        id: docSnap.id, 
        ...docSnap.data() 
      };
      
      // Timestamp'leri dönüştür
      if (data.createdAt?.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.updatedAt?.toDate) {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      
      // Çözme yapılıyorsa hassas alanları çöz
      return decrypt 
        ? decryptObject(data, SENSITIVE_FIELDS)
        : data;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Koleksiyondaki tüm dokümanları okur ve çözer
   * Collection yoksa boş array döner
   * @param {string} collectionName - Koleksiyon adı
   * @param {object} options - Query seçenekleri (where, orderBy, limit)
   * @param {boolean} decrypt - Çözme yapılsın mı
   * @returns {Promise<Array>} Doküman listesi
   */
  static async getAll(collectionName, options = {}, decrypt = true) {
    try {
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);
      
      // Where clauses
      if (options.where && Array.isArray(options.where)) {
        options.where.forEach(w => {
          q = query(q, where(w.field, w.operator || '==', w.value));
        });
      }
      
      // Order by
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
      }
      
      // Limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const docs = [];
      
      querySnapshot.forEach((docSnap) => {
        let data = { 
          id: String(docSnap.id), // ID'yi mutlaka string'e çevir
          ...docSnap.data() 
        };
        
        // Eğer data içinde id property'si varsa, onu da string'e çevir
        if (data.id) {
          data.id = String(data.id);
        }
        
        // Timestamp'leri dönüştür
        if (data.createdAt?.toDate) {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt?.toDate) {
          data.updatedAt = data.updatedAt.toDate().toISOString();
        }
        
        // Çözme yapılıyorsa hassas alanları çöz
        const decryptedData = decrypt 
          ? decryptObject(data, SENSITIVE_FIELDS)
          : data;
        
        // Decrypt sonrası da ID'yi string'e çevir (decryptObject ID'yi değiştirebilir)
        if (decryptedData) {
          decryptedData.id = String(decryptedData.id || docSnap.id);
        }
        
        docs.push(decryptedData);
      });
      
      console.log(`📖 Retrieved ${docs.length} documents from collection "${collectionName}"`);
      return docs;
    } catch (error) {
      // Collection yoksa boş array döner (hata değil)
      if (error.code === 'not-found' || error.code === 'permission-denied') {
        console.warn(`⚠️ Collection "${collectionName}" not found or empty, returning empty array`);
        return [];
      }
      console.error(`❌ Error getting documents from collection "${collectionName}":`, error);
      throw error;
    }
  }

  /**
   * Dokümanı siler
   * @param {string} collectionName - Koleksiyon adı
   * @param {string} docId - Doküman ID
   * @returns {Promise<void>}
   */
  static async delete(collectionName, docId) {
    try {
      // CRITICAL: Log raw parameters BEFORE any conversion
      console.error('[FIREBASE DELETE] RAW PARAMS:', {
        collectionName: collectionName,
        collectionNameType: typeof collectionName,
        collectionNameValue: collectionName,
        collectionNameIsNull: collectionName === null,
        collectionNameIsUndefined: collectionName === undefined,
        docId: docId,
        docIdType: typeof docId,
        docIdValue: docId,
        docIdIsNull: docId === null,
        docIdIsUndefined: docId === undefined,
        docIdIsArray: Array.isArray(docId),
        docIdIsObject: typeof docId === 'object' && docId !== null
      });
      
      // Collection name'i string'e çevir
      const stringCollectionName = String(collectionName || '').trim();
      if (!stringCollectionName) {
        throw new Error(`Geçersiz collection name: ${collectionName}`);
      }
      
      // ID'yi mutlaka string'e çevir (Firebase string bekler)
      let stringId;
      
      if (docId === null || docId === undefined) {
        throw new Error(`Doküman ID null veya undefined: ${docId}`);
      }
      
      // ID'nin tipine göre string'e çevir
      if (typeof docId === 'object') {
        if (Array.isArray(docId)) {
          throw new Error(`Doküman ID array olamaz: ${JSON.stringify(docId)}`);
        }
        if (docId.id) {
          stringId = String(docId.id);
        } else if (docId.toString && typeof docId.toString === 'function') {
          stringId = String(docId.toString());
        } else {
          stringId = JSON.stringify(docId);
        }
      } else if (typeof docId === 'number') {
        stringId = String(docId);
      } else {
        stringId = String(docId);
      }
      
      // Boş string kontrolü
      if (!stringId || stringId.trim() === '' || stringId === 'undefined' || stringId === 'null' || stringId === '[object Object]') {
        throw new Error(`Geçersiz doküman ID: ${docId} (stringId: ${stringId}, type: ${typeof docId})`);
      }
      
      // Trim yap
      stringId = stringId.trim();
      
      // Final validation: Kesinlikle string olmalılar
      if (typeof stringCollectionName !== 'string' || typeof stringId !== 'string') {
        throw new Error(`Parametreler string değil! Collection: ${typeof stringCollectionName}, ID: ${typeof stringId}`);
      }
      
      // db instance kontrolü
      if (!db || typeof db !== 'object') {
        throw new Error(`Firebase db instance geçersiz! Type: ${typeof db}`);
      }
      
      // Use console.error so it's never minified out
      console.error(`[FIREBASE DELETE] Final params:`, {
        collection: stringCollectionName,
        collectionType: typeof stringCollectionName,
        id: stringId,
        idType: typeof stringId,
        dbValid: !!db && typeof db === 'object'
      });
      
      // CRITICAL FIX: Firebase'in doc() fonksiyonunu 3 parametre ile çağır
      // doc(db, collectionPath, documentPath) - TÜM parametreler string olmalı
      // Bu Firebase'in resmi API'si ve path parsing sorunlarını önler
      
      // Son kontrol: Tüm parametreler kesinlikle string ve geçerli mi?
      // Triple-check: Her parametreyi 3 kez string'e çevir
      let finalCollectionName = stringCollectionName;
      let finalDocId = stringId;
      
      // İlk dönüşüm
      finalCollectionName = String(finalCollectionName || '').trim();
      finalDocId = String(finalDocId || '').trim();
      
      // İkinci dönüşüm (güvenlik için)
      finalCollectionName = String(finalCollectionName).trim();
      finalDocId = String(finalDocId).trim();
      
      // Üçüncü kontrol
      if (!finalCollectionName || !finalDocId) {
        throw new Error(`Final params invalid: collection="${finalCollectionName}", id="${finalDocId}"`);
      }
      
      // Type kontrolü
      if (typeof finalCollectionName !== 'string' || typeof finalDocId !== 'string') {
        throw new Error(`Final params not strings: collection type=${typeof finalCollectionName}, id type=${typeof finalDocId}`);
      }
      
      // Boş string kontrolü
      if (finalCollectionName.length === 0 || finalDocId.length === 0) {
        throw new Error(`Final params empty: collection length=${finalCollectionName.length}, id length=${finalDocId.length}`);
      }
      
      // Use console.error so it's never minified out
      console.error(`[FIREBASE DELETE] Calling doc() with (VALIDATED):`, {
        dbType: typeof db,
        dbValid: !!db && typeof db === 'object',
        collection: finalCollectionName,
        collectionType: typeof finalCollectionName,
        collectionLength: finalCollectionName.length,
        id: finalDocId,
        idType: typeof finalDocId,
        idLength: finalDocId.length,
        collectionIsString: typeof finalCollectionName === 'string',
        idIsString: typeof finalDocId === 'string'
      });
      
      // ALTERNATIVE METHOD: Use collection() then doc() pattern
      // This is the recommended Firebase pattern and avoids path parsing issues
      let docRef;
      try {
        // Final validation: All params must be strings
        if (typeof finalCollectionName !== 'string' || typeof finalDocId !== 'string') {
          throw new Error(`Params not strings before doc() call: collection=${typeof finalCollectionName}, id=${typeof finalDocId}`);
        }
        
        // Validate string values are not empty
        if (!finalCollectionName || !finalDocId || finalCollectionName.length === 0 || finalDocId.length === 0) {
          throw new Error(`Params empty: collection="${finalCollectionName}", id="${finalDocId}"`);
        }
        
        // CRITICAL: Validate params one more time RIGHT before doc() call
        // This is the last chance to catch any type issues
        const validatedCollectionName = String(finalCollectionName).trim();
        const validatedDocId = String(finalDocId).trim();
        
        if (typeof validatedCollectionName !== 'string' || typeof validatedDocId !== 'string') {
          throw new Error(`FINAL CHECK FAILED: collection type=${typeof validatedCollectionName}, id type=${typeof validatedDocId}`);
        }
        
        if (validatedCollectionName.length === 0 || validatedDocId.length === 0) {
          throw new Error(`FINAL CHECK FAILED: collection length=${validatedCollectionName.length}, id length=${validatedDocId.length}`);
        }
        
        // Method 1: Try collection() + doc() pattern (recommended)
        // BUT: collection() might also fail if params are not strings
        try {
          // Validate BEFORE collection() call
          if (typeof validatedCollectionName !== 'string') {
            throw new Error(`Collection name not string before collection() call: type=${typeof validatedCollectionName}, value=${validatedCollectionName}`);
          }
          if (typeof validatedDocId !== 'string') {
            throw new Error(`Doc ID not string before collection() call: type=${typeof validatedDocId}, value=${validatedDocId}`);
          }
          
          console.error('[FIREBASE DELETE] Calling collection() with:', {
            collectionName: validatedCollectionName,
            collectionNameType: typeof validatedCollectionName,
            collectionNameValue: validatedCollectionName
          });
          
          const collectionRef = collection(db, validatedCollectionName);
          
          console.error('[FIREBASE DELETE] collection() succeeded, calling doc() with:', {
            docId: validatedDocId,
            docIdType: typeof validatedDocId,
            docIdValue: validatedDocId
          });
          
          docRef = doc(collectionRef, validatedDocId);
          console.error('[FIREBASE DELETE] ✅ doc() created using collection() + doc() pattern');
        } catch (method1Error) {
          console.error('[FIREBASE DELETE] ⚠️ Method 1 failed:', method1Error.message, method1Error);
          console.error('[FIREBASE DELETE] Method 1 error stack:', method1Error.stack);
          
          // Method 2: Direct doc() call (fallback)
          // One more validation before direct call
          if (typeof validatedCollectionName !== 'string' || typeof validatedDocId !== 'string') {
            throw new Error(`Method 2 validation failed: collection type=${typeof validatedCollectionName}, id type=${typeof validatedDocId}`);
          }
          
          console.error('[FIREBASE DELETE] Trying direct doc() call with:', {
            collection: validatedCollectionName,
            collectionType: typeof validatedCollectionName,
            collectionValue: validatedCollectionName,
            id: validatedDocId,
            idType: typeof validatedDocId,
            idValue: validatedDocId
          });
          
          docRef = doc(db, validatedCollectionName, validatedDocId);
          console.error('[FIREBASE DELETE] ✅ doc() created using direct doc() call');
        }
        
        if (!docRef) {
          throw new Error('DocumentReference oluşturulamadı - docRef null/undefined');
        }
      } catch (docError) {
        console.error('❌ Firebase doc() CALL FAILED:', docError);
        console.error('❌ doc() error details:', {
          db: !!db,
          dbType: typeof db,
          dbIsNull: db === null,
          dbIsUndefined: db === undefined,
          collection: finalCollectionName,
          collectionType: typeof finalCollectionName,
          collectionValue: finalCollectionName,
          collectionLength: finalCollectionName?.length,
          id: finalDocId,
          idType: typeof finalDocId,
          idValue: finalDocId,
          idLength: finalDocId?.length,
          errorMessage: docError.message,
          errorStack: docError.stack?.substring(0, 500)
        });
        throw new Error(`Firebase doc() hatası: ${docError.message}. Collection: "${finalCollectionName}", ID: "${finalDocId}"`);
      }
      
      // Dokümanı sil
      await deleteDoc(docRef);
      console.log(`✅ Document deleted from collection "${finalCollectionName}" with ID: ${finalDocId}`);
    } catch (error) {
      console.error(`❌ Error deleting document from ${collectionName}:`, error);
      console.error(`❌ Delete error details:`, {
        collectionName,
        collectionNameType: typeof collectionName,
        docId,
        docIdType: typeof docId,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack?.substring(0, 500)
      });
      throw error;
    }
  }

  /**
   * Belirli bir alana göre doküman bulur
   * @param {string} collectionName - Koleksiyon adı
   * @param {string} field - Alan adı
   * @param {any} value - Değer
   * @param {boolean} decrypt - Çözme yapılsın mı
   * @returns {Promise<Array>} Doküman listesi
   */
  static async findByField(collectionName, field, value, decrypt = true) {
    try {
      return await this.getAll(
        collectionName, 
        { 
          where: [{ field, operator: '==', value }] 
        }, 
        decrypt
      );
    } catch (error) {
      console.error(`❌ Error finding documents by field "${field}" in collection "${collectionName}":`, error);
      return [];
    }
  }

  /**
   * Collection'ın var olup olmadığını kontrol eder
   * @param {string} collectionName - Koleksiyon adı
   * @returns {Promise<boolean>} Collection var mı?
   */
  static async collectionExists(collectionName) {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(query(collectionRef, limit(1)));
      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  }
}

export default FirebaseService;

