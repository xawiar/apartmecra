import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApiService from '../utils/ApiService';

const TownDetailsPage = () => {
  const { id } = useParams();
  const [town, setTown] = useState(null);
  const [district, setDistrict] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [deputyInspectors, setDeputyInspectors] = useState([]);
  const [managementMembers, setManagementMembers] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [stks, setStks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchTownDetails();
    }
  }, [id]);

  const fetchTownDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch town - ID'leri string'e çevirerek karşılaştır (Firebase uyumluluğu için)
      const towns = await ApiService.getTowns();
      const townData = towns.find(t => String(t.id) === String(id));
      setTown(townData);

      if (townData) {
        // Fetch district - ID'leri string'e çevirerek karşılaştır (sadece isim için)
        const districts = await ApiService.getDistricts();
        const districtData = districts.find(d => String(d.id) === String(townData.district_id));
        setDistrict(districtData);

        // Fetch officials - ID'leri string'e çevirerek karşılaştır
        const officialsData = await ApiService.getTownOfficials();
        const townOfficials = officialsData.filter(official => String(official.town_id) === String(id));
        setOfficials(townOfficials);

        // Fetch deputy inspectors - ID'leri string'e çevirerek karşılaştır
        const deputyInspectorsData = await ApiService.getAllTownDeputyInspectors();
        const townDeputyInspectors = deputyInspectorsData.filter(deputy => String(deputy.town_id) === String(id));
        setDeputyInspectors(townDeputyInspectors);

        // Fetch management members - ID'leri string'e çevirerek karşılaştır
        try {
          const managementMembersData = await ApiService.getTownManagementMembers(id);
          setManagementMembers(managementMembersData || []);
        } catch (error) {
          console.error('Error fetching management members:', error);
          setManagementMembers([]);
        }

        // Fetch neighborhoods in this town - ID'leri string'e çevirerek karşılaştır
        try {
          const neighborhoodsData = await ApiService.getNeighborhoods();
          const townNeighborhoods = neighborhoodsData.filter(n => n.town_id && String(n.town_id) === String(id));
          setNeighborhoods(townNeighborhoods);
        } catch (error) {
          console.error('Error fetching neighborhoods:', error);
          setNeighborhoods([]);
        }

        // Fetch villages in this town - ID'leri string'e çevirerek karşılaştır
        try {
          const villagesData = await ApiService.getVillages();
          const townVillages = villagesData.filter(v => v.town_id && String(v.town_id) === String(id));
          setVillages(townVillages);
        } catch (error) {
          console.error('Error fetching villages:', error);
          setVillages([]);
        }

        // Fetch mosques in this town - ID'leri string'e çevirerek karşılaştır
        try {
          const mosquesData = await ApiService.getMosques();
          const townMosques = mosquesData.filter(m => m.town_id && String(m.town_id) === String(id));
          setMosques(townMosques);
        } catch (error) {
          console.error('Error fetching mosques:', error);
          setMosques([]);
        }

        // Fetch STKs (all STKs, as they might be related to the town)
        try {
          const stksData = await ApiService.getSTKs();
          setStks(stksData || []);
        } catch (error) {
          console.error('Error fetching STKs:', error);
          setStks([]);
        }
      }

    } catch (error) {
      console.error('Error fetching town details:', error);
      setError('Belde detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!town) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Belde bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{town.name} Detayları</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {district?.name} ilçesine bağlı belde bilgileri
          </p>
        </div>
      </div>

      {/* Belde Yönetimi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Belde Yönetimi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Belde Başkanı ve Müfettiş */}
          <div className="space-y-4">
            {officials.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Henüz yönetim atanmamış</p>
            ) : (
              <div className="space-y-3">
                {officials.map((official) => (
                  <div key={official.id} className="space-y-3">
                    {official.chairman_name && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Belde Başkanı</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Ad:</strong> {official.chairman_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Telefon:</strong> {official.chairman_phone || '-'}</p>
                        </div>
                      </div>
                    )}
                    
                    {official.inspector_name && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Belde Müfettişi</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Ad:</strong> {official.inspector_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Telefon:</strong> {official.inspector_phone || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Müfettiş Yardımcıları */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Müfettiş Yardımcıları</h4>
            {deputyInspectors.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Henüz müfettiş yardımcısı atanmamış</p>
            ) : (
              <div className="space-y-3">
                {deputyInspectors.map((deputy) => (
                  <div key={deputy.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Ad:</strong> {deputy.member_name || deputy.name || '-'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Telefon:</strong> {deputy.member_phone || deputy.phone || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yönetim Kurulu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Yönetim Kurulu</h3>
        
        {managementMembers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Henüz yönetim kurulu üyesi eklenmemiş</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Görev</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bölge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {managementMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.tc}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.position || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.region || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bu Beldede Bulunan Mahalleler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bu Beldede Bulunan Mahalleler</h3>
        
        {neighborhoods.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Bu beldede mahalle bulunmamaktadır</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mahalle Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grup No</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {neighborhoods.map((neighborhood) => (
                  <tr key={neighborhood.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{neighborhood.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{neighborhood.group_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bu Beldede Bulunan Köyler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bu Beldede Bulunan Köyler</h3>
        
        {villages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Bu beldede köy bulunmamaktadır</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Köy Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grup No</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {villages.map((village) => (
                  <tr key={village.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{village.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{village.group_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bu Beldede Bulunan Camiler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bu Beldede Bulunan Camiler</h3>
        
        {mosques.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Bu beldede cami bulunmamaktadır</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cami Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Konum</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {mosques.map((mosque) => (
                  <tr key={mosque.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{mosque.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {mosque.neighborhood_name ? `Mahalle: ${mosque.neighborhood_name}` : mosque.village_name ? `Köy: ${mosque.village_name}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STK'lar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sivil Toplum Kuruluşları (STK)</h3>
        
        {stks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Henüz STK kaydı bulunmamaktadır</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STK Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Açıklama</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stks.map((stk) => (
                  <tr key={stk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{stk.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{stk.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* İstatistikler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Belde İstatistikleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{officials.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Yönetim</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{deputyInspectors.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Müfettiş Yardımcısı</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{managementMembers.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Yönetim Kurulu</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{neighborhoods.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Mahalle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{villages.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Köy</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TownDetailsPage;
