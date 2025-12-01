import { createSite, updateSite } from '../../services/api';
import { createLog } from '../../services/api';

const SitesFormHandlers = ({
  sites, setSites,
  currentSite, setCurrentSite,
  setShowAddForm,
  setFormData,
  formData,
  calculateTotalElevators,
  calculatePanels,
  calculateAveragePeople,
  refreshData
}) => {
  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Get current formData from the event target if available, otherwise use prop
    const currentFormData = formData || {};
    console.log('Form submitted with data:', currentFormData);
    console.log('FormData keys:', Object.keys(currentFormData));
    console.log('FormData values:', Object.values(currentFormData));
    
    // Use currentFormData for validation
    const data = currentFormData;
    
    // Form validation - Temel alanlar
    if (!data.name || !data.manager) {
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Eksik Bilgi',
          'Lütfen zorunlu alanları doldurunuz (Site Adı ve Yönetici Adı).',
          'warning'
        );
      } else {
        alert('Lütfen zorunlu alanları doldurunuz (Site Adı ve Yönetici Adı).');
      }
      return;
    }

    // Site tipine göre özel validasyonlar
    if (data.siteType === 'site') {
      // Site için daire sayısı zorunlu
      if (!data.apartmentCount || parseInt(data.apartmentCount) <= 0) {
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Eksik Bilgi',
            'Site için daire sayısını girmeniz gerekiyor.',
            'warning'
          );
        } else {
          alert('Site için daire sayısını girmeniz gerekiyor.');
        }
        return;
      }
    } else if (data.siteType === 'business_center') {
      // İş merkezi için manuel panel sayısı validasyonu
      if (!data.manualPanels || parseInt(data.manualPanels) <= 0) {
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Eksik Bilgi',
            'İş merkezi için panel sayısını girmeniz gerekiyor.',
            'warning'
          );
        } else {
          alert('İş merkezi için panel sayısını girmeniz gerekiyor.');
        }
        return;
      }
      
      // İş merkezi için işyeri sayısı zorunlu
      if (!data.businessCount || parseInt(data.businessCount) <= 0) {
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Eksik Bilgi',
            'İş merkezi için işyeri sayısını girmeniz gerekiyor.',
            'warning'
          );
        } else {
          alert('İş merkezi için işyeri sayısını girmeniz gerekiyor.');
        }
        return;
      }
      
      // İş merkezi için kişi sayısı zorunlu
      if (!data.peopleCount || parseInt(data.peopleCount) <= 0) {
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Eksik Bilgi',
            'İş merkezine giren kişi sayısını girmeniz gerekiyor.',
            'warning'
          );
        } else {
          alert('İş merkezine giren kişi sayısını girmeniz gerekiyor.');
        }
        return;
      }
    }
    
    // Prepare data with calculated fields
    const siteData = {
      ...data,
      elevators: calculateTotalElevators(data.blocks, data.elevatorsPerBlock),
      panels: data.siteType === 'business_center' 
        ? parseInt(data.manualPanels) || 0
        : calculatePanels(data.blocks, data.elevatorsPerBlock),
      // Site için ortalama insan sayısını hesapla
      averagePeople: data.siteType === 'site' 
        ? calculateAveragePeople(data.apartmentCount)
        : data.averagePeople || 0
    };
    
    console.log('Site data to be saved:', siteData);
    
    try {
      if (currentSite) {
        // Update existing site
        console.log('Updating existing site:', currentSite.id);
        const updatedSite = await updateSite(currentSite.id, siteData);
        console.log('Update result:', updatedSite);
        if (updatedSite) {
          setSites(sites.map(site => site.id === currentSite.id ? updatedSite : site));
          setShowAddForm(false);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Site güncellendi: ${siteData.name}`
          });
          
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              'Site başarıyla güncellendi.',
              'success'
            );
          } else {
            alert('Site başarıyla güncellendi.');
          }
        } else {
          throw new Error('Site güncelleme işlemi başarısız oldu');
        }
      } else {
        // Create new site
        console.log('Creating new site');
        const newSite = await createSite(siteData);
        console.log('Create result:', newSite);
        if (newSite) {
          setSites([...sites, newSite]);
          setShowAddForm(false);
          // Reset form data
          setFormData({
            name: '',
            manager: '',
            phone: '',
            blocks: '',
            elevatorsPerBlock: '',
            agreementPercentage: '',
            notes: '',
            neighborhood: '',
            siteType: 'site',
            manualPanels: '',
            apartmentCount: '',
            averagePeople: '',
            businessCount: '',
            peopleCount: ''
          });
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Yeni ${data.siteType === 'business_center' ? 'iş merkezi' : 'site'} eklendi: ${siteData.name}`
          });
          
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              `Yeni ${data.siteType === 'business_center' ? 'iş merkezi' : 'site'} başarıyla eklendi.`,
              'success'
            );
          } else {
            alert('Yeni site başarıyla eklendi.');
          }
        } else {
          throw new Error('Site oluşturma işlemi başarısız oldu');
        }
      }
    } catch (error) {
      console.error('Error saving site:', error);
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          `Site kaydedilirken bir hata oluştu: ${error.message}`,
          'error'
        );
      } else {
        alert(`Site kaydedilirken bir hata oluştu: ${error.message}`);
      }
    }
  };

  return {
    handleFormSubmit
  };
};

export default SitesFormHandlers;