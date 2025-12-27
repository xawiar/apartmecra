import React, { useState, useEffect } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, createSite, createCompany, createLog } from '../services/api';
import { getUser } from '../utils/auth';
import logger from '../utils/logger';

const Meetings = () => {
  const [activeTab, setActiveTab] = useState('sites'); // 'sites' or 'companies'
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'continuing', 'positive', 'rejected'
  
  const [formData, setFormData] = useState({
    // Site fields
    name: '',
    manager: '',
    phone: '',
    address: '',
    // Company fields
    contact: '',
    email: '',
    // Common fields
    notes: '',
    status: 'continuing' // 'continuing', 'positive', 'rejected'
  });

  const user = getUser();
  const isAdmin = user && (user.role === 'admin' || user.role === 'administrator');

  useEffect(() => {
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to access meetings page');
      return;
    }
    
    fetchData();
  }, [isAdmin, activeTab, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'sites' ? 'site' : 'company';
      const allMeetings = await getMeetings(type);
      
      // Apply status filter
      let filteredMeetings = allMeetings;
      if (statusFilter !== 'all') {
        filteredMeetings = allMeetings.filter(m => m.status === statusFilter);
      }
      
      setMeetings(filteredMeetings);
    } catch (error) {
      logger.error('Error fetching meetings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const meetingData = {
        type: activeTab === 'sites' ? 'site' : 'company',
        // Site fields
        name: formData.name,
        manager: activeTab === 'sites' ? formData.manager : null,
        phone: formData.phone,
        address: formData.address,
        // Company fields
        contact: activeTab === 'companies' ? formData.contact : null,
        email: activeTab === 'companies' ? formData.email : null,
        // Common fields
        notes: formData.notes,
        status: formData.status,
        date: new Date().toISOString().split('T')[0] // Auto date
      };

      if (editingMeeting) {
        // Update existing meeting
        const success = await updateMeeting(editingMeeting.id || editingMeeting._docId, meetingData);
        if (success) {
          await window.showAlert('Başarılı', 'Görüşme güncellendi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme güncellendi: ${activeTab === 'sites' ? 'Site' : 'Firma'} - ${formData.name}`
          });
          resetForm();
          fetchData();
        }
      } else {
        // Create new meeting
        const result = await createMeeting(meetingData);
        if (result) {
          await window.showAlert('Başarılı', 'Görüşme eklendi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Yeni görüşme eklendi: ${activeTab === 'sites' ? 'Site' : 'Firma'} - ${formData.name}`
          });
          resetForm();
          fetchData();
        }
      }
    } catch (error) {
      logger.error('Error saving meeting:', error);
      await window.showAlert('Hata', 'Görüşme kaydedilirken bir hata oluştu.', 'error');
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      name: meeting.name || '',
      manager: meeting.manager || '',
      phone: meeting.phone || '',
      address: meeting.address || '',
      contact: meeting.contact || '',
      email: meeting.email || '',
      notes: meeting.notes || '',
      status: meeting.status || 'continuing'
    });
    setShowForm(true);
  };

  const handleDelete = async (meetingId) => {
    const confirmed = await window.showConfirm(
      'Görüşmeyi Sil',
      'Bu görüşmeyi silmek istediğinizden emin misiniz?',
      'warning'
    );
    
    if (confirmed) {
      try {
        const success = await deleteMeeting(meetingId);
        if (success) {
          await window.showAlert('Başarılı', 'Görüşme silindi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme silindi: ${meetingId}`
          });
          fetchData();
        }
      } catch (error) {
        logger.error('Error deleting meeting:', error);
        await window.showAlert('Hata', 'Görüşme silinirken bir hata oluştu.', 'error');
      }
    }
  };

  const handleAddToSystem = async (meeting) => {
    const confirmed = await window.showConfirm(
      'Sisteme Ekle',
      `${meeting.name} ${activeTab === 'sites' ? 'sitesini' : 'firmasını'} sisteme eklemek istediğinizden emin misiniz?`,
      'info'
    );
    
    if (confirmed) {
      try {
        if (activeTab === 'sites') {
          // Create site
          const siteData = {
            name: meeting.name,
            manager: meeting.manager || '',
            phone: meeting.phone || '',
            address: meeting.address || '',
            status: 'active',
            notes: meeting.notes || ''
          };
          
          const newSite = await createSite(siteData);
          if (newSite) {
            await window.showAlert('Başarılı', 'Site sisteme eklendi.', 'success');
            await createLog({
              user: 'Admin',
              action: `Görüşmeden site eklendi: ${meeting.name}`
            });
            // Optionally update meeting status to 'positive'
            await updateMeeting(meeting.id || meeting._docId, { status: 'positive' });
            fetchData();
          }
        } else {
          // Create company
          const companyData = {
            name: meeting.name,
            contact: meeting.contact || '',
            phone: meeting.phone || '',
            email: meeting.email || '',
            address: meeting.address || '',
            status: 'active',
            notes: meeting.notes || ''
          };
          
          const newCompany = await createCompany(companyData);
          if (newCompany) {
            await window.showAlert('Başarılı', 'Firma sisteme eklendi.', 'success');
            await createLog({
              user: 'Admin',
              action: `Görüşmeden firma eklendi: ${meeting.name}`
            });
            // Optionally update meeting status to 'positive'
            await updateMeeting(meeting.id || meeting._docId, { status: 'positive' });
            fetchData();
          }
        }
      } catch (error) {
        logger.error('Error adding to system:', error);
        await window.showAlert('Hata', 'Sisteme eklenirken bir hata oluştu.', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      manager: '',
      phone: '',
      address: '',
      contact: '',
      email: '',
      notes: '',
      status: 'continuing'
    });
    setEditingMeeting(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'positive':
        return <span className="badge bg-success">Olumlu</span>;
      case 'rejected':
        return <span className="badge bg-danger">Reddedildi</span>;
      case 'continuing':
        return <span className="badge bg-primary">Devam Ediyor</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Bu sayfaya erişim yetkiniz yok.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3 text-muted">Görüşmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h2 className="h3 h4-md fw-bold mb-1">Görüşmeler</h2>
          <p className="mb-0 small text-muted">Potansiyel site ve firma görüşmelerini yönetin</p>
        </div>
        <button
          className="btn btn-primary mt-2 mt-md-0"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Görüşme Ekle
        </button>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('sites');
              setStatusFilter('all');
              resetForm();
            }}
          >
            <i className="bi bi-building me-1"></i>
            Site Görüşmeleri
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('companies');
              setStatusFilter('all');
              resetForm();
            }}
          >
            <i className="bi bi-building-add me-1"></i>
            Firma Görüşmeleri
          </button>
        </li>
      </ul>

      {/* Status Filter */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setStatusFilter('all')}
          >
            Tümü
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'continuing' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setStatusFilter('continuing')}
          >
            Devam Ediyor
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'positive' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setStatusFilter('positive')}
          >
            Olumlu
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Reddedildi
          </button>
        </div>
      </div>

      {/* Meeting Form Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-chat-dots me-2"></i>
                  {editingMeeting ? 'Görüşme Düzenle' : 'Yeni Görüşme Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label htmlFor="name" className="form-label">
                        {activeTab === 'sites' ? 'Site Adı' : 'Firma Adı'} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        placeholder={activeTab === 'sites' ? 'Site adını girin' : 'Firma adını girin'}
                      />
                    </div>

                    {activeTab === 'sites' ? (
                      <>
                        <div className="col-md-6">
                          <label htmlFor="manager" className="form-label">Yönetici Adı</label>
                          <input
                            type="text"
                            id="manager"
                            name="manager"
                            className="form-control"
                            value={formData.manager}
                            onChange={handleFormChange}
                            placeholder="Yönetici adını girin"
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">Telefon</label>
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleFormChange}
                            placeholder="Telefon numarası"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-md-6">
                          <label htmlFor="contact" className="form-label">Yetkili Adı</label>
                          <input
                            type="text"
                            id="contact"
                            name="contact"
                            className="form-control"
                            value={formData.contact}
                            onChange={handleFormChange}
                            placeholder="Yetkili adını girin"
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">Telefon</label>
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleFormChange}
                            placeholder="Telefon numarası"
                          />
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleFormChange}
                            placeholder="Email adresi"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-md-12">
                      <label htmlFor="address" className="form-label">Adres</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        className="form-control"
                        value={formData.address}
                        onChange={handleFormChange}
                        placeholder="Adres bilgisi"
                      />
                    </div>

                    <div className="col-md-12">
                      <label htmlFor="status" className="form-label">
                        Durum <span className="text-danger">*</span>
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="continuing">Devam Ediyor</option>
                        <option value="positive">Olumlu</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </div>

                    <div className="col-md-12">
                      <label htmlFor="notes" className="form-label">
                        Görüşme Notları <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        className="form-control"
                        rows="6"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Görüşme detaylarını buraya yazın..."
                        required
                      ></textarea>
                      <small className="text-muted">
                        Görüşme tarihi otomatik olarak eklenecektir.
                      </small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editingMeeting ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-list-ul me-2"></i>
            {activeTab === 'sites' ? 'Site' : 'Firma'} Görüşmeleri ({meetings.length})
          </h5>
        </div>
        <div className="card-body">
          {meetings.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
              <p className="text-muted">
                {statusFilter === 'all' 
                  ? `Henüz ${activeTab === 'sites' ? 'site' : 'firma'} görüşmesi eklenmemiş.`
                  : `Bu durumda görüşme bulunmamaktadır.`}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>{activeTab === 'sites' ? 'Site Adı' : 'Firma Adı'}</th>
                    {activeTab === 'sites' ? (
                      <>
                        <th>Yönetici</th>
                        <th>Telefon</th>
                      </>
                    ) : (
                      <>
                        <th>Yetkili</th>
                        <th>Telefon</th>
                        <th>Email</th>
                      </>
                    )}
                    <th>Durum</th>
                    <th>Notlar</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id || meeting._docId}>
                      <td className="small">
                        {meeting.date 
                          ? new Date(meeting.date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Tarih yok'}
                      </td>
                      <td className="fw-medium">{meeting.name || '-'}</td>
                      {activeTab === 'sites' ? (
                        <>
                          <td>{meeting.manager || '-'}</td>
                          <td>{meeting.phone || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td>{meeting.contact || '-'}</td>
                          <td>{meeting.phone || '-'}</td>
                          <td>{meeting.email || '-'}</td>
                        </>
                      )}
                      <td>{getStatusBadge(meeting.status)}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={meeting.notes}>
                          {meeting.notes || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(meeting)}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {meeting.status === 'positive' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleAddToSystem(meeting)}
                              title="Sisteme Ekle"
                            >
                              <i className="bi bi-plus-circle"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(meeting.id || meeting._docId)}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
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
  );
};

export default Meetings;
