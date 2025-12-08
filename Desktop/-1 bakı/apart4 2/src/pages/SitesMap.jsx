import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getSites } from '../services/api';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

// Elazığ merkez koordinatları
const ELAZIG_CENTER = {
  lat: 38.6748,
  lng: 39.2233
};

// Harita container stilleri
const mapContainerStyle = {
  width: '100%',
  height: '100vh'
};

// Harita seçenekleri
const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const SitesMap = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [mapCenter, setMapCenter] = useState(ELAZIG_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const user = getUser();

  // Google Maps API key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAO5-L4SrMA1e5q3ugtjYCI1gVI7KZoD6g';

  // Load sites data
  useEffect(() => {
    const loadSites = async () => {
      try {
        setLoading(true);
        const sitesData = await getSites();
        // Sadece koordinatları olan siteleri filtrele
        const sitesWithCoordinates = sitesData.filter(site => 
          site.locationLat && site.locationLng && 
          !isNaN(parseFloat(site.locationLat)) && 
          !isNaN(parseFloat(site.locationLng))
        );
        setSites(sitesWithCoordinates);
        
        // Map yüklendikten sonra fit bounds yapılacak
      } catch (error) {
        console.error('Error loading sites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, []);

  // Map yüklendiğinde tüm siteleri gösterecek şekilde ayarla
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    if (sites.length > 0 && window.google && window.google.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      sites.forEach(site => {
        bounds.extend({
          lat: parseFloat(site.locationLat),
          lng: parseFloat(site.locationLng)
        });
      });
      map.fitBounds(bounds);
      
      // Eğer çok yakın zoom ise, biraz uzaklaştır
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [sites]);

  // Marker'a tıklandığında
  const handleMarkerClick = (site) => {
    setSelectedSite(site);
  };

  // InfoWindow'u kapat
  const handleInfoWindowClose = () => {
    setSelectedSite(null);
  };

  // Google Maps'e yönlendir
  const openInGoogleMaps = (site) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${site.locationLat},${site.locationLng}`;
    window.open(url, '_blank');
  };

  // Eğer API key yoksa uyarı göster
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="alert alert-warning text-center" style={{ maxWidth: '600px' }}>
          <h4 className="alert-heading">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Google Maps API Key Gerekli
          </h4>
          <p>
            Harita görünümünü kullanabilmek için Google Maps API key'inizi eklemeniz gerekiyor.
          </p>
          <hr />
          <p className="mb-0">
            <strong>Kurulum:</strong>
            <br />
            1. <code>.env</code> dosyasına <code>VITE_GOOGLE_MAPS_API_KEY=your_api_key</code> ekleyin
            <br />
            2. Google Cloud Console'dan Maps JavaScript API'yi etkinleştirin
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ position: 'relative', height: '100vh' }}>
      {/* Header Bar */}
      <div className="bg-white shadow-sm p-3" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-map me-2"></i>
              Elazığ - Site Haritası
            </h5>
            <small className="text-muted">
              {sites.length} site haritada gösteriliyor
            </small>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                if (mapRef.current && sites.length > 0 && window.google && window.google.maps) {
                  const bounds = new window.google.maps.LatLngBounds();
                  sites.forEach(site => {
                    bounds.extend({
                      lat: parseFloat(site.locationLat),
                      lng: parseFloat(site.locationLng)
                    });
                  });
                  mapRef.current.fitBounds(bounds);
                }
              }}
            >
              <i className="bi bi-arrows-angle-contract me-1"></i>
              Tümünü Göster
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setMapCenter(ELAZIG_CENTER);
                setMapZoom(12);
                if (mapRef.current) {
                  mapRef.current.setCenter(ELAZIG_CENTER);
                  mapRef.current.setZoom(12);
                }
              }}
            >
              <i className="bi bi-geo-alt me-1"></i>
              Elazığ Merkez
            </button>
            {user?.role === 'personnel' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Personel Paneli
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={mapZoom}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Site Markers */}
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
                  ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              } : undefined}
            />
          ))}

          {/* InfoWindow for selected site */}
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
                <div className="d-flex gap-2 mt-2">
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

      {/* Legend */}
      <div 
        className="bg-white shadow-sm p-3 rounded"
        style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          zIndex: 1000,
          maxWidth: '250px'
        }}
      >
        <h6 className="fw-bold mb-2">
          <i className="bi bi-info-circle me-1"></i>
          Açıklama
        </h6>
        <div className="d-flex align-items-center mb-2">
          <img 
            src="http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
            alt="Site" 
            style={{ width: '20px', height: '20px', marginRight: '8px' }}
          />
          <span className="small">Site</span>
        </div>
        <div className="d-flex align-items-center">
          <img 
            src="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
            alt="İş Merkezi" 
            style={{ width: '20px', height: '20px', marginRight: '8px' }}
          />
          <span className="small">İş Merkezi</span>
        </div>
      </div>
    </div>
  );
};

export default SitesMap;

