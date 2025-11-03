import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const RegionsSettings = () => {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState('');
  const [editingRegion, setEditingRegion] = useState(null);
  const [editRegionName, setEditRegionName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const regionsData = await ApiService.getRegions();
      setRegions(regionsData);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegion = async () => {
    if (newRegion.trim() !== '') {
      try {
        const regionData = { name: newRegion.trim() };
        const newRegionData = await ApiService.createRegion(regionData);
        
        // createRegion artık tam region objesi döndürüyor (id ve name ile)
        // ID'yi string'e çevir ve formatı garantile
        const regionToAdd = newRegionData && newRegionData.id && newRegionData.name
          ? { ...newRegionData, id: String(newRegionData.id) }
          : { id: String(newRegionData?.id || Date.now()), name: newRegion.trim() };
        
        console.log('Region created:', regionToAdd);
        
        // Optimistic update: add to UI immediately
        setRegions([...regions, regionToAdd]);
        setNewRegion('');
        
        // Fetch fresh data to ensure consistency (biraz bekle)
        setTimeout(async () => {
          await fetchRegions();
        }, 200);
      } catch (error) {
        console.error('Error adding region:', error);
        alert(error.message || 'Bölge eklenirken hata oluştu');
        // Refresh list on error
        await fetchRegions();
      }
    }
  };

  const handleDeleteRegion = async (id) => {
    console.log('🗑️ handleDeleteRegion CALLED with id:', {
      id: id,
      idType: typeof id,
      idValue: id,
      idString: String(id || ''),
      idIsNull: id === null,
      idIsUndefined: id === undefined
    });
    
    if (window.confirm('Bu bölgeyi silmek istediğinize emin misiniz?')) {
      // Store original state for rollback
      const originalRegions = [...regions];
      
      try {
        // ID'yi güvenli şekilde string'e çevir
        let stringId;
        
        if (id === null || id === undefined) {
          console.error('❌ Region ID null veya undefined!', id);
          throw new Error('Region ID bulunamadı (null veya undefined)');
        }
        
        console.log('🔍 Converting ID to string, current type:', typeof id);
        
        if (typeof id === 'object') {
          console.log('⚠️ ID is object, extracting...', id);
          // Eğer ID bir object ise
          if (id.id) {
            stringId = String(id.id);
          } else if (id.toString && typeof id.toString === 'function') {
            stringId = String(id.toString());
          } else {
            console.error('❌ ID object ama id property yok!', id);
            throw new Error(`Region ID geçersiz format: ${JSON.stringify(id)}`);
          }
        } else if (typeof id === 'number') {
          stringId = String(id);
        } else {
          stringId = String(id);
        }
        
        console.log('🔍 ID converted to string:', {
          originalId: id,
          stringId: stringId,
          stringIdType: typeof stringId,
          stringIdLength: stringId?.length
        });
        
        // Boş string kontrolü
        if (!stringId || stringId.trim() === '' || stringId === 'undefined' || stringId === 'null' || stringId === '[object Object]') {
          console.error('❌ String ID geçersiz!', {
            stringId: stringId,
            originalId: id,
            originalType: typeof id
          });
          throw new Error(`Region ID geçersiz: ${id} (stringId: ${stringId})`);
        }
        
        stringId = stringId.trim();
        
        console.log('🗑️ FINAL - Deleting region:', {
          originalId: id,
          originalIdType: typeof id,
          stringId: stringId,
          stringIdType: typeof stringId,
          stringIdLength: stringId.length,
          callingApiService: true
        });
        
        // Optimistic update: remove from UI immediately
        setRegions(regions.filter(r => {
          const rId = String(r.id || '').trim();
          return rId !== stringId;
        }));
        
        console.log('📞 Calling ApiService.deleteRegion with:', stringId);
        await ApiService.deleteRegion(stringId);
        console.log('✅ ApiService.deleteRegion completed successfully');
        
        // Fetch fresh data to ensure consistency
        await fetchRegions();
      } catch (error) {
        console.error('❌ Error deleting region:', error);
        console.error('❌ Delete region details:', {
          id: id,
          idType: typeof id,
          idValue: id,
          idString: String(id || ''),
          errorMessage: error.message,
          errorCode: error.code,
          errorStack: error.stack?.substring(0, 500)
        });
        // Revert on error
        setRegions(originalRegions);
        // Fetch fresh data
        await fetchRegions();
        alert(error.message || 'Bölge silinirken hata oluştu');
      }
    }
  };

  const handleEditRegion = (region) => {
    // ID'yi string'e çevir
    const regionId = String(region.id || '');
    setEditingRegion(regionId);
    setEditRegionName(region.name);
  };

  const handleUpdateRegion = async () => {
    if (editRegionName.trim() !== '') {
      // Store original state for rollback
      const originalRegions = [...regions];
      const oldRegion = regions.find(r => r.id === editingRegion);
      
      try {
        // Optimistic update: update in UI immediately
        setRegions(regions.map(r => 
          r.id === editingRegion ? { ...r, name: editRegionName } : r
        ));
        
        const updatedRegion = await ApiService.updateRegion(editingRegion, { name: editRegionName });
        setEditingRegion(null);
        setEditRegionName('');
        
        // Fetch fresh data to ensure consistency
        await fetchRegions();
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('regionUpdated', { 
          detail: { 
            oldName: oldRegion?.name,
            newName: editRegionName 
          } 
        }));
        
        alert('Bölge başarıyla güncellendi ve tüm üyeler güncellendi');
      } catch (error) {
        console.error('Error updating region:', error);
        // Revert on error
        setRegions(originalRegions);
        // Fetch fresh data
        await fetchRegions();
        alert(error.message || 'Bölge güncellenirken hata oluştu');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRegion(null);
    setEditRegionName('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Bölgeler</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={newRegion}
          onChange={(e) => setNewRegion(e.target.value)}
          placeholder="Yeni bölge adı"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
        />
        <button
          onClick={handleAddRegion}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2 rounded-r-lg text-sm font-medium shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ekle
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <ul className="divide-y divide-gray-200">
          {regions.map((region) => (
            <li key={region.id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition duration-150">
              {editingRegion === region.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editRegionName}
                    onChange={(e) => setEditRegionName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateRegion}
                    className="text-green-600 hover:text-green-900 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition duration-200"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-1 rounded hover:bg-gray-50 transition duration-200"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-700">{region.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRegion(region)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition duration-200"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Region objesinin tam yapısını logla
                        const debugInfo = {
                          region: region,
                          regionId: region.id,
                          regionIdType: typeof region.id,
                          regionIdValue: region.id,
                          regionIdString: String(region.id || ''),
                          regionKeys: Object.keys(region || {}),
                          regionStringified: JSON.stringify(region || {}, null, 2),
                          regionIdIsNull: region.id === null,
                          regionIdIsUndefined: region.id === undefined,
                          regionIdIsString: typeof region.id === 'string',
                          regionIdIsNumber: typeof region.id === 'number',
                          regionIdIsObject: typeof region.id === 'object'
                        };
                        
                        console.log('🔴 DELETE BUTTON CLICKED - FULL DEBUG:', debugInfo);
                        
                        // ID'yi manuel olarak string'e çevir
                        let safeId;
                        if (!region || !region.id) {
                          console.error('❌ Region veya region.id yok!', region);
                          alert('Region ID bulunamadı! Console loglarına bakın.');
                          return;
                        }
                        
                        if (typeof region.id === 'object') {
                          if (region.id.id) {
                            safeId = String(region.id.id);
                          } else {
                            console.error('❌ Region.id object ama id property yok!', region.id);
                            safeId = String(region.id);
                          }
                        } else {
                          safeId = String(region.id);
                        }
                        
                        console.log('🔴 Calling handleDeleteRegion with safeId:', {
                          originalId: region.id,
                          safeId: safeId,
                          safeIdType: typeof safeId,
                          safeIdLength: safeId.length
                        });
                        
                        handleDeleteRegion(safeId);
                      }}
                      className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition duration-200"
                    >
                      Sil
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {regions.length === 0 && (
            <li className="px-4 py-3 text-gray-500 text-center italic">
              Henüz bölge eklenmemiş
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RegionsSettings;