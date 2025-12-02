import { getSites, createSite, updateSite, deleteSite, archiveSite } from '../../services/api';
import { getTransactions, createTransaction } from '../../services/api';
import { createLog } from '../../services/api';
import { getAgreements } from '../../services/api';
import { getCompanies } from '../../services/api';

const SitesDataHandlers = ({
  sites, setSites,
  transactions, setTransactions,
  agreements, setAgreements,
  companies, setCompanies,
  refreshData
}) => {
  // API functions
  const getSitesHandler = async () => {
    try {
      return await getSites();
    } catch (error) {
      console.error('Error fetching sites:', error);
      return [];
    }
  };

  const getTransactionsHandler = async () => {
    try {
      return await getTransactions();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  const getAgreementsHandler = async () => {
    try {
      return await getAgreements();
    } catch (error) {
      console.error('Error fetching agreements:', error);
      return [];
    }
  };

  const getCompaniesHandler = async () => {
    try {
      return await getCompanies();
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  };

  const handleArchiveSite = async (siteId) => {
    const siteName = sites.find(s => s.id === siteId)?.name || 'Bilinmeyen Site';
    
    const result = await window.showConfirm(
      'Site Arşivle',
      `${siteName} isimli siteyi arşivlemek istediğinize emin misiniz?`,
      'warning'
    );
    
    if (result) {
      try {
        const archiveResult = await archiveSite(siteId);
        if (archiveResult && archiveResult.success !== false) {
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Site arşivlendi: ${siteName}`
          });
          
          // Refresh data to get updated list (without archived sites)
          if (refreshData) {
            await refreshData(true); // Force refresh
          } else {
            // Fallback: Remove from local state
            setSites(sites.filter(site => site.id !== siteId));
          }
          
          await window.showAlert(
            'Başarılı',
            'Site başarıyla arşivlendi.',
            'success'
          );
          return true;
        } else {
          await window.showAlert(
            'Hata',
            'Site arşivlenirken bir hata oluştu.',
            'error'
          );
          return false;
        }
      } catch (error) {
        console.error('Error archiving site:', error);
        await window.showAlert(
          'Hata',
          'Site arşivlenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
          'error'
        );
        return false;
      }
    }
    return false;
  };

  // Gerçek silme fonksiyonu
  const handleDeleteSite = async (siteId) => {
    console.log('handleDeleteSite called with siteId:', siteId);
    console.log('Current sites:', sites.map(s => ({ id: s.id, _docId: s._docId, name: s.name })));
    
    // Try to find site by custom ID or document ID (flexible matching)
    const siteToDelete = sites.find(s => {
      // Exact match
      if (s.id === siteId || s._docId === siteId) return true;
      // String comparison
      if (s.id && s.id.toString() === siteId.toString()) return true;
      if (s._docId && s._docId.toString() === siteId.toString()) return true;
      // Also check if siteId might be the document ID (for old sites without _docId)
      if (!s._docId && s.id === siteId) return true;
      return false;
    });
    
    const siteName = siteToDelete?.name || 'Bilinmeyen Site';
    
    if (!siteToDelete) {
      console.error('Site not found in state:', siteId);
      console.error('Available site IDs:', sites.map(s => ({ id: s.id, _docId: s._docId, name: s.name })));
      await window.showAlert(
        'Hata',
        'Site state\'te bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.',
        'error'
      );
      return false;
    }
    
    // Try both custom ID and document ID for deletion
    // deleteSite function handles both, but we'll try custom ID first, then document ID
    const idToDelete = siteToDelete.id || siteToDelete._docId || siteId;
    
    const result = await window.showConfirm(
      'Site Sil',
      `${siteName} isimli siteyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      'error'
    );
    
    if (result) {
      try {
        const success = await deleteSite(idToDelete);
        console.log('deleteSite result:', success, 'idToDelete:', idToDelete);
        
        if (success) {
          // Use functional update to ensure we have the latest state
          setSites(prevSites => {
            const filtered = prevSites.filter(site => {
              // Remove if it matches by custom ID, document ID, or both
              const shouldRemove = site.id === idToDelete || 
                                   site._docId === idToDelete ||
                                   site.id === siteToDelete.id ||
                                   site._docId === siteToDelete._docId;
              if (shouldRemove) {
                console.log('Removing site from state:', site.id, site._docId, site.name);
              }
              return !shouldRemove;
            });
            console.log('Sites after filter:', filtered.length, 'remaining');
            return filtered;
          });
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Site kalıcı olarak silindi: ${siteName}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Site başarıyla silindi.',
            'success'
          );
          return true;
        } else {
          await window.showAlert(
            'Hata',
            'Site silinirken bir hata oluştu.',
            'error'
          );
          return false;
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        await window.showAlert(
          'Hata',
          'Site silinirken bir hata oluştu.',
          'error'
        );
        return false;
      }
    }
    return false;
  };

  // New function to delete all sites and archive them
  const handleDeleteAllSites = async () => {
    if (sites.length === 0) {
      await window.showAlert(
        'Bilgi',
        'Silinecek site bulunmamaktadır.',
        'info'
      );
      return;
    }

    const result = await window.showConfirm(
      'Tüm Siteleri Sil',
      `Tüm ${sites.length} siteyi arşivlemek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      'warning'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        // Create an array of promises for archiving all sites
        const archivePromises = sites.map(async (site) => {
          try {
            const success = await archiveSite(site.id);
            if (success) {
              successCount++;
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Site arşivlendi: ${site.name}`
              });
              return { success: true, siteId: site.id };
            } else {
              errorCount++;
              return { success: false, siteId: site.id };
            }
          } catch (error) {
            console.error('Error archiving site:', site.id, error);
            errorCount++;
            return { success: false, siteId: site.id, error: error.message };
          }
        });
        
        // Wait for all archive operations to complete
        await Promise.all(archivePromises);
        
        // Update state to remove all sites
        setSites([]);
        
        // Refresh the sites data to ensure consistency
        if (refreshData) {
          await refreshData();
        }
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} site başarıyla arşivlendi. ${errorCount} site arşivlenirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all sites:', error);
        await window.showAlert(
          'Hata',
          'Siteler arşivlenirken bir hata oluştu: ' + error.message,
          'error'
        );
      }
    }
  };

  return {
    getSites: getSitesHandler,
    getTransactions: getTransactionsHandler,
    getAgreements: getAgreementsHandler,
    getCompanies: getCompaniesHandler,
    handleArchiveSite,
    handleDeleteSite,
    handleDeleteAllSites
  };
};

export default SitesDataHandlers;