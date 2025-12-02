import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getLogs, getSites } from '../services/api';
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

  // Fetch logs when logs tab is activated
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
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

    // A4 dimensions in mm: 210mm x 297mm
    // Label dimensions: 60mm (6cm) x 20mm (2cm)
    // Labels per row: 3 (18cm used, 1.5cm margin each side)
    // Labels per column: 14 (28cm used, 0.85cm margin top/bottom)
    // Total: 3 x 14 = 42 labels per page

    const labelWidth = 60; // 6cm in mm
    const labelHeight = 20; // 2cm in mm
    const labelsPerRow = 3;
    const labelsPerCol = 14;
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const marginLeft = (pageWidth - (labelWidth * labelsPerRow)) / 2; // Center horizontally
    const marginTop = (pageHeight - (labelHeight * labelsPerCol)) / 2; // Center vertically

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentPage = 0;
    let labelIndex = 0;

    while (labelIndex < allLabels.length) {
      if (labelIndex > 0 && labelIndex % 42 === 0) {
        pdf.addPage();
        currentPage++;
      }

      const pageLabelIndex = labelIndex % 42;
      const row = Math.floor(pageLabelIndex / labelsPerRow);
      const col = pageLabelIndex % labelsPerRow;

      const x = marginLeft + (col * labelWidth);
      const y = marginTop + (row * labelHeight);

      const label = allLabels[labelIndex];

      // Draw label border with modern style
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, labelWidth, labelHeight);

      // Panel ID (left side - bold and large)
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PANEL', x + 2, y + 5);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label.panelId, x + 2, y + 12);

      // Contact info (right side - bold, smaller, right-aligned)
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'bold');
      const contactText = 'Bu alana reklam vermek için iletişim: 05473652323 APART Mecra';
      // Calculate right-aligned position
      const contactMaxWidth = labelWidth - 38; // Leave space for panel ID (35mm) + margin (3mm)
      const contactLines = pdf.splitTextToSize(contactText, contactMaxWidth);
      
      // Right-align each line
      let contactY = y + 4;
      contactLines.forEach((line, idx) => {
        const textWidth = pdf.getTextWidth(line);
        const rightX = x + labelWidth - 2 - textWidth; // Right margin 2mm
        pdf.text(line, rightX, contactY);
        contactY += 3.5;
      });

      // Site name (bottom center, small and italic)
      pdf.setFontSize(4.5);
      pdf.setFont('helvetica', 'italic');
      const siteNameText = label.siteName;
      const siteNameWidth = pdf.getTextWidth(siteNameText);
      const siteNameX = x + (labelWidth - siteNameWidth) / 2; // Center horizontally
      pdf.text(siteNameText, siteNameX, y + labelHeight - 2);

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

      {/* Archive Tab - Moved from separate page */}
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
                      <option key="observer" value="observer">Gözlemci</option>
                      <option key="admin" value="admin">Yönetici</option>
                    </select>
                    <div className="form-text text-muted">
                      <small>
                        <strong>Personel:</strong> Panel yönetimi ve görsel yükleme yetkisi.<br/>
                        <strong>Gözlemci:</strong> Tüm verileri görüntüleyebilir, ancak hiçbir değişiklik yapamaz.<br/>
                        <strong>Yönetici:</strong> Tüm sistem özelliklerine erişim ve düzeneleme yetkisi vardır.<br/>
                        <em>Not: Firma ve Site kullanıcıları otomatik olarak eklenir.</em>
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