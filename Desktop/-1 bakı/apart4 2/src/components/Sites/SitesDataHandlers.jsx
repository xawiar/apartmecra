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
    
    // Get current sites - use state first, then fetch if empty
    let currentSites = sites && sites.length > 0 ? sites : [];
    if (currentSites.length === 0) {
      try {
        currentSites = await getSitesHandler();
      } catch (error) {
        console.error('Error fetching sites:', error);
        currentSites = [];
      }
    }
    
    console.log('Current sites:', currentSites.map(s => ({ id: s.id, _docId: s._docId, name: s.name })));
    
    // Try to find site by custom ID or document ID (flexible matching)
    const siteToDelete = currentSites.find(s => {
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
    
    // If site not found in state, try to delete directly (deleteSite handles ID lookup)
    if (!siteToDelete) {
      console.log('Site not found in state, but attempting deletion anyway:', siteId);
      console.log('Available site IDs:', currentSites.map(s => ({ id: s.id, _docId: s._docId, name: s.name })));
      
      // Still ask for confirmation
      const result = await window.showConfirm(
        'Site Sil',
        `Siteyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
        'error'
      );
      
      if (result) {
        try {
          // Try deletion directly - deleteSite function handles both custom ID and document ID lookup
          const success = await deleteSite(siteId);
          console.log('deleteSite result:', success, 'siteId:', siteId);
          
          if (success) {
            // Refresh data to update state
            if (refreshData) {
              await refreshData();
            } else {
              // Fallback: manually refresh sites
              const updatedSites = await getSites();
              setSites(updatedSites);
            }
            
            await window.showAlert('Başarılı', 'Site başarıyla silindi.', 'success');
            return true;
          } else {
            await window.showAlert('Hata', 'Site silinirken bir hata oluştu.', 'error');
            return false;
          }
        } catch (error) {
          console.error('Error deleting site:', error);
          await window.showAlert('Hata', `Site silinirken bir hata oluştu: ${error.message}`, 'error');
          return false;
        }
      }
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

  // New function to delete all sites permanently
  const handleDeleteAllSites = async () => {
    // Get fresh sites data to ensure we have the latest state
    let currentSites = sites && sites.length > 0 ? sites : [];
    
    // If state is empty, try to fetch fresh data
    if (currentSites.length === 0) {
      try {
        const fetchedSites = await getSitesHandler();
        currentSites = fetchedSites || [];
      } catch (error) {
        console.error('Error fetching sites:', error);
        currentSites = [];
      }
    }
    
    if (!currentSites || currentSites.length === 0) {
      await window.showAlert(
        'Bilgi',
        'Silinecek site bulunmamaktadır.',
        'info'
      );
      return;
    }

    const result = await window.showConfirm(
      'Tüm Siteleri Kalıcı Olarak Sil',
      `Tüm ${currentSites.length} siteyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      'error'
    );
    
    if (result) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        // Create an array of promises for deleting all sites
        const deletePromises = currentSites.map(async (site) => {
          try {
            // Use site.id or site._docId, whichever is available
            const siteIdToDelete = site.id || site._docId;
            if (!siteIdToDelete) {
              console.error('Site has no ID:', site);
              errorCount++;
              return { success: false, siteId: null, error: 'Site has no ID' };
            }
            
            const success = await deleteSite(siteIdToDelete);
            if (success) {
              successCount++;
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Site kalıcı olarak silindi: ${site.name || siteIdToDelete}`
              });
              return { success: true, siteId: siteIdToDelete };
            } else {
              errorCount++;
              return { success: false, siteId: siteIdToDelete };
            }
          } catch (error) {
            console.error('Error deleting site:', site.id, error);
            errorCount++;
            return { success: false, siteId: site.id, error: error.message };
          }
        });
        
        // Wait for all delete operations to complete
        await Promise.all(deletePromises);
        
        // Update state to remove all sites
        setSites([]);
        
        // Refresh the sites data to ensure consistency
        if (refreshData) {
          await refreshData();
        }
        
        await window.showAlert(
          'İşlem Tamamlandı',
          `${successCount} site başarıyla silindi. ${errorCount} site silinirken hata oluştu.`,
          'info'
        );
      } catch (error) {
        console.error('Error deleting all sites:', error);
        await window.showAlert(
          'Hata',
          'Siteler silinirken bir hata oluştu: ' + error.message,
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