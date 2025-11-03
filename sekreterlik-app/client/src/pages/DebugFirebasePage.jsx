import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import FirebaseService from '../services/FirebaseService';
import FirebaseApiService from '../utils/FirebaseApiService';

function DebugFirebasePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      addLog(user ? `✅ Kullanıcı giriş yapmış: ${user.uid}` : '❌ Kullanıcı giriş yapmamış');
    });

    return () => unsubscribe();
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testRead = async () => {
    setLoading(true);
    setTestResult(null);
    addLog('📖 Firestore okuma testi başlatılıyor...');

    try {
      const members = await FirebaseService.getAll('members');
      addLog(`✅ Okuma başarılı! ${members.length} üye bulundu.`);
      setTestResult({ success: true, message: `Okuma başarılı! ${members.length} üye bulundu.` });
    } catch (error) {
      addLog(`❌ Okuma hatası: ${error.message}`);
      setTestResult({ success: false, message: error.message, error });
    } finally {
      setLoading(false);
    }
  };

  const testWrite = async () => {
    setLoading(true);
    setTestResult(null);
    addLog('✍️ Firestore yazma testi başlatılıyor...');

    try {
      const testData = {
        name: `Test Üye ${Date.now()}`,
        tc: `1234567890${Date.now()}`,
        phone: '05000000000',
        position: 'Test Pozisyon',
        region: 'Test Bölge',
        test: true,
        createdAt: new Date().toISOString()
      };

      // Test dokümanı oluştur
      const docId = await FirebaseService.create('members', null, testData);
      addLog(`✅ Yazma başarılı! Doküman ID: ${docId}`);
      setTestResult({ success: true, message: `Yazma başarılı! Doküman ID: ${docId}` });

      // Test dokümanını sil (temizlik)
      setTimeout(async () => {
        try {
          await FirebaseService.delete('members', docId);
          addLog(`🧹 Test dokümanı silindi: ${docId}`);
        } catch (error) {
          addLog(`⚠️ Test dokümanı silinemedi: ${error.message}`);
        }
      }, 2000);
    } catch (error) {
      addLog(`❌ Yazma hatası: ${error.message}`);
      addLog(`❌ Hata detayı: ${JSON.stringify(error)}`);
      setTestResult({ success: false, message: error.message, error });
    } finally {
      setLoading(false);
    }
  };

  const testCreateMember = async () => {
    setLoading(true);
    setTestResult(null);
    addLog('👤 Üye ekleme testi başlatılıyor...');

    try {
      const memberData = {
        tc: `123456789${Date.now()}`,
        name: `Test Üye ${Date.now()}`,
        phone: '05000000000',
        position: 'Test Pozisyon',
        region: 'Test Bölge'
      };

      const result = await FirebaseApiService.createMember(memberData);
      addLog(`✅ Üye ekleme başarılı! Üye ID: ${result.id || result}`);
      setTestResult({ success: true, message: `Üye ekleme başarılı! Üye ID: ${result.id || result}` });
    } catch (error) {
      addLog(`❌ Üye ekleme hatası: ${error.message}`);
      addLog(`❌ Hata detayı: ${JSON.stringify(error, null, 2)}`);
      setTestResult({ success: false, message: error.message, error });
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Firebase Debug & Test Sayfası</h1>

        {/* Authentication Durumu */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Authentication Durumu</h2>
          {currentUser ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ Giriş Yapılmış</p>
              <p><strong>UID:</strong> {currentUser.uid}</p>
              <p><strong>Email:</strong> {currentUser.email || 'Email yok'}</p>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Giriş Yapılmamış</p>
              <p className="text-sm text-gray-600 mt-2">
                Lütfen önce giriş yapın: <a href="/login" className="text-blue-600 underline">Giriş Sayfası</a>
              </p>
            </div>
          )}
        </div>

        {/* Test Butonları */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Firebase Test İşlemleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testRead}
              disabled={loading || !currentUser}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📖 Okuma Testi
            </button>
            <button
              onClick={testWrite}
              disabled={loading || !currentUser}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✍️ Yazma Testi
            </button>
            <button
              onClick={testCreateMember}
              disabled={loading || !currentUser}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              👤 Üye Ekleme Testi
            </button>
          </div>
        </div>

        {/* Test Sonucu */}
        {testResult && (
          <div className={`rounded-lg shadow-md p-6 mb-6 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? '✅ Test Başarılı' : '❌ Test Başarısız'}
            </h2>
            <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              {testResult.message}
            </p>
            {testResult.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">Hata Detayları</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Loglar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📋 Test Logları</h2>
            <button
              onClick={clearLogs}
              className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded"
            >
              Temizle
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Henüz log yok...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Firebase Console Linkleri */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Firebase Console Linkleri</h2>
          <div className="space-y-2">
            <a
              href="https://console.firebase.google.com/project/ilsekreterliki/firestore/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              🔒 Firestore Rules (Security Rules)
            </a>
            <a
              href="https://console.firebase.google.com/project/ilsekreterliki/firestore/data"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              📊 Firestore Database (Veriler)
            </a>
            <a
              href="https://console.firebase.google.com/project/ilsekreterliki/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              👥 Authentication Users
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugFirebasePage;
