import React, { useState, useEffect, useRef } from 'react';
import GroqService from '../services/GroqService';
import GeminiService from '../services/GeminiService';
import ChatGPTService from '../services/ChatGPTService';
import ApiService from '../utils/ApiService';
import FirebaseService from '../services/FirebaseService';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [siteData, setSiteData] = useState(null);
  const [bylawsText, setBylawsText] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load site data on mount (lazy load - only when chatbot is opened)
  useEffect(() => {
    if (isOpen && !siteData) {
      // Load data asynchronously without blocking UI
      Promise.all([
        loadSiteData(),
        loadBylaws()
      ]).catch(error => {
        console.error('Error loading chatbot data:', error);
      });
      
      // Welcome message
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: 'Merhaba! Ben Yeniden Refah Partisi Elazığ Merkez İlçe Sekreteri. Size nasıl yardımcı olabilirim? Site içi bilgiler (üyeler, toplantılar, etkinlikler) ve tüzük hakkında sorular sorabilirsiniz.'
      }]);
    }
  }, [isOpen, siteData]);

  const loadSiteData = async () => {
    try {
      // Optimize: Load critical data first, then less critical data
      // This prevents blocking the UI for too long
      const [
        members, 
        events, 
        meetings, 
        districts, 
        towns, 
        neighborhoods, 
        villages
      ] = await Promise.all([
        ApiService.getMembers().catch(() => []),
        ApiService.getEvents().catch(() => []),
        ApiService.getMeetings().catch(() => []),
        ApiService.getDistricts().catch(() => []),
        ApiService.getTowns().catch(() => []),
        ApiService.getNeighborhoods().catch(() => []),
        ApiService.getVillages().catch(() => [])
      ]);

      // Set initial data to allow chatbot to work with basic info
      setSiteData(prev => ({
        ...prev,
        members,
        events,
        meetings,
        districts,
        towns,
        neighborhoods,
        villages
      }));

      // Load ALL additional data in background (non-blocking) - TÜM VERİLER
      Promise.all([
        // Seçim hazırlık verileri
        ApiService.getBallotBoxes().catch(() => []),
        ApiService.getBallotBoxObservers().catch(() => []),
        ApiService.getGroups().catch(() => []),
        
        // Yönetim verileri
        ApiService.getDistrictOfficials().catch(() => []),
        ApiService.getTownOfficials().catch(() => []),
        
        // Tüm yönetim üyeleri - Tüm district ve town'lar için
        Promise.all([
          ApiService.getDistricts().then(districts => 
            Promise.all(districts.map(d => 
              ApiService.getDistrictManagementMembers(d.id).catch(() => [])
            ))
          ).then(results => results.flat()).catch(() => []),
          ApiService.getTowns().then(towns => 
            Promise.all(towns.map(t => 
              ApiService.getTownManagementMembers(t.id).catch(() => [])
            ))
          ).then(results => results.flat()).catch(() => [])
        ]).then(([districtMembers, townMembers]) => ({
          districtManagementMembers: districtMembers,
          townManagementMembers: townMembers
        })).catch(() => ({ districtManagementMembers: [], townManagementMembers: [] })),
        
        // Temsilci ve sorumlu verileri
        ApiService.getNeighborhoodRepresentatives().catch(() => []),
        ApiService.getVillageRepresentatives().catch(() => []),
        ApiService.getNeighborhoodSupervisors().catch(() => []),
        ApiService.getVillageSupervisors().catch(() => []),
        ApiService.getAllDistrictDeputyInspectors().catch(() => []),
        ApiService.getAllTownDeputyInspectors().catch(() => []),
        
        // Ziyaret sayıları
        ApiService.getAllVisitCounts('neighborhood').catch(() => []),
        ApiService.getAllVisitCounts('village').catch(() => []),
        
        // Üye kayıtları
        ApiService.getMemberRegistrations().catch(() => []),
        
        // STK ve Cami verileri
        ApiService.getSTKs().catch(() => []),
        ApiService.getMosques().catch(() => []),
        
        // Etkinlik kategorileri
        ApiService.getEventCategories().catch(() => []),
        
        // Tüm kişisel belgeler - Tüm üyeler için
        ApiService.getMembers().then(members => 
          Promise.all(members.map(m => 
            ApiService.getPersonalDocuments(m.id).catch(() => [])
          ))
        ).then(results => results.flat()).catch(() => []),
        
        // Arşiv verileri
        ApiService.getDocuments().catch(() => []),
        
        // Arşivlenmiş üyeler, toplantılar, etkinlikler
        ApiService.getMembers(true).catch(() => []), // archived members
        ApiService.getMeetings(true).catch(() => []), // archived meetings
        ApiService.getEvents(true).catch(() => []) // archived events
      ]).then(([
        ballotBoxes,
        observers,
        groups,
        districtOfficials,
        townOfficials,
        managementMembersData,
        neighborhoodRepresentatives,
        villageRepresentatives,
        neighborhoodSupervisors,
        villageSupervisors,
        districtDeputyInspectors,
        townDeputyInspectors,
        neighborhoodVisitCounts,
        villageVisitCounts,
        memberRegistrations,
        stks,
        mosques,
        eventCategories,
        personalDocuments,
        archiveDocuments,
        archivedMembers,
        archivedMeetings,
        archivedEvents
      ]) => {

        // Update with ALL additional data
        setSiteData(prev => ({
          ...prev,
          ballotBoxes,
          observers,
          groups,
          districtOfficials,
          townOfficials,
          districtManagementMembers: managementMembersData?.districtManagementMembers || [],
          townManagementMembers: managementMembersData?.townManagementMembers || [],
          neighborhoodRepresentatives,
          villageRepresentatives,
          neighborhoodSupervisors,
          villageSupervisors,
          districtDeputyInspectors,
          townDeputyInspectors,
          neighborhoodVisitCounts,
          villageVisitCounts,
          memberRegistrations,
          stks,
          mosques,
          eventCategories,
          personalDocuments,
          archiveDocuments,
          archivedMembers,
          archivedMeetings,
          archivedEvents
        }));
      }).catch(error => {
        console.error('Error loading additional site data:', error);
      });
    } catch (error) {
      console.error('Error loading site data:', error);
    }
  };

  const loadBylaws = async () => {
    try {
      // Firebase'den tüzük metnini veya URL'yi yükle
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (USE_FIREBASE) {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          const bylawsRef = doc(db, 'bylaws', 'main');
          const bylawsSnap = await getDoc(bylawsRef);
          
          if (bylawsSnap.exists()) {
            const bylawsData = bylawsSnap.data();
            
            console.log('📋 Bylaws data loaded:', {
              hasText: !!bylawsData.text,
              textLength: bylawsData.text?.length || 0,
              hasUrl: !!bylawsData.url,
              url: bylawsData.url
            });
            
            // Önce text varsa onu kullan (text varsa URL'yi ignore et)
            if (bylawsData.text && bylawsData.text.trim()) {
              console.log('✅ Using bylaws text (length:', bylawsData.text.length, ')');
              setBylawsText(bylawsData.text.trim());
            }
            // Eğer text yoksa ama URL varsa, URL'den içeriği çek
            else if (bylawsData.url) {
              console.log('⚠️ No text found, trying to fetch from URL:', bylawsData.url);
              try {
                // Backend API'den URL'den içeriği çek
                const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
                let API_BASE_URL;
                
                if (USE_FIREBASE) {
                  // Render.com'da backend URL'i environment variable'dan al
                  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sekreterlik-backend.onrender.com/api';
                } else {
                  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
                }
                
                console.log('Loading bylaws from URL:', bylawsData.url, 'API:', API_BASE_URL);
                
                const response = await fetch(`${API_BASE_URL}/bylaws/fetch?url=${encodeURIComponent(bylawsData.url)}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log('Bylaws load response status:', response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Bylaws load success:', data.success, 'Text length:', data.text?.length);
                  
                  if (data.success && data.text) {
                    setBylawsText(data.text);
                  } else {
                    // Backend başarısız olursa, URL'yi kaydet
                    setBylawsText(`TÜZÜK_LINK:${bylawsData.url}`);
                  }
                } else {
                  const errorText = await response.text();
                  console.error('Bylaws load error:', response.status, errorText);
                  // Backend hatası olursa, URL'yi kaydet
                  setBylawsText(`TÜZÜK_LINK:${bylawsData.url}`);
                }
              } catch (fetchError) {
                console.error('Error fetching bylaws from URL:', fetchError);
                // Hata olursa, URL'yi kaydet
                setBylawsText(`TÜZÜK_LINK:${bylawsData.url}`);
              }
            }
          }
        } catch (error) {
          console.error('Error loading bylaws from Firebase:', error);
          // Tüzük yoksa, boş bırak
        }
      }
    } catch (error) {
      console.error('Error loading bylaws:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    setLoading(true);

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Build context from site data
      const context = [];
      
      if (siteData) {
        const siteContext = GroqService.buildSiteContext(siteData);
        context.push(...siteContext);
        
        // Check if user is asking about a specific member (with all site data for comprehensive info)
        const memberContext = GroqService.buildMemberContext(
          siteData.members, 
          userMessage,
          siteData // Tüm site verilerini gönder (meetings, representatives, supervisors, observers vb.)
        );
        context.push(...memberContext);
      }
      
      // Add bylaws text or URL if available (kısaltılmış - token limiti için)
      if (bylawsText) {
        // Tüzük metnini kısalt (token limiti için - max 10000 karakter)
        const MAX_BYLAWS_LENGTH = 10000;
        const shortenedBylaws = bylawsText.length > MAX_BYLAWS_LENGTH 
          ? bylawsText.substring(0, MAX_BYLAWS_LENGTH) + '\n\n[Tüzük metni kısaltıldı - token limiti nedeniyle]'
          : bylawsText;
        
        console.log('📋 Adding bylaws to context:', {
          textLength: bylawsText.length,
          startsWithLink: bylawsText.startsWith('TÜZÜK_LINK:'),
          preview: bylawsText.substring(0, 100)
        });
        
        // Eğer URL ise (TÜZÜK_LINK: ile başlıyorsa), tekrar çekmeyi dene
        if (bylawsText.startsWith('TÜZÜK_LINK:')) {
          console.log('⚠️ Bylaws text is a link, trying to fetch...');
          const url = bylawsText.replace('TÜZÜK_LINK:', '');
          try {
            // Backend API'den URL'den içeriği çek
            // Firebase kullanılıyorsa backend URL'i kontrol et
            const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
            let API_BASE_URL;
            
            if (USE_FIREBASE) {
              // Render.com'da backend URL'i environment variable'dan al
              API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sekreterlik-backend.onrender.com/api';
            } else {
              API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            }
            
            console.log('Fetching bylaws from URL:', url, 'API:', API_BASE_URL);
            
            const response = await fetch(`${API_BASE_URL}/bylaws/fetch?url=${encodeURIComponent(url)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Bylaws fetch response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Bylaws fetch success:', data.success, 'Text length:', data.text?.length);
              
              if (data.success && data.text) {
                // Tüzük metnini context'e ekle (ilk 15000 karakter - daha fazla context)
                const text = data.text.substring(0, 15000);
                context.push(`TÜZÜK BİLGİLERİ:\n${text}${data.text.length > 15000 ? '... (devamı var)' : ''}`);
              } else {
                // Backend başarısız olursa, URL'yi kullan
                context.push(`TÜZÜK BİLGİLERİ: Parti tüzüğü şu web linkinde bulunmaktadır: ${url}. Tüzük hakkında sorular için bu linki ziyaret edebilirsiniz.`);
              }
            } else {
              const errorText = await response.text();
              console.error('Bylaws fetch error:', response.status, errorText);
              // Backend hatası olursa, URL'yi kullan
              context.push(`TÜZÜK BİLGİLERİ: Parti tüzüğü şu web linkinde bulunmaktadır: ${url}. Tüzük hakkında sorular için bu linki ziyaret edebilirsiniz.`);
            }
          } catch (fetchError) {
            console.error('Error fetching bylaws from URL:', fetchError);
            // Hata olursa, URL'yi kullan
            context.push(`TÜZÜK BİLGİLERİ: Parti tüzüğü şu web linkinde bulunmaktadır: ${url}. Tüzük hakkında sorular için bu linki ziyaret edebilirsiniz.`);
          }
        } else {
          // Normal metin ise, tüm metni kullan (tüzük metni önemli, mümkün olduğunca fazla karakter kullan)
          console.log('✅ Using bylaws text directly (length:', bylawsText.length, ')');
          // Tüzük metni çok uzun olabilir, ama mümkün olduğunca fazla karakter kullan (max 50000 karakter)
          const maxLength = 50000;
          const textToAdd = bylawsText.length > maxLength 
            ? bylawsText.substring(0, maxLength) + '... (devamı var - tüzük metni çok uzun)' 
            : bylawsText;
          context.push(`TÜZÜK BİLGİLERİ:\n${textToAdd}`);
        }
      }
      
      // Build conversation history (last 5 messages for context)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Seçilen AI servisine göre API çağrısı yap
      let response;
      if (aiProvider === 'gemini') {
        response = await GeminiService.chat(userMessage, context, conversationHistory);
      } else if (aiProvider === 'chatgpt') {
        response = await ChatGPTService.chat(userMessage, context, conversationHistory);
      } else {
        response = await GroqService.chat(userMessage, context, conversationHistory); // Default: Groq
      }

      // Add assistant message
      const newAssistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message || 'Mesaj gönderilirken hata oluştu');
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Merhaba! Ben Yeniden Refah Partisi Elazığ Merkez İlçe Sekreteri. Size nasıl yardımcı olabilirim? Site içi bilgiler (üyeler, toplantılar, etkinlikler) ve tüzük hakkında sorular sorabilirsiniz.'
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Yeniden Refah Partisi Elazığ Merkez İlçe Sekreteri</h2>
              <p className="text-indigo-100 text-xs">Site içi bilgiler (üyeler, toplantılar, etkinlikler) ve tüzük hakkında sorular sorabilirsiniz</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Sohbeti Temizle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;

