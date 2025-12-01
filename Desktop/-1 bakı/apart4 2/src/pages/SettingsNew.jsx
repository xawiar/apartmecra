import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [securityFormData, setSecurityFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState({}); // State to track which user info to show

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

    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setUserFormData({
      name: '',
      password: '',
      confirmPassword: ''
    });
    setEditingUser(null);
    setShowAddUserForm(true);
  };

  const handleEditUser = (user) => {
    setUserFormData({
      name: user.name || '',
      password: '',
      confirmPassword: ''
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

  // Function to reset the entire system
  const handleResetSystem = async () => {
    const result = await window.showConfirm(
      'Sistem Sıfırlama',
      'Tüm sistem verileri silinecek. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?',
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
            className={`nav-link ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => navigate('/settings/archive')}
          >
            <i className="bi bi-archive me-1"></i>
            Arşiv
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reset' ? 'active' : ''}`}
            onClick={() => setActiveTab('reset')}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Sistemi Sıfırla
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
                      <td>{user.role || 'Kullanıcı'}</td>
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
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {activeTab === 'archive' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-4">Arşiv</h5>
            <p>Arşiv sayfasına gitmek için aşağıdaki butona tıklayın:</p>
            <button 
              onClick={() => navigate('/settings/archive')}
              className="btn btn-primary"
            >
              <i className="bi bi-archive me-2"></i>
              Arşiv Sayfasına Git
            </button>
          </div>
        </div>
      )}

      {/* Reset System Tab */}
      {activeTab === 'reset' && (
        <div className="card custom-card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-4">Sistemi Sıfırla</h5>
            
            <div className="alert alert-warning">
              <h6 className="alert-heading">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Uyarı!
              </h6>
              <p>
                Bu işlem tüm sistem verilerini kalıcı olarak siler. Bu işlem geri alınamaz.
                Sistemdeki tüm siteler, firmalar, anlaşmalar, kasa işlemleri, ortak payları ve kullanıcılar silinecektir.
              </p>
            </div>
            
            <div className="d-flex justify-content-center mt-4">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn btn-danger btn-lg"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Sistemi Sıfırla
              </button>
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
                <h5 className="modal-title">Sistemi Sıfırla</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <h6 className="alert-heading">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Onay Gerekiyor!
                  </h6>
                  <p>
                    Tüm sistem verileri kalıcı olarak silinecek. Bu işlem geri alınamaz.
                    Devam etmek istediğinize emin misiniz?
                  </p>
                </div>
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