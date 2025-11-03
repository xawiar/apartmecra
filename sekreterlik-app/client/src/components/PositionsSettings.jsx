import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';

const PositionsSettings = () => {
  const [positions, setPositions] = useState([]);
  const [newPosition, setNewPosition] = useState('');
  const [editingPosition, setEditingPosition] = useState(null);
  const [editPositionName, setEditPositionName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const positionsData = await ApiService.getPositions();
      setPositions(positionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (newPosition.trim() !== '') {
      try {
        const positionData = { name: newPosition };
        await ApiService.createPosition(positionData);
        setNewPosition('');
        fetchPositions(); // Refresh the list
      } catch (error) {
        console.error('Error adding position:', error);
      }
    }
  };

  const handleDeletePosition = async (id) => {
    if (window.confirm('Bu pozisyonu silmek istediğinize emin misiniz?')) {
      try {
        const response = await ApiService.deletePosition(id);
        
        // Check if the response contains an error message
        if (response.message && response.message.includes('kullanılıyor')) {
          alert(response.message);
          return;
        }
        
        fetchPositions(); // Refresh the list
        alert('Pozisyon başarıyla silindi');
      } catch (error) {
        console.error('Error deleting position:', error);
        alert('Pozisyon silinirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  };

  const handleEditPosition = (position) => {
    setEditingPosition(position.id);
    setEditPositionName(position.name);
  };

  const handleUpdatePosition = async () => {
    if (editPositionName.trim() !== '') {
      try {
        await ApiService.updatePosition(editingPosition, { name: editPositionName });
        setEditingPosition(null);
        setEditPositionName('');
        fetchPositions(); // Refresh the list
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('positionUpdated', { 
          detail: { 
            oldName: positions.find(p => p.id === editingPosition)?.name,
            newName: editPositionName 
          } 
        }));
        
        alert('Görev başarıyla güncellendi ve tüm üyeler güncellendi');
      } catch (error) {
        console.error('Error updating position:', error);
        alert('Görev güncellenirken hata oluştu');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPosition(null);
    setEditPositionName('');
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
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Görevler</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={newPosition}
          onChange={(e) => setNewPosition(e.target.value)}
          placeholder="Yeni görev adı"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition duration-200"
        />
        <button
          onClick={handleAddPosition}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-4 py-2 rounded-r-lg text-sm font-medium shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ekle
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <ul className="divide-y divide-gray-200">
          {positions.map((position) => (
            <li key={position.id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition duration-150">
              {editingPosition === position.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={editPositionName}
                    onChange={(e) => setEditPositionName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdatePosition}
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
                  <span className="text-gray-700">{position.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPosition(position)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition duration-200"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeletePosition(position.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition duration-200"
                    >
                      Sil
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {positions.length === 0 && (
            <li className="px-4 py-3 text-gray-500 text-center italic">
              Henüz görev eklenmemiş
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PositionsSettings;