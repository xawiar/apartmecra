import React from 'react';

const AgreementPhotoModal = ({ 
  showPhotoModal, 
  currentAgreement, 
  setShowPhotoModal, 
  helpers,
  photoData, 
  setPhotoData, 
  handlePhotoSave, 
  handlePhotoChange 
}) => {
  if (!showPhotoModal) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content agreement-modal-content">
          <div className="modal-header bg-primary text-white rounded-top">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-image me-2"></i>
              <span className="fw-bold">Fotoğraf Yükle</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowPhotoModal(false)}
            ></button>
          </div>
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-cloud-upload text-primary fs-1"></i>
              </div>
              <h6 className="fw-semibold">{helpers.getCompanyName(currentAgreement?.companyId)}</h6>
              <p className="text-muted small mb-0">Anlaşma #{currentAgreement?.id}</p>
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-medium mb-2">Fotoğraf Seç</label>
              <input
                type="file"
                className="form-control agreement-form-control"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <div className="form-text">Maksimum dosya boyutu: 5MB</div>
            </div>
            
            {photoData.previewUrl && (
              <div className="mb-4">
                <label className="form-label fw-medium mb-2">Önizleme</label>
                <div className="border rounded p-2">
                  <img 
                    src={photoData.previewUrl} 
                    alt="Preview" 
                    className="img-fluid rounded"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer bg-light rounded-bottom p-4">
            <div className="d-flex justify-content-end w-100 gap-2">
              <button
                type="button"
                className="btn btn-agreement-outline px-4 py-2"
                onClick={() => setShowPhotoModal(false)}
              >
                <i className="bi bi-x-lg me-1"></i>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-agreement-primary px-4 py-2"
                onClick={handlePhotoSave}
                disabled={!photoData.previewUrl}
              >
                <i className="bi bi-save me-1"></i>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementPhotoModal;