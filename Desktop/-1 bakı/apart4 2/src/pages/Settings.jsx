import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getCompanies } from '../services/api';
import { getLogs, createLog } from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // Add companies state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    role: 'personnel'
  });
  const [systemFormData, setSystemFormData] = useState({
    currency: 'TRY',
    paymentDay: 'Friday',
    companyName: '',
    companyAddress: '',
    companyPhone: ''
  });
  const [securityFormData, setSecurityFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState({}); // State to track which user info to show

  const fetchData = async () => {
    try {
      const [usersData, logsData, companiesData] = await Promise.all([
        getUsers(),
        getLogs(),
        getCompanies()
      ]);
      setUsers(usersData);
      setLogs(logsData);
      setCompanies(companiesData); // Set companies data
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh users when page becomes visible (user might have deleted site/company from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh periodically (every 30 seconds)
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

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
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Kullanıcı silindi: ${users.find(u => u.id === userId)?.name || 'Bilinmeyen Kullanıcı'}`
          });
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

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value
    });
  };

  const handleSystemFormChange = (e) => {
    const { name, value } = e.target;
    setSystemFormData({
      ...systemFormData,
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
    if (!userFormData.name) {
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
        const updatedUser = await updateUser(editingUser.id, userFormData);
        if (updatedUser) {
          setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
          setShowAddUserForm(false);
          setEditingUser(null);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Kullanıcı güncellendi: ${userFormData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Kullanıcı başarıyla güncellendi.',
            'success'
          );
        }
      } else {
        // Create new user
        const newUser = await createUser(userFormData);
        if (newUser) {
          setUsers([...users, newUser]);
          setShowAddUserForm(false);
          // Log the action
          await createLog({
            user: 'Admin',
            action: `Yeni kullanıcı eklendi: ${userFormData.name}`
          });
          
          await window.showAlert(
            'Başarılı',
            'Yeni kullanıcı başarıyla eklendi.',
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

  const handleSystemFormSubmit = async (e) => {
    e.preventDefault();
    
    // In a real app, this would connect to an API
    console.log('System settings saved:', systemFormData);
    
    await window.showAlert(
      'Başarılı',
      'Sistem ayarları başarıyla güncellendi.',
      'success'
    );
    
    // Log the action
    await createLog({
      user: 'Admin',
      action: 'Sistem ayarları güncellendi'
    });
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
    
    // Log the action
    await createLog({
      user: 'Admin',
      action: 'Şifre güncellendi'
    });
  };

  // Function to clear all logs
  const handleClearLogs = async () => {
    const result = await window.showConfirm(
      'Log Temizleme',
      'Tüm log kayıtlarını silmek istediğinize emin misiniz?',
      'warning'
    );
    
    if (result) {
      try {
        // Clear logs by sending an empty array to the logs endpoint
        const response = await fetch('http://localhost:3001/logs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([])
        });
        
        if (response.ok) {
          setLogs([]);
          await window.showAlert(
            'Başarılı',
            'Tüm log kayıtları silindi.',
            'success'
          );
          
          // Log the action
          await createLog({
            user: 'Admin',
            action: 'Tüm log kayıtları silindi'
          });
        } else {
          await window.showAlert(
            'Hata',
            'Log kayıtları silinirken bir hata oluştu.',
            'error'
          );
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
        await window.showAlert(
          'Hata',
          'Log kayıtları silinirken bir hata oluştu.',
          'error'
        );
      }
    }
  };

  // Function to reset the system
  const handleResetSystem = async () => {
    const result = await window.showConfirm(
      'Sistem Sıfırlama',
      'Sistemi sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.',
      'warning'
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
          throw new Error('Reset endpoint returned an error');
        }
      } catch (error) {
        console.error('Error resetting system:', error);
        await window.showAlert(
          'Hata',
          'Sistem sıfırlama sırasında bir hata oluştu.',
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
      <div className="page-header mb-4">
        <h2 className="h3 fw-bold mb-0">Ayarlar</h2>
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
            className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <i className="bi bi-gear me-1"></i>
            Sistem
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
      </ul>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">Kullanıcı Yönetimi</h5>
              <button 
                onClick={handleAddUser}
                className="btn btn-primary btn-sm btn-icon"
              >
                <i className="bi bi-plus-lg"></i>
                Kullanıcı Ekle
              </button>
            </div>
            
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-medium">{user.name || user.username}</td>
                      <td>
                        {user.role === 'company' ? `Firma Kullanıcısı (${getCompanyName(user.companyId)})` : 
                         user.role === 'site_user' ? 'Site Kullanıcısı' :
                         user.role === 'observer' ? 'Gözlemci' :
                         user.role === 'personnel' ? 'Personel' :
                         user.role === 'admin' || user.role === 'administrator' ? 'Yönetici' :
                         (user.role || 'Kullanıcı')}
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
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-people"></i>
                          <p className="mb-3">Henüz kullanıcı bulunmamaktadır.</p>
                          <button 
                            onClick={handleAddUser}
                            className="btn btn-primary-gradient"
                          >
                            Kullanıcı Ekle
                          </button>
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

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-4">Sistem Ayarları</h5>
            
            <form onSubmit={handleSystemFormSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="currency" className="form-label">Para Birimi</label>
                  <select
                    id="currency"
                    name="currency"
                    value={systemFormData.currency}
                    onChange={handleSystemFormChange}
                    className="form-select form-control-custom"
                  >
                    <option value="TRY">Türk Lirası (₺)</option>
                    <option value="USD">Amerikan Doları ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="paymentDay" className="form-label">Ödeme Günü</label>
                  <select
                    id="paymentDay"
                    name="paymentDay"
                    value={systemFormData.paymentDay}
                    onChange={handleSystemFormChange}
                    className="form-select form-control-custom"
                  >
                    <option value="Monday">Pazartesi</option>
                    <option value="Tuesday">Salı</option>
                    <option value="Wednesday">Çarşamba</option>
                    <option value="Thursday">Perşembe</option>
                    <option value="Friday">Cuma</option>
                    <option value="Saturday">Cumartesi</option>
                    <option value="Sunday">Pazar</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="companyName" className="form-label">Firma Adı</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={systemFormData.companyName}
                    onChange={handleSystemFormChange}
                    className="form-control form-control-custom"
                    placeholder="Firma adını girin"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="companyPhone" className="form-label">Firma Telefonu</label>
                  <input
                    type="text"
                    id="companyPhone"
                    name="companyPhone"
                    value={systemFormData.companyPhone}
                    onChange={handleSystemFormChange}
                    className="form-control form-control-custom"
                    placeholder="Telefon numarasını girin"
                  />
                </div>
                
                <div className="col-12 mb-3">
                  <label htmlFor="companyAddress" className="form-label">Firma Adresi</label>
                  <textarea
                    id="companyAddress"
                    name="companyAddress"
                    value={systemFormData.companyAddress}
                    onChange={handleSystemFormChange}
                    className="form-control form-control-custom"
                    rows="3"
                    placeholder="Adresi girin"
                  ></textarea>
                </div>
              </div>
              
              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-primary-gradient"
                >
                  <i className="bi bi-save me-1"></i>
                  Ayarları Kaydet
                </button>
              </div>
            </form>
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
            
            {/* System Reset Section */}
            <div className="mt-5 pt-4 border-top">
              <h5 className="card-title mb-3">Sistem Yönetimi</h5>
              <button
                onClick={() => setShowResetConfirm(true)}
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
              <h5 className="card-title mb-0">Log Kayıtları</h5>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleClearLogs}
              >
                <i className="bi bi-trash me-1"></i>
                Tüm Logları Temizle
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>İşlem</th>
                    <th>Tarih/Saat</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    [...logs].reverse().map((log) => (
                      <tr key={log.id}>
                        <td className="fw-medium">{log.user}</td>
                        <td>{log.action}</td>
                        <td>{formatDate(log.timestamp)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-journal-text"></i>
                          <p className="mb-3">Henüz log kaydı bulunmamaktadır.</p>
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
                      <option value="personnel">Personel</option>
                      <option value="company">Firma Kullanıcısı</option>
                      <option value="site_user">Site Kullanıcısı</option>
                      <option value="observer">Gözlemci</option>
                      <option value="admin">Yönetici</option>
                    </select>
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

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sistem Sıfırlama Onayı</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowResetConfirm(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Sistemi sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowResetConfirm(false);
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    handleResetSystem();
                    setShowResetConfirm(false);
                  }}
                >
                  Evet, Sistemi Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get company name by ID
const getCompanyName = (companyId) => {
  if (!companyId) return 'Bilinmiyor';
  
  const company = companies.find(c => String(c.id) === String(companyId));
  return company ? company.name : companyId;
};

export default Settings;