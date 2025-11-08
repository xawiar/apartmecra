import React, { useState, useEffect } from 'react';
import FirebaseService from '../services/FirebaseService';
import { decryptData, encryptData } from '../utils/crypto';

const DeploymentConfigSettings = () => {
  const [renderApiKey, setRenderApiKey] = useState('');
  const [renderServiceId, setRenderServiceId] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const configDoc = await FirebaseService.getById('deployment_config', 'main');
          if (configDoc) {
            // Şifrelenmiş alanları decrypt et
            if (configDoc.renderApiKey && configDoc.renderApiKey.startsWith('U2FsdGVkX1')) {
              setRenderApiKey(decryptData(configDoc.renderApiKey));
            } else {
              setRenderApiKey(configDoc.renderApiKey || '');
            }
            
            if (configDoc.githubToken && configDoc.githubToken.startsWith('U2FsdGVkX1')) {
              setGithubToken(decryptData(configDoc.githubToken));
            } else {
              setGithubToken(configDoc.githubToken || '');
            }
            
            setRenderServiceId(configDoc.renderServiceId || '');
            setGithubRepo(configDoc.githubRepo || '');
          } else {
            // Environment variable'lardan yükle, yoksa mevcut yapılandırmadan
            setRenderApiKey(import.meta.env.VITE_RENDER_API_KEY || '');
            setRenderServiceId(import.meta.env.VITE_RENDER_SERVICE_ID || 'ilce-sekreterlik');
            setGithubToken(import.meta.env.VITE_GITHUB_TOKEN || '');
            setGithubRepo(import.meta.env.VITE_GITHUB_REPO || 'xawiar/ilce-sekreterlik');
          }
        } catch (error) {
          console.warn('Deployment config not found in Firestore, using environment variables:', error);
          setRenderApiKey(import.meta.env.VITE_RENDER_API_KEY || '');
          setRenderServiceId(import.meta.env.VITE_RENDER_SERVICE_ID || 'ilce-sekreterlik');
          setGithubToken(import.meta.env.VITE_GITHUB_TOKEN || '');
          setGithubRepo(import.meta.env.VITE_GITHUB_REPO || 'xawiar/ilce-sekreterlik');
        }
      } else {
        setRenderApiKey(import.meta.env.VITE_RENDER_API_KEY || '');
        setRenderServiceId(import.meta.env.VITE_RENDER_SERVICE_ID || 'ilce-sekreterlik');
        setGithubToken(import.meta.env.VITE_GITHUB_TOKEN || '');
        setGithubRepo(import.meta.env.VITE_GITHUB_REPO || 'xawiar/ilce-sekreterlik');
      }
    } catch (error) {
      console.error('Error loading deployment config:', error);
      setMessage('Yapılandırma yüklenirken hata oluştu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        // Yapılandırmayı şifreleyerek kaydet
        const encryptedRenderApiKey = renderApiKey ? encryptData(renderApiKey.trim()) : '';
        const encryptedGithubToken = githubToken ? encryptData(githubToken.trim()) : '';
        
        await FirebaseService.create('deployment_config', 'main', {
          renderApiKey: encryptedRenderApiKey,
          renderServiceId: renderServiceId.trim() || '',
          githubToken: encryptedGithubToken,
          githubRepo: githubRepo.trim() || '',
          updated_at: new Date().toISOString()
        }, false);
        
        setMessage('Yapılandırma başarıyla kaydedildi');
        setMessageType('success');
      } else {
        setMessage('Firebase kullanılmıyor. Yapılandırma environment variable olarak ayarlanmalıdır.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving deployment config:', error);
      setMessage('Yapılandırma kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Deployment Yapılandırması
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Render.com ve GitHub için yapılandırma bilgilerini girin. Bu bilgiler otomatik deploy ve entegrasyonlar için kullanılır.
        </p>
      </div>

      {/* Render.com Yapılandırması */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Render.com</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Render API Key
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={renderApiKey}
              onChange={(e) => setRenderApiKey(e.target.value)}
              placeholder="rnd_..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Render Dashboard &gt; Account Settings &gt; API Keys bölümünden alabilirsiniz
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Render Service ID
            </label>
            <input
              type="text"
              value={renderServiceId}
              onChange={(e) => setRenderServiceId(e.target.value)}
              placeholder="srv-..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Render Dashboard &gt; Service Settings &gt; Service ID bölümünden alabilirsiniz
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Yapılandırması */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">GitHub</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Personal Access Token
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              GitHub Settings &gt; Developer settings &gt; Personal access tokens bölümünden oluşturabilirsiniz
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Repository
            </label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="username/repository"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Örnek: username/repository-name
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowSecrets(!showSecrets)}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {showSecrets ? 'Gizle' : 'Göster'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button
          onClick={loadConfig}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Yenile
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Bilgi</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>API key'ler ve token'lar şifrelenmiş olarak Firebase'de saklanır</li>
          <li>Render API key'i otomatik deploy ve servis yönetimi için kullanılır</li>
          <li>GitHub token'ı repository erişimi ve otomatik deploy için kullanılır</li>
          <li>Bu bilgiler opsiyoneldir, sadece otomatik deploy özellikleri için gereklidir</li>
        </ul>
      </div>
    </div>
  );
};

export default DeploymentConfigSettings;

