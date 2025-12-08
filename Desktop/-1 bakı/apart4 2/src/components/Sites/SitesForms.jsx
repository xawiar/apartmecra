import React from 'react';
import SiteHelpers from './SiteHelpers';

const SitesForms = ({ 
  showAddForm, 
  currentSite, 
  formData, 
  uiHandlers,
  handlers,
  helpers 
}) => {
  if (!showAddForm) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => {
      if (e.target === e.currentTarget) {
        uiHandlers.handleCloseAddForm();
      }
    }}>
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content sites-modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className={`bi ${formData.siteType === 'business_center' ? 'bi-briefcase' : 'bi-building'} me-2`}></i>
              {currentSite 
                ? `${formData.siteType === 'business_center' ? 'İş Merkezi' : 'Site'} Düzenle` 
                : `Yeni ${formData.siteType === 'business_center' ? 'İş Merkezi' : 'Site'} Ekle`
              }
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={uiHandlers.handleCloseAddForm}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              handlers.handleFormSubmit(e);
            }}>
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Tür Seçimi <span className="text-danger">*</span></label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="siteType"
                        id="siteType"
                        value="site"
                        checked={formData.siteType === 'site' || formData.siteType === ''}
                        onChange={uiHandlers.handleFormChange}
                      />
                      <label className="form-check-label fw-medium" htmlFor="siteType">
                        <i className="bi bi-building me-1"></i>
                        Site
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="siteType"
                        id="businessCenterType"
                        value="business_center"
                        checked={formData.siteType === 'business_center'}
                        onChange={uiHandlers.handleFormChange}
                      />
                      <label className="form-check-label fw-medium" htmlFor="businessCenterType">
                        <i className="bi bi-briefcase me-1"></i>
                        İş Merkezi
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label fw-bold">
                    {formData.siteType === 'business_center' ? 'İş Merkezi Adı' : 'Site Adı'} 
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder={formData.siteType === 'business_center' ? 'İş merkezi adını girin' : 'Site adını girin'}
                    required
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="neighborhood" className="form-label fw-bold">Mahalle</label>
                  <input
                    type="text"
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder="Mahalle adını girin"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="manager" className="form-label fw-bold">Yönetici Adı <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    id="manager"
                    name="manager"
                    value={formData.manager}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder="Yönetici adını girin"
                    required
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label fw-bold">Yönetici İletişim</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder="örn: (555) 123 45 67"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="blocks" className="form-label fw-bold">Blok Sayısı</label>
                  <input
                    type="number"
                    id="blocks"
                    name="blocks"
                    value={formData.blocks}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    min="0"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="elevatorsPerBlock" className="form-label fw-bold">1 Bloktaki Asansör Sayısı</label>
                  <input
                    type="number"
                    id="elevatorsPerBlock"
                    name="elevatorsPerBlock"
                    value={formData.elevatorsPerBlock}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    min="0"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Toplam Asansör Sayısı (Otomatik)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    value={helpers.calculateTotalElevators(formData.blocks, formData.elevatorsPerBlock)}
                    readOnly
                  />
                  <div className="form-text">Blok Sayısı × 1 Bloktaki Asansör Sayısı</div>
                </div>
                
                <div className="col-md-6 mb-3">
                  {formData.siteType === 'business_center' ? (
                    <>
                      <label htmlFor="manualPanels" className="form-label fw-bold">Panel Sayısı (Manuel) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        id="manualPanels"
                        name="manualPanels"
                        value={formData.manualPanels || ''}
                        onChange={uiHandlers.handleFormChange}
                        className="form-control form-control-custom"
                        min="1"
                        placeholder="Panel sayısını girin"
                        required
                      />
                      <div className="form-text">İş merkezi için panel sayısını manuel olarak girin</div>
                    </>
                  ) : (
                    <>
                      <label className="form-label fw-bold">Panel Sayısı (Otomatik)</label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        value={helpers.calculatePanelsForType(formData.siteType, formData.blocks, formData.elevatorsPerBlock, formData.manualPanels)}
                        readOnly
                      />
                      <div className="form-text">Toplam Asansör Sayısı × 2</div>
                    </>
                  )}
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="agreementPercentage" className="form-label fw-bold">Anlaşma Yüzdesi (%)</label>
                  <input
                    type="number"
                    id="agreementPercentage"
                    name="agreementPercentage"
                    value={formData.agreementPercentage}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    min="0"
                    max="100"
                    placeholder="0-100 arası"
                  />
                </div>

                {/* Site için daire sayısı ve ortalama insan sayısı */}
                {formData.siteType === 'site' && (
                  <>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="apartmentCount" className="form-label fw-bold">Daire Sayısı <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        id="apartmentCount"
                        name="apartmentCount"
                        value={formData.apartmentCount}
                        onChange={uiHandlers.handleFormChange}
                        className="form-control form-control-custom"
                        min="1"
                        placeholder="Daire sayısını girin"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Ortalama İnsan Sayısı (Otomatik)</label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        value={helpers.calculateAveragePeople(formData.apartmentCount)}
                        readOnly
                      />
                      <div className="form-text">Daire Sayısı × 3</div>
                    </div>
                  </>
                )}

                {/* İş merkezi için işyeri sayısı ve kişi sayısı */}
                {formData.siteType === 'business_center' && (
                  <>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="businessCount" className="form-label fw-bold">İşyeri Sayısı <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        id="businessCount"
                        name="businessCount"
                        value={formData.businessCount}
                        onChange={uiHandlers.handleFormChange}
                        className="form-control form-control-custom"
                        min="1"
                        placeholder="İşyeri sayısını girin"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="peopleCount" className="form-label fw-bold">İş Merkezine Giren Kişi Sayısı <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        id="peopleCount"
                        name="peopleCount"
                        value={formData.peopleCount}
                        onChange={uiHandlers.handleFormChange}
                        className="form-control form-control-custom"
                        min="1"
                        placeholder="Günlük giren kişi sayısını girin"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="bankAccountName" className="form-label fw-bold">Banka Hesap Adı</label>
                  <input
                    type="text"
                    id="bankAccountName"
                    name="bankAccountName"
                    value={formData.bankAccountName || ''}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder="Banka hesap adını girin"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="iban" className="form-label fw-bold">IBAN Numarası</label>
                  <input
                    type="text"
                    id="iban"
                    name="iban"
                    value={formData.iban || ''}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    maxLength="34"
                  />
                </div>
                
                <div className="col-12 mb-3">
                  <label htmlFor="notes" className="form-label fw-bold">Notlar</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={uiHandlers.handleFormChange}
                    className="form-control form-control-custom"
                    rows="3"
                    placeholder="Ek notlar..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  onClick={uiHandlers.handleCloseAddForm}
                  className="btn btn-secondary"
                >
                  <i className="bi bi-x-lg me-1"></i> İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <i className="bi bi-check-lg me-1"></i> {currentSite ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitesForms;