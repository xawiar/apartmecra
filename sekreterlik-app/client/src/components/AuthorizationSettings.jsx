import React, { useEffect, useState } from 'react';
import ApiService from '../utils/ApiService';

// Çoklu yetkilendirme seçenekleri
const AVAILABLE_PERMISSIONS = [
  { key: 'add_member', label: 'Üye Ekleme' },
  { key: 'create_meeting', label: 'Toplantı Oluşturma' },
  { key: 'create_event', label: 'Etkinlik Oluşturma' },
  { key: 'add_stk', label: 'STK Ekleme' },
  { key: 'access_ballot_boxes', label: 'Sandıklar Sayfası Erişimi' },
  { key: 'add_ballot_box', label: 'Sandık Ekleme' },
  { key: 'access_observers', label: 'Müşahitler Sayfası Erişimi' },
  { key: 'add_observer', label: 'Müşahit Ekleme' },
  // Yeni erişim izinleri
  { key: 'access_members_page', label: 'Üyeler Sayfası Erişimi' },
  { key: 'access_meetings_page', label: 'Toplantılar Sayfası Erişimi' },
  { key: 'access_calendar_page', label: 'Takvim Sayfası Erişimi' },
  { key: 'access_districts_page', label: 'İlçeler Sayfası Erişimi' },
];

const AuthorizationSettings = () => {
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positionPermissions, setPositionPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await ApiService.getAllPermissions();
        setPositionPermissions(all || {});
      } catch (_) {}
      try {
        const pos = await ApiService.getPositions();
        setPositions(Array.isArray(pos) ? pos : []);
      } catch (_) {}
    })();
  }, []);

  const permissionsForSelected = positionPermissions[selectedPosition] || [];

  const togglePermission = (perm) => {
    const current = new Set(permissionsForSelected);
    if (current.has(perm)) current.delete(perm); else current.add(perm);
    setPositionPermissions(prev => ({ ...prev, [selectedPosition]: Array.from(current) }));
  };

  const handleSave = async () => {
    if (!selectedPosition) return;
    setLoading(true);
    try {
      await ApiService.setPermissionsForPosition(selectedPosition, positionPermissions[selectedPosition] || []);
      alert('Yetkiler kaydedildi');
      // Kaydedilen kısmı kaldır ve sayfayı yenile
      setSelectedPosition('');
      try {
        const all = await ApiService.getAllPermissions();
        setPositionPermissions(all || {});
      } catch (_) {}
      // Tam istek: sayfayı yenile
      window.location.reload();
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermissions = async (posName) => {
    if (!window.confirm(`"${posName}" görevinin tüm yetkilerini silmek istediğinize emin misiniz?`)) {
      return;
    }
    setLoading(true);
    try {
      // Boş array göndererek tüm yetkileri siliyoruz
      await ApiService.setPermissionsForPosition(posName, []);
      alert('Yetkiler başarıyla silindi');
      // Listeyi yenile
      try {
        const all = await ApiService.getAllPermissions();
        setPositionPermissions(all || {});
      } catch (_) {}
      // Sayfayı yenile
      window.location.reload();
    } catch (e) {
      alert('Hata: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mevcut Yetkilendirmeler Özeti */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Mevcut Yetkilendirmeler</h3>
          <p className="text-sm text-gray-500 mt-1">Görevlerin sahip olduğu yetkileri burada görürsünüz.</p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görev</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yetkiler</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Object.keys(positionPermissions).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm text-gray-500">Kayıtlı yetkilendirme yok.</td>
                </tr>
              )}
              {Object.entries(positionPermissions).map(([posName, perms]) => (
                <tr key={posName}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{posName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(perms || []).length === 0 ? (
                      <span className="text-gray-400">Yetki yok</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(perms || []).map(k => {
                          const label = (AVAILABLE_PERMISSIONS.find(ap => ap.key === k)?.label) || k;
                          return (
                            <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDeletePermissions(posName)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition duration-200"
                      title="Tüm yetkileri sil"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Görev Seç</label>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Görev seçin</option>
          {positions.map(p => (
            <option key={p.id || p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedPosition && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Yetkiler</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_PERMISSIONS.map(ap => (
              <label key={ap.key} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={permissionsForSelected.includes(ap.key)}
                  onChange={() => togglePermission(ap.key)}
                />
                <span className="text-sm text-gray-700">{ap.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorizationSettings;


