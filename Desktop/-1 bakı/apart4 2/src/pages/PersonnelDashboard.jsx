import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAgreements, getSites, getCompanies, getPanelImages, uploadPanelImage, cleanupExpiredImages, resetPanelImages, updateSite } from '../services/api';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import LazyImage from '../components/LazyImage';
import logger from '../utils/logger';

// Import helper functions
const AgreementHelpers = ({
  companies = [],
  sites = [],
  agreements = [],
  sitePanelSelections = {},
  selectedWeeks = [],
  formData = {}
}) => {
  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Bilinmeyen Firma';
  };

  // Get site name by ID
  const getSiteName = (siteId) => {
    const site = sites.find(s => String(s.id) === String(siteId));
    return site ? site.name : '';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Check if two date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && start2 <= end1;
  };

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  return {
    getCompanyName,
    getSiteName,
    formatCurrency,
    dateRangesOverlap,
    generateBlockLabels
  };
};

const PersonnelDashboard = () => {
  const [agreements, setAgreements] = useState([]);
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [panelImages, setPanelImages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showSiteEditModal, setShowSiteEditModal] = useState(false);
  const [siteEditForm, setSiteEditForm] = useState({
    location: '',
    locationLat: '',
    locationLng: '',
    manager: '',
    janitorPhones: '',
    notes: '',
    blocks: '',
    elevatorsPerBlock: '',
    apartmentCount: ''
  });
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSites, setRouteSites] = useState([]);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const navigate = useNavigate();
  
  const user = getUser();

  // Elazığ merkez koordinatları
  const ELAZIG_CENTER = { lat: 38.6748, lng: 39.2233 };
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAO5-L4SrMA1e5q3ugtjYCI1gVI7KZoD6g';

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cleanup expired images first
      try {
        await cleanupExpiredImages();
      } catch (cleanupError) {
        logger.warn('Failed to cleanup expired images:', cleanupError);
      }
      
      const [allAgreements, allSites, allCompanies] = await Promise.all([
        getAgreements(),
        getSites(),
        getCompanies()
      ]);

      // Helper to normalize strings (for name/neighborhood comparison)
      const normalize = (value) =>
        (value || '')
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ');

      // Remove duplicate sites
      // 1) First by technical id fields (_docId / id / siteId)
      const uniqueById = (allSites || []).filter((site, index, self) => {
        const key = String(site._docId || site.id || site.siteId || '');
        if (!key) return true;
        return index === self.findIndex(
          (s) => String(s._docId || s.id || s.siteId || '') === key
        );
      });

      // 2) Then by business identity (name + neighborhood)
      const uniqueSites = uniqueById.filter((site, index, self) => {
        const nameKey = normalize(site.name);
        const neighborhoodKey = normalize(site.neighborhood);
        const compositeKey = `${nameKey}::${neighborhoodKey}`;

        return (
          index ===
          self.findIndex((s) => {
            const nName = normalize(s.name);
            const nNeighborhood = normalize(s.neighborhood);
            return `${nName}::${nNeighborhood}` === compositeKey;
          })
        );
      });
      
      setAgreements(allAgreements);
      setSites(uniqueSites);
      setCompanies(allCompanies);
      
      // Initialize filtered agreements with active and future agreements
      const activeAndFutureAgreements = allAgreements.filter(agreement => {
        // Check if agreement is not deleted or archived
        if (agreement.isDeleted || agreement.isArchived || agreement.status === 'archived') {
          return false;
        }
        
        // Check if agreement is not expired
        const now = new Date();
        const endDate = new Date(agreement.endDate);
        return endDate >= now;
      });
      setFilteredAgreements(activeAndFutureAgreements);
      
      // Load panel images
      await loadPanelImages();
      
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for agreement changes to refresh data
    const handleAgreementChange = () => {
      loadData();
    };
    
    window.addEventListener('agreementChanged', handleAgreementChange);
    
    return () => {
      window.removeEventListener('agreementChanged', handleAgreementChange);
    };
  }, []);

  // Update filtered agreements when date filters change
  useEffect(() => {
    handleDateFilterChange();
  }, [startDate, endDate, agreements]);

  // Initialize helper functions
  const helpers = AgreementHelpers({
    companies,
    sites,
    agreements
  });

  // Get site by ID
  const getSiteById = (siteId) => {
    return sites.find(s => String(s.id) === String(siteId));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Get active and future agreements
  const getActiveAndFutureAgreements = () => {
    const now = new Date();
    return agreements.filter(agreement => {
      // Check if agreement is not deleted or archived
      if (agreement.isDeleted || agreement.isArchived || agreement.status === 'archived') {
        return false;
      }
      
      // Check if agreement is not expired
      const endDate = new Date(agreement.endDate);
      return endDate >= now; // Active or future agreements
    });
  };

  // Filter agreements by date range
  const filterAgreementsByDate = (agreements, startDate, endDate) => {
    if (!startDate && !endDate) {
      return agreements;
    }

    return agreements.filter(agreement => {
      const agreementStart = new Date(agreement.startDate);
      const agreementEnd = new Date(agreement.endDate);
      
      if (startDate && endDate) {
        // Check if agreement overlaps with the selected date range
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        return agreementStart <= filterEnd && agreementEnd >= filterStart;
      } else if (startDate) {
        // Only start date provided - show agreements that start on or after this date
        const filterStart = new Date(startDate);
        return agreementStart >= filterStart;
      } else if (endDate) {
        // Only end date provided - show agreements that end on or before this date
        const filterEnd = new Date(endDate);
        return agreementEnd <= filterEnd;
      }
      
      return true;
    });
  };

  // Handle date filter changes
  const handleDateFilterChange = () => {
    const activeAndFutureAgreements = getActiveAndFutureAgreements();
    const filtered = filterAgreementsByDate(activeAndFutureAgreements, startDate, endDate);
    setFilteredAgreements(filtered);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    const activeAndFutureAgreements = getActiveAndFutureAgreements();
    setFilteredAgreements(activeAndFutureAgreements);
  };

  // Load panel images
  const loadPanelImages = async () => {
    try {
      const images = await getPanelImages();
      setPanelImages(images);
    } catch (error) {
      logger.error('Error loading panel images:', error);
    }
  };

  // Handle reset all panel images
  const handleResetAllPanels = async () => {
    try {
      if (window.showConfirm) {
        const confirm = await window.showConfirm(
          'Tüm Panel Fotoğraflarını Sıfırla',
          'Tüm sitelerdeki tüm panel fotoğrafları silinecek. Emin misiniz?',
          'warning'
        );
        if (!confirm) return;
      } else if (!window.confirm('Tüm panel fotoğraflarını silmek istediğinize emin misiniz?')) {
        return;
      }

      const result = await resetPanelImages();
      await loadPanelImages();

      if (window.showAlert) {
        window.showAlert(
          'Başarılı',
          `Tüm panel fotoğrafları sıfırlandı. Silinen görsel sayısı: ${result?.deletedCount ?? 0}`,
          'success'
        );
      }
    } catch (error) {
      logger.error('Error resetting panel images:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Panel fotoğrafları sıfırlanırken bir hata oluştu.', 'error');
      }
    }
  };

  // Handle panel click
  const handlePanelClick = (agreement, siteId, blockId, panelId) => {
    const existingImage = getPanelImage(agreement.id.toString(), siteId, blockId, panelId.toString());
    setSelectedPanel({
      agreement,
      siteId,
      blockId,
      panelId,
      fullPanelNumber: generatePanelName(siteId, blockId.split('-')[2], panelId),
      existingImage
    });
    setShowPhotoModal(true);
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    if (!selectedPanel) return;

    try {
      // If there's an existing image, delete it first
      if (selectedPanel.existingImage) {
        try {
          const deleteResponse = await fetch(`http://localhost:3001/panelImages/${selectedPanel.existingImage.id}`, {
            method: 'DELETE'
          });
          if (!deleteResponse.ok) {
            logger.warn('Failed to delete existing image, continuing with upload');
          }
        } catch (deleteError) {
          logger.warn('Error deleting existing image:', deleteError);
        }
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('agreementId', selectedPanel.agreement.id);
      formData.append('siteId', selectedPanel.siteId);
      formData.append('blockId', selectedPanel.blockId);
      formData.append('panelId', selectedPanel.panelId);
      formData.append('companyId', selectedPanel.agreement.companyId);

      await uploadPanelImage(formData);
      
      // Reload panel images
      await loadPanelImages();
      
      // Close modal
      setShowPhotoModal(false);
      setSelectedPanel(null);
      
      // Show success message
      if (window.showAlert) {
        window.showAlert('Başarılı', 'Panel fotoğrafı başarıyla yüklendi!', 'success');
      }
    } catch (error) {
      logger.error('Error uploading panel image:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.', 'error');
      }
    }
  };

  // Handle photo delete
  const handlePhotoDelete = async () => {
    if (!selectedPanel || !selectedPanel.existingImage) return;

    try {
      const response = await fetch(`http://localhost:3001/panelImages/${selectedPanel.existingImage.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadPanelImages(); // Reload panel images after delete

        setShowPhotoModal(false);
        setSelectedPanel(null);

        if (window.showAlert) {
          window.showAlert('Başarılı', 'Panel fotoğrafı başarıyla silindi!', 'success');
        }
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      logger.error('Error deleting panel image:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Fotoğraf silinirken bir hata oluştu.', 'error');
      }
    }
  };

  // Get panel image
  const getPanelImage = (agreementId, siteId, blockId, panelId) => {
    return panelImages.find(img => 
      img.agreementId === agreementId.toString() && 
      img.siteId === siteId && 
      img.blockId === blockId && 
      img.panelId === panelId.toString()
    );
  };

  // Helper function to generate panel name
  const generatePanelName = (siteId, blockLabel, panelNumber) => {
    return `${siteId}${blockLabel}${panelNumber}`;
  };

  // Handle site selection from sidebar
  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    setSiteEditForm({
      location: site.location || '',
      locationLat: site.locationLat || '',
      locationLng: site.locationLng || '',
      manager: site.manager || '',
      janitorPhones: Array.isArray(site.janitorPhones) ? site.janitorPhones.join(', ') : (site.janitorPhones || ''),
      notes: site.notes || '',
      blocks: site.blocks || '',
      elevatorsPerBlock: site.elevatorsPerBlock || '',
      apartmentCount: site.apartmentCount || ''
    });
    setShowSiteEditModal(true);
  };

  // Handle site edit form change
  const handleSiteEditChange = (e) => {
    const { name, value } = e.target;
    setSiteEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle site update
  const handleSiteUpdate = async () => {
    if (!selectedSite) return;

    try {
      // Convert janitorPhones string to array
      const janitorPhonesArray = siteEditForm.janitorPhones
        ? siteEditForm.janitorPhones.split(',').map(phone => phone.trim()).filter(phone => phone)
        : [];

      const updateData = {
        location: siteEditForm.location,
        locationLat: siteEditForm.locationLat || null,
        locationLng: siteEditForm.locationLng || null,
        manager: siteEditForm.manager,
        janitorPhones: janitorPhonesArray,
        notes: siteEditForm.notes,
        blocks: siteEditForm.blocks ? parseInt(siteEditForm.blocks) : null,
        elevatorsPerBlock: siteEditForm.elevatorsPerBlock ? parseInt(siteEditForm.elevatorsPerBlock) : null,
        apartmentCount: siteEditForm.apartmentCount ? parseInt(siteEditForm.apartmentCount) : null
      };

      const result = await updateSite(selectedSite.id, updateData);
      
      if (result) {
        // Reload sites data
        await loadData();
        setShowSiteEditModal(false);
        setSelectedSite(null);
        
        if (window.showAlert) {
          window.showAlert('Başarılı', 'Site bilgileri başarıyla güncellendi!', 'success');
        }
      } else {
        throw new Error('Güncelleme başarısız');
      }
    } catch (error) {
      logger.error('Error updating site:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Site bilgileri güncellenirken bir hata oluştu.', 'error');
      }
    }
  };

  // Map yüklendiğinde tüm siteleri gösterecek şekilde ayarla
  const onMapLoad = useCallback((map) => {
    if (!map) return;
    
    mapRef.current = map;
    
    // DirectionsService'i başlat
    if (window.google && window.google.maps) {
      const service = new window.google.maps.DirectionsService();
      directionsServiceRef.current = service;
    }
    
    const sitesWithCoordinates = sites.filter(site => 
      site.locationLat && site.locationLng && 
      !isNaN(parseFloat(site.locationLat)) && 
      !isNaN(parseFloat(site.locationLng))
    );
    
    if (sitesWithCoordinates.length > 0 && window.google && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      sitesWithCoordinates.forEach(site => {
        bounds.extend({
          lat: parseFloat(site.locationLat),
          lng: parseFloat(site.locationLng)
        });
      });
      map.fitBounds(bounds);
      
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
    setMapLoading(false);
  }, [sites]);

  // Harita gösterildiğinde loading'i başlat
  useEffect(() => {
    if (showMap && GOOGLE_MAPS_API_KEY) {
      setMapLoading(true);
      // Timeout ile güvenlik - eğer harita 10 saniye içinde yüklenmezse loading'i durdur
      const timeout = setTimeout(() => {
        setMapLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    } else {
      setMapLoading(false);
    }
  }, [showMap, GOOGLE_MAPS_API_KEY]);

  // İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // En yakın komşu algoritması ile optimal rota sırasını hesapla
  const calculateOptimalRoute = (start, destinations) => {
    if (destinations.length === 0) return [];
    
    const route = [];
    const unvisited = [...destinations];
    let current = start;
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = calculateDistance(current, unvisited[0]);
      
      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(current, unvisited[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearest);
      current = nearest;
    }
    
    return route;
  };

  // Rota oluştur
  const createRoute = async () => {
    if (!directionsServiceRef.current) {
      if (window.showAlert) {
        window.showAlert('Hata', 'Harita yüklenmedi. Lütfen bekleyin.', 'error');
      }
      return;
    }

    const sitesWithCoordinates = sites.filter(site => 
      site.locationLat && site.locationLng && 
      !isNaN(parseFloat(site.locationLat)) && 
      !isNaN(parseFloat(site.locationLng))
    );

    if (sitesWithCoordinates.length === 0) {
      if (window.showAlert) {
        window.showAlert('Hata', 'Rota oluşturulamadı. Koordinatı olan site bulunamadı.', 'error');
      }
      return;
    }

    try {
      setRouteLoading(true);
      
      // Kullanıcının konumunu al
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      // Tüm sitelerin koordinatlarını hazırla
      const destinations = sitesWithCoordinates.map(site => ({
        lat: parseFloat(site.locationLat),
        lng: parseFloat(site.locationLng),
        site: site
      }));
      
      // Optimal rota sırasını hesapla
      const optimalRoute = calculateOptimalRoute(location, destinations);
      
      if (optimalRoute.length === 0) {
        if (window.showAlert) {
          window.showAlert('Bilgi', 'Rota oluşturulacak site bulunamadı.', 'info');
        }
        setRouteLoading(false);
        return;
      }
      
      // Waypoints hazırla (son nokta hariç)
      const waypoints = optimalRoute.slice(0, -1).map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        stopover: true
      }));
      
      // Son nokta
      const finalDestination = optimalRoute[optimalRoute.length - 1];
      
      // Directions isteği
      directionsServiceRef.current.route(
        {
          origin: new window.google.maps.LatLng(location.lat, location.lng),
          destination: new window.google.maps.LatLng(finalDestination.lat, finalDestination.lng),
          waypoints: waypoints,
          optimizeWaypoints: false,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setRoute(result);
            
            // Rota sırasındaki siteleri kaydet
            const sitesInOrder = [
              { ...location, isStart: true, order: 0 },
              ...optimalRoute.map((point, index) => ({
                ...point.site,
                order: index + 1,
                isStart: false
              }))
            ];
            setRouteSites(sitesInOrder);
            
            // Haritayı rotaya göre ayarla
            if (mapRef.current) {
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
              optimalRoute.forEach(point => {
                bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
              });
              mapRef.current.fitBounds(bounds);
            }
            
            if (window.showAlert) {
              const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
              const totalDuration = result.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;
              window.showAlert(
                'Başarılı', 
                `Rota oluşturuldu! Toplam mesafe: ${totalDistance.toFixed(1)} km, Tahmini süre: ${Math.round(totalDuration)} dakika`,
                'success'
              );
            }
          } else {
            logger.error('Directions request failed:', status);
            let errorMessage = 'Rota oluşturulurken bir hata oluştu.';
            
            if (status === 'REQUEST_DENIED') {
              errorMessage = 'Directions API aktif değil. Google Cloud Console\'dan "Directions API" ve "Routes API" servislerini aktifleştirmeniz gerekiyor.';
            } else if (status === 'OVER_QUERY_LIMIT') {
              errorMessage = 'API kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin.';
            } else if (status === 'ZERO_RESULTS') {
              errorMessage = 'Bu noktalar arasında rota bulunamadı.';
            }
            
            if (window.showAlert) {
              window.showAlert('Hata', errorMessage, 'error');
            }
          }
          setRouteLoading(false);
        }
      );
    } catch (error) {
      logger.error('Error creating route:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Konumunuz alınamadı. Lütfen tarayıcınızın konum iznini kontrol edin.', 'error');
      }
      setRouteLoading(false);
    }
  };

  // Rotayı temizle
  const clearRoute = () => {
    setRoute(null);
    setCurrentLocation(null);
    setRouteSites([]);
    if (mapRef.current) {
      const sitesWithCoordinates = sites.filter(site => 
        site.locationLat && site.locationLng && 
        !isNaN(parseFloat(site.locationLat)) && 
        !isNaN(parseFloat(site.locationLng))
      );
      if (sitesWithCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        sitesWithCoordinates.forEach(site => {
          bounds.extend({
            lat: parseFloat(site.locationLat),
            lng: parseFloat(site.locationLng)
          });
        });
        mapRef.current.fitBounds(bounds);
      }
    }
  };

  // Belirli bir siteye yol tarifi aç
  const openDirectionsToSite = (site) => {
    if (!site.locationLat || !site.locationLng) {
      if (window.showAlert) {
        window.showAlert('Hata', 'Bu site için konum bilgisi bulunmamaktadır.', 'error');
      }
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${site.locationLat},${site.locationLng}`;
    window.open(url, '_blank');
  };

  // Get current location using geolocation API
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Handle get current location button
  const handleGetCurrentLocation = async () => {
    try {
      if (window.showAlert) {
        window.showAlert('Bilgi', 'Konumunuz alınıyor, lütfen bekleyin...', 'info');
      }

      const location = await getCurrentLocation();
      
      setSiteEditForm(prev => ({
        ...prev,
        locationLat: location.lat.toString(),
        locationLng: location.lng.toString()
      }));

      if (window.showAlert) {
        window.showAlert('Başarılı', `Konumunuz alındı: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`, 'success');
      }
    } catch (error) {
      logger.error('Error getting location:', error);
      if (window.showAlert) {
        window.showAlert('Hata', 'Konumunuz alınamadı. Lütfen tarayıcınızın konum iznini kontrol edin.', 'error');
      }
    }
  };

  // Open Google Maps with directions to site location
  const openGoogleMaps = (site) => {
    // Prefer coordinates if available
    if (site.locationLat && site.locationLng) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.locationLat},${site.locationLng}`;
      window.open(mapsUrl, '_blank');
      return;
    }

    // Fallback to address
    if (!site.location || !site.location.trim()) {
      if (window.showAlert) {
        window.showAlert('Uyarı', 'Bu site için konum bilgisi bulunmamaktadır. Lütfen önce konum bilgisini ekleyin.', 'warning');
      }
      return;
    }

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(site.location);
    
    // Google Maps Directions URL (opens with route planning)
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    // Open in new tab
    window.open(mapsUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const activeAndFutureAgreements = getActiveAndFutureAgreements();

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4">
      <div className="row">
        {/* Left Sidebar - Sites List - Responsive */}
        <div className={`col-12 col-md-4 col-lg-3 ${sidebarOpen ? '' : 'd-none d-md-none'}`}>
          <div className="card custom-card shadow-sm sticky-top" style={{ top: '20px', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-primary-subtle d-flex justify-content-between align-items-center p-2 p-md-3">
              <h5 className="mb-0 fw-bold small">
                <i className="bi bi-building me-2"></i>
                Siteler ({sites.length})
              </h5>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowMap(!showMap)}
                  title={showMap ? "Haritayı Gizle" : "Haritayı Göster"}
                >
                  <i className="bi bi-map"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary d-none d-md-inline-block"
                  onClick={() => setSidebarOpen(false)}
                  title="Menüyü Kapat"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto', flex: 1 }}>
              {sites.length > 0 ? (
                <div className="list-group list-group-flush">
                  {(() => {
                    // Group sites by neighborhood
                    const groupedSites = {};
                    (sites || []).forEach((site) => {
                      const neighborhood = site.neighborhood || 'Mahalle Belirtilmemiş';
                      if (!groupedSites[neighborhood]) {
                        groupedSites[neighborhood] = [];
                      }
                      groupedSites[neighborhood].push(site);
                    });
                    
                    // Sort neighborhoods alphabetically
                    const sortedNeighborhoods = Object.keys(groupedSites).sort();
                    
                    return sortedNeighborhoods.map((neighborhood) => (
                      <div key={neighborhood}>
                        <div className="list-group-item bg-light fw-bold text-primary border-bottom-0" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                          <i className="bi bi-geo-alt-fill me-2"></i>
                          {neighborhood} ({groupedSites[neighborhood].length} site)
                        </div>
                        {groupedSites[neighborhood].map((site) => (
                          <div
                            key={site.id}
                            className={`list-group-item ${selectedSite?.id === site.id ? 'active' : ''}`}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => handleSiteSelect(site)}>
                                <h6 className="mb-1 fw-bold">{site.name}</h6>
                                {site.manager && (
                                  <small className="text-muted d-block">
                                    <i className="bi bi-person me-1"></i>
                                    {site.manager}
                                  </small>
                                )}
                                {(site.location || (site.locationLat && site.locationLng)) && (
                                  <small className="text-success d-block mt-1">
                                    <i className="bi bi-map me-1"></i>
                                    {site.locationLat && site.locationLng 
                                      ? `Konum: ${parseFloat(site.locationLat).toFixed(6)}, ${parseFloat(site.locationLng).toFixed(6)}`
                                      : `Konum: ${site.location}`}
                                  </small>
                                )}
                              </div>
                              <i className="bi bi-pencil-square ms-2" style={{ cursor: 'pointer' }} onClick={() => handleSiteSelect(site)}></i>
                            </div>
                            {site.location && (
                              <button
                                className="btn btn-sm btn-outline-primary w-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGoogleMaps(site);
                                }}
                                title="Google Maps'te Yol Tarifi Al"
                              >
                                <i className="bi bi-geo-alt-fill me-1"></i>
                                Haritada Aç
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-building fs-1"></i>
                  <p className="mt-2 mb-0">Henüz site bulunmamaktadır</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Responsive */}
        <div className={sidebarOpen ? 'col-12 col-md-8 col-lg-9' : 'col-12'}>
          {/* Sidebar Toggle Button (when closed) */}
          {!sidebarOpen && (
            <button
              className="btn btn-outline-primary btn-sm mb-3"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list me-2"></i>
              Site Menüsünü Aç
            </button>
          )}

      {/* Header - Responsive */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
        <div className="flex-grow-1">
          <h2 className="h3 h4-md fw-bold mb-1">Personel Panosu</h2>
          <p className="text-muted mb-0 small">Tüm aktif ve gelecek anlaşma panelleri</p>
        </div>
        <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
          <button
            className="btn btn-outline-warning btn-sm"
            onClick={handleResetAllPanels}
          >
            <i className="bi bi-trash3 me-1"></i>
            <span className="d-none d-sm-inline">Tüm Panelleri Sıfırla</span>
            <span className="d-sm-none">Sıfırla</span>
          </button>
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={async () => {
              const { cleanupKeepAlive } = await import('../utils/keepAlive');
              await cleanupKeepAlive();
              
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="d-none d-sm-inline">Çıkış Yap</span>
            <span className="d-sm-none">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards - Responsive */}
      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <div className="col-6 col-sm-4 col-md-4 col-lg-2">
          <div className="card custom-card shadow-sm border-0 h-100">
            <div className="card-body text-center p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-center mb-2 mb-md-3">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 p-md-3">
                  <i className="bi bi-file-earmark-text text-primary fs-5 fs-4-md"></i>
                </div>
              </div>
              <h3 className="fw-bold text-primary mb-1 fs-5 fs-4-md">{filteredAgreements.length}</h3>
              <p className="text-muted mb-0 small">Filtrelenmiş Anlaşma</p>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-sm-4 col-md-4 col-lg-2">
          <div className="card custom-card shadow-sm border-0 h-100">
            <div className="card-body text-center p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-center mb-2 mb-md-3">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 p-md-3">
                  <i className="bi bi-check-circle text-success fs-5 fs-4-md"></i>
                </div>
              </div>
              <h3 className="fw-bold text-success mb-1 fs-5 fs-4-md">
                {agreements.filter(a => a.status === 'active').length}
              </h3>
              <p className="text-muted mb-0 small">Aktif Anlaşma</p>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-sm-4 col-md-4 col-lg-2">
          <div className="card custom-card shadow-sm border-0 h-100">
            <div className="card-body text-center p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-center mb-2 mb-md-3">
                <div className="bg-info bg-opacity-10 rounded-circle p-2 p-md-3">
                  <i className="bi bi-building text-info fs-5 fs-4-md"></i>
                </div>
              </div>
              <h3 className="fw-bold text-info mb-1 fs-5 fs-4-md">
                {sites.filter(site => site.siteType !== 'business_center').length}
              </h3>
              <p className="text-muted mb-0 small">Siteler</p>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-sm-4 col-md-4 col-lg-2">
          <div className="card custom-card shadow-sm border-0 h-100">
            <div className="card-body text-center p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-center mb-2 mb-md-3">
                <div className="bg-secondary bg-opacity-10 rounded-circle p-2 p-md-3">
                  <i className="bi bi-briefcase text-secondary fs-5 fs-4-md"></i>
                </div>
              </div>
              <h3 className="fw-bold text-secondary mb-1 fs-5 fs-4-md">
                {sites.filter(site => site.siteType === 'business_center').length}
              </h3>
              <p className="text-muted mb-0 small">İş Merkezleri</p>
            </div>
          </div>
        </div>
        
        <div className="col-6 col-sm-4 col-md-4 col-lg-2">
          <div className="card custom-card shadow-sm border-0 h-100">
            <div className="card-body text-center p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-center mb-2 mb-md-3">
                <div className="bg-warning bg-opacity-10 rounded-circle p-2 p-md-3">
                  <i className="bi bi-grid-3x3-gap text-warning fs-5 fs-4-md"></i>
                </div>
              </div>
              <h3 className="fw-bold text-warning mb-1 fs-5 fs-4-md">
                {filteredAgreements.reduce((total, agreement) => {
                  return total + Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0);
                }, 0)}
              </h3>
              <p className="text-muted mb-0 small">Filtrelenmiş Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Section - Responsive */}
      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <div className="col-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-info-subtle p-2 p-md-3">
              <h5 className="mb-0 fw-bold small">
                <i className="bi bi-calendar-range me-2"></i>
                Tarih Filtresi
              </h5>
            </div>
            <div className="card-body p-2 p-md-3">
              <div className="row g-2 g-md-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-medium small">Başlangıç Tarihi:</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-medium small">Bitiş Tarihi:</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-end gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm flex-grow-1"
                    onClick={clearDateFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Temizle
                  </button>
                  <button
                    className="btn btn-primary btn-sm flex-grow-1"
                    onClick={handleDateFilterChange}
                  >
                    <i className="bi bi-funnel me-1"></i>
                    Filtrele
                  </button>
                </div>
              </div>
              {(startDate || endDate) && (
                <div className="mt-2 mt-md-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Filtre: {startDate ? `Başlangıç: ${formatDate(startDate)}` : ''} 
                    {startDate && endDate ? ' - ' : ''} 
                    {endDate ? `Bitiş: ${formatDate(endDate)}` : ''}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Agreement Panels */}
      {filteredAgreements.length > 0 ? (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-primary-subtle">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-tv me-2"></i>
                  Filtrelenmiş Anlaşma Panelleri
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {filteredAgreements.map((agreement) => (
                    <div key={agreement.id} className="col-lg-12">
                      <div className="card border-primary h-100">
                        <div className="card-header bg-primary-subtle">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0 fw-bold">
                                <i className="bi bi-file-earmark-text me-2"></i>
                                Anlaşma ID: {agreement.id}
                              </h6>
                              <small className="text-muted">
                                {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                              </small>
                              <div className="mt-1">
                                <span className={`badge ${
                                  agreement.status === 'active' 
                                    ? 'bg-success-subtle text-success-emphasis' 
                                    : 'bg-info-subtle text-info-emphasis'
                                }`}>
                                  {agreement.status === 'active' ? 'Aktif' : 'Gelecek'}
                                </span>
                                <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
                                  {helpers.getCompanyName(agreement.companyId)}
                                </span>
                              </div>
                            </div>
                            <div className="fw-bold text-primary">
                              {helpers.formatCurrency(agreement.totalAmount)}
                            </div>
                          </div>
                        </div>
                        <div className="card-body">
                          {/* Sites, Blocks, and Panels */}
                          <div className="row g-3">
                            {(agreement.siteIds || []).map((siteId) => {
                              const site = getSiteById(siteId);
                              if (!site) return null;
                              
                              // Calculate panels based on site type
                              let blockCount, panelsPerBlock, blockLabels;
                              
                              if (site.siteType === 'business_center') {
                                // For business centers, use manual panel count and single block
                                blockCount = 1;
                                panelsPerBlock = parseInt(site.panels) || 0;
                                blockLabels = ['A']; // Single block for business centers
                              } else {
                                // For regular sites, use blocks and elevators
                                blockCount = parseInt(site.blocks) || 0;
                                const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                                panelsPerBlock = elevatorsPerBlock * 2;
                                blockLabels = helpers.generateBlockLabels(blockCount);
                              }
                              // Collect blocks and panels from all date ranges (new format)
                              // New format: siteBlockSelections = { "range-0": { "siteId": [blockKeys] }, ... }
                              // New format: sitePanelSelections = { "siteId": { "blockKey": { "range-0": [panelKeys], ... } } }
                              let usedBlocks = [];
                              let panelSelections = {};
                              
                              // Check if new format (with date ranges)
                              if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
                                // New format: collect from all date ranges
                                agreement.dateRanges.forEach((range, rangeIndex) => {
                                  const rangeKey = `range-${rangeIndex}`;
                                  const rangeBlocks = agreement.siteBlockSelections?.[rangeKey]?.[siteId] || [];
                                  usedBlocks = [...new Set([...usedBlocks, ...rangeBlocks])]; // Merge unique blocks
                                  
                                  // Collect panels from all ranges for each block
                                  const sitePanelData = agreement.sitePanelSelections?.[siteId] || {};
                                  Object.keys(sitePanelData).forEach(blockKey => {
                                    if (!panelSelections[blockKey]) {
                                      panelSelections[blockKey] = [];
                                    }
                                    const rangePanels = sitePanelData[blockKey]?.[rangeKey] || [];
                                    panelSelections[blockKey] = [...new Set([...panelSelections[blockKey], ...rangePanels])]; // Merge unique panels
                                  });
                                });
                              } else {
                                // Old format: direct access
                                usedBlocks = agreement.siteBlockSelections?.[siteId] || [];
                                panelSelections = agreement.sitePanelSelections?.[siteId] || {};
                              }
                              
                              return (
                                <div key={siteId} className="col-md-12">
                                  <div className="card border-info">
                                    <div className="card-header bg-info-subtle">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">
                                          <i className="bi bi-building me-2"></i>
                                          {site.name}
                                        </h6>
                                        <span className="badge bg-primary-subtle text-primary-emphasis">
                                          {Object.values(agreement.sitePanelCounts || {}).reduce((sum, count) => sum + parseInt(count || 0), 0)} panel
                                        </span>
                                      </div>
                                    </div>
                                    <div className="card-body">
                                      {usedBlocks.length === 0 ? (
                                        <div className="text-center py-3 text-muted">
                                          <i className="bi bi-exclamation-triangle"></i>
                                          <p className="mb-0 mt-2">Bu anlaşma için blok bilgisi bulunamadı.</p>
                                        </div>
                                      ) : (
                                        <div className="row g-3">
                                          {usedBlocks.map((blockId) => {
                                            const blockLabel = blockId.split('-')[2]; // Extract block label (A, B, C, etc.)
                                            const usedPanels = panelSelections[blockId] || [];
                                            
                                            return (
                                              <div key={blockId} className="col-md-6 col-lg-4">
                                                <div className="card border-warning">
                                                  <div className="card-header bg-warning-subtle">
                                                    <h6 className="mb-0 fw-bold">
                                                      <i className={`bi ${site.siteType === 'business_center' ? 'bi-briefcase' : 'bi-grid-3x3-gap'} me-1`}></i>
                                                      {site.siteType === 'business_center' ? 'İş Merkezi' : `${blockLabel} Blok`}
                                                    </h6>
                                                  </div>
                                                  <div className="card-body">
                                                    <div className="small text-muted mb-2">
                                                      Kullanılan Paneller: {usedPanels.length} / {panelsPerBlock}
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-1">
                                                      {Array.from({ length: panelsPerBlock }, (_, panelIndex) => {
                                                        const panelId = panelIndex + 1;
                                                        const panelKey = `panel-${panelId}`;
                                                            const isPanelUsed = usedPanels.includes(panelKey);
                                                            const fullPanelNumber = `${siteId}${blockLabel}${panelId}`;
                                                            const panelImage = getPanelImage(agreement.id.toString(), siteId, blockId, panelId.toString());
                                                            
                                                            return (
                                                              <div
                                                                key={panelKey}
                                                                className={`d-flex align-items-center justify-content-center ${
                                                                  panelImage ? '' : (isPanelUsed ? 'bg-primary text-white' : 'bg-light text-muted')
                                                                } border rounded position-relative`}
                                                                style={{
                                                                  width: panelImage ? '90px' : '60px',
                                                                  height: panelImage ? '120px' : '80px',
                                                                  fontSize: '8px',
                                                                  fontWeight: 'bold',
                                                                  flexDirection: 'column',
                                                                  cursor: isPanelUsed ? 'pointer' : 'default',
                                                                  backgroundImage: panelImage ? `url(${panelImage.url})` : 'none',
                                                                  backgroundSize: 'cover',
                                                                  backgroundPosition: 'center',
                                                                  backgroundRepeat: 'no-repeat',
                                                                  minHeight: panelImage ? '120px' : '80px'
                                                                }}
                                                                title={isPanelUsed ? `Panel ${fullPanelNumber} - ${helpers.getCompanyName(agreement.companyId)}${panelImage ? ' (Fotoğraf var)' : ''}` : `Panel ${panelId} - Boş`}
                                                                onClick={() => {
                                                                  if (isPanelUsed) {
                                                                    handlePanelClick(agreement, siteId, blockId, panelId);
                                                                  }
                                                                }}
                                                              >
                                                                {!panelImage && (
                                                                  <>
                                                                    <div className="fw-bold">{panelId}</div>
                                                                    {isPanelUsed && (
                                                                      <div className="text-truncate" style={{ fontSize: '7px', lineHeight: '1', maxWidth: '50px' }}>
                                                                        {fullPanelNumber}
                                                                      </div>
                                                                    )}
                                                                  </>
                                                                )}
                                                                {isPanelUsed && (
                                                                  <div className="position-absolute top-0 end-0" style={{ fontSize: '8px' }}>
                                                                    {panelImage ? (
                                                                      <i className="bi bi-camera-fill text-success"></i>
                                                                    ) : (
                                                                      <i className="bi bi-camera text-warning"></i>
                                                                    )}
                                                                  </div>
                                                                )}
                                                                {panelImage && (
                                                                  <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center" style={{ fontSize: '6px', padding: '2px' }}>
                                                                    Panel {panelId}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                      })}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-12">
            <div className="card custom-card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-file-earmark text-muted fs-1"></i>
                <h4 className="text-muted mt-3">
                  {(startDate || endDate) ? 'Seçilen tarih aralığında anlaşma bulunamadı' : 'Henüz anlaşma bulunmamaktadır'}
                </h4>
                <p className="text-muted">
                  {(startDate || endDate) ? 'Farklı tarih aralığı seçmeyi deneyin.' : 'Aktif veya gelecek anlaşma bulunamadı.'}
                </p>
                {(startDate || endDate) && (
                  <button
                    className="btn btn-outline-primary mt-3"
                    onClick={clearDateFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedPanel && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-camera me-2"></i>
                  Panel Fotoğrafı Yükle
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedPanel(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <h6 className="fw-bold">Panel: {selectedPanel.fullPanelNumber}</h6>
                  <p className="text-muted mb-0">
                    Firma: {helpers.getCompanyName(selectedPanel.agreement.companyId)}
                  </p>
                </div>

                {selectedPanel.existingImage && (
                  <div className="mb-3">
                    <h6 className="text-center mb-2">Mevcut Fotoğraf:</h6>
                    <div className="text-center">
                      <LazyImage 
                        src={selectedPanel.existingImage.url}
                        alt="Mevcut Panel Fotoğrafı"
                        width={200}
                        height={200}
                        quality={85}
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          border: '2px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        // Check if getUserMedia is supported
                        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                          // Request camera permission and open camera
                          const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                              facingMode: 'environment' // Rear camera
                            } 
                          });
                          
                          // Create a video element to show camera preview
                          const video = document.createElement('video');
                          video.srcObject = stream;
                          video.style.width = '100%';
                          video.style.height = '300px';
                          video.style.objectFit = 'cover';
                          video.autoplay = true;
                          video.muted = true;
                          
                          // Create modal for camera preview
                          const modal = document.createElement('div');
                          modal.style.position = 'fixed';
                          modal.style.top = '0';
                          modal.style.left = '0';
                          modal.style.width = '100%';
                          modal.style.height = '100%';
                          modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                          modal.style.zIndex = '9999';
                          modal.style.display = 'flex';
                          modal.style.flexDirection = 'column';
                          modal.style.alignItems = 'center';
                          modal.style.justifyContent = 'center';
                          
                          // Create camera container
                          const cameraContainer = document.createElement('div');
                          cameraContainer.style.backgroundColor = 'white';
                          cameraContainer.style.padding = '20px';
                          cameraContainer.style.borderRadius = '10px';
                          cameraContainer.style.maxWidth = '90%';
                          cameraContainer.style.maxHeight = '90%';
                          
                          // Create buttons container
                          const buttonsContainer = document.createElement('div');
                          buttonsContainer.style.marginTop = '20px';
                          buttonsContainer.style.display = 'flex';
                          buttonsContainer.style.gap = '10px';
                          buttonsContainer.style.justifyContent = 'center';
                          
                          // Create capture button
                          const captureBtn = document.createElement('button');
                          captureBtn.textContent = 'Fotoğraf Çek';
                          captureBtn.style.padding = '10px 20px';
                          captureBtn.style.backgroundColor = '#007bff';
                          captureBtn.style.color = 'white';
                          captureBtn.style.border = 'none';
                          captureBtn.style.borderRadius = '5px';
                          captureBtn.style.cursor = 'pointer';
                          
                          // Create cancel button
                          const cancelBtn = document.createElement('button');
                          cancelBtn.textContent = 'İptal';
                          cancelBtn.style.padding = '10px 20px';
                          cancelBtn.style.backgroundColor = '#6c757d';
                          cancelBtn.style.color = 'white';
                          cancelBtn.style.border = 'none';
                          cancelBtn.style.borderRadius = '5px';
                          cancelBtn.style.cursor = 'pointer';
                          
                          // Create canvas for capturing
                          const canvas = document.createElement('canvas');
                          const context = canvas.getContext('2d');
                          
                          // Capture photo function
                          captureBtn.onclick = () => {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            context.drawImage(video, 0, 0);
                            
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                                handlePhotoUpload(file);
                              }
                            }, 'image/jpeg', 0.8);
                            
                            // Stop camera and close modal
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                          };
                          
                          // Cancel function
                          cancelBtn.onclick = () => {
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(modal);
                          };
                          
                          // Assemble modal
                          buttonsContainer.appendChild(captureBtn);
                          buttonsContainer.appendChild(cancelBtn);
                          cameraContainer.appendChild(video);
                          cameraContainer.appendChild(buttonsContainer);
                          modal.appendChild(cameraContainer);
                          document.body.appendChild(modal);
                          
                        } else {
                          // Fallback to file input
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = (e) => {
                            if (e.target.files && e.target.files[0]) {
                              handlePhotoUpload(e.target.files[0]);
                            }
                          };
                          input.click();
                        }
                      } catch (error) {
                        logger.error('Camera error:', error);
                        // Fallback to file input
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoUpload(e.target.files[0]);
                          }
                        };
                        input.click();
                      }
                    }}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Kamera ile Çek
                  </button>
                  
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(e.target.files[0]);
                        }
                      };
                      input.click();
                    }}
                  >
                    <i className="bi bi-image me-2"></i>
                    Galeriden Seç
                  </button>

                  {selectedPanel.existingImage && (
                    <button
                      className="btn btn-danger"
                      onClick={handlePhotoDelete}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Fotoğrafı Sil
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harita Bölümü */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold text-dark">
                  <i className="bi bi-map me-2"></i>
                  Elazığ - Site Haritası
                </h5>
                <small className="text-muted">
                  {sites.filter(site => site.locationLat && site.locationLng).length} site haritada gösteriliyor
                </small>
              </div>
              <div className="d-flex gap-2">
                {!route ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={createRoute}
                    disabled={routeLoading || !sites.some(site => site.locationLat && site.locationLng)}
                  >
                    {routeLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Rota Hesaplanıyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-route me-1"></i>
                        Rota Oluştur
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearRoute}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Rotayı Temizle
                  </button>
                )}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowMap(!showMap)}
                >
                  <i className={`bi ${showMap ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                  {showMap ? 'Haritayı Gizle' : 'Haritayı Göster'}
                </button>
              </div>
            </div>
            
            {showMap && (
              <>
                {/* Rota Listesi - Rota oluşturulduğunda göster */}
                {route && routeSites.length > 0 && (
                  <div className="card-body border-bottom bg-light">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-list-ol me-2"></i>
                      Rota Sırası ({routeSites.length - 1} Site)
                    </h6>
                    <div className="row g-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {routeSites.map((siteItem, index) => {
                        if (siteItem.isStart) return null;
                        return (
                          <div key={siteItem.id || index} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100">
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-1">
                                      <span className="badge bg-primary me-2">{index}</span>
                                      <strong className="small">{siteItem.name}</strong>
                                    </div>
                                    {siteItem.neighborhood && (
                                      <small className="text-muted d-block">{siteItem.neighborhood}</small>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openDirectionsToSite(siteItem)}
                                    title="Yol Tarifi Al"
                                  >
                                    <i className="bi bi-navigation"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="card-body p-0" style={{ height: '600px', position: 'relative' }}>
                  {showMap && GOOGLE_MAPS_API_KEY && (
                    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={ELAZIG_CENTER}
                        zoom={12}
                        options={{
                          zoomControl: true,
                          streetViewControl: false,
                          mapTypeControl: true,
                          fullscreenControl: true,
                        }}
                        onLoad={onMapLoad}
                        onError={() => {
                          logger.error('Google Maps load error');
                          setMapLoading(false);
                        }}
                      >
                        {/* Kullanıcı konumu marker'ı */}
                        {currentLocation && (
                          <Marker
                            position={currentLocation}
                            icon={window.google && window.google.maps ? {
                              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                              scaledSize: new window.google.maps.Size(40, 40)
                            } : undefined}
                            title="Başlangıç Noktası (Sizin Konumunuz)"
                          />
                        )}

                        {/* Site marker'ları */}
                        {sites.filter(site => site.locationLat && site.locationLng).map((site) => (
                          <Marker
                            key={site.id}
                            position={{
                              lat: parseFloat(site.locationLat),
                              lng: parseFloat(site.locationLng)
                            }}
                            onClick={() => setSelectedSite(site)}
                            icon={window.google && window.google.maps ? {
                              url: site.siteType === 'business_center' 
                                ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                              scaledSize: new window.google.maps.Size(32, 32)
                            } : undefined}
                          />
                        ))}

                        {/* Rota çizgisi */}
                        {route && <DirectionsRenderer directions={route} />}

                        {/* InfoWindow */}
                        {selectedSite && selectedSite.locationLat && selectedSite.locationLng && (
                          <InfoWindow
                            position={{
                              lat: parseFloat(selectedSite.locationLat),
                              lng: parseFloat(selectedSite.locationLng)
                            }}
                            onCloseClick={() => setSelectedSite(null)}
                          >
                            <div style={{ maxWidth: '250px' }}>
                              <h6 className="fw-bold mb-2">
                                <i className={`bi ${selectedSite.siteType === 'business_center' ? 'bi-briefcase' : 'bi-building'} me-1`}></i>
                                {selectedSite.name}
                              </h6>
                              {selectedSite.neighborhood && (
                                <p className="mb-1 small">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  <strong>Mahalle:</strong> {selectedSite.neighborhood}
                                </p>
                              )}
                              {selectedSite.manager && (
                                <p className="mb-1 small">
                                  <i className="bi bi-person me-1"></i>
                                  <strong>Yönetici:</strong> {selectedSite.manager}
                                </p>
                              )}
                              {selectedSite.phone && (
                                <p className="mb-1 small">
                                  <i className="bi bi-telephone me-1"></i>
                                  <strong>Telefon:</strong> {selectedSite.phone}
                                </p>
                              )}
                              <div className="d-flex gap-2 mt-2 flex-wrap">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => openGoogleMaps(selectedSite)}
                                >
                                  <i className="bi bi-map me-1"></i>
                                  Yol Tarifi
                                </button>
                                {selectedSite.blocks && (
                                  <span className="badge bg-info">
                                    {selectedSite.blocks} Blok
                                  </span>
                                )}
                                {selectedSite.panels && (
                                  <span className="badge bg-success">
                                    {selectedSite.panels} Panel
                                  </span>
                                )}
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  )}
                  {showMap && (!GOOGLE_MAPS_API_KEY || mapLoading) && (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-3 text-muted">Harita yükleniyor...</p>
                      </div>
                    </div>
                  )}
                  {showMap && !GOOGLE_MAPS_API_KEY && !mapLoading && (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="alert alert-warning text-center" style={{ maxWidth: '600px' }}>
                        <h6 className="alert-heading">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Google Maps API Key Gerekli
                        </h6>
                        <p className="mb-0">Harita görünümünü kullanabilmek için Google Maps API key gerekli.</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Site Edit Modal */}
      {showSiteEditModal && selectedSite && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Site Bilgilerini Düzenle: {selectedSite.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowSiteEditModal(false);
                    setSelectedSite(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium mb-0">
                        <i className="bi bi-geo-alt me-1"></i>
                        Konum Bilgisi (Koordinatlar)
                      </label>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={handleGetCurrentLocation}
                          title="Mevcut Konumunuzu Al"
                        >
                          <i className="bi bi-geo-alt-fill me-1"></i>
                          Konumumu Al
                        </button>
                        {(siteEditForm.locationLat && siteEditForm.locationLng) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              const siteWithLocation = { 
                                ...selectedSite, 
                                locationLat: siteEditForm.locationLat,
                                locationLng: siteEditForm.locationLng
                              };
                              openGoogleMaps(siteWithLocation);
                            }}
                            title="Google Maps'te Yol Tarifi Al"
                          >
                            <i className="bi bi-map me-1"></i>
                            Haritada Aç
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small">Enlem (Latitude)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="locationLat"
                          value={siteEditForm.locationLat}
                          onChange={handleSiteEditChange}
                          placeholder="Örn: 41.0082"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small">Boylam (Longitude)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="locationLng"
                          value={siteEditForm.locationLng}
                          onChange={handleSiteEditChange}
                          placeholder="Örn: 28.9784"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control mt-2"
                      name="location"
                      value={siteEditForm.location}
                      onChange={handleSiteEditChange}
                      placeholder="Adres (Opsiyonel - Örn: İstanbul, Kadıköy, Acıbadem Mahallesi...)"
                    />
                    <small className="text-muted">"Konumumu Al" butonuna tıklayarak mevcut konumunuzu otomatik alabilir veya manuel olarak koordinatları girebilirsiniz</small>
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium">
                      <i className="bi bi-person me-1"></i>
                      Site Yöneticisi
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="manager"
                      value={siteEditForm.manager}
                      onChange={handleSiteEditChange}
                      placeholder="Site yöneticisinin adı"
                    />
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium">
                      <i className="bi bi-telephone me-1"></i>
                      Kapıcı Telefonları
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="janitorPhones"
                      value={siteEditForm.janitorPhones}
                      onChange={handleSiteEditChange}
                      placeholder="Birden fazla telefon için virgülle ayırın (örn: 0532 123 45 67, 0533 987 65 43)"
                    />
                    <small className="text-muted">Birden fazla telefon numarasını virgülle ayırarak girebilirsiniz</small>
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        <i className="bi bi-building me-1"></i>
                        Blok Sayısı
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="blocks"
                        value={siteEditForm.blocks}
                        onChange={handleSiteEditChange}
                        placeholder="Örn: 5"
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        <i className="bi bi-elevator me-1"></i>
                        Blok Başına Asansör Sayısı
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="elevatorsPerBlock"
                        value={siteEditForm.elevatorsPerBlock}
                        onChange={handleSiteEditChange}
                        placeholder="Örn: 2"
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">
                        <i className="bi bi-house-door me-1"></i>
                        Daire Sayısı
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="apartmentCount"
                        value={siteEditForm.apartmentCount}
                        onChange={handleSiteEditChange}
                        placeholder="Örn: 100"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-12">
                    <label className="form-label fw-medium">
                      <i className="bi bi-sticky me-1"></i>
                      Notlar
                    </label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={siteEditForm.notes}
                      onChange={handleSiteEditChange}
                      rows="4"
                      placeholder="Site hakkında özel notlar..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSiteEditModal(false);
                    setSelectedSite(null);
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSiteUpdate}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
};

export default PersonnelDashboard;
