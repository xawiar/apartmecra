/**
 * OpenAI ChatGPT API Service
 * ChatGPT API ile chat completions için
 */

import GroqService from './GroqService';

class ChatGPTService {
  static API_URL = 'https://api.openai.com/v1/chat/completions';
  
  /**
   * ChatGPT API ile chat completion
   * @param {string} userMessage - Kullanıcı mesajı
   * @param {Array} context - Site verileri ve tüzük bilgileri context'i
   * @param {Array} conversationHistory - Konuşma geçmişi
   * @returns {Promise<string>} AI yanıtı
   */
  static async chat(userMessage, context = [], conversationHistory = []) {
    try {
      // Önce Firebase'den API key'i al, yoksa environment variable'dan al
      let apiKey = null;
      
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      if (USE_FIREBASE) {
        try {
          const FirebaseService = (await import('../services/FirebaseService')).default;
          const configDoc = await FirebaseService.getById('chatgpt_api_config', 'main');
          if (configDoc && configDoc.api_key) {
            // API key şifrelenmiş olabilir, decrypt et
            if (configDoc.api_key.startsWith('U2FsdGVkX1')) {
              const { decryptData } = await import('../utils/crypto');
              apiKey = decryptData(configDoc.api_key);
            } else {
              apiKey = configDoc.api_key;
            }
          }
        } catch (error) {
          console.warn('Firebase\'den ChatGPT API key alınamadı, environment variable kullanılıyor:', error);
        }
      }
      
      // Eğer Firebase'de yoksa, environment variable'dan al
      if (!apiKey) {
        apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      }
      
      if (!apiKey) {
        throw new Error('ChatGPT API key bulunamadı. Lütfen Ayarlar > Chatbot API sayfasından API anahtarını girin veya VITE_OPENAI_API_KEY environment variable\'ını ayarlayın.');
      }

      // Context'i token limitine göre kısalt (ChatGPT için daha yüksek limit var)
      const MAX_CONTEXT_LENGTH = 100000; // ChatGPT için daha yüksek limit
      let contextText = context.length > 0 ? context.join('\n') : 'Henüz context bilgisi yok.';
      
      // Eğer context çok büyükse, kısalt
      if (contextText.length > MAX_CONTEXT_LENGTH) {
        contextText = contextText.substring(0, MAX_CONTEXT_LENGTH) + '\n\n[Context kısaltıldı - token limiti nedeniyle]';
        console.warn('Context çok büyük, kısaltıldı:', contextText.length, 'karakter');
      }

      // System prompt - AI'nın kimliği ve sınırları
      const systemPrompt = `Sen "Yeniden Refah Partisi Elazığ Merkez İlçe Sekreteri" adlı bir yapay zeka asistanısın. Görevin site içi bilgileri ve yüklenen siyasi parti tüzüğünü kullanarak kullanıcılara yardımcı olmaktır.

KURALLAR:
1. SADECE verilen bilgileri (context) kullanarak cevap ver
2. Site içi bilgiler (üyeler, etkinlikler, toplantılar, bölgeler vb.), site işlevleri ve tüzük bilgileri dışında bilgi verme
3. Eğer sorulan bilgi context'te yoksa, "Bu bilgiyi bulamadım. Lütfen site içi bilgiler, site işlevleri veya tüzük ile ilgili sorular sorun." de
4. Eğer tüzük için web linki verilmişse, kullanıcıya tüzük hakkında sorular sorduğunda bu linki paylaşabilirsin: "Parti tüzüğü hakkında detaylı bilgi için şu linki ziyaret edebilirsiniz: [link]"
5. Hassas bilgileri (TC, telefon, adres vb.) sadece yetkili kullanıcılar sorduğunda paylaş
6. Türkçe yanıt ver, samimi ve yardımcı ol
7. Yanıtlarını kısa ve öz tut, gereksiz detay verme
8. Sayısal sorular için (kaç üye var, kaç etkinlik yapıldı vb.) context'teki verileri kullanarak hesapla
9. Site işlevleri hakkında sorular sorulduğunda (örnek: "sandık nasıl eklenir", "toplantı nasıl oluşturulur"), context'teki "SİTE İŞLEVLERİ VE KULLANIM KILAVUZU" bölümündeki bilgileri kullanarak adım adım açıkla
10. Kullanıcılar site işlevlerini nasıl kullanacaklarını sorduğunda, hangi sayfaya gitmeleri gerektiğini, hangi butona tıklamaları gerektiğini ve hangi bilgileri girmeleri gerektiğini detaylıca anlat

CONTEXT BİLGİLERİ:
${contextText}`;

      // Konuşma geçmişini formatla
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Daha ucuz ve hızlı model
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ChatGPT API hatası: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('ChatGPT API yanıt formatı beklenmedik');
      }
    } catch (error) {
      console.error('ChatGPT API error:', error);
      throw error;
    }
  }

  /**
   * Site verilerini context'e çevir (GroqService'ten alınan metod)
   */
  static buildSiteContext(siteData) {
    // GroqService'ten buildSiteContext metodunu kullan
    return GroqService.buildSiteContext(siteData);
  }

  /**
   * Üye bilgilerini context'e ekle (GroqService'ten alınan metod)
   */
  static buildMemberContext(members, searchTerm, siteData) {
    // GroqService'ten buildMemberContext metodunu kullan
    return GroqService.buildMemberContext(members, searchTerm, siteData);
  }
}

export default ChatGPTService;

