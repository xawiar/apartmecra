import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getRecentTransactions, getSites } from '../services/api';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    activeSites: 0,
    activeCompanies: 0,
    activeAgreements: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netCash: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSites, setRouteSites] = useState([]); // Rota sırasındaki siteler
  const [directionsService, setDirectionsService] = useState(null);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Elazığ merkez koordinatları
  const ELAZIG_CENTER = { lat: 38.6748, lng: 39.2233 };
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAO5-L4SrMA1e5q3ugtjYCI1gVI7KZoD6g';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, transactionsData, sitesData] = await Promise.all([
          getDashboardSummary(),
          getRecentTransactions(),
          getSites()
        ]);
        
        setSummary(summaryData);
        setTransactions(transactionsData);
        
        // Sadece koordinatları olan siteleri filtrele
        const sitesWithCoordinates = sitesData.filter(site => 
          site.locationLat && site.locationLng && 
          !isNaN(parseFloat(site.locationLat)) && 
          !isNaN(parseFloat(site.locationLng))
        );
        setSites(sitesWithCoordinates);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setMapLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map yüklendiğinde tüm siteleri gösterecek şekilde ayarla
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // DirectionsService'i başlat
    if (window.google && window.google.maps) {
      const service = new window.google.maps.DirectionsService();
      directionsServiceRef.current = service;
      setDirectionsService(service);
    }
    
    if (sites.length > 0 && window.google && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      sites.forEach(site => {
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
  }, [sites]);

  // Kullanıcının mevcut konumunu al
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation desteklenmiyor'));
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
    if (!directionsServiceRef.current || sites.length === 0) {
      if (window.showAlert) {
        window.showAlert('Hata', 'Rota oluşturulamadı. Lütfen sitelerin yüklendiğinden emin olun.', 'error');
      }
      return;
    }

    try {
      setRouteLoading(true);
      
      // Kullanıcının konumunu al
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      // Tüm sitelerin koordinatlarını hazırla
      const destinations = sites.map(site => ({
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
          optimizeWaypoints: false, // Zaten optimize ettik
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setRoute(result);
            
            // Rota sırasındaki siteleri kaydet (başlangıç noktası + optimal route)
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
            console.error('Directions request failed:', status);
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
      console.error('Error creating route:', error);
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
    if (mapRef.current && sites.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      sites.forEach(site => {
        bounds.extend({
          lat: parseFloat(site.locationLat),
          lng: parseFloat(site.locationLng)
        });
      });
      mapRef.current.fitBounds(bounds);
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

  const handleMarkerClick = (site) => {
    setSelectedSite(site);
  };

  const handleInfoWindowClose = () => {
    setSelectedSite(null);
  };

  const openInGoogleMaps = (site) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${site.locationLat},${site.locationLng}`;
    window.open(url, '_blank');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₺0,00';
    }
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Handle activity click
  const handleActivityClick = (activityType) => {
    switch(activityType) {
      case 'agreement':
        navigate('/agreements');
        break;
      case 'cashier':
        navigate('/cashier');
        break;
      case 'sites':
        navigate('/sites');
        break;
      case 'companies':
        navigate('/companies');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4 py-3 py-md-4">
      {/* Header Section - Responsive */}
      <div className="page-header mb-3 mb-md-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <div>
            <h2 className="h3 h4-md fw-bold mb-1">Yönetim Paneli</h2>
            <p className="mb-0 small">Sistem durumu ve son aktiviteler</p>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-2 me-md-3 text-end d-none d-sm-block">
              <p className="mb-0 small" style={{opacity: 0.9}}>Hoş geldiniz</p>
              <p className="mb-0 fw-medium small">Yönetici</p>
            </div>
            <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center" 
                 style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Responsive */}
      <div className="row mb-3 mb-md-4 g-2 g-md-3 g-lg-4">
        <div className="col-6 col-sm-6 col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-geo-alt text-primary fs-5 fs-4-md"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Toplam Site</p>
                  <h3 className="mb-0 fw-bold text-dark fs-5 fs-4-md">{summary.activeSites}</h3>
                </div>
              </div>
              <div className="progress d-none d-md-block" style={{ height: '4px' }}>
                <div className="progress-bar bg-primary" role="progressbar" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-building text-success fs-5 fs-4-md"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Aktif Firma</p>
                  <h3 className="mb-0 fw-bold text-dark fs-5 fs-4-md">{summary.activeCompanies}</h3>
                </div>
              </div>
              <div className="progress d-none d-md-block" style={{ height: '4px' }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-file-text text-info fs-5 fs-4-md"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Aktif Anlaşma</p>
                  <h3 className="mb-0 fw-bold text-dark fs-5 fs-4-md">{summary.activeAgreements}</h3>
                </div>
              </div>
              <div className="progress d-none d-md-block" style={{ height: '4px' }}>
                <div className="progress-bar bg-info" role="progressbar" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="page-stats-card border-0 shadow-sm h-100">
            <div className="card-body p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" 
                     style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-cash-stack text-warning fs-5 fs-4-md"></i>
                </div>
                <div className="text-end">
                  <p className="mb-0 small text-muted">Kasa Bakiyesi</p>
                  <h3 className="mb-0 fw-bold text-dark fs-6 fs-5-md">{formatCurrency(summary.netCash)}</h3>
                </div>
              </div>
              <div className="progress d-none d-md-block" style={{ height: '4px' }}>
                <div className="progress-bar bg-warning" role="progressbar" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel - Responsive */}
      <div className="row mb-3 mb-md-4 g-2 g-md-3">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-header bg-white border-0 py-2 py-md-3">
              <h5 className="mb-0 fw-bold text-dark small">Hızlı İşlemler</h5>
            </div>
            <div className="card-body p-2 p-md-3">
              <div className="row g-2 g-md-3">
                {/* Add Income */}
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/cashier')}>
                    <div className="card-body text-center py-2 py-md-4">
                      <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2 mb-md-3" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-plus-circle text-success fs-5 fs-4-md"></i>
                      </div>
                      <h6 className="mb-0 fw-medium small">Gelir Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Expense */}
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/cashier')}>
                    <div className="card-body text-center py-2 py-md-4">
                      <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2 mb-md-3" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-dash-circle text-danger fs-5 fs-4-md"></i>
                      </div>
                      <h6 className="mb-0 fw-medium small">Gider Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Agreement */}
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/agreements')}>
                    <div className="card-body text-center py-2 py-md-4">
                      <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2 mb-md-3" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-file-earmark-text text-primary fs-5 fs-4-md"></i>
                      </div>
                      <h6 className="mb-0 fw-medium small">Anlaşma Ekle</h6>
                    </div>
                  </div>
                </div>
                
                {/* Add Site */}
                <div className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm h-100 quick-action-card" 
                       style={{ borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onClick={() => navigate('/sites')}>
                    <div className="card-body text-center py-2 py-md-4">
                      <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2 mb-md-3" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-geo-alt text-info fs-5 fs-4-md"></i>
                      </div>
                      <h6 className="mb-0 fw-medium small">Site Ekle</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <small className="text-muted">{sites.length} site haritada gösteriliyor</small>
              </div>
              <div className="d-flex gap-2">
                {!route ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={createRoute}
                    disabled={routeLoading || sites.length === 0}
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
              </div>
            </div>
            {/* Rota Listesi - Rota oluşturulduğunda göster */}
            {route && routeSites.length > 0 && (
              <div className="card-body border-bottom bg-light">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-list-ol me-2"></i>
                  Rota Sırası ({routeSites.length - 1} Site)
                </h6>
                <div className="row g-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {routeSites.map((siteItem, index) => {
                    if (siteItem.isStart) return null; // Başlangıç noktasını gösterme
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
              {!mapLoading && GOOGLE_MAPS_API_KEY && (
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
                    {sites.map((site) => (
                      <Marker
                        key={site.id}
                        position={{
                          lat: parseFloat(site.locationLat),
                          lng: parseFloat(site.locationLng)
                        }}
                        onClick={() => handleMarkerClick(site)}
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

                    {selectedSite && (
                      <InfoWindow
                        position={{
                          lat: parseFloat(selectedSite.locationLat),
                          lng: parseFloat(selectedSite.locationLng)
                        }}
                        onCloseClick={handleInfoWindowClose}
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
                          {selectedSite.location && (
                            <p className="mb-2 small text-muted">
                              {selectedSite.location}
                            </p>
                          )}
                          <div className="d-flex gap-2 mt-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => openInGoogleMaps(selectedSite)}
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
              {(!GOOGLE_MAPS_API_KEY || mapLoading) && (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3 text-muted">Harita yükleniyor...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;