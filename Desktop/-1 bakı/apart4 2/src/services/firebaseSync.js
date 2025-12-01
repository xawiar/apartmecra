// Firebase Senkronizasyon Servisi
// Tüm işlemlerin Firebase ile senkronize olmasını sağlar

import { 
  createLog,
  batchUpdate,
  batchCreate,
  batchDelete
} from './firebaseDb.js';

// Senkronizasyon durumunu takip etmek için
// Firebase sync is PERMANENTLY DISABLED - Local mode only
const syncStatus = {
  isEnabled: false, // ALWAYS disabled - Local mode only
  lastSync: null,
  pendingOperations: []
};

// Senkronizasyon logları
const syncLogs = [];

/**
 * Tüm işlemleri Firebase ile senkronize et
 */
export const syncWithFirebase = async (operation, data, collection = null) => {
  // Firebase sync is PERMANENTLY DISABLED - Always return early
  console.warn('🚫 Firebase senkronizasyonu devre dışı - Lokal mod aktif');
  return { success: false, error: 'Senkronizasyon devre dışı - Lokal mod' };

  try {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Senkronizasyon işlemini logla
    const syncLog = {
      id: syncId,
      operation,
      data,
      collection,
      timestamp,
      status: 'pending'
    };

    syncLogs.push(syncLog);
    syncStatus.pendingOperations.push(syncId);

    console.log(`🔄 Firebase senkronizasyonu başlatıldı: ${operation}`, {
      syncId,
      collection,
      data: data ? Object.keys(data) : 'N/A'
    });

    // İşlem tipine göre senkronizasyon yap
    let result;
    switch (operation) {
      case 'create':
        result = await syncCreate(data, collection);
        break;
      case 'update':
        result = await syncUpdate(data, collection);
        break;
      case 'delete':
        result = await syncDelete(data, collection);
        break;
      case 'batch_update':
        result = await syncBatchUpdate(data, collection);
        break;
      case 'batch_create':
        result = await syncBatchCreate(data, collection);
        break;
      case 'batch_delete':
        result = await syncBatchDelete(data, collection);
        break;
      default:
        result = { success: false, error: `Bilinmeyen işlem: ${operation}` };
    }

    // Senkronizasyon sonucunu güncelle
    syncLog.status = result.success ? 'completed' : 'failed';
    syncLog.result = result;
    syncStatus.lastSync = timestamp;

    // Pending operations'dan çıkar
    const index = syncStatus.pendingOperations.indexOf(syncId);
    if (index > -1) {
      syncStatus.pendingOperations.splice(index, 1);
    }

    // Senkronizasyon logunu kaydet
    await createLog({
      user: 'System',
      action: `Firebase Sync: ${operation}`,
      details: {
        syncId,
        collection,
        success: result.success,
        error: result.error || null
      }
    });

    console.log(`✅ Firebase senkronizasyonu tamamlandı: ${operation}`, {
      syncId,
      success: result.success,
      error: result.error
    });

    return result;

  } catch (error) {
    console.error('Firebase senkronizasyon hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create işlemi senkronizasyonu
 */
const syncCreate = async (data, collection) => {
  try {
    // Collection'a göre özel işlemler
    if (collection === 'sites') {
      // Site oluşturulduğunda kullanıcı da oluştur
      const siteUser = {
        email: `${data.id}@site.local`,
        password: data.phone || data.id,
        role: 'site_user',
        siteId: data.id,
        username: data.id
      };
      
      // Kullanıcı oluşturma işlemi burada yapılacak
      console.log('Site kullanıcısı oluşturulacak:', siteUser);
    }
    
    if (collection === 'companies') {
      // Firma oluşturulduğunda kullanıcı da oluştur
      const companyUser = {
        email: `${data.id}@company.local`,
        password: data.phone || data.id,
        role: 'company',
        companyId: data.id,
        username: data.id
      };
      
      console.log('Firma kullanıcısı oluşturulacak:', companyUser);
    }

    return { success: true, message: 'Create senkronizasyonu başarılı' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update işlemi senkronizasyonu
 */
const syncUpdate = async (data, collection) => {
  try {
    // Güncelleme işlemi için özel kontroller
    if (collection === 'sites' && data.phone) {
      // Site telefonu değiştiğinde kullanıcı şifresini güncelle
      console.log(`Site ${data.id} telefonu güncellendi, kullanıcı şifresi güncellenecek`);
    }
    
    if (collection === 'companies' && data.phone) {
      // Firma telefonu değiştiğinde kullanıcı şifresini güncelle
      console.log(`Firma ${data.id} telefonu güncellendi, kullanıcı şifresi güncellenecek`);
    }

    return { success: true, message: 'Update senkronizasyonu başarılı' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete işlemi senkronizasyonu
 */
const syncDelete = async (data, collection) => {
  try {
    if (collection === 'sites') {
      // Site silindiğinde kullanıcıyı da sil
      console.log(`Site ${data.id} silindi, kullanıcı ${data.id}@site.local silinecek`);
    }
    
    if (collection === 'companies') {
      // Firma silindiğinde kullanıcıyı da sil
      console.log(`Firma ${data.id} silindi, kullanıcı ${data.id}@company.local silinecek`);
    }

    return { success: true, message: 'Delete senkronizasyonu başarılı' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Batch update senkronizasyonu
 */
const syncBatchUpdate = async (updates, collection) => {
  try {
    const result = await batchUpdate(collection, updates);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Batch create senkronizasyonu
 */
const syncBatchCreate = async (data, collection) => {
  try {
    const result = await batchCreate(collection, data);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Batch delete senkronizasyonu
 */
const syncBatchDelete = async (docIds, collection) => {
  try {
    const result = await batchDelete(collection, docIds);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Senkronizasyon durumunu getir
 */
export const getSyncStatus = () => {
  return {
    ...syncStatus,
    totalLogs: syncLogs.length,
    recentLogs: syncLogs.slice(-10) // Son 10 log
  };
};

/**
 * Senkronizasyonu etkinleştir/devre dışı bırak
 * DISABLED - Firebase sync is permanently disabled (Local mode only)
 */
export const setSyncEnabled = (enabled) => {
  // Always keep disabled - Local mode only
  syncStatus.isEnabled = false;
  console.log('🚫 Firebase senkronizasyonu devre dışı - Lokal mod aktif (değiştirilemez)');
};

/**
 * Pending operations'ları temizle
 */
export const clearPendingOperations = () => {
  syncStatus.pendingOperations = [];
  console.log('Pending operations temizlendi');
};

/**
 * Senkronizasyon loglarını getir
 */
export const getSyncLogs = (limit = 50) => {
  return syncLogs.slice(-limit);
};

export default {
  syncWithFirebase,
  getSyncStatus,
  setSyncEnabled,
  clearPendingOperations,
  getSyncLogs
};
