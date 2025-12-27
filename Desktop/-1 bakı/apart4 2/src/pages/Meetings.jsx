import React, { useState, useEffect } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, getSites, getCompanies, createLog } from '../services/api';
import { getUser } from '../utils/auth';
import logger from '../utils/logger';

const Meetings = () => {
  const [activeTab, setActiveTab] = useState('sites'); // 'sites' or 'companies'
  const [meetings, setMeetings] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'continuing', 'positive', 'rejected'
  
  const [formData, setFormData] = useState({
    type: 'site', // 'site' or 'company'
    siteId: '',
    companyId: '',
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
      
      // Fetch sites and companies for dropdowns
      const [sitesData, companiesData] = await Promise.all([
        getSites(),
        getCompanies()
      ]);
      
      setSites(sitesData || []);
      setCompanies(companiesData || []);
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
        siteId: activeTab === 'sites' ? formData.siteId : null,
        companyId: activeTab === 'companies' ? formData.companyId : null,
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
            action: `Görüşme güncellendi: ${activeTab === 'sites' ? 'Site' : 'Firma'} - ${editingMeeting.id}`
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
            action: `Yeni görüşme eklendi: ${activeTab === 'sites' ? 'Site' : 'Firma'}`
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
      type: meeting.type || (activeTab === 'sites' ? 'site' : 'company'),
      siteId: meeting.siteId || '',
      companyId: meeting.companyId || '',
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

  const resetForm = () => {
    setFormData({
      type: activeTab === 'sites' ? 'site' : 'company',
      siteId: '',
      companyId: '',
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getSiteName = (siteId) => {
    const site = sites.find(s => String(s.id) === String(siteId) || String(s._docId) === String(siteId));
    return site ? site.name : 'Bilinmeyen Site';
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId) || String(c._docId) === String(companyId));
    return company ? company.name : 'Bilinmeyen Firma';
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
          <p className="mb-0 small text-muted">Site ve firma görüşmelerini yönetin</p>
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
                  <div className="mb-3">
                    <label htmlFor="entitySelect" className="form-label">
                      {activeTab === 'sites' ? 'Site' : 'Firma'} <span className="text-danger">*</span>
                    </label>
                    <select
                      id="entitySelect"
                      name={activeTab === 'sites' ? 'siteId' : 'companyId'}
                      className="form-select"
                      value={activeTab === 'sites' ? formData.siteId : formData.companyId}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Seçiniz...</option>
                      {activeTab === 'sites' ? (
                        sites.map(site => (
                          <option key={site.id || site._docId} value={site.id || site._docId}>
                            {site.name}
                          </option>
                        ))
                      ) : (
                        companies.map(company => (
                          <option key={company.id || company._docId} value={company.id || company._docId}>
                            {company.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="mb-3">
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

                  <div className="mb-3">
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
                    <th>{activeTab === 'sites' ? 'Site' : 'Firma'}</th>
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
                      <td className="fw-medium">
                        {activeTab === 'sites' 
                          ? getSiteName(meeting.siteId)
                          : getCompanyName(meeting.companyId)}
                      </td>
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

