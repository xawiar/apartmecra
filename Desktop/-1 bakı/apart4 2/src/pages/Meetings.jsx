import React, { useState, useEffect } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, createLog } from '../services/api';
import { getUser } from '../utils/auth';
import logger from '../utils/logger';

const Meetings = () => {
  const [activeTab, setActiveTab] = useState('sites'); // 'sites' or 'companies'
  const [meetingEntities, setMeetingEntities] = useState([]); // Sites or companies for meetings
  const [allMeetingNotes, setAllMeetingNotes] = useState([]); // All meeting notes grouped by entity
  const [loading, setLoading] = useState(true);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  
  // Entity form (site/company)
  const [entityFormData, setEntityFormData] = useState({
    name: '',
    manager: '',
    phone: '',
    address: '',
    contact: '',
    email: ''
  });
  
  // Note form
  const [noteFormData, setNoteFormData] = useState({
    selectedEntityId: '', // Dropdown selection
    notes: '',
    status: 'continuing'
  });

  const user = getUser();
  const isAdmin = user && (user.role === 'admin' || user.role === 'administrator');

  useEffect(() => {
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to access meetings page');
      return;
    }
    
    fetchEntities();
  }, [isAdmin, activeTab]);

  useEffect(() => {
    fetchAllMeetingNotes();
  }, [activeTab]);

  const fetchEntities = async () => {
    try {
      const type = activeTab === 'sites' ? 'site' : 'company';
      const allMeetings = await getMeetings(type);
      
      // Get unique entities (sites/companies) from meetings
      const entitiesMap = new Map();
      allMeetings.forEach(meeting => {
        const entityId = activeTab === 'sites' ? meeting.siteId : meeting.companyId;
        const entityName = meeting.name;
        
        if (entityId && !entitiesMap.has(entityId)) {
          entitiesMap.set(entityId, {
            id: entityId,
            name: entityName,
            manager: meeting.manager || '',
            phone: meeting.phone || '',
            address: meeting.address || '',
            contact: meeting.contact || '',
            email: meeting.email || ''
          });
        }
      });
      
      setMeetingEntities(Array.from(entitiesMap.values()));
    } catch (error) {
      logger.error('Error fetching entities:', error);
    }
  };

  const fetchAllMeetingNotes = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'sites' ? 'site' : 'company';
      const allMeetings = await getMeetings(type);
      
      // Group meetings by entity
      const groupedNotes = {};
      allMeetings.forEach(meeting => {
        const entityId = activeTab === 'sites' ? meeting.siteId : meeting.companyId;
        if (entityId) {
          if (!groupedNotes[entityId]) {
            groupedNotes[entityId] = {
              entityId: entityId,
              entityName: meeting.name,
              notes: []
            };
          }
          groupedNotes[entityId].notes.push(meeting);
        }
      });
      
      // Sort notes within each group by date (most recent first)
      Object.keys(groupedNotes).forEach(entityId => {
        groupedNotes[entityId].notes.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
      });
      
      setAllMeetingNotes(Object.values(groupedNotes));
      await fetchEntities();
    } catch (error) {
      logger.error('Error fetching meeting notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntitySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const entityData = {
        type: activeTab === 'sites' ? 'site' : 'company',
        name: entityFormData.name,
        [activeTab === 'sites' ? 'siteId' : 'companyId']: `MEETING_${Date.now()}`, // Temporary ID
        ...(activeTab === 'sites' ? {
          manager: entityFormData.manager || '',
          phone: entityFormData.phone || '',
          address: entityFormData.address || ''
        } : {
          contact: entityFormData.contact || '',
          phone: entityFormData.phone || '',
          email: entityFormData.email || '',
          address: entityFormData.address || ''
        }),
        // Create first meeting note with entity info
        notes: `İlk görüşme - ${entityFormData.name} eklendi`,
        status: 'continuing',
        date: new Date().toISOString().split('T')[0]
      };

      if (editingEntity) {
        // Update: Update all meetings with this entity
        const type = activeTab === 'sites' ? 'site' : 'company';
        const allMeetings = await getMeetings(type);
        const entityMeetings = allMeetings.filter(m => {
          const meetingEntityId = activeTab === 'sites' ? m.siteId : m.companyId;
          return meetingEntityId === editingEntity.id;
        });
        
        for (const meeting of entityMeetings) {
          await updateMeeting(meeting.id || meeting._docId, {
            name: entityFormData.name,
            ...(activeTab === 'sites' ? {
              manager: entityFormData.manager || '',
              phone: entityFormData.phone || '',
              address: entityFormData.address || ''
            } : {
              contact: entityFormData.contact || '',
              phone: entityFormData.phone || '',
              email: entityFormData.email || '',
              address: entityFormData.address || ''
            })
          });
        }
        
        await window.showAlert('Başarılı', `${activeTab === 'sites' ? 'Site' : 'Firma'} güncellendi.`, 'success');
      } else {
        // Create: Create first meeting with entity info
        const result = await createMeeting(entityData);
        if (result) {
          await window.showAlert('Başarılı', `${activeTab === 'sites' ? 'Site' : 'Firma'} eklendi.`, 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme ${activeTab === 'sites' ? 'sitesi' : 'firması'} eklendi: ${entityFormData.name}`
          });
        }
      }
      
      resetEntityForm();
      fetchAllMeetingNotes();
    } catch (error) {
      logger.error('Error saving entity:', error);
      await window.showAlert('Hata', 'Kaydedilirken bir hata oluştu.', 'error');
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    
    if (!noteFormData.selectedEntityId) {
      await window.showAlert('Uyarı', 'Lütfen bir site/firma seçin.', 'warning');
      return;
    }
    
    try {
      const selectedEntity = meetingEntities.find(e => e.id === noteFormData.selectedEntityId);
      if (!selectedEntity) {
        throw new Error('Seçilen site/firma bulunamadı');
      }
      
      const noteData = {
        type: activeTab === 'sites' ? 'site' : 'company',
        [activeTab === 'sites' ? 'siteId' : 'companyId']: noteFormData.selectedEntityId,
        name: selectedEntity.name,
        notes: noteFormData.notes,
        status: noteFormData.status,
        date: new Date().toISOString().split('T')[0] // Auto date
      };

      if (editingNote) {
        const success = await updateMeeting(editingNote.id || editingNote._docId, noteData);
        if (success) {
          await window.showAlert('Başarılı', 'Görüşme notu güncellendi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme notu güncellendi: ${selectedEntity.name}`
          });
        }
      } else {
        const result = await createMeeting(noteData);
        if (result) {
          await window.showAlert('Başarılı', 'Görüşme notu eklendi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme notu eklendi: ${selectedEntity.name}`
          });
        }
      }
      
      resetNoteForm();
      fetchAllMeetingNotes();
    } catch (error) {
      logger.error('Error saving note:', error);
      await window.showAlert('Hata', 'Görüşme notu kaydedilirken bir hata oluştu.', 'error');
    }
  };

  const handleDeleteEntity = async (entity) => {
    const confirmed = await window.showConfirm(
      `${activeTab === 'sites' ? 'Siteyi' : 'Firmayı'} Sil`,
      `${entity.name} ${activeTab === 'sites' ? 'sitesini' : 'firmasını'} ve tüm görüşme notlarını silmek istediğinizden emin misiniz?`,
      'error'
    );
    
    if (confirmed) {
      try {
        const type = activeTab === 'sites' ? 'site' : 'company';
        const allMeetings = await getMeetings(type);
        const entityMeetings = allMeetings.filter(m => {
          const meetingEntityId = activeTab === 'sites' ? m.siteId : m.companyId;
          return meetingEntityId === entity.id;
        });
        
        // Delete all meetings for this entity
        for (const meeting of entityMeetings) {
          await deleteMeeting(meeting.id || meeting._docId);
        }
        
        await window.showAlert('Başarılı', `${activeTab === 'sites' ? 'Site' : 'Firma'} ve tüm görüşme notları silindi.`, 'success');
          await createLog({
            user: 'Admin',
            action: `${activeTab === 'sites' ? 'Site' : 'Firma'} silindi: ${entity.name}`
          });
        
        fetchAllMeetingNotes();
        if (selectedEntity && selectedEntity.id === entity.id) {
          setSelectedEntity(null);
        }
      } catch (error) {
        logger.error('Error deleting entity:', error);
        await window.showAlert('Hata', 'Silinirken bir hata oluştu.', 'error');
      }
    }
  };

  const handleDeleteNote = async (note) => {
    const confirmed = await window.showConfirm(
      'Görüşme Notunu Sil',
      'Bu görüşme notunu silmek istediğinizden emin misiniz?',
      'warning'
    );
    
    if (confirmed) {
      try {
        const success = await deleteMeeting(note.id || note._docId);
        if (success) {
          await window.showAlert('Başarılı', 'Görüşme notu silindi.', 'success');
          await createLog({
            user: 'Admin',
            action: `Görüşme notu silindi`
          });
          fetchAllMeetingNotes();
        }
      } catch (error) {
        logger.error('Error deleting note:', error);
        await window.showAlert('Hata', 'Silinirken bir hata oluştu.', 'error');
      }
    }
  };


  const resetEntityForm = () => {
    setEntityFormData({
      name: '',
      manager: '',
      phone: '',
      address: '',
      contact: '',
      email: ''
    });
    setEditingEntity(null);
    setShowEntityForm(false);
  };

  const resetNoteForm = () => {
    setNoteFormData({
      selectedEntityId: '',
      notes: '',
      status: 'continuing'
    });
    setEditingNote(null);
    setShowNoteForm(false);
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
          <p className="mt-3 text-muted">Yükleniyor...</p>
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
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('sites');
              resetEntityForm();
              resetNoteForm();
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
              resetEntityForm();
              resetNoteForm();
            }}
          >
            <i className="bi bi-building-add me-1"></i>
            Firma Görüşmeleri
          </button>
        </li>
      </ul>

      <div className="row">
        {/* Left Panel: Entity List */}
        <div className="col-lg-4 mb-4 mb-lg-0">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                {activeTab === 'sites' ? 'Siteler' : 'Firmalar'} ({meetingEntities.length})
              </h5>
              <button
                className="btn btn-sm btn-light"
                onClick={() => {
                  resetEntityForm();
                  setShowEntityForm(true);
                }}
                title={`Yeni ${activeTab === 'sites' ? 'Site' : 'Firma'} Ekle`}
              >
                <i className="bi bi-plus-circle"></i>
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {meetingEntities.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                  <p className="text-muted">Henüz {activeTab === 'sites' ? 'site' : 'firma'} eklenmemiş.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {meetingEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className={`list-group-item list-group-item-action ${
                        selectedEntity && selectedEntity.id === entity.id ? 'active' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewEntity(entity)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold">{entity.name}</h6>
                          {entity.phone && (
                            <small className="text-muted d-block">
                              <i className="bi bi-telephone me-1"></i>
                              {entity.phone}
                            </small>
                          )}
                        </div>
                        <div className="btn-group btn-group-sm" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setEditingEntity(entity);
                              setEntityFormData({
                                name: entity.name,
                                manager: entity.manager || '',
                                phone: entity.phone || '',
                                address: entity.address || '',
                                contact: entity.contact || '',
                                email: entity.email || ''
                              });
                              setShowEntityForm(true);
                            }}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteEntity(entity)}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Meeting Notes */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                {selectedEntity 
                  ? `${selectedEntity.name} - Görüşme Notları (${meetingNotes.length})`
                  : 'Görüşme Notları'}
              </h5>
              {selectedEntity && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    resetNoteForm();
                    setShowNoteForm(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Görüşme Notu Ekle
                </button>
              )}
            </div>
            <div className="card-body">
              {!selectedEntity ? (
                <div className="text-center py-5">
                  <i className="bi bi-info-circle fs-1 text-muted d-block mb-3"></i>
                  <p className="text-muted">Görüşme notlarını görmek için sol taraftan bir {activeTab === 'sites' ? 'site' : 'firma'} seçin.</p>
                </div>
              ) : meetingNotes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                  <p className="text-muted">Bu {activeTab === 'sites' ? 'site' : 'firma'} için henüz görüşme notu eklenmemiş.</p>
                </div>
              ) : (
                <div className="list-group">
                  {meetingNotes.map((note) => (
                    <div key={note.id || note._docId} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge bg-secondary">
                              <i className="bi bi-calendar me-1"></i>
                              {formatDate(note.date)}
                            </span>
                            {getStatusBadge(note.status)}
                          </div>
                          <p className="mb-0">{note.notes}</p>
                        </div>
                        <div className="btn-group btn-group-sm ms-2">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setEditingNote(note);
                              setNoteFormData({
                                notes: note.notes || '',
                                status: note.status || 'continuing'
                              });
                              setShowNoteForm(true);
                            }}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteNote(note)}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Entity Form Modal */}
      {showEntityForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-building me-2"></i>
                  {editingEntity 
                    ? `${activeTab === 'sites' ? 'Site' : 'Firma'} Düzenle`
                    : `Yeni ${activeTab === 'sites' ? 'Site' : 'Firma'} Ekle`}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetEntityForm}
                ></button>
              </div>
              <form onSubmit={handleEntitySubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label htmlFor="entityName" className="form-label">
                        {activeTab === 'sites' ? 'Site Adı' : 'Firma Adı'} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="entityName"
                        className="form-control"
                        value={entityFormData.name}
                        onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                        required
                      />
                    </div>

                    {activeTab === 'sites' ? (
                      <>
                        <div className="col-md-6">
                          <label htmlFor="manager" className="form-label">Yönetici Adı</label>
                          <input
                            type="text"
                            id="manager"
                            className="form-control"
                            value={entityFormData.manager}
                            onChange={(e) => setEntityFormData({ ...entityFormData, manager: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">Telefon</label>
                          <input
                            type="text"
                            id="phone"
                            className="form-control"
                            value={entityFormData.phone}
                            onChange={(e) => setEntityFormData({ ...entityFormData, phone: e.target.value })}
                          />
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="address" className="form-label">Adres</label>
                          <input
                            type="text"
                            id="address"
                            className="form-control"
                            value={entityFormData.address}
                            onChange={(e) => setEntityFormData({ ...entityFormData, address: e.target.value })}
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
                            className="form-control"
                            value={entityFormData.contact}
                            onChange={(e) => setEntityFormData({ ...entityFormData, contact: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">Telefon</label>
                          <input
                            type="text"
                            id="phone"
                            className="form-control"
                            value={entityFormData.phone}
                            onChange={(e) => setEntityFormData({ ...entityFormData, phone: e.target.value })}
                          />
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            id="email"
                            className="form-control"
                            value={entityFormData.email}
                            onChange={(e) => setEntityFormData({ ...entityFormData, email: e.target.value })}
                          />
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="address" className="form-label">Adres</label>
                          <input
                            type="text"
                            id="address"
                            className="form-control"
                            value={entityFormData.address}
                            onChange={(e) => setEntityFormData({ ...entityFormData, address: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetEntityForm}>İptal</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editingEntity ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-chat-dots me-2"></i>
                  {editingNote ? 'Görüşme Notu Düzenle' : 'Yeni Görüşme Notu Ekle'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetNoteForm}
                ></button>
              </div>
              <form onSubmit={handleNoteSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="selectedEntityId" className="form-label">
                      {activeTab === 'sites' ? 'Site' : 'Firma'} Seçin <span className="text-danger">*</span>
                    </label>
                    <select
                      id="selectedEntityId"
                      className="form-select"
                      value={noteFormData.selectedEntityId}
                      onChange={(e) => setNoteFormData({ ...noteFormData, selectedEntityId: e.target.value })}
                      required
                      disabled={!!editingNote} // Disable when editing
                    >
                      <option value="">-- {activeTab === 'sites' ? 'Site' : 'Firma'} Seçin --</option>
                      {meetingEntities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                    {meetingEntities.length === 0 && (
                      <small className="text-muted">
                        Önce bir {activeTab === 'sites' ? 'site' : 'firma'} eklemeniz gerekiyor.
                      </small>
                    )}
                  </div>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Tarih: {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} - Otomatik eklenecek
                  </div>
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">
                      Görüşme Notu <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="notes"
                      className="form-control"
                      rows="6"
                      value={noteFormData.notes}
                      onChange={(e) => setNoteFormData({ ...noteFormData, notes: e.target.value })}
                      required
                      placeholder="Görüşme notunu girin..."
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      Durum <span className="text-danger">*</span>
                    </label>
                    <select
                      id="status"
                      className="form-select"
                      value={noteFormData.status}
                      onChange={(e) => setNoteFormData({ ...noteFormData, status: e.target.value })}
                      required
                    >
                      <option value="continuing">Devam Ediyor</option>
                      <option value="positive">Olumlu</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetNoteForm}>İptal</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editingNote ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
