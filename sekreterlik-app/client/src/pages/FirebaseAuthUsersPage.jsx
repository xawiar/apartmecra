import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import ApiService from '../utils/ApiService';
import FirebaseService from '../services/FirebaseService';

const FirebaseAuthUsersPage = () => {
  const [authUsers, setAuthUsers] = useState([]);
  const [memberUsers, setMemberUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuthUsers();
  }, []);

  const fetchAuthUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Firestore'daki member_users'ları al
      const memberUsersData = await FirebaseService.getAll('member_users');
      setMemberUsers(memberUsersData || []);

      // Firebase Auth'daki kullanıcıları almak için Admin SDK gerekir
      // Client-side'da bu mümkün değil, bu yüzden Firestore'daki authUid'leri kontrol ediyoruz
      // Admin kullanıcısını al
      const adminDoc = await FirebaseService.getById('admin', 'main');
      const adminUid = adminDoc?.uid || null;

      // Firestore'daki authUid'leri topla (admin hariç)
      const authUids = [];
      if (memberUsersData && memberUsersData.length > 0) {
        memberUsersData.forEach(memberUser => {
          if (memberUser.authUid && memberUser.authUid !== adminUid) {
            authUids.push({
              authUid: memberUser.authUid,
              username: memberUser.username,
              memberId: memberUser.memberId,
              isActive: memberUser.isActive
            });
          }
        });
      }

      setAuthUsers(authUids);
    } catch (err) {
      console.error('Error fetching auth users:', err);
      setError('Kullanıcılar alınırken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberInfo = (memberId) => {
    // Member bilgisini bulmak için member_users'dan memberId'ye bakabiliriz
    // Ama member zaten silinmiş olabilir, bu yüzden sadece memberId gösteriyoruz
    return memberId || 'Bilinmeyen';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Firebase Auth Kullanıcıları</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Firestore'daki authUid'lere göre Firebase Auth'daki kullanıcılar (Admin hariç)
              </p>
            </div>
            <button
              onClick={fetchAuthUsers}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Yenile
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Firebase Auth Kullanıcıları ({authUsers.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Not: Client-side'dan Firebase Auth'daki kullanıcıları direkt listeleyemeyiz. 
              Bu liste Firestore'daki authUid'lere göre oluşturulmuştur.
              Firebase Console'dan tüm kullanıcıları görebilirsiniz.
            </p>
          </div>

          {authUsers.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Firebase Auth'da kullanıcı bulunamadı (admin hariç).
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Tüm üyeler silinmiş olabilir veya Firebase Auth'da kullanıcı oluşturulmamış olabilir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Auth UID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Member ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {authUsers.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                        {user.authUid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.username || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.memberId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ Önemli Not:
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>Bu liste Firestore'daki authUid'lere göre oluşturulmuştur.</li>
            <li>Firebase Auth'daki gerçek kullanıcı sayısını görmek için Firebase Console'a bakmanız gerekir.</li>
            <li>Firestore'da authUid olmayan ama Firebase Auth'da olan kullanıcılar bu listede görünmez.</li>
            <li>Firebase Auth'dan kullanıcı silmek için backend/Cloud Functions gerekir.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuthUsersPage;

