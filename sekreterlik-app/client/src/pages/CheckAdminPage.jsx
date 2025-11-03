import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import FirebaseService from '../services/FirebaseService';

function CheckAdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminDoc, setAdminDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Firestore'dan admin dokümanını kontrol et
        try {
          const adminRef = doc(db, 'admin', 'main');
          const adminSnap = await getDoc(adminRef);
          
          if (adminSnap.exists()) {
            setAdminDoc(adminSnap.data());
          } else {
            setAdminDoc(null);
          }
        } catch (error) {
          console.error('Error checking admin doc:', error);
          setAdminDoc(null);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fixAdminDoc = async () => {
    if (!currentUser) {
      setAction({ type: 'error', message: 'Kullanıcı giriş yapmamış' });
      return;
    }

    setLoading(true);
    try {
      const adminData = {
        username: 'admin',
        email: currentUser.email || 'admin@ilsekreterlik.local',
        uid: currentUser.uid,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await FirebaseService.create('admin', 'main', adminData, false);
      
      setAction({ 
        type: 'success', 
        message: '✅ Admin dokümanı başarıyla oluşturuldu/güncellendi!' 
      });
      
      // Tekrar kontrol et
      const adminRef = doc(db, 'admin', 'main');
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        setAdminDoc(adminSnap.data());
      }
    } catch (error) {
      console.error('Error fixing admin doc:', error);
      setAction({ 
        type: 'error', 
        message: `❌ Hata: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔍 Firebase Admin Durumu Kontrol
        </h1>

        {/* Current User Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="font-bold text-lg mb-2">Firebase Authentication:</h2>
          {currentUser ? (
            <div className="space-y-1 font-mono text-sm">
              <div><strong>UID:</strong> {currentUser.uid}</div>
              <div><strong>Email:</strong> {currentUser.email || 'N/A'}</div>
              <div><strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <p className="text-red-600">❌ Kullanıcı giriş yapmamış</p>
          )}
        </div>

        {/* Admin Doc Info */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h2 className="font-bold text-lg mb-2">Firestore Admin Dokümanı:</h2>
          {adminDoc ? (
            <div className="space-y-1 font-mono text-sm">
              <div><strong>Username:</strong> {adminDoc.username || 'N/A'}</div>
              <div><strong>Email:</strong> {adminDoc.email || 'N/A'}</div>
              <div><strong>UID:</strong> {adminDoc.uid || 'N/A'}</div>
              <div><strong>Role:</strong> {adminDoc.role || 'N/A'}</div>
              {adminDoc.createdAt && <div><strong>Created:</strong> {new Date(adminDoc.createdAt).toLocaleString()}</div>}
            </div>
          ) : (
            <p className="text-red-600">❌ Admin dokümanı bulunamadı</p>
          )}
        </div>

        {/* UID Match Check */}
        {currentUser && adminDoc && (
          <div className={`mb-6 p-4 rounded-lg border ${
            currentUser.uid === adminDoc.uid 
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <h2 className="font-bold text-lg mb-2">UID Eşleşme:</h2>
            {currentUser.uid === adminDoc.uid ? (
              <p className="text-green-700">✅ UID'ler eşleşiyor</p>
            ) : (
              <p className="text-yellow-700">
                ⚠️ UID'ler eşleşmiyor:
                <br />Auth UID: {currentUser.uid}
                <br />Firestore UID: {adminDoc.uid}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {currentUser && (!adminDoc || currentUser.uid !== adminDoc.uid) && (
          <button
            onClick={fixAdminDoc}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor...' : 'Admin Dokümanını Oluştur/Güncelle'}
          </button>
        )}

        {/* Action Result */}
        {action && (
          <div className={`mt-6 p-4 rounded-lg ${
            action.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <p className="font-medium">{action.message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">📋 Talimatlar:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Eğer admin dokümanı yoksa veya UID eşleşmiyorsa yukarıdaki butona tıklayın</li>
            <li>Admin dokümanı oluşturulduktan sonra login sayfasına geri dönün</li>
            <li>Username: <strong>admin</strong>, Password: <strong>admin123</strong> ile giriş yapmayı deneyin</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CheckAdminPage;

