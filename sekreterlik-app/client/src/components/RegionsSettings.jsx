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
        // Eğer hala success objesi dönerse, regionData'dan oluştur
        const regionToAdd = newRegionData.id && newRegionData.name 
          ? newRegionData 
          : { id: newRegionData.id || Date.now().toString(), name: newRegion.trim() };
        
        // Optimistic update: add to UI immediately
        setRegions([...regions, regionToAdd]);
        setNewRegion('');
        
        // Fetch fresh data to ensure consistency
        await fetchRegions();
      } catch (error) {
        console.error('Error adding region:', error);
        alert(error.message || 'Bölge eklenirken hata oluştu');
        // Refresh list on error
        await fetchRegions();
      }
    }
  };

  const handleDeleteRegion = async (id) => {
    if (window.confirm('Bu bölgeyi silmek istediğinize emin misiniz?')) {
      // Store original state for rollback
      const originalRegions = [...regions];
      
      try {
        // Optimistic update: remove from UI immediately
        setRegions(regions.filter(r => r.id !== id));
        
        await ApiService.deleteRegion(id);
        
        // Fetch fresh data to ensure consistency
        await fetchRegions();
      } catch (error) {
        console.error('Error deleting region:', error);
        // Revert on error
        setRegions(originalRegions);
        // Fetch fresh data
        await fetchRegions();
        alert(error.message || 'Bölge silinirken hata oluştu');
      }
    }
  };

  const handleEditRegion = (region) => {
    setEditingRegion(region.id);
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
                      onClick={() => handleDeleteRegion(region.id)}
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