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
      const docRef = doc(db, collectionName, docId);
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
        // Eğer ID bir object/array ise, JSON.stringify kullan
        if (Array.isArray(docId)) {
          throw new Error(`Doküman ID array olamaz: ${JSON.stringify(docId)}`);
        }
        // Eğer DocumentReference ise, id property'sini al
        if (docId.id) {
          stringId = String(docId.id);
        } else if (docId.toString) {
          stringId = docId.toString();
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
      
      // Trim yap ve kontrol et
      stringId = stringId.trim();
      
      // Son kontrol: Her iki parametre de kesinlikle string olmalı
      if (typeof stringCollectionName !== 'string') {
        throw new Error(`Collection name string değil! Type: ${typeof stringCollectionName}, Value: ${stringCollectionName}`);
      }
      if (typeof stringId !== 'string') {
        throw new Error(`Document ID string değil! Type: ${typeof stringId}, Value: ${stringId}`);
      }
      
      // Firebase DocumentReference oluştur - collection name ve docId mutlaka string olmalı
      console.log(`🔍 Creating doc reference:`, {
        collection: stringCollectionName,
        collectionType: typeof stringCollectionName,
        id: stringId,
        idType: typeof stringId,
        idLength: stringId.length,
        collectionIsString: typeof stringCollectionName === 'string',
        idIsString: typeof stringId === 'string'
      });
      
      // Firebase'in doc() fonksiyonunu çağırmadan önce son kontrol
      // Eğer hala sorun varsa, alternatif yöntem kullan
      let docRef;
      try {
        // Önce normal yöntemi dene
        docRef = doc(db, stringCollectionName, stringId);
        
        // docRef'in geçerli olduğunu kontrol et
        if (!docRef) {
          throw new Error('DocumentReference oluşturulamadı');
        }
      } catch (docError) {
        console.error('❌ doc() hatası:', docError);
        console.error('❌ doc() hatası detayları:', {
          db: typeof db,
          collectionName: stringCollectionName,
          collectionNameType: typeof stringCollectionName,
          docId: stringId,
          docIdType: typeof stringId,
          error: docError.message
        });
        throw new Error(`Firebase doc() hatası: ${docError.message}. Collection: "${stringCollectionName}", ID: "${stringId}"`);
      }
      
      // Dokümanı sil
      await deleteDoc(docRef);
      console.log(`✅ Document deleted from collection "${stringCollectionName}" with ID: ${stringId}`);
    } catch (error) {
      console.error(`❌ Error deleting document from ${collectionName}:`, error);
      console.error(`❌ Delete error details:`, {
        collectionName,
        collectionNameType: typeof collectionName,
        collectionNameString: String(collectionName),
        docId,
        docIdType: typeof docId,
        docIdValue: docId,
        docIdString: String(docId),
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

