import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const CreateEventForm = ({ onClose, onEventCreated, members }) => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [attendance, setAttendance] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [eventCategories, setEventCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Location selection states
  const [selectedLocationTypes, setSelectedLocationTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState({});
  const [districts, setDistricts] = useState([]);
  const [towns, setTowns] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [stks, setStks] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [responsibleMembers, setResponsibleMembers] = useState([]);
  const [loadingResponsibleMembers, setLoadingResponsibleMembers] = useState(false);

  // Filter and sort members
  const filteredMembers = members ? members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.region?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Get responsible members for selected locations
  const getResponsibleMembers = async () => {
    const responsibleMembers = [];
    
    try {
      console.log('Getting responsible members for:', selectedLocationTypes, selectedLocations);
      
      // Get all officials and representatives data
      const [districtOfficials, townOfficials, neighborhoodRepresentatives, villageRepresentatives, neighborhoodSupervisors, villageSupervisors, districtDeputyInspectors, townDeputyInspectors] = await Promise.all([
        ApiService.getDistrictOfficials(),
        ApiService.getTownOfficials(),
        ApiService.getNeighborhoodRepresentatives(),
        ApiService.getVillageRepresentatives(),
        ApiService.getNeighborhoodSupervisors(),
        ApiService.getVillageSupervisors(),
        ApiService.getAllDistrictDeputyInspectors(),
        ApiService.getAllTownDeputyInspectors()
      ]);

      console.log('Fetched data:', {
        districtOfficials: districtOfficials.length,
        townOfficials: townOfficials.length,
        neighborhoodRepresentatives: neighborhoodRepresentatives.length,
        villageRepresentatives: villageRepresentatives.length,
        neighborhoodSupervisors: neighborhoodSupervisors.length,
        villageSupervisors: villageSupervisors.length,
        districtDeputyInspectors: districtDeputyInspectors.length,
        townDeputyInspectors: townDeputyInspectors.length
      });

      selectedLocationTypes.forEach(locationType => {
        const locationIds = selectedLocations[locationType] || [];
        if (locationIds.length === 0) return;
        
        locationIds.forEach(locationId => {
        
        let responsible = [];
        
        switch (locationType) {
          case 'district':
            // Find district officials for this district
            const districtOfficialsForLocation = districtOfficials.filter(official => official.district_id === locationId);
            const districtDeputyInspectorsForLocation = districtDeputyInspectors.filter(deputy => deputy.district_id === locationId);
            
            // Add chairman and inspector
            const districtMainOfficials = districtOfficialsForLocation.map(official => {
              const officials = [];
              
              if (official.chairman_member_id) {
                officials.push({
                  id: official.chairman_member_id,
                  name: official.chairman_name,
                  position: 'İlçe Başkanı',
                  region: official.district_name,
                  phone: official.chairman_phone
                });
              }
              
              if (official.inspector_member_id) {
                officials.push({
                  id: official.inspector_member_id,
                  name: official.inspector_name,
                  position: 'İlçe Müfettişi',
                  region: official.district_name,
                  phone: official.inspector_phone
                });
              }
              
              return officials;
            }).flat();
            
            // Add deputy inspectors
            const districtDeputyOfficials = districtDeputyInspectorsForLocation.map(deputy => ({
              id: deputy.member_id,
              name: deputy.member_name || deputy.name,
              position: 'İlçe Müfettiş Yardımcısı',
              region: deputy.district_name,
              phone: deputy.member_phone || deputy.phone
            }));
            
            responsible = [...districtMainOfficials, ...districtDeputyOfficials];
            break;
            
          case 'town':
            // Find town officials for this town
            const townOfficialsForLocation = townOfficials.filter(official => official.town_id === locationId);
            const townDeputyInspectorsForLocation = townDeputyInspectors.filter(deputy => deputy.town_id === locationId);
            
            // Add chairman and inspector
            const townMainOfficials = townOfficialsForLocation.map(official => {
              const officials = [];
              
              if (official.chairman_member_id) {
                officials.push({
                  id: official.chairman_member_id,
                  name: official.chairman_name,
                  position: 'Belde Başkanı',
                  region: official.town_name,
                  phone: official.chairman_phone
                });
              }
              
              if (official.inspector_member_id) {
                officials.push({
                  id: official.inspector_member_id,
                  name: official.inspector_name,
                  position: 'Belde Müfettişi',
                  region: official.town_name,
                  phone: official.inspector_phone
                });
              }
              
              return officials;
            }).flat();
            
            // Add deputy inspectors
            const townDeputyOfficials = townDeputyInspectorsForLocation.map(deputy => ({
              id: deputy.member_id,
              name: deputy.member_name || deputy.name,
              position: 'Belde Müfettiş Yardımcısı',
              region: deputy.town_name,
              phone: deputy.member_phone || deputy.phone
            }));
            
            responsible = [...townMainOfficials, ...townDeputyOfficials];
            break;
            
          case 'neighborhood':
            // Find neighborhood representatives and supervisors
            console.log('Looking for neighborhood representatives for locationId:', locationId);
            console.log('Available neighborhood representatives:', neighborhoodRepresentatives);
            
            const neighborhoodReps = neighborhoodRepresentatives
              .filter(rep => rep.neighborhood_id === locationId)
              .map(rep => ({
                id: rep.member_id,
                name: rep.name,
                position: 'Mahalle Temsilcisi',
                region: rep.neighborhood_name,
                phone: rep.phone
              }));
              
            console.log('Found neighborhood reps:', neighborhoodReps);
            
            const neighborhoodSups = neighborhoodSupervisors
              .filter(sup => sup.neighborhood_id === locationId)
              .map(sup => ({
                id: sup.member_id,
                name: sup.name,
                position: 'Mahalle Sorumlusu',
                region: sup.neighborhood_name,
                phone: sup.phone
              }));
              
            console.log('Found neighborhood supervisors:', neighborhoodSups);
              
            responsible = [...neighborhoodReps, ...neighborhoodSups];
            console.log('Total responsible for neighborhood:', responsible);
            break;
            
          case 'village':
            // Find village representatives and supervisors
            const villageReps = villageRepresentatives
              .filter(rep => rep.village_id === locationId)
              .map(rep => ({
                id: rep.member_id,
                name: rep.name,
                position: 'Köy Temsilcisi',
                region: rep.village_name,
                phone: rep.phone
              }));
              
            const villageSups = villageSupervisors
              .filter(sup => sup.village_id === locationId)
              .map(sup => ({
                id: sup.member_id,
                name: sup.name,
                position: 'Köy Sorumlusu',
                region: sup.village_name,
                phone: sup.phone
              }));
              
            responsible = [...villageReps, ...villageSups];
            break;
        }
        
        console.log(`Adding ${responsible.length} responsible members for ${locationType}:`, responsible);
        responsibleMembers.push(...responsible);
        });
      });
      
      console.log('All responsible members before deduplication:', responsibleMembers);
      
      // Remove duplicates
      const finalResponsible = responsibleMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.id === member.id)
      );
      
      console.log('Final responsible members:', finalResponsible);
      return finalResponsible;
    } catch (error) {
      console.error('Error fetching responsible members:', error);
      return [];
    }
  };

  // Get other members (excluding responsible ones)
  const otherMembers = filteredMembers.filter(member => 
    !responsibleMembers.some(resp => resp.id === member.id)
  );

  // Sort members: responsible first, then others A-Z
  const sortedMembers = [
    ...responsibleMembers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })),
    ...otherMembers.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))
  ];

  // Load event categories
  const fetchEventCategories = async () => {
    setLoadingCategories(true);
    try {
      const categories = await ApiService.getEventCategories();
      setEventCategories(categories);
    } catch (error) {
      console.error('Error fetching event categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load all location data
  const fetchLocationData = async () => {
    setLoadingLocations(true);
    try {
      const [districtsData, townsData, neighborhoodsData, villagesData, stksData, mosquesData] = await Promise.all([
        ApiService.getDistricts(),
        ApiService.getTowns(),
        ApiService.getNeighborhoods(),
        ApiService.getVillages(),
        ApiService.getSTKs(),
        ApiService.getMosques()
      ]);
      
      setDistricts(districtsData);
      setTowns(townsData);
      setNeighborhoods(neighborhoodsData);
      setVillages(villagesData);
      setStks(stksData);
      setMosques(mosquesData);
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Load categories and location data on component mount
  useEffect(() => {
    fetchEventCategories();
    fetchLocationData();
  }, []);

  // Compute filtered options based on hierarchical selections
  const getFilteredOptions = (type) => {
    const selectedDistrictIds = selectedLocations.district || [];
    const selectedTownIds = selectedLocations.town || [];
    const selectedNeighborhoodIds = selectedLocations.neighborhood || [];
    const selectedVillageIds = selectedLocations.village || [];

    switch (type) {
      case 'town': {
        if (selectedDistrictIds.length === 0) return towns;
        return towns.filter(t => selectedDistrictIds.includes(t.district_id));
      }
      case 'neighborhood': {
        let base = neighborhoods;
        if (selectedDistrictIds.length > 0) {
          base = base.filter(n => selectedDistrictIds.includes(n.district_id));
        }
        if (selectedTownIds.length > 0 && base.length > 0 && 'town_id' in (base[0] || {})) {
          base = base.filter(n => selectedTownIds.includes(n.town_id));
        }
        return base;
      }
      case 'village': {
        let base = villages;
        if (selectedDistrictIds.length > 0) {
          base = base.filter(v => selectedDistrictIds.includes(v.district_id));
        }
        if (selectedTownIds.length > 0 && base.length > 0 && 'town_id' in (base[0] || {})) {
          base = base.filter(v => selectedTownIds.includes(v.town_id));
        }
        return base;
      }
      case 'mosque': {
        let base = mosques;
        if (selectedDistrictIds.length > 0) {
          base = base.filter(m => selectedDistrictIds.includes(m.district_id));
        }
        // If neighborhood selected, constrain to those
        if (selectedNeighborhoodIds.length > 0 && base.length > 0 && 'neighborhood_id' in (base[0] || {})) {
          base = base.filter(m => selectedNeighborhoodIds.includes(m.neighborhood_id));
        }
        // If village selected, constrain to those (some mosques may be village-linked)
        if (selectedVillageIds.length > 0 && base.length > 0 && 'village_id' in (base[0] || {})) {
          base = base.filter(m => selectedVillageIds.includes(m.village_id));
        }
        return base;
      }
      case 'district':
        return districts;
      case 'stk':
        // STK’lar bölge bazlı olabilir; eğer district_id alanı varsa filtrele
        if ((selectedDistrictIds.length > 0) && stks.length > 0 && 'district_id' in (stks[0] || {})) {
          return stks.filter(s => selectedDistrictIds.includes(s.district_id));
        }
        return stks;
      default:
        return [];
    }
  };

  // Load responsible members when selected locations change
  useEffect(() => {
    const loadResponsibleMembers = async () => {
      console.log('useEffect triggered - selectedLocationTypes:', selectedLocationTypes, 'selectedLocations:', selectedLocations);
      
      if (selectedLocationTypes.length === 0 || Object.values(selectedLocations).every(arr => arr.length === 0)) {
        console.log('No locations selected, clearing responsible members');
        setResponsibleMembers([]);
        return;
      }

      setLoadingResponsibleMembers(true);
      try {
        console.log('Loading responsible members...');
        const responsible = await getResponsibleMembers();
        console.log('Loaded responsible members:', responsible);
        setResponsibleMembers(responsible);
      } catch (error) {
        console.error('Error loading responsible members:', error);
        setResponsibleMembers([]);
      } finally {
        setLoadingResponsibleMembers(false);
      }
    };

    loadResponsibleMembers();
  }, [selectedLocationTypes, selectedLocations]);

  // Handle location type selection
  const handleLocationTypeChange = (locationType) => {
    setSelectedLocationTypes(prev => {
      if (prev.includes(locationType)) {
        // Remove location type and clear its selections
        const newTypes = prev.filter(type => type !== locationType);
        setSelectedLocations(prev => {
          const newLocations = { ...prev };
          delete newLocations[locationType];
          return newLocations;
        });
        return newTypes;
      } else {
        return [...prev, locationType];
      }
    });
  };

  // Handle specific location selection (multiple selection)
  const handleLocationSelection = (locationType, locationId, isChecked) => {
    setSelectedLocations(prev => {
      const currentSelections = prev[locationType] || [];
      
      if (isChecked) {
        // Add to selection if not already present
        if (!currentSelections.includes(locationId)) {
          return {
            ...prev,
            [locationType]: [...currentSelections, locationId]
          };
        }
      } else {
        // Remove from selection
        return {
          ...prev,
          [locationType]: currentSelections.filter(id => id !== locationId)
        };
      }
      
      return prev;
    });
  };

  // Get location name by type and id
  const getLocationName = (locationType, locationId) => {
    if (!locationId) return '';
    
    switch (locationType) {
      case 'district':
        const district = districts.find(d => d.id === locationId);
        return district ? district.name : '';
      case 'town':
        const town = towns.find(t => t.id === locationId);
        return town ? town.name : '';
      case 'neighborhood':
        const neighborhood = neighborhoods.find(n => n.id === locationId);
        return neighborhood ? neighborhood.name : '';
      case 'village':
        const village = villages.find(v => v.id === locationId);
        return village ? village.name : '';
      case 'stk':
        const stk = stks.find(s => s.id === locationId);
        return stk ? stk.name : '';
      case 'mosque':
        const mosque = mosques.find(m => m.id === locationId);
        return mosque ? mosque.name : '';
      default:
        return '';
    }
  };

  // Generate event location string
  const generateEventLocation = () => {
    const locationParts = selectedLocationTypes.map(type => {
      const locationIds = selectedLocations[type] || [];
      if (locationIds.length > 0) {
        const locationNames = locationIds.map(id => getLocationName(type, id)).filter(name => name !== '');
        return locationNames.join(', ');
      }
      return '';
    }).filter(name => name !== '');
    
    return locationParts.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      alert('Etkinlik kategorisi seçilmelidir');
      return;
    }
    
    if (!eventDate) {
      alert('Etkinlik tarihi ve saati zorunludur');
      return;
    }
    
    if (selectedLocationTypes.length === 0) {
      alert('En az bir konum türü seçilmelidir');
      return;
    }

    // Check if all selected location types have at least one selected location
    const missingLocations = selectedLocationTypes.filter(type => 
      !selectedLocations[type] || selectedLocations[type].length === 0
    );
    if (missingLocations.length > 0) {
      alert('Seçilen konum türleri için en az bir konum seçimi yapılmalıdır');
      return;
    }
    
    try {
      // Get selected category name
      const selectedCategory = eventCategories.find(cat => cat.id === parseInt(selectedCategoryId));
      const eventNameFromCategory = selectedCategory ? selectedCategory.name : '';
      
      // Create event
      const eventData = {
        name: eventNameFromCategory,
        date: eventDate,
        location: generateEventLocation(),
        description: eventDescription,
        selectedLocationTypes: selectedLocationTypes, // Store selected location types
        selectedLocations: selectedLocations, // Store selected locations
        attendees: sortedMembers.map(member => {
          const memberId = member.id;
          const attended = attendance[memberId] === true;
          
          return {
            memberId: parseInt(memberId),
            attended: attended
          };
        })
      };
      
      console.log('Creating event with data:', eventData);
      const response = await ApiService.createEvent(eventData);
      console.log('Event created successfully:', response);
      
      // Process visit counts for selected locations
      if (response && response.id) {
        try {
          const visitResults = await ApiService.processEventLocations(
            response.id,
            selectedLocationTypes,
            selectedLocations
          );
          console.log('Visit counts updated:', visitResults);
        } catch (visitError) {
          console.error('Error updating visit counts:', visitError);
          // Don't show error to user as event was created successfully
        }
      }
      
      // Show success message
      alert('Etkinlik başarıyla oluşturuldu');
      
      // Call callbacks
      if (onEventCreated) {
        onEventCreated();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Etkinlik oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleAttendanceChange = (memberId, attended) => {
    setAttendance(prev => ({
      ...prev,
      [memberId]: attended
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etkinlik Kategorisi *
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories ? 'Kategoriler yükleniyor...' : 'Etkinlik kategorisi seçin'}
            </option>
            {eventCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {eventCategories.length === 0 && !loadingCategories && (
            <p className="text-sm text-gray-500 mt-1">
              Henüz etkinlik kategorisi eklenmemiş. Lütfen önce ayarlar sayfasından etkinlik kategorisi ekleyin.
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etkinlik Tarihi ve Saati *
          </label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Etkinlik Yeri *
        </label>
        
        {/* Location Type Checkboxes */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Konum türü seçin:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'district', label: 'İlçe' },
              { key: 'town', label: 'Belde' },
              { key: 'neighborhood', label: 'Mahalle' },
              { key: 'village', label: 'Köy' },
              { key: 'stk', label: 'STK' },
              { key: 'mosque', label: 'Cami' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocationTypes.includes(key)}
                  onChange={() => handleLocationTypeChange(key)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={loadingLocations}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Selection Dropdowns */}
        {selectedLocationTypes.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Seçilen konum türleri için detay seçin:</p>
            
            {selectedLocationTypes.map(locationType => {
              const locationTypeLabels = {
                district: 'İlçe',
                town: 'Belde', 
                neighborhood: 'Mahalle',
                village: 'Köy',
                stk: 'STK',
                mosque: 'Cami'
              };

              const options = getFilteredOptions(locationType);

              return (
                <div key={locationType} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {locationTypeLabels[locationType]}:
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                    {options.length === 0 ? (
                      <p className="text-gray-500 text-sm">Seçenek bulunamadı</p>
                    ) : (
                      options.map(option => (
                        <label key={option.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
        <input
                            type="checkbox"
                            checked={(selectedLocations[locationType] || []).includes(option.id)}
                            onChange={(e) => handleLocationSelection(locationType, option.id, e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{option.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Responsible Members Selection */}
      {console.log('Rendering responsible members section - responsibleMembers:', responsibleMembers, 'length:', responsibleMembers.length)}
      {responsibleMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sorumlu Kişilerin Katılım Durumu
          </label>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-3">
              Seçilen konumlardaki sorumlu kişilerin katılım durumunu belirleyin:
            </p>
            <div className="space-y-3">
              {responsibleMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {member.position}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{member.region}</div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`responsible_${member.id}`}
                        checked={attendance[member.id] === true}
                        onChange={() => handleAttendanceChange(member.id, true)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Katıldı</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`responsible_${member.id}`}
                        checked={attendance[member.id] === false}
                        onChange={() => handleAttendanceChange(member.id, false)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Katılmadı</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Açıklama
        </label>
        <textarea
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Etkinlik hakkında detaylı bilgi..."
        />
      </div>

      {/* Attendance Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Katılım Durumu</h3>
          {responsibleMembers.length > 0 && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {responsibleMembers.length} sorumlu kişi
            </span>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Üye ara (isim, görev, bölge)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {sortedMembers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'Arama kriterlerine uygun üye bulunamadı' : 'Üye bulunamadı'}
              </div>
            ) : (
              sortedMembers.map((member) => {
                const isResponsible = responsibleMembers.some(resp => resp.id === member.id);
                return (
                  <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    isResponsible 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}>
                <div className="flex-1">
                      <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900">{member.name}</div>
                        {isResponsible && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Sorumlu
                          </span>
                        )}
                      </div>
                  <div className="text-sm text-gray-500">{member.position} - {member.region}</div>
                </div>
                
                    <div className="flex items-center">
                  {/* Attendance Checkbox */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={attendance[member.id] === true}
                      onChange={(e) => handleAttendanceChange(member.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Katıldı</span>
                  </label>
                </div>
              </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
        >
          Etkinlik Oluştur
        </button>
      </div>
    </form>
  );
};

export default CreateEventForm;
