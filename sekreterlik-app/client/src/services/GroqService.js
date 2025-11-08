/**
 * Groq API Service
 * Ücretsiz ve hızlı AI chat completions için Groq API kullanır
 */

class GroqService {
  static API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  /**
   * Groq API ile chat completion
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
          const configDoc = await FirebaseService.getById('groq_api_config', 'main');
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
          console.warn('Firebase\'den Groq API key alınamadı, environment variable kullanılıyor:', error);
        }
      }
      
      // Eğer Firebase'de yoksa, environment variable'dan al
      if (!apiKey) {
        apiKey = import.meta.env.VITE_GROQ_API_KEY;
      }
      
      if (!apiKey) {
        throw new Error('Groq API key bulunamadı. Lütfen Ayarlar > Chatbot API sayfasından API anahtarını girin veya VITE_GROQ_API_KEY environment variable\'ını ayarlayın.');
      }

      // Context'i token limitine göre kısalt (12000 token limiti için)
      // Her token yaklaşık 4 karakter (Türkçe için)
      // Güvenli limit: 10000 token = 40000 karakter (sistem prompt ve mesajlar için 2000 token bırakıyoruz)
      const MAX_CONTEXT_LENGTH = 35000; // ~8750 token için güvenli limit (daha küçük)
      let contextText = context.length > 0 ? context.join('\n') : 'Henüz context bilgisi yok.';
      
      // Eğer context çok büyükse, kısalt
      if (contextText.length > MAX_CONTEXT_LENGTH) {
        contextText = contextText.substring(0, MAX_CONTEXT_LENGTH) + '\n\n[Context kısaltıldı - token limiti nedeniyle]';
        console.warn('Context çok büyük, kısaltıldı:', contextText.length, 'karakter (limit:', MAX_CONTEXT_LENGTH, ')');
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
            model: 'llama-3.3-70b-versatile', // Güncel model - hızlı ve ücretsiz
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048, // Tüzük metni için daha fazla token
            stream: false
          })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error?.message || response.statusText;
        
        // 402 hatası için özel mesaj
        if (response.status === 402) {
          errorMessage = 'Groq API ücretsiz tier limiti aşıldı veya ödeme gerekiyor. Lütfen Groq Console\'dan hesabınızı kontrol edin veya başka bir AI servisi (Gemini, DeepSeek) kullanın.';
        }
        
        throw new Error(`Groq API hatası: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Groq API yanıt formatı beklenmedik');
      }
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  /**
   * Site verilerini context'e çevir (Token limiti için optimize edilmiş)
   * @param {Object} siteData - Firestore'dan çekilen site verileri
   * @returns {Array<string>} Context array'i
   */
  static buildSiteContext(siteData) {
    const context = [];
    const MAX_ITEMS_PER_SECTION = 30; // Her bölüm için maksimum öğe sayısı (token limiti için daha küçük)
    
    // ÜYE BİLGİLERİ (Özet - detaylar sadece gerektiğinde)
    if (siteData.members && siteData.members.length > 0) {
      context.push(`\n=== ÜYE BİLGİLERİ ===`);
      context.push(`Toplam ${siteData.members.length} üye kayıtlı.`);
      
      // Sadece ilk 50 üyenin özet bilgileri (token limiti için)
      const membersList = siteData.members.slice(0, MAX_ITEMS_PER_SECTION).map(m => {
        const info = [];
        info.push(`Ad: ${m.name || 'İsimsiz'}`);
        if (m.region) info.push(`Bölge: ${m.region}`);
        if (m.position) info.push(`Görev: ${m.position}`);
        return info.join(' | ');
      }).join('\n');
      
      context.push(`ÜYE LİSTESİ (İlk ${Math.min(siteData.members.length, MAX_ITEMS_PER_SECTION)}):\n${membersList}`);
      if (siteData.members.length > MAX_ITEMS_PER_SECTION) {
        context.push(`... ve ${siteData.members.length - MAX_ITEMS_PER_SECTION} üye daha`);
      }
    }
    
    // ÜYE KAYITLARI (Üyelerin kaydettiği üye sayıları ve tarihleri)
    if (siteData.memberRegistrations && siteData.memberRegistrations.length > 0) {
      context.push(`\n=== ÜYE KAYITLARI ===`);
      context.push(`Toplam ${siteData.memberRegistrations.length} üye kayıt kaydı var.`);
      
      // Her üye kaydının detayları
      const registrationsList = siteData.memberRegistrations.map(reg => {
        const member = siteData.members?.find(m => String(m.id) === String(reg.memberId));
        const info = [];
        if (member) info.push(`Kaydeden Üye: ${member.name || 'Bilinmeyen üye'}`);
        if (reg.count) info.push(`Kayıt Sayısı: ${reg.count}`);
        if (reg.date) info.push(`Tarih: ${reg.date}`);
        if (reg.createdAt) {
          const date = new Date(reg.createdAt);
          info.push(`Kayıt Tarihi: ${date.toLocaleDateString('tr-TR')}`);
        }
        return info.join(' | ');
      }).join('\n');
      
      context.push(`ÜYE KAYIT LİSTESİ:\n${registrationsList}`);
      
      // Üye bazında toplam kayıt sayıları
      const memberRegistrationTotals = {};
      siteData.memberRegistrations.forEach(reg => {
        const memberId = String(reg.memberId);
        if (!memberRegistrationTotals[memberId]) {
          memberRegistrationTotals[memberId] = {
            memberId: memberId,
            totalCount: 0,
            registrations: []
          };
        }
        memberRegistrationTotals[memberId].totalCount += (reg.count || 0);
        memberRegistrationTotals[memberId].registrations.push({
          count: reg.count,
          date: reg.date,
          createdAt: reg.createdAt
        });
      });
      
      // Üye bazında özet bilgiler
      context.push(`\n=== ÜYE BAZINDA KAYIT ÖZETLERİ ===`);
      Object.values(memberRegistrationTotals).forEach(total => {
        const member = siteData.members?.find(m => String(m.id) === String(total.memberId));
        if (member) {
          context.push(`${member.name}: Toplam ${total.totalCount} üye kaydetti (${total.registrations.length} kayıt)`);
          total.registrations.forEach(reg => {
            const regInfo = [];
            if (reg.count) regInfo.push(`${reg.count} üye`);
            if (reg.date) regInfo.push(`Tarih: ${reg.date}`);
            if (regInfo.length > 0) {
              context.push(`  - ${regInfo.join(' | ')}`);
            }
          });
        }
      });
    }
    
    // TOPLANTI BİLGİLERİ
    if (siteData.meetings && siteData.meetings.length > 0) {
      const activeMeetings = siteData.meetings.filter(m => !m.archived);
      context.push(`\n=== TOPLANTI BİLGİLERİ ===`);
      context.push(`Toplam ${activeMeetings.length} aktif toplantı var.`);
      
      // Her toplantının detayları
      activeMeetings.forEach(meeting => {
        const meetingInfo = [];
        meetingInfo.push(`Toplantı: ${meeting.name || 'İsimsiz toplantı'}`);
        if (meeting.date) meetingInfo.push(`Tarih: ${meeting.date}`);
        if (meeting.location) meetingInfo.push(`Yer: ${meeting.location}`);
        
        // Yoklama bilgileri
        if (meeting.attendees && meeting.attendees.length > 0) {
          const attended = meeting.attendees.filter(a => a.attended === true).length;
          const notAttended = meeting.attendees.length - attended;
          meetingInfo.push(`Katılan: ${attended}, Katılmayan: ${notAttended}`);
          
          // Katılmayanların listesi
          if (notAttended > 0) {
            const notAttendedMembers = meeting.attendees
              .filter(a => a.attended !== true)
              .map(a => {
                const member = siteData.members?.find(m => String(m.id) === String(a.memberId));
                return member ? member.name : 'Bilinmeyen üye';
              })
              .join(', ');
            meetingInfo.push(`Katılmayanlar: ${notAttendedMembers}`);
          }
        }
        
        context.push(meetingInfo.join(' | '));
      });
    }
    
    // ETKİNLİK BİLGİLERİ (Kısaltılmış - token limiti için)
    if (siteData.events && siteData.events.length > 0) {
      const activeEvents = siteData.events.filter(e => !e.archived).slice(0, MAX_ITEMS_PER_SECTION);
      context.push(`\n=== ETKİNLİK BİLGİLERİ ===`);
      context.push(`Toplam ${siteData.events.filter(e => !e.archived).length} aktif etkinlik var.`);
      
      activeEvents.forEach(event => {
        const eventInfo = [];
        eventInfo.push(`Etkinlik: ${event.name || 'İsimsiz etkinlik'}`);
        if (event.date) eventInfo.push(`Tarih: ${event.date}`);
        if (event.location) eventInfo.push(`Yer: ${event.location}`);
        
        if (event.attendees && event.attendees.length > 0) {
          const attended = event.attendees.filter(a => a.attended === true).length;
          eventInfo.push(`Katılan: ${attended}`);
        }
        
        context.push(eventInfo.join(' | '));
      });
    }
    
    // DİĞER BİLGİLER
    if (siteData.districts && siteData.districts.length > 0) {
      context.push(`\n=== İLÇE BİLGİLERİ ===`);
      context.push(`${siteData.districts.length} ilçe kayıtlı: ${siteData.districts.map(d => d.name).join(', ')}`);
    }
    
    if (siteData.towns && siteData.towns.length > 0) {
      context.push(`\n=== BELDE BİLGİLERİ ===`);
      context.push(`${siteData.towns.length} belde kayıtlı: ${siteData.towns.map(t => t.name).join(', ')}`);
    }
    
    if (siteData.neighborhoods && siteData.neighborhoods.length > 0) {
      context.push(`\n=== MAHALLE BİLGİLERİ ===`);
      context.push(`${siteData.neighborhoods.length} mahalle kayıtlı.`);
    }
    
    if (siteData.villages && siteData.villages.length > 0) {
      context.push(`\n=== KÖY BİLGİLERİ ===`);
      context.push(`${siteData.villages.length} köy kayıtlı.`);
    }
    
    // SİTE İŞLEVLERİ VE KULLANIM KILAVUZU
    context.push(`\n=== SİTE İŞLEVLERİ VE KULLANIM KILAVUZU ===`);
    
    // ÜYE İŞLEMLERİ
    context.push(`\n--- ÜYE İŞLEMLERİ ---`);
    context.push(`Üye eklemek için: Ayarlar > Üye Ekle veya Üyeler sayfasından "Yeni Üye Ekle" butonuna tıklayın.`);
    context.push(`Üye kaydı için gerekli bilgiler: Ad Soyad, TC Kimlik No, Telefon, Adres, Bölge, Görev.`);
    context.push(`Üye düzenlemek için: Üyeler sayfasından üyeye tıklayın, detay sayfasında "Düzenle" butonuna tıklayın.`);
    context.push(`Üye silmek için: Üyeler sayfasından üyeyi arşive alabilir veya arşivden kalıcı olarak silebilirsiniz.`);
    
    // TOPLANTI İŞLEMLERİ
    context.push(`\n--- TOPLANTI İŞLEMLERİ ---`);
    context.push(`Toplantı oluşturmak için: Toplantılar sayfasından "Yeni Toplantı Oluştur" butonuna tıklayın.`);
    context.push(`Toplantı için gerekli bilgiler: Toplantı Adı, Bölge Seçimi (en az bir bölge), Tarih, Notlar (opsiyonel).`);
    context.push(`Toplantı oluştururken bölgeler seçildiğinde, o bölgelerdeki tüm üyeler otomatik olarak toplantıya eklenir.`);
    context.push(`Toplantı oluştururken her üye için katılım durumu (katıldı/katılmadı) ve mazeret bilgisi girilebilir.`);
    context.push(`Toplantı düzenlemek için: Toplantılar sayfasından toplantıya tıklayın, "Düzenle" butonuna tıklayın.`);
    context.push(`Toplantı yoklaması için: Toplantı detay sayfasında üyelerin katılım durumunu güncelleyebilirsiniz.`);
    
    // ETKİNLİK İŞLEMLERİ
    context.push(`\n--- ETKİNLİK İŞLEMLERİ ---`);
    context.push(`Etkinlik oluşturmak için: Etkinlikler sayfasından "Yeni Etkinlik Oluştur" butonuna tıklayın.`);
    context.push(`Etkinlik için gerekli bilgiler: Etkinlik Kategorisi (önceden tanımlanmış kategorilerden seçim), Tarih ve Saat, Konum (İlçe, Belde, Mahalle, Köy vb. seçimi), Açıklama (opsiyonel).`);
    context.push(`Etkinlik kategorisi seçildiğinde, etkinlik adı otomatik olarak kategori adı olarak ayarlanır.`);
    context.push(`Etkinlik oluştururken birden fazla konum türü seçilebilir (İlçe, Belde, Mahalle, Köy, Cami, STK vb.).`);
    context.push(`Etkinlik oluştururken seçilen konumlardaki sorumlu üyeler otomatik olarak etkinliğe eklenir.`);
    context.push(`Etkinlik düzenlemek için: Etkinlikler sayfasından etkinliğe tıklayın, "Düzenle" butonuna tıklayın.`);
    
    // SANDIK İŞLEMLERİ
    context.push(`\n--- SANDIK İŞLEMLERİ ---`);
    context.push(`Sandık eklemek için: Seçime Hazırlık > Sandıklar sayfasından "Yeni Sandık Ekle" butonuna tıklayın.`);
    context.push(`Sandık için gerekli bilgiler: Sandık Numarası, Kurum Adı.`);
    context.push(`Sandık için opsiyonel bilgiler: İlçe, Belde, Mahalle, Köy (konum bilgileri).`);
    context.push(`Sandık düzenlemek için: Sandıklar sayfasından sandığa tıklayın, "Düzenle" butonuna tıklayın.`);
    context.push(`Sandığa müşahit atamak için: Sandıklar sayfasından sandığa tıklayın, "Müşahit Ata" butonuna tıklayın veya Müşahitler sayfasından yeni müşahit eklerken sandık seçin.`);
    
    // MÜŞAHİT İŞLEMLERİ
    context.push(`\n--- MÜŞAHİT İŞLEMLERİ ---`);
    context.push(`Müşahit eklemek için: Seçime Hazırlık > Müşahitler sayfasından "Yeni Müşahit Ekle" butonuna tıklayın.`);
    context.push(`Müşahit için gerekli bilgiler: TC Kimlik No, Ad Soyad, Telefon.`);
    context.push(`Müşahit için opsiyonel bilgiler: Sandık Seçimi, İlçe, Belde, Mahalle, Köy, Baş Müşahit (evet/hayır).`);
    context.push(`Müşahit eklerken sandık seçilirse, ilgili sandığa otomatik olarak atanır.`);
    context.push(`Baş müşahit atamak için: Müşahit eklerken veya düzenlerken "Baş Müşahit" seçeneğini işaretleyin. Bir sandıkta sadece bir baş müşahit olabilir.`);
    context.push(`Müşahit düzenlemek için: Müşahitler sayfasından müşahite tıklayın, "Düzenle" butonuna tıklayın.`);
    
    // İLÇE İŞLEMLERİ
    context.push(`\n--- İLÇE İŞLEMLERİ ---`);
    context.push(`İlçe eklemek için: Ayarlar > İlçeler sayfasından "Yeni İlçe Ekle" butonuna tıklayın.`);
    context.push(`İlçe için gerekli bilgiler: İlçe Adı.`);
    context.push(`İlçe için opsiyonel bilgiler: İlçe Başkanı (Ad Soyad, Telefon, Üye Seçimi), İlçe Müfettişi (Ad Soyad, Telefon, Üye Seçimi), Müfettiş Yardımcıları.`);
    context.push(`İlçe düzenlemek için: İlçeler sayfasından ilçeye tıklayın, "Düzenle" butonuna tıklayın.`);
    
    // BELDE İŞLEMLERİ
    context.push(`\n--- BELDE İŞLEMLERİ ---`);
    context.push(`Belde eklemek için: Ayarlar > Beldeler sayfasından "Yeni Belde Ekle" butonuna tıklayın.`);
    context.push(`Belde için gerekli bilgiler: Belde Adı, İlçe Seçimi.`);
    context.push(`Belde için opsiyonel bilgiler: Belde Başkanı (Ad Soyad, Telefon, Üye Seçimi), Belde Müfettişi (Ad Soyad, Telefon, Üye Seçimi), Müfettiş Yardımcıları.`);
    context.push(`Belde düzenlemek için: Beldeler sayfasından beldeye tıklayın, "Düzenle" butonuna tıklayın.`);
    
    // MAHALLE İŞLEMLERİ
    context.push(`\n--- MAHALLE İŞLEMLERİ ---`);
    context.push(`Mahalle eklemek için: Seçime Hazırlık > Mahalleler sayfasından "Yeni Mahalle Ekle" butonuna tıklayın.`);
    context.push(`Mahalle için gerekli bilgiler: Mahalle Adı, İlçe Seçimi.`);
    context.push(`Mahalle için opsiyonel bilgiler: Belde Seçimi, Grup Numarası, Mahalle Temsilcisi (Ad Soyad, TC, Telefon, Üye Seçimi), Mahalle Sorumlusu/Müfettişi (Ad Soyad, TC, Telefon, Üye Seçimi).`);
    context.push(`Mahalle düzenlemek için: Mahalleler sayfasından mahalleye tıklayın, "Düzenle" butonuna tıklayın.`);
    context.push(`Mahalleler Excel'den toplu olarak yüklenebilir: Mahalleler sayfasından "Excel'den Yükle" butonuna tıklayın.`);
    
    // KÖY İŞLEMLERİ
    context.push(`\n--- KÖY İŞLEMLERİ ---`);
    context.push(`Köy eklemek için: Seçime Hazırlık > Köyler sayfasından "Yeni Köy Ekle" butonuna tıklayın.`);
    context.push(`Köy için gerekli bilgiler: Köy Adı, İlçe Seçimi.`);
    context.push(`Köy için opsiyonel bilgiler: Belde Seçimi, Grup Numarası, Köy Temsilcisi (Ad Soyad, TC, Telefon, Üye Seçimi), Köy Sorumlusu/Müfettişi (Ad Soyad, TC, Telefon, Üye Seçimi).`);
    context.push(`Köy düzenlemek için: Köyler sayfasından köye tıklayın, "Düzenle" butonuna tıklayın.`);
    context.push(`Köyler Excel'den toplu olarak yüklenebilir: Köyler sayfasından "Excel'den Yükle" butonuna tıklayın.`);
    
    // CAMİ İŞLEMLERİ
    context.push(`\n--- CAMİ İŞLEMLERİ ---`);
    context.push(`Cami eklemek için: Ayarlar > Camiler sayfasından "Yeni Cami Ekle" butonuna tıklayın.`);
    context.push(`Cami için gerekli bilgiler: Cami Adı, İlçe Seçimi, Konum Türü (Mahalle veya Köy), Seçilen Konum (Mahalle veya Köy).`);
    context.push(`Cami için opsiyonel bilgiler: Belde Seçimi.`);
    context.push(`Cami düzenlemek için: Camiler sayfasından camiye tıklayın, "Düzenle" butonuna tıklayın.`);
    
    // GRUP İŞLEMLERİ
    context.push(`\n--- GRUP İŞLEMLERİ ---`);
    context.push(`Grup oluşturmak için: Mahalleler veya Köyler sayfasından mahalle/köy eklerken veya düzenlerken "Grup Numarası" alanına grup numarasını girin.`);
    context.push(`Aynı grup numarasına sahip mahalle ve köyler otomatik olarak aynı grupta listelenir.`);
    context.push(`Grup lideri atamak için: Seçime Hazırlık > Gruplar sayfasından gruba tıklayın, "Grup Lideri Ata" butonuna tıklayın, üye listesinden grup liderini seçin.`);
    context.push(`Gruplar sayfasında tüm grup bilgileri (mahalleler, köyler, temsilciler, sorumlular, grup lideri) görüntülenir.`);
    
    // TEMSİLCİ VE SORUMLU İŞLEMLERİ
    context.push(`\n--- TEMSİLCİ VE SORUMLU İŞLEMLERİ ---`);
    context.push(`Mahalle/Köy Temsilcisi atamak için: Mahalleler veya Köyler sayfasından mahalle/köy eklerken veya düzenlerken "Temsilci" bölümünden temsilci bilgilerini girin.`);
    context.push(`Temsilci atarken üye listesinden seçim yapabilir veya yeni kişi bilgileri girebilirsiniz.`);
    context.push(`Mahalle/Köy Sorumlusu (Müfettiş) atamak için: Mahalleler veya Köyler sayfasından mahalle/köy eklerken veya düzenlerken "Sorumlu" bölümünden sorumlu bilgilerini girin.`);
    context.push(`Sorumlu atarken üye listesinden seçim yapabilir veya yeni kişi bilgileri girebilirsiniz.`);
    
    // EXCEL İŞLEMLERİ
    context.push(`\n--- EXCEL İŞLEMLERİ ---`);
    context.push(`Excel'den veri yüklemek için: İlgili sayfada (Mahalleler, Köyler, Üyeler vb.) "Excel'den Yükle" veya "Excel'e Aktar" butonları kullanılabilir.`);
    context.push(`Excel formatı: Her sayfa için uygun sütun başlıkları olmalıdır (örnek: Mahalle Adı, İlçe, Grup No vb.).`);
    
    // RAPORLAMA VE İSTATİSTİKLER
    context.push(`\n--- RAPORLAMA VE İSTATİSTİKLER ---`);
    context.push(`Toplantı istatistikleri: Toplantılar sayfasında toplantı bazında katılım oranları görüntülenir.`);
    context.push(`Etkinlik istatistikleri: Etkinlikler sayfasında etkinlik bazında katılım bilgileri görüntülenir.`);
    context.push(`Üye istatistikleri: Üyeler sayfasında üye bazında toplantı katılım oranları ve istatistikleri görüntülenir.`);
    context.push(`Sandık istatistikleri: Sandıklar sayfasında sandık tamamlanma durumları (ilçe, mahalle/köy, baş müşahit, müşahit atanmış mı) görüntülenir.`);
    
    // TOPLANTI İSTATİSTİKLERİ (TARİH BAZLI)
    if (siteData.meetings && siteData.meetings.length > 0) {
      const activeMeetings = siteData.meetings.filter(m => !m.archived);
      context.push(`\n=== TOPLANTI İSTATİSTİKLERİ ===`);
      context.push(`Toplam ${activeMeetings.length} aktif toplantı yapılmış.`);
      
      // Ay bazlı analiz
      const meetingsByMonth = {};
      activeMeetings.forEach(meeting => {
        if (meeting.date) {
          try {
            // Tarih formatı: DD.MM.YYYY veya YYYY-MM-DD
            let dateObj;
            if (meeting.date.includes('.')) {
              const [day, month, year] = meeting.date.split('.');
              dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dateObj = new Date(meeting.date);
            }
            
            const monthKey = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            if (!meetingsByMonth[monthKey]) {
              meetingsByMonth[monthKey] = 0;
            }
            meetingsByMonth[monthKey]++;
          } catch (e) {
            // Tarih parse edilemezse atla
          }
        }
      });
      
      // Ay bazlı toplantı sayıları
      Object.entries(meetingsByMonth).forEach(([month, count]) => {
        context.push(`${month}: ${count} toplantı`);
      });
    }
    
    // ETKİNLİK İSTATİSTİKLERİ (TARİH BAZLI)
    if (siteData.events && siteData.events.length > 0) {
      const activeEvents = siteData.events.filter(e => !e.archived);
      context.push(`\n=== ETKİNLİK İSTATİSTİKLERİ ===`);
      context.push(`Toplam ${activeEvents.length} aktif etkinlik yapılmış.`);
      
      // Ay bazlı analiz
      const eventsByMonth = {};
      activeEvents.forEach(event => {
        if (event.date) {
          try {
            let dateObj;
            if (event.date.includes('.')) {
              const [day, month, year] = event.date.split('.');
              dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dateObj = new Date(event.date);
            }
            
            const monthKey = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            if (!eventsByMonth[monthKey]) {
              eventsByMonth[monthKey] = 0;
            }
            eventsByMonth[monthKey]++;
          } catch (e) {
            // Tarih parse edilemezse atla
          }
        }
      });
      
      // Ay bazlı etkinlik sayıları
      Object.entries(eventsByMonth).forEach(([month, count]) => {
        context.push(`${month}: ${count} etkinlik`);
      });
    }
    
    // MAHALLE ZİYARET SAYILARI
    if (siteData.neighborhoodVisitCounts && siteData.neighborhoodVisitCounts.length > 0) {
      context.push(`\n=== MAHALLE ZİYARET SAYILARI ===`);
      siteData.neighborhoodVisitCounts.forEach(visit => {
        const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(visit.neighborhood_id));
        const info = [];
        if (neighborhood) info.push(`Mahalle: ${neighborhood.name}`);
        if (visit.visit_count !== undefined) info.push(`Ziyaret Sayısı: ${visit.visit_count}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // KÖY ZİYARET SAYILARI
    if (siteData.villageVisitCounts && siteData.villageVisitCounts.length > 0) {
      context.push(`\n=== KÖY ZİYARET SAYILARI ===`);
      siteData.villageVisitCounts.forEach(visit => {
        const village = siteData.villages?.find(v => String(v.id) === String(visit.village_id));
        const info = [];
        if (village) info.push(`Köy: ${village.name}`);
        if (visit.visit_count !== undefined) info.push(`Ziyaret Sayısı: ${visit.visit_count}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // TEMSİLCİSİ OLMAYAN MAHALLELER
    if (siteData.neighborhoods && siteData.neighborhoods.length > 0) {
      const neighborhoodsWithReps = new Set(
        (siteData.neighborhoodRepresentatives || [])
          .map(rep => String(rep.neighborhood_id))
      );
      const neighborhoodsWithoutReps = siteData.neighborhoods.filter(n => 
        !neighborhoodsWithReps.has(String(n.id))
      );
      
      if (neighborhoodsWithoutReps.length > 0) {
        context.push(`\n=== TEMSİLCİSİ OLMAYAN MAHALLELER ===`);
        context.push(`Toplam ${neighborhoodsWithoutReps.length} mahallenin temsilcisi yok:`);
        neighborhoodsWithoutReps.forEach(neighborhood => {
          const district = siteData.districts?.find(d => String(d.id) === String(neighborhood.district_id));
          const info = [];
          info.push(`Mahalle: ${neighborhood.name}`);
          if (district) info.push(`İlçe: ${district.name}`);
          context.push(info.join(' | '));
        });
      }
    }
    
    // TEMSİLCİSİ OLMAYAN KÖYLER
    if (siteData.villages && siteData.villages.length > 0) {
      const villagesWithReps = new Set(
        (siteData.villageRepresentatives || [])
          .map(rep => String(rep.village_id))
      );
      const villagesWithoutReps = siteData.villages.filter(v => 
        !villagesWithReps.has(String(v.id))
      );
      
      if (villagesWithoutReps.length > 0) {
        context.push(`\n=== TEMSİLCİSİ OLMAYAN KÖYLER ===`);
        context.push(`Toplam ${villagesWithoutReps.length} köyün temsilcisi yok:`);
        villagesWithoutReps.forEach(village => {
          const district = siteData.districts?.find(d => String(d.id) === String(village.district_id));
          const info = [];
          info.push(`Köy: ${village.name}`);
          if (district) info.push(`İlçe: ${district.name}`);
          context.push(info.join(' | '));
        });
      }
    }
    
    // İLÇE YÖNETİMİ (BAŞKAN VE MÜFETTİŞLER)
    if (siteData.districtOfficials && siteData.districtOfficials.length > 0) {
      context.push(`\n=== İLÇE YÖNETİMİ ===`);
      siteData.districtOfficials.forEach(official => {
        const district = siteData.districts?.find(d => String(d.id) === String(official.district_id));
        const info = [];
        if (district) info.push(`İlçe: ${district.name}`);
        if (official.chairman_name) info.push(`İlçe Başkanı: ${official.chairman_name}`);
        if (official.chairman_phone) info.push(`Başkan Telefon: ${official.chairman_phone}`);
        if (official.inspector_name) info.push(`İlçe Müfettişi: ${official.inspector_name}`);
        if (official.inspector_phone) info.push(`Müfettiş Telefon: ${official.inspector_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // İLÇE MÜFETTİŞ YARDIMCILARI
    if (siteData.districtDeputyInspectors && siteData.districtDeputyInspectors.length > 0) {
      context.push(`\n=== İLÇE MÜFETTİŞ YARDIMCILARI ===`);
      siteData.districtDeputyInspectors.forEach(deputy => {
        const district = siteData.districts?.find(d => String(d.id) === String(deputy.district_id));
        const info = [];
        if (district) info.push(`İlçe: ${district.name}`);
        if (deputy.member_name) info.push(`Müfettiş Yardımcısı: ${deputy.member_name}`);
        if (deputy.member_phone) info.push(`Telefon: ${deputy.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // BELDE YÖNETİMİ (BAŞKAN VE MÜFETTİŞLER)
    if (siteData.townOfficials && siteData.townOfficials.length > 0) {
      context.push(`\n=== BELDE YÖNETİMİ ===`);
      siteData.townOfficials.forEach(official => {
        const town = siteData.towns?.find(t => String(t.id) === String(official.town_id));
        const info = [];
        if (town) info.push(`Belde: ${town.name}`);
        if (official.chairman_name) info.push(`Belde Başkanı: ${official.chairman_name}`);
        if (official.chairman_phone) info.push(`Başkan Telefon: ${official.chairman_phone}`);
        if (official.inspector_name) info.push(`Belde Müfettişi: ${official.inspector_name}`);
        if (official.inspector_phone) info.push(`Müfettiş Telefon: ${official.inspector_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // BELDE MÜFETTİŞ YARDIMCILARI
    if (siteData.townDeputyInspectors && siteData.townDeputyInspectors.length > 0) {
      context.push(`\n=== BELDE MÜFETTİŞ YARDIMCILARI ===`);
      siteData.townDeputyInspectors.forEach(deputy => {
        const town = siteData.towns?.find(t => String(t.id) === String(deputy.town_id));
        const info = [];
        if (town) info.push(`Belde: ${town.name}`);
        if (deputy.member_name) info.push(`Müfettiş Yardımcısı: ${deputy.member_name}`);
        if (deputy.member_phone) info.push(`Telefon: ${deputy.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // MAHALLE TEMSİLCİLERİ
    if (siteData.neighborhoodRepresentatives && siteData.neighborhoodRepresentatives.length > 0) {
      context.push(`\n=== MAHALLE TEMSİLCİLERİ ===`);
      siteData.neighborhoodRepresentatives.forEach(rep => {
        const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(rep.neighborhood_id));
        const district = siteData.districts?.find(d => String(d.id) === String(rep.district_id));
        const info = [];
        if (neighborhood) info.push(`Mahalle: ${neighborhood.name}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (rep.member_name) info.push(`Temsilci: ${rep.member_name}`);
        if (rep.member_phone) info.push(`Telefon: ${rep.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // KÖY TEMSİLCİLERİ
    if (siteData.villageRepresentatives && siteData.villageRepresentatives.length > 0) {
      context.push(`\n=== KÖY TEMSİLCİLERİ ===`);
      siteData.villageRepresentatives.forEach(rep => {
        const village = siteData.villages?.find(v => String(v.id) === String(rep.village_id));
        const district = siteData.districts?.find(d => String(d.id) === String(rep.district_id));
        const info = [];
        if (village) info.push(`Köy: ${village.name}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (rep.member_name) info.push(`Temsilci: ${rep.member_name}`);
        if (rep.member_phone) info.push(`Telefon: ${rep.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // MAHALLE SORUMLULARI (MÜFETTİŞLER)
    if (siteData.neighborhoodSupervisors && siteData.neighborhoodSupervisors.length > 0) {
      context.push(`\n=== MAHALLE SORUMLULARI ===`);
      siteData.neighborhoodSupervisors.forEach(supervisor => {
        const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(supervisor.neighborhood_id));
        const district = siteData.districts?.find(d => String(d.id) === String(supervisor.district_id));
        const info = [];
        if (neighborhood) info.push(`Mahalle: ${neighborhood.name}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (supervisor.member_name) info.push(`Sorumlu: ${supervisor.member_name}`);
        if (supervisor.member_phone) info.push(`Telefon: ${supervisor.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // KÖY SORUMLULARI (MÜFETTİŞLER)
    if (siteData.villageSupervisors && siteData.villageSupervisors.length > 0) {
      context.push(`\n=== KÖY SORUMLULARI ===`);
      siteData.villageSupervisors.forEach(supervisor => {
        const village = siteData.villages?.find(v => String(v.id) === String(supervisor.village_id));
        const district = siteData.districts?.find(d => String(d.id) === String(supervisor.district_id));
        const info = [];
        if (village) info.push(`Köy: ${village.name}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (supervisor.member_name) info.push(`Sorumlu: ${supervisor.member_name}`);
        if (supervisor.member_phone) info.push(`Telefon: ${supervisor.member_phone}`);
        context.push(info.join(' | '));
      });
    }
    
    // SANDIKLAR
    if (siteData.ballotBoxes && siteData.ballotBoxes.length > 0) {
      context.push(`\n=== SANDIKLAR ===`);
      context.push(`Toplam ${siteData.ballotBoxes.length} sandık kayıtlı.`);
      
      siteData.ballotBoxes.forEach(box => {
        const district = siteData.districts?.find(d => String(d.id) === String(box.district_id));
        const town = siteData.towns?.find(t => String(t.id) === String(box.town_id));
        const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(box.neighborhood_id));
        const village = siteData.villages?.find(v => String(v.id) === String(box.village_id));
        
        const info = [];
        if (box.ballot_box_number) info.push(`Sandık No: ${box.ballot_box_number}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (town) info.push(`Belde: ${town.name}`);
        if (neighborhood) info.push(`Mahalle: ${neighborhood.name}`);
        if (village) info.push(`Köy: ${village.name}`);
        if (box.location) info.push(`Konum: ${box.location}`);
        context.push(info.join(' | '));
      });
    }
    
    // MÜŞAHİTLER (GÖZLEMCİLER)
    if (siteData.observers && siteData.observers.length > 0) {
      context.push(`\n=== MÜŞAHİTLER (GÖZLEMCİLER) ===`);
      context.push(`Toplam ${siteData.observers.length} müşahit kayıtlı.`);
      
      // Baş müşahitler
      const chiefObservers = siteData.observers.filter(o => o.is_chief_observer === true);
      if (chiefObservers.length > 0) {
        context.push(`Baş Müşahitler: ${chiefObservers.length} adet`);
        chiefObservers.forEach(observer => {
          const ballotBox = siteData.ballotBoxes?.find(b => String(b.id) === String(observer.ballot_box_id));
          const district = siteData.districts?.find(d => String(d.id) === String(observer.observer_district_id));
          const info = [];
          if (observer.observer_name) info.push(`Baş Müşahit: ${observer.observer_name}`);
          if (observer.observer_phone) info.push(`Telefon: ${observer.observer_phone}`);
          if (ballotBox) info.push(`Sandık: ${ballotBox.ballot_box_number || 'No yok'}`);
          if (district) info.push(`İlçe: ${district.name}`);
          context.push(info.join(' | '));
        });
      }
      
      // Normal müşahitler
      const regularObservers = siteData.observers.filter(o => !o.is_chief_observer || o.is_chief_observer === false);
      if (regularObservers.length > 0) {
        context.push(`Müşahitler: ${regularObservers.length} adet`);
        regularObservers.slice(0, 10).forEach(observer => {
          const ballotBox = siteData.ballotBoxes?.find(b => String(b.id) === String(observer.ballot_box_id));
          const district = siteData.districts?.find(d => String(d.id) === String(observer.observer_district_id));
          const info = [];
          if (observer.observer_name) info.push(`Müşahit: ${observer.observer_name}`);
          if (observer.observer_phone) info.push(`Telefon: ${observer.observer_phone}`);
          if (ballotBox) info.push(`Sandık: ${ballotBox.ballot_box_number || 'No yok'}`);
          if (district) info.push(`İlçe: ${district.name}`);
          context.push(info.join(' | '));
        });
        if (regularObservers.length > 10) {
          context.push(`... ve ${regularObservers.length - 10} müşahit daha`);
        }
      }
    }
    
    // GRUPLAR VE GRUP LİDERLERİ
    if (siteData.groups && siteData.groups.length > 0) {
      context.push(`\n=== GRUPLAR ===`);
      context.push(`Toplam ${siteData.groups.length} grup kayıtlı.`);
      
      siteData.groups.forEach(group => {
        const groupInfo = [];
        if (group.group_no) groupInfo.push(`Grup No: ${group.group_no}`);
        if (group.group_leader_id) {
          const leader = siteData.members?.find(m => String(m.id) === String(group.group_leader_id));
          if (leader) groupInfo.push(`Grup Lideri: ${leader.name}`);
        }
        context.push(groupInfo.join(' | '));
      });
    }
    
    // İLÇE YÖNETİM KURULU ÜYELERİ
    if (siteData.districtManagementMembers && siteData.districtManagementMembers.length > 0) {
      context.push(`\n=== İLÇE YÖNETİM KURULU ÜYELERİ ===`);
      context.push(`Toplam ${siteData.districtManagementMembers.length} ilçe yönetim kurulu üyesi var.`);
      
      siteData.districtManagementMembers.forEach(member => {
        const district = siteData.districts?.find(d => String(d.id) === String(member.district_id));
        const info = [];
        if (district) info.push(`İlçe: ${district.name}`);
        if (member.name) info.push(`Ad: ${member.name}`);
        if (member.tc) info.push(`TC: ${member.tc}`);
        if (member.phone) info.push(`Telefon: ${member.phone}`);
        if (member.position) info.push(`Görev: ${member.position}`);
        if (member.region) info.push(`Bölge: ${member.region}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // BELDE YÖNETİM KURULU ÜYELERİ
    if (siteData.townManagementMembers && siteData.townManagementMembers.length > 0) {
      context.push(`\n=== BELDE YÖNETİM KURULU ÜYELERİ ===`);
      context.push(`Toplam ${siteData.townManagementMembers.length} belde yönetim kurulu üyesi var.`);
      
      siteData.townManagementMembers.forEach(member => {
        const town = siteData.towns?.find(t => String(t.id) === String(member.town_id));
        const info = [];
        if (town) info.push(`Belde: ${town.name}`);
        if (member.name) info.push(`Ad: ${member.name}`);
        if (member.tc) info.push(`TC: ${member.tc}`);
        if (member.phone) info.push(`Telefon: ${member.phone}`);
        if (member.position) info.push(`Görev: ${member.position}`);
        if (member.region) info.push(`Bölge: ${member.region}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // STK'LAR
    if (siteData.stks && siteData.stks.length > 0) {
      context.push(`\n=== STK'LAR (SİVİL TOPLUM KURULUŞLARI) ===`);
      context.push(`Toplam ${siteData.stks.length} STK kayıtlı.`);
      
      siteData.stks.forEach(stk => {
        const info = [];
        if (stk.name) info.push(`STK Adı: ${stk.name}`);
        if (stk.description) info.push(`Açıklama: ${stk.description}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // CAMİLER (DETAYLI)
    if (siteData.mosques && siteData.mosques.length > 0) {
      context.push(`\n=== CAMİLER ===`);
      context.push(`Toplam ${siteData.mosques.length} cami kayıtlı.`);
      
      siteData.mosques.forEach(mosque => {
        const district = siteData.districts?.find(d => String(d.id) === String(mosque.district_id));
        const town = siteData.towns?.find(t => String(t.id) === String(mosque.town_id));
        const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(mosque.neighborhood_id));
        const village = siteData.villages?.find(v => String(v.id) === String(mosque.village_id));
        
        const info = [];
        if (mosque.name) info.push(`Cami Adı: ${mosque.name}`);
        if (district) info.push(`İlçe: ${district.name}`);
        if (town) info.push(`Belde: ${town.name}`);
        if (neighborhood) info.push(`Mahalle: ${neighborhood.name}`);
        if (village) info.push(`Köy: ${village.name}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // ETKİNLİK KATEGORİLERİ
    if (siteData.eventCategories && siteData.eventCategories.length > 0) {
      context.push(`\n=== ETKİNLİK KATEGORİLERİ ===`);
      context.push(`Toplam ${siteData.eventCategories.length} etkinlik kategorisi var: ${siteData.eventCategories.map(c => c.name).join(', ')}`);
    }
    
    // KİŞİSEL BELGELER
    if (siteData.personalDocuments && siteData.personalDocuments.length > 0) {
      context.push(`\n=== KİŞİSEL BELGELER ===`);
      context.push(`Toplam ${siteData.personalDocuments.length} kişisel belge kayıtlı.`);
      
      // Üye bazında belgeler
      const memberDocuments = {};
      siteData.personalDocuments.forEach(doc => {
        const memberId = String(doc.member_id || doc.memberId);
        if (!memberDocuments[memberId]) {
          memberDocuments[memberId] = [];
        }
        memberDocuments[memberId].push(doc);
      });
      
      Object.entries(memberDocuments).forEach(([memberId, docs]) => {
        const member = siteData.members?.find(m => String(m.id) === memberId);
        if (member) {
          context.push(`${member.name}: ${docs.length} belge`);
          docs.forEach(doc => {
            const docInfo = [];
            if (doc.document_name) docInfo.push(`Belge: ${doc.document_name}`);
            if (doc.document_type) docInfo.push(`Tür: ${doc.document_type}`);
            if (doc.upload_date) docInfo.push(`Tarih: ${doc.upload_date}`);
            if (docInfo.length > 0) {
              context.push(`  - ${docInfo.join(' | ')}`);
            }
          });
        }
      });
    }
    
    // ARŞİV BELGELERİ
    if (siteData.archiveDocuments && siteData.archiveDocuments.length > 0) {
      context.push(`\n=== ARŞİV BELGELERİ ===`);
      context.push(`Toplam ${siteData.archiveDocuments.length} arşiv belgesi var.`);
      
      siteData.archiveDocuments.forEach(doc => {
        const info = [];
        if (doc.name) info.push(`Belge Adı: ${doc.name}`);
        if (doc.type) info.push(`Tür: ${doc.type}`);
        if (doc.upload_date) info.push(`Tarih: ${doc.upload_date}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
    }
    
    // ARŞİVLENMİŞ ÜYELER
    if (siteData.archivedMembers && siteData.archivedMembers.length > 0) {
      context.push(`\n=== ARŞİVLENMİŞ ÜYELER ===`);
      context.push(`Toplam ${siteData.archivedMembers.length} arşivlenmiş üye var.`);
      
      siteData.archivedMembers.slice(0, 20).forEach(member => {
        const info = [];
        if (member.name) info.push(`Ad: ${member.name}`);
        if (member.tc) info.push(`TC: ${member.tc}`);
        if (member.region) info.push(`Bölge: ${member.region}`);
        if (member.position) info.push(`Görev: ${member.position}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
      if (siteData.archivedMembers.length > 20) {
        context.push(`... ve ${siteData.archivedMembers.length - 20} arşivlenmiş üye daha`);
      }
    }
    
    // ARŞİVLENMİŞ TOPLANTILAR
    if (siteData.archivedMeetings && siteData.archivedMeetings.length > 0) {
      context.push(`\n=== ARŞİVLENMİŞ TOPLANTILAR ===`);
      context.push(`Toplam ${siteData.archivedMeetings.length} arşivlenmiş toplantı var.`);
      
      siteData.archivedMeetings.slice(0, 10).forEach(meeting => {
        const info = [];
        if (meeting.name) info.push(`Toplantı: ${meeting.name}`);
        if (meeting.date) info.push(`Tarih: ${meeting.date}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
      if (siteData.archivedMeetings.length > 10) {
        context.push(`... ve ${siteData.archivedMeetings.length - 10} arşivlenmiş toplantı daha`);
      }
    }
    
    // ARŞİVLENMİŞ ETKİNLİKLER
    if (siteData.archivedEvents && siteData.archivedEvents.length > 0) {
      context.push(`\n=== ARŞİVLENMİŞ ETKİNLİKLER ===`);
      context.push(`Toplam ${siteData.archivedEvents.length} arşivlenmiş etkinlik var.`);
      
      siteData.archivedEvents.slice(0, 10).forEach(event => {
        const info = [];
        if (event.name) info.push(`Etkinlik: ${event.name}`);
        if (event.date) info.push(`Tarih: ${event.date}`);
        if (info.length > 0) {
          context.push(info.join(' | '));
        }
      });
      if (siteData.archivedEvents.length > 10) {
        context.push(`... ve ${siteData.archivedEvents.length - 10} arşivlenmiş etkinlik daha`);
      }
    }
    
    return context;
  }

  /**
   * Üye bilgilerini context'e ekle (detaylı arama - tüm üye kartı bilgileri)
   * @param {Array} members - Üye listesi
   * @param {string} searchTerm - Arama terimi
   * @param {Object} siteData - Tüm site verileri (meetings, representatives, supervisors, observers vb.)
   * @returns {Array<string>} Context array'i
   */
  static buildMemberContext(members, searchTerm = '', siteData = {}) {
    const context = [];
    
    if (!searchTerm || !members || members.length === 0) {
      return context;
    }
    
    const meetings = siteData.meetings || [];
    
    // Üye arama (isim, TC, telefon ile)
    const searchLower = searchTerm.toLowerCase();
    const matchingMembers = members.filter(m => {
      const nameMatch = m.name && typeof m.name === 'string' && m.name.toLowerCase().includes(searchLower);
      const tcMatch = m.tc && (typeof m.tc === 'string' ? m.tc.toLowerCase().includes(searchLower) : String(m.tc).includes(searchTerm));
      const phoneMatch = m.phone && (typeof m.phone === 'string' ? m.phone.toLowerCase().includes(searchLower) : String(m.phone).includes(searchTerm));
      return nameMatch || tcMatch || phoneMatch;
    });
    
    if (matchingMembers.length > 0) {
      matchingMembers.slice(0, 3).forEach(member => {
        const memberId = String(member.id);
        
        // ÜYE KARTI BİLGİLERİ (TÜM DETAYLAR)
        context.push(`\n=== ÜYE KARTI BİLGİLERİ: ${member.name || 'İsimsiz'} ===`);
        
        // Temel Bilgiler
        const basicInfo = [];
        if (member.name) basicInfo.push(`Ad Soyad: ${member.name}`);
        if (member.tc) basicInfo.push(`TC Kimlik No: ${member.tc}`);
        if (member.phone) basicInfo.push(`Telefon: ${member.phone}`);
        if (member.address) basicInfo.push(`Adres: ${member.address}`);
        if (member.region) basicInfo.push(`Bölge: ${member.region}`);
        if (member.position) basicInfo.push(`Görev: ${member.position}`);
        if (member.district) basicInfo.push(`İlçe: ${member.district}`);
        if (member.notes) basicInfo.push(`Notlar: ${member.notes}`);
        if (basicInfo.length > 0) {
          context.push(basicInfo.join(' | '));
        }
        
        // Toplantı Yoklama Bilgisi
        if (meetings && meetings.length > 0) {
          const memberMeetings = meetings.filter(m => {
            if (!m.attendees) return false;
            return m.attendees.some(a => String(a.memberId) === memberId);
          });
          
          if (memberMeetings.length > 0) {
            const attended = memberMeetings.filter(m => {
              const attendee = m.attendees.find(a => String(a.memberId) === memberId);
              return attendee && attendee.attended === true;
            }).length;
            const notAttended = memberMeetings.length - attended;
            const attendanceRate = Math.round((attended / memberMeetings.length) * 100);
            
            context.push(`Toplantı İstatistikleri: ${attended} toplantıya katıldı, ${notAttended} toplantıya katılmadı (Katılım Oranı: %${attendanceRate})`);
            
            // Katıldığı toplantılar
            if (attended > 0) {
              const attendedMeetings = memberMeetings
                .filter(m => {
                  const attendee = m.attendees.find(a => String(a.memberId) === memberId);
                  return attendee && attendee.attended === true;
                })
                .map(m => `${m.name || 'İsimsiz'} (${m.date || 'Tarih yok'})`)
                .slice(0, 5)
                .join(', ');
              context.push(`Katıldığı toplantılar: ${attendedMeetings}${attended > 5 ? ' ve diğerleri...' : ''}`);
            }
            
            // Katılmadığı toplantılar
            if (notAttended > 0) {
              const notAttendedMeetings = memberMeetings
                .filter(m => {
                  const attendee = m.attendees.find(a => String(a.memberId) === memberId);
                  return !attendee || attendee.attended !== true;
                })
                .map(m => `${m.name || 'İsimsiz'} (${m.date || 'Tarih yok'})`)
                .slice(0, 5)
                .join(', ');
              context.push(`Katılmadığı toplantılar: ${notAttendedMeetings}${notAttended > 5 ? ' ve diğerleri...' : ''}`);
            }
          } else {
            context.push(`Toplantı İstatistikleri: Bu üye henüz hiçbir toplantıya katılmamış.`);
          }
        }
        
        // Etkinlik Katılım Bilgisi
        const events = siteData.events || [];
        if (events && events.length > 0) {
          const memberEvents = events.filter(e => {
            if (!e.attendees) return false;
            return e.attendees.some(a => String(a.memberId) === memberId);
          });
          
          if (memberEvents.length > 0) {
            const attendedEvents = memberEvents.filter(e => {
              const attendee = e.attendees.find(a => String(a.memberId) === memberId);
              return attendee && attendee.attended === true;
            }).length;
            context.push(`Etkinlik İstatistikleri: ${attendedEvents} etkinliğe katıldı (Toplam ${memberEvents.length} etkinlikte yer aldı)`);
          }
        }
        
        // MAHALLE/KÖY TEMSİLCİSİ BİLGİSİ
        const neighborhoodReps = siteData.neighborhoodRepresentatives || [];
        const villageReps = siteData.villageRepresentatives || [];
        const memberNeighborhoodRep = neighborhoodReps.find(rep => {
          const repMemberId = rep.member_id || rep.memberId;
          return String(repMemberId) === memberId;
        });
        const memberVillageRep = villageReps.find(rep => {
          const repMemberId = rep.member_id || rep.memberId;
          return String(repMemberId) === memberId;
        });
        
        if (memberNeighborhoodRep) {
          const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(memberNeighborhoodRep.neighborhood_id));
          const district = siteData.districts?.find(d => String(d.id) === String(memberNeighborhoodRep.district_id));
          const repInfo = [];
          repInfo.push(`Mahalle Temsilcisi`);
          if (neighborhood) repInfo.push(`Mahalle: ${neighborhood.name}`);
          if (district) repInfo.push(`İlçe: ${district.name}`);
          if (memberNeighborhoodRep.member_phone) repInfo.push(`Telefon: ${memberNeighborhoodRep.member_phone}`);
          context.push(repInfo.join(' | '));
        }
        
        if (memberVillageRep) {
          const village = siteData.villages?.find(v => String(v.id) === String(memberVillageRep.village_id));
          const district = siteData.districts?.find(d => String(d.id) === String(memberVillageRep.district_id));
          const repInfo = [];
          repInfo.push(`Köy Temsilcisi`);
          if (village) repInfo.push(`Köy: ${village.name}`);
          if (district) repInfo.push(`İlçe: ${district.name}`);
          if (memberVillageRep.member_phone) repInfo.push(`Telefon: ${memberVillageRep.member_phone}`);
          context.push(repInfo.join(' | '));
        }
        
        // MAHALLE/KÖY SORUMLUSU (MÜFETTİŞ) BİLGİSİ
        const neighborhoodSups = siteData.neighborhoodSupervisors || [];
        const villageSups = siteData.villageSupervisors || [];
        const memberNeighborhoodSup = neighborhoodSups.find(sup => {
          const supMemberId = sup.member_id || sup.memberId;
          return String(supMemberId) === memberId;
        });
        const memberVillageSup = villageSups.find(sup => {
          const supMemberId = sup.member_id || sup.memberId;
          return String(supMemberId) === memberId;
        });
        
        if (memberNeighborhoodSup) {
          const neighborhood = siteData.neighborhoods?.find(n => String(n.id) === String(memberNeighborhoodSup.neighborhood_id));
          const district = siteData.districts?.find(d => String(d.id) === String(memberNeighborhoodSup.district_id));
          const supInfo = [];
          supInfo.push(`Mahalle Sorumlusu (Müfettiş)`);
          if (neighborhood) supInfo.push(`Mahalle: ${neighborhood.name}`);
          if (district) supInfo.push(`İlçe: ${district.name}`);
          if (memberNeighborhoodSup.member_phone) supInfo.push(`Telefon: ${memberNeighborhoodSup.member_phone}`);
          context.push(supInfo.join(' | '));
        }
        
        if (memberVillageSup) {
          const village = siteData.villages?.find(v => String(v.id) === String(memberVillageSup.village_id));
          const district = siteData.districts?.find(d => String(d.id) === String(memberVillageSup.district_id));
          const supInfo = [];
          supInfo.push(`Köy Sorumlusu (Müfettiş)`);
          if (village) supInfo.push(`Köy: ${village.name}`);
          if (district) supInfo.push(`İlçe: ${district.name}`);
          if (memberVillageSup.member_phone) supInfo.push(`Telefon: ${memberVillageSup.member_phone}`);
          context.push(supInfo.join(' | '));
        }
        
        // MÜŞAHİT BİLGİSİ
        const observers = siteData.observers || [];
        const memberObservers = observers.filter(obs => {
          const obsMemberId = obs.member_id || obs.memberId || obs.observer_member_id;
          return String(obsMemberId) === memberId;
        });
        
        if (memberObservers.length > 0) {
          memberObservers.forEach(observer => {
            const ballotBox = siteData.ballotBoxes?.find(b => String(b.id) === String(observer.ballot_box_id));
            const district = siteData.districts?.find(d => String(d.id) === String(observer.observer_district_id));
            const obsInfo = [];
            if (observer.is_chief_observer === true) {
              obsInfo.push(`Baş Müşahit`);
            } else {
              obsInfo.push(`Müşahit`);
            }
            if (ballotBox) obsInfo.push(`Sandık: ${ballotBox.ballot_box_number || 'No yok'}`);
            if (district) obsInfo.push(`İlçe: ${district.name}`);
            if (observer.observer_phone) obsInfo.push(`Telefon: ${observer.observer_phone}`);
            context.push(obsInfo.join(' | '));
          });
        }
        
        // ÜYE KAYITLARI BİLGİSİ (Bu üyenin kaydettiği üye sayıları ve tarihleri)
        const memberRegistrations = siteData.memberRegistrations || [];
        const memberRegs = memberRegistrations.filter(reg => String(reg.memberId) === memberId);
        
        if (memberRegs.length > 0) {
          context.push(`\n=== ÜYE KAYITLARI ===`);
          const totalCount = memberRegs.reduce((sum, reg) => sum + (reg.count || 0), 0);
          context.push(`${member.name} toplam ${totalCount} üye kaydetti (${memberRegs.length} kayıt)`);
          
          memberRegs.forEach(reg => {
            const regInfo = [];
            if (reg.count) regInfo.push(`${reg.count} üye`);
            if (reg.date) regInfo.push(`Tarih: ${reg.date}`);
            if (reg.createdAt) {
              const date = new Date(reg.createdAt);
              regInfo.push(`Kayıt Tarihi: ${date.toLocaleDateString('tr-TR')}`);
            }
            if (regInfo.length > 0) {
              context.push(`  - ${regInfo.join(' | ')}`);
            }
          });
        }
        
        // İLÇE/BELDE YÖNETİMİ BİLGİSİ
        const districtOfficials = siteData.districtOfficials || [];
        const townOfficials = siteData.townOfficials || [];
        const districtDeputyInspectors = siteData.districtDeputyInspectors || [];
        const townDeputyInspectors = siteData.townDeputyInspectors || [];
        
        const memberDistrictOfficial = districtOfficials.find(off => 
          (off.chairman_id && String(off.chairman_id) === memberId) ||
          (off.inspector_id && String(off.inspector_id) === memberId)
        );
        
        const memberTownOfficial = townOfficials.find(off => 
          (off.chairman_id && String(off.chairman_id) === memberId) ||
          (off.inspector_id && String(off.inspector_id) === memberId)
        );
        
        const memberDistrictDeputy = districtDeputyInspectors.find(dep => {
          const depMemberId = dep.member_id || dep.memberId;
          return String(depMemberId) === memberId;
        });
        
        const memberTownDeputy = townDeputyInspectors.find(dep => {
          const depMemberId = dep.member_id || dep.memberId;
          return String(depMemberId) === memberId;
        });
        
        if (memberDistrictOfficial) {
          const district = siteData.districts?.find(d => String(d.id) === String(memberDistrictOfficial.district_id));
          const officialInfo = [];
          if (memberDistrictOfficial.chairman_id && String(memberDistrictOfficial.chairman_id) === memberId) {
            officialInfo.push(`İlçe Başkanı`);
          }
          if (memberDistrictOfficial.inspector_id && String(memberDistrictOfficial.inspector_id) === memberId) {
            officialInfo.push(`İlçe Müfettişi`);
          }
          if (district) officialInfo.push(`İlçe: ${district.name}`);
          context.push(officialInfo.join(' | '));
        }
        
        if (memberTownOfficial) {
          const town = siteData.towns?.find(t => String(t.id) === String(memberTownOfficial.town_id));
          const officialInfo = [];
          if (memberTownOfficial.chairman_id && String(memberTownOfficial.chairman_id) === memberId) {
            officialInfo.push(`Belde Başkanı`);
          }
          if (memberTownOfficial.inspector_id && String(memberTownOfficial.inspector_id) === memberId) {
            officialInfo.push(`Belde Müfettişi`);
          }
          if (town) officialInfo.push(`Belde: ${town.name}`);
          context.push(officialInfo.join(' | '));
        }
        
        if (memberDistrictDeputy) {
          const district = siteData.districts?.find(d => String(d.id) === String(memberDistrictDeputy.district_id));
          const deputyInfo = [];
          deputyInfo.push(`İlçe Müfettiş Yardımcısı`);
          if (district) deputyInfo.push(`İlçe: ${district.name}`);
          context.push(deputyInfo.join(' | '));
        }
        
        if (memberTownDeputy) {
          const town = siteData.towns?.find(t => String(t.id) === String(memberTownDeputy.town_id));
          const deputyInfo = [];
          deputyInfo.push(`Belde Müfettiş Yardımcısı`);
          if (town) deputyInfo.push(`Belde: ${town.name}`);
          context.push(deputyInfo.join(' | '));
        }
      });
    }
    
    return context;
  }
}

export default GroqService;

