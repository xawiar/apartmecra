import * as XLSX from 'xlsx';
import { getSites, createSite, updateSite } from '../../services/api';
import { createLog } from '../../services/api';

const SitesExcelHandlers = ({
  sites, setSites,
  refreshData
}) => {
  // Handle Excel file import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'xlsx' && fileType !== 'xls') {
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          'Lütfen geçerli bir Excel dosyası yükleyin (.xlsx veya .xls)',
          'error'
        );
      } else {
        alert('Lütfen geçerli bir Excel dosyası yükleyin (.xlsx veya .xls)');
      }
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          'Dosya boyutu 5MB\'dan büyük olamaz',
          'error'
        );
      } else {
        alert('Dosya boyutu 5MB\'dan büyük olamaz');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with proper header handling (header: 1 means array of arrays)
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Check if file has data
        if (!data || data.length === 0) {
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Uyarı',
              'Excel dosyasında içe aktarılacak veri bulunamadı. Lütfen şablonu kullandığınızdan emin olun.',
              'warning'
            );
          } else {
            alert('Excel dosyasında içe aktarılacak veri bulunamadı. Lütfen şablonu kullandığınızdan emin olun.');
          }
          return;
        }
        
        // Check if first row is header (contains expected header text)
        let startRow = 0;
        const firstRow = data[0] || [];
        const firstRowText = firstRow.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
        
        // Check if first row looks like a header (contains keywords)
        if (firstRowText.includes('site adı') || 
            firstRowText.includes('mahalle') || 
            firstRowText.includes('yönetici') ||
            firstRowText.includes('site türü')) {
          startRow = 1; // Skip header row
        }
        
        // Check if we have data rows after header
        if (data.length <= startRow) {
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Uyarı',
              'Excel dosyasında içe aktarılacak veri bulunamadı. Lütfen şablonu kullandığınızdan emin olun.',
              'warning'
            );
          } else {
            alert('Excel dosyasında içe aktarılacak veri bulunamadı. Lütfen şablonu kullandığınızdan emin olun.');
          }
          return;
        }
        
        // Process the data (skip header row if present)
        const sitesToImport = [];
        const skippedRows = [];
        
        for (let i = startRow; i < data.length; i++) {
          const row = data[i];
          
          // Skip completely empty rows
          if (!row || row.length === 0 || (row.length === 1 && !row[0])) {
            continue;
          }
          
          // Ensure we have at least 13 columns (A-M) by padding with empty strings if needed
          while (row.length < 13) {
            row.push('');
          }
          
          // Convert all values to strings and trim whitespace
          const cleanRow = row.map(cell => {
            if (cell === null || cell === undefined) {
              return '';
            }
            return String(cell).trim();
          });
          
          // Debug: Log the row being processed
          console.log(`Processing row ${i + 1}:`, cleanRow);
          
          // Map Excel columns to site data (A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12)
          // E1 sütununda 1 = site, 2 = iş merkezi
          const e1Value = cleanRow[4] ? String(cleanRow[4]).trim() : '';
          const siteType = (e1Value === '2' || e1Value === '2.0') ? 'business_center' : 'site';
          
          const siteData = {
            name: cleanRow[0] || '',                    // A: Site Adı
            neighborhood: cleanRow[1] || '',             // B: Mahalle
            manager: cleanRow[2] || '',                 // C: Yönetici Adı
            phone: cleanRow[3] || '',                   // D: Yönetici İletişim (şifre olarak kullanılacak)
            siteType: siteType,                         // E: Site Türü (1=site, 2=iş merkezi)
            blocks: cleanRow[5] || '',                   // F: Blok Sayısı
            elevatorsPerBlock: cleanRow[6] || '',        // G: 1 Blok için Asansör Sayısı
            agreementPercentage: cleanRow[7] || '',     // H: Anlaşma Yüzdesi
            apartmentCount: cleanRow[8] || '',          // I: Daire Sayısı (Site için)
            averagePeople: cleanRow[9] || '',           // J: Ortalama İnsan Sayısı (Site için - otomatik)
            businessCount: cleanRow[10] || '',          // K: İşyeri Sayısı (İş Merkezi için)
            peopleCount: cleanRow[11] || '',           // L: İş Merkezine Giren Kişi Sayısı (İş Merkezi için)
            notes: cleanRow[12] || ''                   // M: Not
          };
          
          // Şifre kontrolü: phone boşsa 123456, değilse phone değeri
          if (!siteData.phone || siteData.phone.trim() === '') {
            siteData.phone = '123456';
          }
          
          console.log(`Parsed site data for row ${i + 1}:`, siteData);
          
          // Validate required fields
          if (!siteData.name) {
            skippedRows.push(`Satır ${i+1}: Site adı eksik`);
            continue;
          }
          
          if (!siteData.manager) {
            skippedRows.push(`Satır ${i+1}: Yönetici adı eksik`);
            continue;
          }
          
          // Validate and sanitize numeric fields
          if (siteData.blocks !== '') {
            const blocksValue = siteData.blocks.toString().trim();
            if (blocksValue && (isNaN(parseInt(blocksValue)) || parseInt(blocksValue) < 0)) {
              skippedRows.push(`Satır ${i+1}: Blok sayısı geçersiz (${blocksValue})`);
              continue;
            }
            siteData.blocks = blocksValue ? parseInt(blocksValue) : '';
          } else {
            siteData.blocks = ''; // Set to empty string if not provided
          }
          
          if (siteData.elevatorsPerBlock !== '') {
            const elevatorsValue = siteData.elevatorsPerBlock.toString().trim();
            if (elevatorsValue && (isNaN(parseInt(elevatorsValue)) || parseInt(elevatorsValue) < 0)) {
              skippedRows.push(`Satır ${i+1}: Asansör sayısı geçersiz (${elevatorsValue})`);
              continue;
            }
            siteData.elevatorsPerBlock = elevatorsValue ? parseInt(elevatorsValue) : '';
          } else {
            siteData.elevatorsPerBlock = ''; // Set to empty string if not provided
          }
          
          if (siteData.agreementPercentage !== '') {
            const agreementValue = siteData.agreementPercentage.toString().trim();
            if (agreementValue && (isNaN(parseFloat(agreementValue)) || parseFloat(agreementValue) < 0 || parseFloat(agreementValue) > 100)) {
              skippedRows.push(`Satır ${i+1}: Anlaşma yüzdesi geçersiz (${agreementValue}). 0-100 arasında bir değer olmalıdır.`);
              continue;
            }
            siteData.agreementPercentage = agreementValue ? parseFloat(agreementValue) : '';
          } else {
            siteData.agreementPercentage = ''; // Set to empty string if not provided
          }

          // Validate new fields based on site type
          if (siteData.siteType === 'site') {
            // Validate apartment count for sites
            if (siteData.apartmentCount !== '') {
              const apartmentValue = siteData.apartmentCount.toString().trim();
              if (apartmentValue && (isNaN(parseInt(apartmentValue)) || parseInt(apartmentValue) < 0)) {
                skippedRows.push(`Satır ${i+1}: Daire sayısı geçersiz (${apartmentValue})`);
                continue;
              }
              siteData.apartmentCount = apartmentValue ? parseInt(apartmentValue) : '';
            } else {
              siteData.apartmentCount = '';
            }
            
            // Calculate average people for sites (apartment count * 3)
            if (siteData.apartmentCount && siteData.apartmentCount !== '') {
              siteData.averagePeople = parseInt(siteData.apartmentCount) * 3;
            } else {
              siteData.averagePeople = '';
            }
            
            // Clear business center fields for sites
            siteData.businessCount = '';
            siteData.peopleCount = '';
          } else if (siteData.siteType === 'business_center') {
            // Validate business count for business centers
            if (siteData.businessCount !== '') {
              const businessValue = siteData.businessCount.toString().trim();
              if (businessValue && (isNaN(parseInt(businessValue)) || parseInt(businessValue) < 0)) {
                skippedRows.push(`Satır ${i+1}: İşyeri sayısı geçersiz (${businessValue})`);
                continue;
              }
              siteData.businessCount = businessValue ? parseInt(businessValue) : '';
            } else {
              siteData.businessCount = '';
            }
            
            // Validate people count for business centers
            if (siteData.peopleCount !== '') {
              const peopleValue = siteData.peopleCount.toString().trim();
              if (peopleValue && (isNaN(parseInt(peopleValue)) || parseInt(peopleValue) < 0)) {
                skippedRows.push(`Satır ${i+1}: İş merkezine giren kişi sayısı geçersiz (${peopleValue})`);
                continue;
              }
              siteData.peopleCount = peopleValue ? parseInt(peopleValue) : '';
            } else {
              siteData.peopleCount = '';
            }
            
            // Clear site fields for business centers
            siteData.apartmentCount = '';
            siteData.averagePeople = '';
            
            // İş merkezleri için elevators ve panels 0 olarak ayarla (manuel girilecek)
            siteData.elevators = 0;
            siteData.panels = 0;
          }
          
          // Calculate elevators and panels only for sites (not business centers)
          // İş merkezleri için panels manuel girilir, bu yüzden hesaplama yapılmaz
          if (siteData.siteType === 'site') {
            const blocks = parseInt(siteData.blocks) || 0;
            const elevatorsPerBlock = parseInt(siteData.elevatorsPerBlock) || 0;
            siteData.elevators = blocks * elevatorsPerBlock;
            siteData.panels = siteData.elevators * 2;
          }
          
          sitesToImport.push(siteData);
        }
        
        // Report skipped rows if any
        if (skippedRows.length > 0) {
          console.log('Skipped rows:', skippedRows);
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Uyarı',
              `${skippedRows.length} satır atlandı. Detaylı bilgi için konsolu kontrol edin.`,
              'warning'
            );
          } else {
            alert(`${skippedRows.length} satır atlandı. Detaylı bilgi için konsolu kontrol edin.`);
          }
        }
        
        if (sitesToImport.length === 0) {
          // Check if window.showAlert is available, if not use a fallback
          if (typeof window.showAlert === 'function') {
            await window.showAlert(
              'Uyarı',
              'İçe aktarılacak geçerli site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve gerekli alanları doldurun.',
              'warning'
            );
          } else {
            alert('İçe aktarılacak geçerli site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve gerekli alanları doldurun.');
          }
          return;
        }
        
        console.log('Sites to import:', sitesToImport); // Debug log
        
        // Import sites
        await importSitesFromExcel(sitesToImport);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        // Check if window.showAlert is available, if not use a fallback
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Hata',
            'Excel dosyası okunurken bir hata oluştu: ' + error.message,
            'error'
          );
        } else {
          alert('Excel dosyası okunurken bir hata oluştu: ' + error.message);
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // Import sites from Excel data
  const importSitesFromExcel = async (sitesData) => {
    console.log('Importing sites data:', sitesData); // Debug log
    
    if (!sitesData || sitesData.length === 0) {
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Uyarı',
          'İçe aktarılacak site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve en az bir satır veri ekleyin.',
          'warning'
        );
      } else {
        alert('İçe aktarılacak site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve en az bir satır veri ekleyin.');
      }
      return;
    }
    
    try {
      // Get all current sites once to avoid race conditions
      const allCurrentSites = await getSites();
      let importedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const errorDetails = [];
      
      // Process sites sequentially to avoid overwhelming the server
      for (let i = 0; i < sitesData.length; i++) {
        const siteData = sitesData[i];
        try {
          console.log(`Processing site ${i+1}/${sitesData.length}:`, siteData); // Debug log
          
          // Validate required fields
          if (!siteData.name || !siteData.manager) {
            const errorMsg = `Satır ${i+2}: Gerekli alanlar eksik (Site: ${siteData.name || 'Bilinmeyen'}, Yönetici: ${siteData.manager || 'Bilinmeyen'})`;
            console.log(errorMsg);
            errorDetails.push(errorMsg);
            errorCount++;
            continue;
          }
          
          // Check if a site with the same name and neighborhood already exists
          const existingSite = allCurrentSites.find(site => 
            site.name.toLowerCase() === siteData.name.toLowerCase() && 
            site.neighborhood.toLowerCase() === siteData.neighborhood.toLowerCase()
          );
          
          if (existingSite) {
            // Update existing site with new data, but preserve important properties
            console.log(`Updating existing site: ${existingSite.id}`, siteData);
            
            // Preserve important existing properties that shouldn't be overwritten
            const updatedSiteData = {
              ...existingSite, // Start with all existing properties
              ...siteData,     // Override with new data where provided
              id: existingSite.id, // Ensure ID is preserved
              pendingPayments: existingSite.pendingPayments || [],
              hasPendingPayment: existingSite.hasPendingPayment || false,
              elevators: siteData.blocks && siteData.elevatorsPerBlock ? 
                parseInt(siteData.blocks) * parseInt(siteData.elevatorsPerBlock) : 
                existingSite.elevators || 0,
              panels: siteData.blocks && siteData.elevatorsPerBlock ? 
                parseInt(siteData.blocks) * parseInt(siteData.elevatorsPerBlock) * 2 : 
                existingSite.panels || 0
            };
            
            const updatedSite = await updateSite(existingSite.id, updatedSiteData);
            if (updatedSite) {
              setSites(prevSites => 
                prevSites.map(site => 
                  site.id === existingSite.id ? updatedSite : site
                )
              );
              updatedCount++;
              
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Site güncellendi (Excel içe aktarma): ${siteData.name}`
              });
              
              // Small delay to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              const errorMsg = `Satır ${i+2}: Mevcut site güncellenemedi - ${siteData.name}`;
              console.log(errorMsg);
              errorDetails.push(errorMsg);
              errorCount++;
            }
          } else {
            // Create new site
            // Calculate the correct sequence number: existing sites count + current index + 1
            const sequenceNumber = allCurrentSites.length + i + 1;
            
            const newSite = await createSite(siteData, null, sequenceNumber);
            if (newSite) {
              setSites(prevSites => [...prevSites, newSite]);
              importedCount++;
              
              // Log the action
              await createLog({
                user: 'Admin',
                action: `Site Excel ile içe aktarıldı: ${siteData.name}`
              });
              
              // Small delay to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              const errorMsg = `Satır ${i+2}: Site oluşturulamadı - ${siteData.name}`;
              console.log(errorMsg);
              errorDetails.push(errorMsg);
              errorCount++;
            }
          }
        } catch (error) {
          const errorMsg = `Satır ${i+2}: Hata oluştu - ${siteData.name}: ${error.message}`;
          console.error(errorMsg, error);
          errorDetails.push(errorMsg);
          errorCount++;
        }
      }
      
      // Log detailed error information
      if (errorDetails.length > 0) {
        console.log('Import error details:', errorDetails);
      }
      
      // Show final result
      if (importedCount > 0 || updatedCount > 0 || errorCount > 0) {
        let message = '';
        if (importedCount > 0) {
          message += `${importedCount} yeni site oluşturuldu. `;
        }
        if (updatedCount > 0) {
          message += `${updatedCount} site güncellendi. `;
        }
        if (errorCount > 0) {
          message += `${errorCount} site işlenemedi. `;
        }
        if (errorCount > 0) {
          message += 'Detaylı bilgi için konsolu kontrol edin.';
        }
        
        // Check if window.showAlert is available, if not use a fallback
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'İçe Aktarma Tamamlandı',
            message,
            (importedCount > 0 || updatedCount > 0) ? 'success' : 'warning'
          );
        } else {
          alert(message);
        }
      } else {
        // Check if window.showAlert is available, if not use a fallback
        if (typeof window.showAlert === 'function') {
          await window.showAlert(
            'Uyarı',
            'İçe aktarılacak site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve en az bir satır veri ekleyin.',
            'warning'
          );
        } else {
          alert('İçe aktarılacak site bulunamadı. Lütfen şablon dosyasını kullandığınızdan emin olun ve en az bir satır veri ekleyin.');
        }
      }
    } catch (error) {
      console.error('Error importing sites from Excel:', error);
      // Check if window.showAlert is available, if not use a fallback
      if (typeof window.showAlert === 'function') {
        await window.showAlert(
          'Hata',
          'Siteler içe aktarılırken bir hata oluştu: ' + error.message,
          'error'
        );
      } else {
        alert('Siteler içe aktarılırken bir hata oluştu: ' + error.message);
      }
    }
  };

  // Export sites to Excel
  const exportSitesToExcel = (sitesToExport = null) => {
    // Use passed sites array or fallback to prop
    const sitesData = sitesToExport || sites;
    console.log('Exporting sites to Excel, sites data:', sitesData);
    
    // Check if sites data is available
    if (!sitesData || sitesData.length === 0) {
      console.error('No sites data available for export');
      if (typeof window.showAlert === 'function') {
        window.showAlert(
          'Uyarı',
          'İndirilecek site verisi bulunamadı. Lütfen önce siteleri yükleyin.',
          'warning'
        );
      } else {
        alert('İndirilecek site verisi bulunamadı. Lütfen önce siteleri yükleyin.');
      }
      return;
    }
    
    // Prepare data for export
    const exportData = sitesData.map(site => ({
      'Site Adı': site.name,
      'Mahalle': site.neighborhood,
      'Yönetici Adı': site.manager,
      'Yönetici İletişim': site.phone,
      'Site Türü': site.siteType === 'site' ? 'Site' : 'İş Merkezi',
      'Blok Sayısı': site.blocks,
      '1 Blok için Asansör Sayısı': site.elevatorsPerBlock,
      'Toplam Asansör': site.elevators,
      'Panel Sayısı': site.panels,
      'Anlaşma Yüzdesi': site.agreementPercentage,
      'Daire Sayısı': site.siteType === 'site' ? (site.apartmentCount || 0) : '-',
      'Ortalama İnsan Sayısı': site.siteType === 'site' ? (site.averagePeople || 0) : '-',
      'İşyeri Sayısı': site.siteType === 'business_center' ? (site.businessCount || 0) : '-',
      'İş Merkezine Giren Kişi Sayısı': site.siteType === 'business_center' ? (site.peopleCount || 0) : '-',
      'Not': site.notes
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siteler');
    
    // Export to file
    console.log('Exporting Excel file with data:', exportData);
    try {
      XLSX.writeFile(wb, 'siteler.xlsx');
      console.log('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      alert('Excel dosyası indirilirken hata oluştu: ' + error.message);
    }
  };

  return {
    handleExcelImport,
    importSitesFromExcel,
    exportSitesToExcel
  };
};

export default SitesExcelHandlers;