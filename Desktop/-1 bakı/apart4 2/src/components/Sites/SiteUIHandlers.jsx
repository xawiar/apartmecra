const SiteUIHandlers = ({
  setShowModal, setCurrentSite,
  setShowAddForm, setFormData,
  setShowPaymentSelection, setSelectedSiteForPayment,
  setPendingPayments,
  setShowActiveAgreements, setCurrentSiteForAgreements,
  setShowExcelInfo,
  fileInputRef,
  calculateTotalElevators, calculatePanels
}) => {
  const handleAddSite = () => {
    setFormData({
      name: '',
      manager: '',
      phone: '',
      blocks: '',
      elevatorsPerBlock: '',
      agreementPercentage: '',
      notes: '',
      neighborhood: ''
    });
    setCurrentSite(null);
    setShowAddForm(true);
  };

  const handleEditSite = (site) => {
    setFormData({
      name: site.name || '',
      manager: site.manager || '',
      phone: site.phone || '',
      blocks: site.blocks || '',
      elevatorsPerBlock: site.elevatorsPerBlock || '',
      agreementPercentage: site.agreementPercentage || '',
      notes: site.notes || '',
      neighborhood: site.neighborhood || ''
    });
    setCurrentSite(site);
    setShowAddForm(true);
  };

  const handleShowSite = (site) => {
    setCurrentSite(site);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSite(null);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setCurrentSite(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClosePaymentSelection = () => {
    setShowPaymentSelection(false);
    setSelectedSiteForPayment(null);
    setPendingPayments([]);
  };

  const handleShowActiveAgreements = (site) => {
    setCurrentSiteForAgreements(site);
    setShowActiveAgreements(true);
  };

  const handleCloseActiveAgreements = () => {
    setShowActiveAgreements(false);
    setCurrentSiteForAgreements(null);
  };

  const setShowExcelInfoHandler = (show) => {
    setShowExcelInfo(show);
  };

  return {
    handleAddSite,
    handleEditSite,
    handleShowSite,
    handleCloseModal,
    handleCloseAddForm,
    handleFormChange,
    handleClosePaymentSelection,
    handleShowActiveAgreements,
    handleCloseActiveAgreements,
    setShowExcelInfo: setShowExcelInfoHandler
  };
};

export default SiteUIHandlers;