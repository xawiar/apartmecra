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
    
    console.log('Form submitted with data:', formData);
    
    // Form validation - Temel alanlar
    if (!formData.name || !formData.manager) {
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
    if (formData.siteType === 'site') {
      // Site için daire sayısı zorunlu
      if (!formData.apartmentCount || parseInt(formData.apartmentCount) <= 0) {
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
    } else if (formData.siteType === 'business_center') {
      // İş merkezi için manuel panel sayısı validasyonu
      if (!formData.manualPanels || parseInt(formData.manualPanels) <= 0) {
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
      if (!formData.businessCount || parseInt(formData.businessCount) <= 0) {
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
      if (!formData.peopleCount || parseInt(formData.peopleCount) <= 0) {
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
      ...formData,
      elevators: calculateTotalElevators(formData.blocks, formData.elevatorsPerBlock),
      panels: formData.siteType === 'business_center' 
        ? parseInt(formData.manualPanels) || 0
        : calculatePanels(formData.blocks, formData.elevatorsPerBlock),
      // Site için ortalama insan sayısını hesapla
      averagePeople: formData.siteType === 'site' 
        ? calculateAveragePeople(formData.apartmentCount)
        : formData.averagePeople || 0
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
            action: `Yeni ${formData.siteType === 'business_center' ? 'iş merkezi' : 'site'} eklendi: ${siteData.name}`
          });
          
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Başarılı',
              `Yeni ${formData.siteType === 'business_center' ? 'iş merkezi' : 'site'} başarıyla eklendi.`,
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