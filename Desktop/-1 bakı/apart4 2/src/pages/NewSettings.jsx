import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getLogs, getSites, getCompanies, getSiteUpdateRequests, getCompanyUpdateRequests, updateSiteUpdateRequest, updateCompanyUpdateRequest, deleteSiteUpdateRequest, deleteCompanyUpdateRequest, updateSite, updateCompany, createLog, sendNotificationToSite, sendAnnouncementToAllSites, getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/api';
import Archive from './Archive';
import jsPDF from 'jspdf';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    role: 'personnel'
  });
  const [securityFormData, setSecurityFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState({}); // State to track which user info to show
  const [roleFilter, setRoleFilter] = useState('all'); // State for role filtering
  const [firebaseEnabled, setFirebaseEnabled] = useState(false); // Firebase status - ALWAYS DISABLED
  const [sites, setSites] = useState([]); // Sites for label printing
  const [selectedSiteForLabels, setSelectedSiteForLabels] = useState('all'); // Selected site for labels
  const [labelType, setLabelType] = useState('all'); // Label type filter (all, site, business_center)
  const [siteUpdateRequests, setSiteUpdateRequests] = useState([]); // Site update requests
  const [companyUpdateRequests, setCompanyUpdateRequests] = useState([]); // Company update requests
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetSite: 'all' // 'all' or specific siteId
  });
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSites = async () => {
      try {
        const sitesData = await getSites();
        setSites(sitesData);
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };

    // Firebase is ALWAYS disabled - force local mode
    localStorage.setItem('firebaseEnabled', 'false');
    setFirebaseEnabled(false);

    fetchUsers();
    fetchSites();
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const logsData = await getLogs();
      // Sort logs by timestamp (most recent first)
      const sortedLogs = logsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };
  
  const fetchUpdateRequests = async () => {
    try {
      const [siteRequests, companyRequests] = await Promise.all([
        getSiteUpdateRequests(),
        getCompanyUpdateRequests()
      ]);
      setSiteUpdateRequests(siteRequests || []);
      setCompanyUpdateRequests(companyRequests || []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
    }
  };

  // Fetch logs when logs tab is activated
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);
  
  // Fetch update requests when approvals tab is activated
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchUpdateRequests();
    }
  }, [activeTab]);
  
  // Fetch announcements when announcements tab is activated
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcementsData = await getAnnouncements();
        setAnnouncements(announcementsData || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  // Filter users by role
  const filteredUsers = users.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  // Get unique roles for filter dropdown
  const getUniqueRoles = () => {
    if (!users || users.length === 0) return [];
    const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
    return roles;
  };

  const handleAddUser = () => {
    setUserFormData({
      name: '',
      password: '',
      confirmPassword: '',
      role: 'personnel'
    });
    setEditingUser(null);
    setShowAddUserForm(true);
  };

  const handleEditUser = (user) => {
    setUserFormData({
      name: user.name || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'personnel'
    });
    setEditingUser(user);
    setShowAddUserForm(true);
  };

  const handleCloseUserForm = () => {
    setShowAddUserForm(false);
    setEditingUser(null);
  };

  // Handle delete all users (except admin)
  const handleDeleteAllUsers = async () => {
    const result = await window.showConfirm(
      'Tüm Kullanıcıları Sil',
      'Admin hariç tüm kullanıcıları siteden ve Firebase Auth\'dan silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
      'error'
    );
    
    if (!result) {
      return;
    }
    
    try {
      // Filter out admin users
      const usersToDelete = users.filter(user => 
        user.role !== 'admin' && 
        user.role !== 'administrator' &&
        user.email !== 'admin@apartmecra.com'
      );
      
      if (usersToDelete.length === 0) {
        await window.showAlert(
          'Bilgi',
          'Silinecek kullanıcı bulunmamaktadır.',
          'info'
        );
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Delete users in batches
      const batchSize = 5;
      for (let i = 0; i < usersToDelete.length; i += batchSize) {
        const batch = usersToDelete.slice(i, i + batchSize);
        
        const deletePromises = batch.map(async (user) => {
          try {
            // Delete from Firestore
            await deleteUser(user.id);
            
            // Delete from Firebase Auth using Cloud Function
            if (user.email) {
              try {
                const functionUrl = `https://us-central1-apartmecra-elz.cloudfunctions.net/deleteUserByEmail`;
                const response = await fetch(functionUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: user.email })
                });
                
                if (!response.ok) {
                  console.warn(`Failed to delete user from Auth: ${user.email}`);
                }
              } catch (authError) {
                console.warn(`Error deleting user from Auth: ${user.email}`, authError);
                // Continue even if Auth deletion fails
              }
            }
            
            successCount++;
            return { success: true, userId: user.id };
          } catch (error) {
            console.error(`Error deleting user ${user.id}:`, error);
            errorCount++;
            return { success: false, userId: user.id, error: error.message };
          }
        });
        
        await Promise.all(deletePromises);
        
        // Add delay between batches
        if (i + batchSize < usersToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Reload users
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      
      if (errorCount === 0) {
        await window.showAlert(
          'Başarılı',
          `${successCount} kullanıcı başarıyla silindi.`,
          'success'
        );
      } else {
        await window.showAlert(
          'Kısmen Başarılı',
          `${successCount} kullanıcı silindi, ${errorCount} kullanıcı silinemedi.`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Error deleting all users:', error);
      await window.showAlert(
        'Hata',
        'Kullanıcılar silinirken bir hata oluştu: ' + error.message,
        'error'
      );
    }
  };

  // Handle recreate users for all sites and companies
  const handleRecreateUsers = async () => {
    const result = await window.showConfirm(
      'Kullanıcıları Yeniden Oluştur',
      'Tüm site ve firmalar için kullanıcıları yeniden oluşturmak istediğinize emin misiniz? Mevcut kullanıcılar varsa güncellenecektir.',
      'warning'
    );
    
    if (!result) {
      return;
    }
    
    try {
      const [allSites, allCompanies] = await Promise.all([
        getSites(),
        getCompanies()
      ]);
      
      // Filter out archived sites and companies
      const activeSites = allSites.filter(site => site.status !== 'archived');
      const activeCompanies = allCompanies.filter(company => company.status !== 'archived');
      
      let siteSuccessCount = 0;
      let siteErrorCount = 0;
      let companySuccessCount = 0;
      let companyErrorCount = 0;
      
      // Import createSiteUser and createCompanyUser from firebaseDb
      const { createSiteUser, createCompanyUser } = await import('../services/firebaseDb.js');
      
      // Create users for sites (force recreate to ensure fresh users)
      for (const site of activeSites) {
        try {
          await createSiteUser(site.id, site, true); // forceRecreate = true
          siteSuccessCount++;
        } catch (error) {
          console.error(`Error creating user for site ${site.id}:`, error);
          siteErrorCount++;
        }
      }
      
      // Create users for companies (force recreate to ensure fresh users)
      for (const company of activeCompanies) {
        try {
          await createCompanyUser(company.id, company, true); // forceRecreate = true
          companySuccessCount++;
        } catch (error) {
          console.error(`Error creating user for company ${company.id}:`, error);
          companyErrorCount++;
        }
      }
      
      // Reload users
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      
      const totalSuccess = siteSuccessCount + companySuccessCount;
      const totalError = siteErrorCount + companyErrorCount;
      
      if (totalError === 0) {
        await window.showAlert(
          'Başarılı',
          `${totalSuccess} kullanıcı başarıyla oluşturuldu/güncellendi. (${siteSuccessCount} site, ${companySuccessCount} firma)`,
          'success'
        );
      } else {
        await window.showAlert(
          'Kısmen Başarılı',
          `${totalSuccess} kullanıcı oluşturuldu, ${totalError} kullanıcı oluşturulamadı. (${siteSuccessCount} site, ${companySuccessCount} firma başarılı)`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Error recreating users:', error);
      await window.showAlert(
        'Hata',
        'Kullanıcılar oluşturulurken bir hata oluştu: ' + error.message,
        'error'
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await window.showConfirm(
      'Kullanıcı Silme',
      'Bu kullanıcıyı silmek istediğinize emin misiniz?',
      'warning'
    );
    
    if (result) {
      try {
        const success = await deleteUser(userId);
        if (success) {
          setUsers(users.filter(user => user.id !== userId));
        } else {
          await window.showAlert(
            'Hata',
            'Kullanıcı silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        await window.showAlert(
          'Hata',
          'Kullanıcı silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  // Function to toggle user info visibility
  const toggleUserInfo = (userId) => {
    setShowUserInfo(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Function to get Turkish role label
  const getRoleLabel = (role) => {
    switch (role) {
      case 'personnel':
        return 'Personel';
      case 'company':
        return 'Firma Kullanıcısı';
      case 'site_user':
        return 'Site Kullanıcısı';
      case 'observer':
      case 'gözlemci':
        return 'Gözlemci';
      case 'administrator':
      case 'admin':
        return 'Yönetici';
      default:
        return 'Kullanıcı';
    }
  };

  // Function to download labels as PDF
  const handleDownloadLabelsPDF = () => {
    // Get filtered sites
    const filteredSites = sites.filter(site => {
      if (selectedSiteForLabels !== 'all' && site.id !== selectedSiteForLabels) return false;
      if (labelType !== 'all' && site.siteType !== labelType) return false;
      return true;
    });

    // Collect all labels
    const allLabels = [];
    filteredSites.forEach(site => {
      const blockLabels = site.siteType === 'business_center' ? ['A'] : 
        Array.from({ length: parseInt(site.blocks) || 0 }, (_, i) => String.fromCharCode(65 + i));
      
      blockLabels.forEach(blockLabel => {
        const panelCount = site.siteType === 'business_center' ? 
          (parseInt(site.panels) || 0) : 
          (parseInt(site.elevatorsPerBlock) || 0) * 2;
        
        for (let i = 1; i <= panelCount; i++) {
          const panelId = `${site.id}${blockLabel}${i}`;
          allLabels.push({
            panelId,
            siteName: site.name
          });
        }
      });
    });

    if (allLabels.length === 0) {
      window.showAlert('Bilgi', 'Yazdırılacak etiket bulunamadı.', 'info');
      return;
    }

    // A4 portrait dimensions in mm: 210mm x 297mm (width x height)
    // Label dimensions: 120mm (12cm) width x 20mm (2cm) height
    // Layout: 2 columns (labels side by side) with gaps
    // Target: ~30 labels per page

    const pageWidth = 210; // A4 portrait width in mm
    const pageHeight = 297; // A4 portrait height in mm
    const labelWidth = 120; // 12cm in mm
    const labelHeight = 20; // 2cm in mm
    const labelsPerRow = 2; // 2 labels side by side
    const marginLeft = 5; // Left margin
    const marginTop = 5; // Top margin
    const gapBetweenLabels = 5; // Gap between labels horizontally
    const gapBetweenRows = 3; // Gap between rows vertically
    
    // Calculate how many rows fit
    const availableHeight = pageHeight - (2 * marginTop);
    const rowHeight = labelHeight + gapBetweenRows;
    const labelsPerCol = Math.floor(availableHeight / rowHeight);
    const labelsPerPage = labelsPerRow * labelsPerCol; // ~30 labels per page

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentPage = 0;
    let labelIndex = 0;

    // Helper function to fix Turkish characters for PDF (jsPDF doesn't support Turkish chars well)
    const fixTurkishChars = (text) => {
      if (!text) return '';
      return text
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
    };

    while (labelIndex < allLabels.length) {
      if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
        pdf.addPage();
        currentPage++;
      }

      const pageLabelIndex = labelIndex % labelsPerPage;
      const row = Math.floor(pageLabelIndex / labelsPerRow);
      const col = pageLabelIndex % labelsPerRow;

      const x = marginLeft + (col * (labelWidth + gapBetweenLabels));
      const y = marginTop + (row * rowHeight);

      const label = allLabels[labelIndex];

      // Draw label with black background (like the logo image)
      pdf.setFillColor(0, 0, 0); // Black background
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.1);
      pdf.rect(x, y, labelWidth, labelHeight, 'F'); // Filled black rectangle

      // Panel ID (left side - white/light color on black background)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White color for visibility on black
      pdf.text('PANEL', x + 3, y + 6);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White color
      pdf.text(label.panelId, x + 3, y + 14);

      // Logo area (right side) - Create the "mecra" logo with red bracket design
      const logoX = x + 50; // Start logo after Panel ID
      const logoY = y + 2;
      
      // Draw red bracket frame (like in the logo image)
      pdf.setDrawColor(220, 53, 69); // Red color
      pdf.setLineWidth(1);
      
      // Left vertical line
      pdf.line(logoX, logoY, logoX, logoY + 16);
      
      // Right vertical line (shorter, creating the bracket effect)
      const rightLineX = logoX + 18;
      pdf.line(rightLineX, logoY + 2, rightLineX, logoY + 14);
      
      // Top horizontal line
      pdf.line(logoX, logoY, rightLineX, logoY);
      
      // Bottom horizontal line
      pdf.line(logoX, logoY + 16, rightLineX, logoY + 16);
      
      // "mecra" text in red (next to the bracket)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69); // Red color
      pdf.text('mecra', logoX + 20, logoY + 11);
      
      // "Bu Alanda" text (top right, red)
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69); // Red color
      const buAlandaX = x + labelWidth - 35;
      pdf.text('Bu Alanda', buAlandaX, y + 6);
      
      // "Reklam vermek için" text (below "Bu Alanda", red)
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 53, 69); // Red color
      pdf.text('Reklam vermek icin', buAlandaX, y + 11);

      labelIndex++;
    }

    // Save PDF
    pdf.save(`panel-etiketleri-${new Date().toISOString().split('T')[0]}.pdf`);
    
    window.showAlert('Başarılı', `${allLabels.length} etiket PDF olarak indirildi.`, 'success');
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value
    });
  };

  const handleSecurityFormChange = (e) => {
    const { name, value } = e.target;
    setSecurityFormData({
      ...securityFormData,
      [name]: value
    });
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!userFormData.name || !userFormData.role) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen zorunlu alanları doldurunuz.',
        'warning'
      );
      return;
    }
    
    if (!editingUser && (!userFormData.password || userFormData.password !== userFormData.confirmPassword)) {
      await window.showAlert(
        'Şifre Hatası',
        'Şifreler eşleşmiyor.',
        'warning'
      );
      return;
    }
    
    try {
      if (editingUser) {
        // Update existing user
        const userData = {
          ...userFormData,
          username: editingUser.username || userFormData.name.toLowerCase().replace(/\s+/g, ''),
          status: editingUser.status || 'active'
        };
        
        const updatedUser = await updateUser(editingUser.id, userData);
        if (updatedUser) {
          setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
          setShowAddUserForm(false);
          setEditingUser(null);
          
          await window.showAlert(
            'Başarılı',
            'Kullanıcı başarıyla güncellendi.',
            'success'
          );
        }
      } else {
        // Create new user
        const userData = {
          name: userFormData.name,
          username: userFormData.name.toLowerCase().replace(/\s+/g, ''),
          password: userFormData.password,
          role: userFormData.role,
          status: 'active'
        };
        
        const newUser = await createUser(userData);
        if (newUser) {
          setUsers([...users, newUser]);
          setShowAddUserForm(false);
          
          await window.showAlert(
            'Başarılı',
            `Yeni ${getRoleLabel(userFormData.role)} kullanıcısı başarıyla eklendi.`,
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      await window.showAlert(
        'Hata',
        'Kullanıcı kaydedilirken bir hata oluştu.',
        'error'
      );
    }
  };

  const handleSecurityFormSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!securityFormData.currentPassword || !securityFormData.newPassword || !securityFormData.confirmNewPassword) {
      await window.showAlert(
        'Eksik Bilgi',
        'Lütfen tüm alanları doldurunuz.',
        'warning'
      );
      return;
    }
    
    if (securityFormData.newPassword !== securityFormData.confirmNewPassword) {
      await window.showAlert(
        'Şifre Hatası',
        'Yeni şifreler eşleşmiyor.',
        'warning'
      );
      return;
    }
    
    // In a real app, this would connect to an API
    console.log('Password updated:', securityFormData);
    setSecurityFormData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    
    await window.showAlert(
      'Başarılı',
      'Şifre başarıyla güncellendi.',
      'success'
    );
  };

  // Function to toggle Firebase - DISABLED - Always local mode
  const handleToggleFirebase = async () => {
    await window.showAlert(
      'Bilgi',
      'Firebase bağlantıları devre dışı bırakılmıştır. Sistem sadece lokal modda çalışmaktadır.',
      'info'
    );
  };

  // Function to reset the entire system
  const handleResetSystem = async () => {
    // First, ask for admin password
    const adminPassword = await window.showPrompt(
      'Admin Şifresi Gerekli',
      'Sistem sıfırlamak için admin şifrenizi girin:',
      'password'
    );
    
    if (!adminPassword) {
      return; // User cancelled
    }
    
    // Verify admin password
    try {
      const response = await fetch('http://localhost:3001/api/users?username=admin&password=' + encodeURIComponent(adminPassword));
      const users = await response.json();
      
      if (users.length === 0) {
        await window.showAlert(
          'Hata',
          'Admin şifresi hatalı!',
          'error'
        );
        return;
      }
    } catch (error) {
      await window.showAlert(
        'Hata',
        'Şifre doğrulama sırasında bir hata oluştu!',
        'error'
      );
      return;
    }
    
    // Now ask for confirmation
    const result = await window.showConfirm(
      'Sistem Sıfırlama',
      'TÜM VERİLER SİLİNECEK! Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?',
      'error',
      'Evet, Sistemi Sıfırla',
      'İptal'
    );
    
    if (result) {
      try {
        // Use the proper reset endpoint
        const response = await fetch('http://localhost:3001/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          await window.showAlert(
            'Başarılı',
            'Sistem başarıyla sıfırlandı.',
            'success'
          );
          
          // Reload the page to reflect changes
          window.location.reload();
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Reset endpoint returned an error');
        }
      } catch (error) {
        console.error('Error resetting system:', error);
        await window.showAlert(
          'Hata',
          `Sistem sıfırlama sırasında bir hata oluştu: ${error.message}`,
          'error'
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2 className="h3 fw-bold">Ayarlar</h2>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-1"></i>
            Kullanıcılar
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="bi bi-shield-lock me-1"></i>
            Güvenlik
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <i className="bi bi-journal-text me-1"></i>
            Log Kayıtları
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <i className="bi bi-check-circle me-1"></i>
            Onaylar
            {(siteUpdateRequests.filter(r => r.status === 'pending').length + companyUpdateRequests.filter(r => r.status === 'pending').length) > 0 && (
              <span className="badge bg-danger ms-2">
                {siteUpdateRequests.filter(r => r.status === 'pending').length + companyUpdateRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            <i className="bi bi-megaphone me-1"></i>
            Duyurular
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'labels' ? 'active' : ''}`}
            onClick={() => setActiveTab('labels')}
          >
            <i className="bi bi-printer me-1"></i>
            Etiket Bas
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <i className="bi bi-archive me-1"></i>
            Arşiv
          </button>
        </li>
      </ul>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">Kullanıcı Yönetimi</h5>
              <div className="d-flex gap-2 align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="roleFilter" className="form-label mb-0 small">
                    <i className="bi bi-funnel me-1"></i>
                    Rol Filtresi:
                  </label>
                  <select
                    id="roleFilter"
                    className="form-select form-select-sm"
                    style={{width: 'auto'}}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option key="all" value="all">Tüm Roller</option>
                    {getUniqueRoles().map((role, index) => (
                      <option key={`role-${role}-${index}`} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleAddUser}
                  className="btn btn-primary btn-sm btn-icon"
                >
                  <i className="bi bi-plus-lg"></i>
                  Kullanıcı Ekle
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="d-flex gap-2 mb-4 p-3 bg-light rounded">
              <button 
                onClick={handleDeleteAllUsers}
                className="btn btn-danger btn-sm"
                title="Admin hariç tüm kullanıcıları sil"
              >
                <i className="bi bi-trash me-1"></i>
                Tüm Kullanıcıları Sil
              </button>
              <button 
                onClick={handleRecreateUsers}
                className="btn btn-success btn-sm"
                title="Tüm site ve firmalar için kullanıcı oluştur"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Yeniden Oluştur
              </button>
            </div>

            {/* Filter Results Info */}
            {users.length > 0 && (
              <div className="mb-3">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  {roleFilter === 'all' 
                    ? `Toplam ${users.length} kullanıcı gösteriliyor.`
                    : `${getRoleLabel(roleFilter)} rolünde ${filteredUsers.length} kullanıcı gösteriliyor.`
                  }
                </small>
              </div>
            )}
            
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-medium">{user.name || user.username}</td>
                      <td>
                        <span className={`badge ${
                          user.role === 'administrator' || user.role === 'admin' 
                            ? 'bg-danger-subtle text-danger-emphasis'
                            : 'bg-info-subtle text-info-emphasis'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                          {user.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => toggleUserInfo(user.id)}
                            className="btn btn-sm btn-outline-info"
                            title="Göster"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn btn-sm btn-outline-secondary"
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        {showUserInfo[user.id] && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <small>
                              <strong>Kullanıcı Adı:</strong> {user.username || user.name || 'Bilinmiyor'}<br/>
                              <strong>Şifre:</strong> {user.password || 'Bilinmiyor'}
                            </small>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-people"></i>
                          <p className="mb-3">
                            {users.length === 0 
                              ? 'Henüz kullanıcı bulunmamaktadır.' 
                              : 'Seçilen role göre kullanıcı bulunmamaktadır.'
                            }
                          </p>
                          {users.length === 0 && (
                            <button 
                              onClick={handleAddUser}
                              className="btn btn-primary-gradient"
                            >
                              Kullanıcı Ekle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-4">Güvenlik Ayarları</h5>
            
            <form onSubmit={handleSecurityFormSubmit}>
              <div className="mb-3">
                <label htmlFor="currentPassword" className="form-label">Mevcut Şifre</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={securityFormData.currentPassword}
                  onChange={handleSecurityFormChange}
                  className="form-control form-control-custom"
                  placeholder="Mevcut şifrenizi girin"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">Yeni Şifre</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={securityFormData.newPassword}
                  onChange={handleSecurityFormChange}
                  className="form-control form-control-custom"
                  placeholder="Yeni şifrenizi girin"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="confirmNewPassword" className="form-label">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={securityFormData.confirmNewPassword}
                  onChange={handleSecurityFormChange}
                  className="form-control form-control-custom"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
              
              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-primary-gradient"
                >
                  <i className="bi bi-shield-check me-1"></i>
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
            
            {/* Firebase Settings - DISABLED */}
            <div className="mt-5 pt-4 border-top">
              <h5 className="card-title mb-3">Firebase Ayarları</h5>
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-cloud-slash text-muted me-2"></i>
                    Firebase Bağlantısı
                  </h6>
                  <p className="mb-0 text-muted small">
                    Firebase devre dışı - Veriler sadece lokal olarak saklanıyor (db.json)
                  </p>
                </div>
                <button
                  onClick={handleToggleFirebase}
                  className="btn btn-secondary"
                  disabled
                >
                  <i className="bi bi-lock me-1"></i>
                  Devre Dışı (Lokal Mod)
                </button>
              </div>
              <p className="text-muted mt-2">
                <small>
                  <strong>Lokal Mod Aktif:</strong> Tüm veriler sadece lokal olarak saklanır (db.json), internet bağlantısı gerektirmez. Firebase bağlantıları tamamen devre dışı bırakılmıştır.
                </small>
              </p>
            </div>

            {/* System Reset Button */}
            <div className="mt-4 pt-4 border-top">
              <h5 className="card-title mb-3">Sistem Yönetimi</h5>
              <button
                onClick={handleResetSystem}
                className="btn btn-danger"
              >
                <i className="bi bi-exclamation-triangle me-1"></i>
                Sistemi Sıfırla
              </button>
              <p className="text-muted mt-2">
                <small>Tüm verileri siler ve sistemi ilk kurulum haline getirir. Bu işlem geri alınamaz!</small>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">Sistem Log Kayıtları</h5>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={fetchLogs}
                disabled={logsLoading}
              >
                <i className={`bi bi-arrow-clockwise me-1 ${logsLoading ? 'spinner-border spinner-border-sm' : ''}`}></i>
                Yenile
              </button>
            </div>

            {logsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-2 text-muted">Log kayıtları yükleniyor...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-journal-x display-4 text-muted"></i>
                <p className="mt-2 text-muted">Henüz log kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: '15%'}}>Tarih & Saat</th>
                      <th style={{width: '20%'}}>Kullanıcı</th>
                      <th style={{width: '65%'}}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">
                              {(() => {
                                try {
                                  // Handle Firestore Timestamp object
                                  let date;
                                  if (log.timestamp && typeof log.timestamp.toDate === 'function') {
                                    date = log.timestamp.toDate();
                                  } else if (log.timestamp && log.timestamp.seconds) {
                                    date = new Date(log.timestamp.seconds * 1000);
                                  } else if (log.timestamp) {
                                    date = new Date(log.timestamp);
                                  } else {
                                    return 'Tarih yok';
                                  }
                                  return date.toLocaleDateString('tr-TR');
                                } catch (e) {
                                  return 'Geçersiz tarih';
                                }
                              })()}
                            </span>
                            <small className="text-muted">
                              {(() => {
                                try {
                                  // Handle Firestore Timestamp object
                                  let date;
                                  if (log.timestamp && typeof log.timestamp.toDate === 'function') {
                                    date = log.timestamp.toDate();
                                  } else if (log.timestamp && log.timestamp.seconds) {
                                    date = new Date(log.timestamp.seconds * 1000);
                                  } else if (log.timestamp) {
                                    date = new Date(log.timestamp);
                                  } else {
                                    return 'Saat yok';
                                  }
                                  return date.toLocaleTimeString('tr-TR');
                                } catch (e) {
                                  return 'Geçersiz saat';
                                }
                              })()}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {log.user}
                          </span>
                        </td>
                        <td>
                          <span className="text-dark">
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {logs.length > 0 && (
              <div className="mt-3">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Toplam {logs.length} log kaydı gösteriliyor. En yeni kayıtlar üstte listelenmektedir.
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="card custom-card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-check-circle me-2"></i>
              Güncelleme Talepleri
            </h5>
          </div>
          <div className="card-body">
            {/* Site Update Requests */}
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="bi bi-building me-2"></i>
                Site Güncelleme Talepleri
                {siteUpdateRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {siteUpdateRequests.filter(r => r.status === 'pending').length} Bekliyor
                  </span>
                )}
              </h6>
              {siteUpdateRequests.length === 0 ? (
                <p className="text-muted">Henüz site güncelleme talebi yok.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th>Talep Eden</th>
                        <th>Değişiklikler</th>
                        <th>Durum</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteUpdateRequests.map(request => (
                        <tr key={request._docId || request.id}>
                          <td><strong>{request.siteName || request.siteId}</strong></td>
                          <td>{request.requestedBy}</td>
                          <td>
                            <small>
                              {Object.keys(request.changes || {}).length > 0 ? (
                                Object.keys(request.changes).map(key => (
                                  <div key={key} className="mb-1">
                                    <strong>{key}:</strong> <span className="text-muted">{request.changes[key].old || '(boş)'}</span> → <span className="text-success">{request.changes[key].new || '(boş)'}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted">Değişiklik yok</span>
                              )}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${request.status === 'pending' ? 'bg-warning' : request.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                              {request.status === 'pending' ? 'Bekliyor' : request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                            </span>
                          </td>
                          <td>
                            {request.requestedAt ? (
                              request.requestedAt.seconds ? 
                                new Date(request.requestedAt.seconds * 1000).toLocaleDateString('tr-TR') : 
                                new Date(request.requestedAt).toLocaleDateString('tr-TR')
                            ) : '-'}
                          </td>
                          <td>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  onClick={async () => {
                                    try {
                                      // Approve request
                                      await updateSite(request.siteId, request.requestedData);
                                      await updateSiteUpdateRequest(request._docId || request.id, { status: 'approved', approvedAt: new Date().toISOString() });
                                      await createLog({
                                        user: 'Admin',
                                        action: `Site güncelleme talebi onaylandı: ${request.siteName || request.siteId}`
                                      });
                                      await window.showAlert('Başarılı', 'Talep onaylandı ve site güncellendi.', 'success');
                                      fetchUpdateRequests();
                                    } catch (error) {
                                      console.error('Error approving request:', error);
                                      await window.showAlert('Hata', 'Talep onaylanırken bir hata oluştu: ' + error.message, 'error');
                                    }
                                  }}
                                >
                                  <i className="bi bi-check"></i> Onayla
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={async () => {
                                    try {
                                      await updateSiteUpdateRequest(request._docId || request.id, { status: 'rejected', rejectedAt: new Date().toISOString() });
                                      await createLog({
                                        user: 'Admin',
                                        action: `Site güncelleme talebi reddedildi: ${request.siteName || request.siteId}`
                                      });
                                      await window.showAlert('Başarılı', 'Talep reddedildi.', 'success');
                                      fetchUpdateRequests();
                                    } catch (error) {
                                      console.error('Error rejecting request:', error);
                                      await window.showAlert('Hata', 'Talep reddedilirken bir hata oluştu: ' + error.message, 'error');
                                    }
                                  }}
                                >
                                  <i className="bi bi-x"></i> Reddet
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Company Update Requests */}
            <div>
              <h6 className="mb-3">
                <i className="bi bi-briefcase me-2"></i>
                Firma Güncelleme Talepleri
                {companyUpdateRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {companyUpdateRequests.filter(r => r.status === 'pending').length} Bekliyor
                  </span>
                )}
              </h6>
              {companyUpdateRequests.length === 0 ? (
                <p className="text-muted">Henüz firma güncelleme talebi yok.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Firma</th>
                        <th>Talep Eden</th>
                        <th>Değişiklikler</th>
                        <th>Durum</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyUpdateRequests.map(request => (
                        <tr key={request._docId || request.id}>
                          <td><strong>{request.companyName || request.companyId}</strong></td>
                          <td>{request.requestedBy}</td>
                          <td>
                            <small>
                              {Object.keys(request.changes || {}).length > 0 ? (
                                Object.keys(request.changes).map(key => (
                                  <div key={key} className="mb-1">
                                    <strong>{key}:</strong> <span className="text-muted">{request.changes[key].old || '(boş)'}</span> → <span className="text-success">{request.changes[key].new || '(boş)'}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted">Değişiklik yok</span>
                              )}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${request.status === 'pending' ? 'bg-warning' : request.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                              {request.status === 'pending' ? 'Bekliyor' : request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                            </span>
                          </td>
                          <td>
                            {request.requestedAt ? (
                              request.requestedAt.seconds ? 
                                new Date(request.requestedAt.seconds * 1000).toLocaleDateString('tr-TR') : 
                                new Date(request.requestedAt).toLocaleDateString('tr-TR')
                            ) : '-'}
                          </td>
                          <td>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  onClick={async () => {
                                    try {
                                      // Approve request
                                      await updateCompany(request.companyId, request.requestedData);
                                      await updateCompanyUpdateRequest(request._docId || request.id, { status: 'approved', approvedAt: new Date().toISOString() });
                                      await createLog({
                                        user: 'Admin',
                                        action: `Firma güncelleme talebi onaylandı: ${request.companyName || request.companyId}`
                                      });
                                      await window.showAlert('Başarılı', 'Talep onaylandı ve firma güncellendi.', 'success');
                                      fetchUpdateRequests();
                                    } catch (error) {
                                      console.error('Error approving request:', error);
                                      await window.showAlert('Hata', 'Talep onaylanırken bir hata oluştu: ' + error.message, 'error');
                                    }
                                  }}
                                >
                                  <i className="bi bi-check"></i> Onayla
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={async () => {
                                    try {
                                      await updateCompanyUpdateRequest(request._docId || request.id, { status: 'rejected', rejectedAt: new Date().toISOString() });
                                      await createLog({
                                        user: 'Admin',
                                        action: `Firma güncelleme talebi reddedildi: ${request.companyName || request.companyId}`
                                      });
                                      await window.showAlert('Başarılı', 'Talep reddedildi.', 'success');
                                      fetchUpdateRequests();
                                    } catch (error) {
                                      console.error('Error rejecting request:', error);
                                      await window.showAlert('Hata', 'Talep reddedilirken bir hata oluştu: ' + error.message, 'error');
                                    }
                                  }}
                                >
                                  <i className="bi bi-x"></i> Reddet
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Tab - Moved from separate page */}
      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          {/* Announcements List */}
          <div className="card custom-card shadow-sm mb-4">
            <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2"></i>
                Yayınlanan Duyurular ({announcements.length})
              </h5>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowAnnouncementForm(true);
                  setEditingAnnouncement(null);
                  setAnnouncementForm({ title: '', message: '', type: 'info', targetSite: 'all' });
                }}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Yeni Duyuru
              </button>
            </div>
            <div className="card-body">
              {announcements.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-megaphone fs-1 d-block mb-2"></i>
                  <p>Henüz duyuru yayınlanmamış</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Başlık</th>
                        <th>Hedef</th>
                        <th>Tip</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((announcement) => (
                        <tr key={announcement.id || announcement._docId}>
                          <td>{announcement.title}</td>
                          <td>
                            {announcement.targetSite === 'all' 
                              ? 'Tüm Siteler' 
                              : sites.find(s => s.id === announcement.targetSite)?.name || announcement.targetSite}
                          </td>
                          <td>
                            <span className={`badge ${
                              announcement.type === 'payment' ? 'bg-success' :
                              announcement.type === 'warning' ? 'bg-warning' :
                              announcement.type === 'error' ? 'bg-danger' :
                              'bg-info'
                            }`}>
                              {announcement.type === 'payment' ? 'Ödeme' :
                               announcement.type === 'warning' ? 'Uyarı' :
                               announcement.type === 'error' ? 'Hata' :
                               'Bilgi'}
                            </span>
                          </td>
                          <td>
                            {announcement.createdAt 
                              ? new Date(announcement.createdAt.seconds * 1000 || announcement.createdAt).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Bilinmiyor'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => {
                                setEditingAnnouncement(announcement);
                                setAnnouncementForm({
                                  title: announcement.title,
                                  message: announcement.message,
                                  type: announcement.type,
                                  targetSite: announcement.targetSite || 'all'
                                });
                                setShowAnnouncementForm(true);
                              }}
                              title="Düzenle"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={async () => {
                                const confirmed = await window.showConfirm(
                                  'Duyuruyu Sil',
                                  'Bu duyuruyu silmek istediğinizden emin misiniz?',
                                  'warning'
                                );
                                if (confirmed) {
                                  try {
                                    await deleteAnnouncement(announcement.id || announcement._docId);
                                    setAnnouncements(prev => prev.filter(a => (a.id || a._docId) !== (announcement.id || announcement._docId)));
                                    await window.showAlert('Başarılı', 'Duyuru silindi.', 'success');
                                    await createLog({
                                      user: 'Admin',
                                      action: `Duyuru silindi: ${announcement.title}`
                                    });
                                  } catch (error) {
                                    console.error('Error deleting announcement:', error);
                                    await window.showAlert('Hata', 'Duyuru silinirken bir hata oluştu.', 'error');
                                  }
                                }
                              }}
                              title="Sil"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Announcement Form */}
          {showAnnouncementForm && (
            <div className="card custom-card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-megaphone me-2"></i>
                    {editingAnnouncement ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Gönder'}
                  </h5>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setEditingAnnouncement(null);
                      setAnnouncementForm({ title: '', message: '', type: 'info', targetSite: 'all' });
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingAnnouncement) {
                  // Update existing announcement
                  const result = await updateAnnouncement(
                    editingAnnouncement.id || editingAnnouncement._docId,
                    {
                      title: announcementForm.title,
                      message: announcementForm.message,
                      type: announcementForm.type,
                      targetSite: announcementForm.targetSite
                    }
                  );
                  if (result) {
                    await window.showAlert('Başarılı', 'Duyuru güncellendi.', 'success');
                    setAnnouncements(prev => prev.map(a => 
                      (a.id || a._docId) === (editingAnnouncement.id || editingAnnouncement._docId)
                        ? { ...a, ...announcementForm }
                        : a
                    ));
                    setShowAnnouncementForm(false);
                    setEditingAnnouncement(null);
                    setAnnouncementForm({ title: '', message: '', type: 'info', targetSite: 'all' });
                    await createLog({
                      user: 'Admin',
                      action: `Duyuru güncellendi: ${announcementForm.title}`
                    });
                  }
                } else {
                  // Create new announcement
                  const announcementResult = await createAnnouncement({
                    title: announcementForm.title,
                    message: announcementForm.message,
                    type: announcementForm.type,
                    targetSite: announcementForm.targetSite
                  });
                  
                  if (announcementResult) {
                    // Send notifications
                    let notificationResult;
                    if (announcementForm.targetSite === 'all') {
                      notificationResult = await sendAnnouncementToAllSites(
                        announcementForm.title,
                        announcementForm.message,
                        announcementForm.type,
                        null,
                        announcementResult.id || announcementResult._docId
                      );
                    } else {
                      notificationResult = await sendNotificationToSite(
                        announcementForm.targetSite,
                        announcementForm.title,
                        announcementForm.message,
                        announcementForm.type,
                        null,
                        announcementResult.id || announcementResult._docId
                      );
                    }
                    
                    if (notificationResult.success) {
                      await window.showAlert(
                        'Başarılı',
                        `Duyuru ${notificationResult.count} site kullanıcısına gönderildi.`,
                        'success'
                      );
                      setAnnouncements(prev => [announcementResult, ...prev]);
                      setAnnouncementForm({ title: '', message: '', type: 'info', targetSite: 'all' });
                      setShowAnnouncementForm(false);
                      await createLog({
                        user: 'Admin',
                        action: `Duyuru gönderildi: ${announcementForm.title} (${announcementForm.targetSite === 'all' ? 'Tüm siteler' : sites.find(s => s.id === announcementForm.targetSite)?.name || announcementForm.targetSite})`
                      });
                    }
                  }
                }
              } catch (error) {
                console.error('Error saving announcement:', error);
                await window.showAlert(
                  'Hata',
                  'Duyuru kaydedilirken bir hata oluştu.',
                  'error'
                );
              }
            }}>
              <div className="mb-3">
                <label htmlFor="announcementTarget" className="form-label">
                  <i className="bi bi-bullseye me-1"></i>
                  Hedef
                </label>
                <select
                  id="announcementTarget"
                  className="form-select"
                  value={announcementForm.targetSite}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetSite: e.target.value })}
                  required
                >
                  <option value="all">Tüm Siteler</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="announcementTitle" className="form-label">
                  <i className="bi bi-type me-1"></i>
                  Başlık
                </label>
                <input
                  type="text"
                  id="announcementTitle"
                  className="form-control"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Duyuru başlığı"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="announcementMessage" className="form-label">
                  <i className="bi bi-chat-text me-1"></i>
                  Mesaj
                </label>
                <textarea
                  id="announcementMessage"
                  className="form-control"
                  rows="5"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Duyuru mesajı"
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label htmlFor="announcementType" className="form-label">
                  <i className="bi bi-tag me-1"></i>
                  Bildirim Tipi
                </label>
                <select
                  id="announcementType"
                  className="form-select"
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                >
                  <option value="info">Bilgi</option>
                  <option value="success">Başarı</option>
                  <option value="warning">Uyarı</option>
                  <option value="error">Hata</option>
                  <option value="payment">Ödeme</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                <i className="bi bi-send me-2"></i>
                {editingAnnouncement ? 'Duyuruyu Güncelle' : 'Duyuru Gönder'}
              </button>
            </form>
          </div>
        </div>
          )}
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <Archive />
          </div>
        </div>
      )}

      {/* Add/Edit User Form Modal */}
      {showAddUserForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseUserForm}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUserFormSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Ad Soyad *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={userFormData.name}
                      onChange={handleUserFormChange}
                      className="form-control form-control-custom"
                      placeholder="Ad soyad girin"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Rol *</label>
                    <select
                      id="role"
                      name="role"
                      value={userFormData.role}
                      onChange={handleUserFormChange}
                      className="form-select form-control-custom"
                    >
                      <option key="personnel" value="personnel">Personel</option>
                    </select>
                    <div className="form-text text-muted">
                      <small>
                        <strong>Personel:</strong> Panel yönetimi ve görsel yükleme yetkisi.<br/>
                        <em>Not: Firma ve Site kullanıcıları otomatik olarak eklenir. Gözlemci ve yönetici hesapları teknik kuruluma özeldir.</em>
                      </small>
                    </div>
                  </div>
                  
                  {!editingUser && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">Şifre *</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={userFormData.password}
                          onChange={handleUserFormChange}
                          className="form-control form-control-custom"
                          placeholder="Şifre girin"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Şifre (Tekrar) *</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={userFormData.confirmPassword}
                          onChange={handleUserFormChange}
                          className="form-control form-control-custom"
                          placeholder="Şifreyi tekrar girin"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseUserForm();
                      }}
                      className="btn btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-gradient"
                      onClick={() => {
                        // Close form immediately after submission
                        setTimeout(() => {
                          handleCloseUserForm();
                        }, 100);
                      }}
                    >
                      {editingUser ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">
                <i className="bi bi-printer me-2"></i>
                Panel Etiketleri
              </h5>
              <button 
                className="btn btn-primary"
                onClick={handleDownloadLabelsPDF}
              >
                <i className="bi bi-download me-1"></i>
                PDF İndir
              </button>
            </div>

            {/* Filters */}
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Site Seçimi</label>
                <select 
                  className="form-select"
                  value={selectedSiteForLabels}
                  onChange={(e) => setSelectedSiteForLabels(e.target.value)}
                >
                  <option key="all" value="all">Tüm Siteler</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.siteType === 'business_center' ? 'İş Merkezi' : 'Site'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Tür Seçimi</label>
                <select 
                  className="form-select"
                  value={labelType}
                  onChange={(e) => setLabelType(e.target.value)}
                >
                  <option key="all" value="all">Tüm Türler</option>
                  <option key="site" value="site">Sadece Siteler</option>
                  <option key="business_center" value="business_center">Sadece İş Merkezleri</option>
                </select>
              </div>
            </div>

            {/* Labels Grid */}
            <div className="labels-container">
              {sites
                .filter(site => {
                  if (selectedSiteForLabels !== 'all' && site.id !== selectedSiteForLabels) return false;
                  if (labelType !== 'all' && site.siteType !== labelType) return false;
                  return true;
                })
                .map(site => {
                  const blockLabels = site.siteType === 'business_center' ? ['A'] : 
                    Array.from({ length: parseInt(site.blocks) || 0 }, (_, i) => String.fromCharCode(65 + i));
                  
                  return (
                    <div key={site.id} className="mb-4">
                      <h6 className="text-primary mb-3">
                        <i className={`bi ${site.siteType === 'business_center' ? 'bi-briefcase' : 'bi-building'} me-2`}></i>
                        {site.name} ({site.siteType === 'business_center' ? 'İş Merkezi' : 'Site'})
                      </h6>
                      
                      {blockLabels.map(blockLabel => {
                        const panelCount = site.siteType === 'business_center' ? 
                          (parseInt(site.panels) || 0) : 
                          (parseInt(site.elevatorsPerBlock) || 0) * 2;
                        
                        return (
                          <div key={`${site.id}-${blockLabel}`} className="mb-3">
                            <h6 className="text-muted mb-2">
                              {site.siteType === 'business_center' ? 'İş Merkezi' : `Blok ${blockLabel}`}
                            </h6>
                            <div className="row g-2">
                              {Array.from({ length: panelCount }, (_, i) => {
                                const panelId = i + 1;
                                const panelName = `${site.id}${blockLabel}${panelId}`;
                                
                                return (
                                  <div key={panelName} className="col-3 col-md-2 col-lg-1">
                                    <div className="label-sticker">
                                      <div className="label-content">
                                        <div className="label-title">Panel</div>
                                        <div className="label-id">{panelName}</div>
                                        <div className="label-site">{site.name}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="toast show position-fixed bottom-0 end-0 m-3" style={{zIndex: 1050}}>
          <div className="toast-header bg-success text-white">
            <i className="bi bi-check-circle me-2"></i>
            <strong className="me-auto">Başarılı</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowSuccessMessage(false)}></button>
          </div>
          <div className="toast-body">
            İşlem başarıyla tamamlandı.
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;