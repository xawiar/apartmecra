/**
 * SMS Service
 * Türkiye'de yaygın SMS servis sağlayıcıları için genel bir interface
 * Şu anda Netgsm destekleniyor, gelecekte diğer servisler eklenebilir
 */

class SmsService {
  constructor() {
    this.provider = 'netgsm'; // 'netgsm', 'twilio', 'iletimerkezi', etc.
    this.config = null;
  }

  /**
   * SMS servis yapılandırmasını yükle
   */
  async loadConfig() {
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      if (USE_FIREBASE) {
        const { FirebaseService } = await import('./FirebaseService');
        try {
          const configDoc = await FirebaseService.getById('sms_config', 'main');
          if (configDoc) {
            this.config = configDoc;
            this.provider = configDoc.provider || 'netgsm';
          }
        } catch (error) {
          console.warn('SMS config not found, using default');
        }
      }
    } catch (error) {
      console.error('Error loading SMS config:', error);
    }
  }

  /**
   * Tek bir SMS gönder
   * @param {string} phone - Telefon numarası (5XXXXXXXXX formatında)
   * @param {string} message - Gönderilecek mesaj
   * @returns {Promise<{success: boolean, message: string, data?: any}>}
   */
  async sendSms(phone, message) {
    await this.loadConfig();
    
    if (!this.config || !this.config.apiKey || !this.config.apiSecret) {
      return {
        success: false,
        message: 'SMS yapılandırması bulunamadı. Lütfen ayarlardan SMS yapılandırmasını tamamlayın.'
      };
    }

    // Telefon numarasını temizle ve formatla
    const cleanPhone = this.formatPhoneNumber(phone);
    if (!cleanPhone) {
      return {
        success: false,
        message: 'Geçersiz telefon numarası formatı'
      };
    }

    try {
      switch (this.provider) {
        case 'netgsm':
          return await this.sendViaNetgsm(cleanPhone, message);
        case 'twilio':
          return await this.sendViaTwilio(cleanPhone, message);
        default:
          return {
            success: false,
            message: `Desteklenmeyen SMS servisi: ${this.provider}`
          };
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      return {
        success: false,
        message: `SMS gönderilemedi: ${error.message}`
      };
    }
  }

  /**
   * Toplu SMS gönder
   * @param {string[]} phones - Telefon numaraları array'i
   * @param {string} message - Gönderilecek mesaj
   * @returns {Promise<{success: boolean, message: string, sent: number, failed: number, errors?: any[]}>}
   */
  async sendBulkSms(phones, message) {
    await this.loadConfig();
    
    if (!this.config || !this.config.apiKey || !this.config.apiSecret) {
      return {
        success: false,
        message: 'SMS yapılandırması bulunamadı. Lütfen ayarlardan SMS yapılandırmasını tamamlayın.',
        sent: 0,
        failed: phones.length
      };
    }

    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Toplu gönderim için API'ye göre farklı stratejiler
    switch (this.provider) {
      case 'netgsm':
        // Netgsm toplu gönderim desteği
        const cleanPhones = phones.map(p => this.formatPhoneNumber(p)).filter(p => p);
        if (cleanPhones.length === 0) {
          return {
            success: false,
            message: 'Geçerli telefon numarası bulunamadı',
            sent: 0,
            failed: phones.length
          };
        }
        
        // Netgsm API'sine toplu gönderim isteği
        try {
          const response = await this.sendBulkViaNetgsm(cleanPhones, message);
          results.sent = response.sent || 0;
          results.failed = response.failed || 0;
          results.errors = response.errors || [];
          results.success = results.failed === 0;
        } catch (error) {
          // Hata durumunda tek tek göndermeyi dene
          for (const phone of cleanPhones) {
            try {
              await this.sendViaNetgsm(phone, message);
              results.sent++;
            } catch (err) {
              results.failed++;
              results.errors.push({ phone, error: err.message });
            }
          }
        }
        break;
      
      default:
        // Diğer servisler için tek tek gönder
        for (const phone of phones) {
          const cleanPhone = this.formatPhoneNumber(phone);
          if (!cleanPhone) {
            results.failed++;
            results.errors.push({ phone, error: 'Geçersiz telefon numarası' });
            continue;
          }

          try {
            const result = await this.sendSms(cleanPhone, message);
            if (result.success) {
              results.sent++;
            } else {
              results.failed++;
              results.errors.push({ phone, error: result.message });
            }
            // Rate limiting için kısa bir bekleme
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.failed++;
            results.errors.push({ phone, error: error.message });
          }
        }
        break;
    }

    return results;
  }

  /**
   * Netgsm üzerinden SMS gönder
   */
  async sendViaNetgsm(phone, message) {
    const { apiKey, apiSecret, sender } = this.config;
    
    // Netgsm API endpoint
    const apiUrl = 'https://api.netgsm.com.tr/sms/send/get';
    
    const params = new URLSearchParams({
      usercode: apiKey,
      password: apiSecret,
      gsmno: phone,
      message: message,
      msgheader: sender || 'NETGSM',
      dil: 'TR'
    });

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const responseText = await response.text();
      
      // Netgsm başarılı yanıt: "00" ile başlar
      if (responseText.startsWith('00')) {
        return {
          success: true,
          message: 'SMS başarıyla gönderildi',
          data: { messageId: responseText.trim() }
        };
      } else {
        // Hata kodları
        const errorMessages = {
          '20': 'Mesaj metni hatalı veya boş',
          '30': 'Geçersiz kullanıcı adı, şifre veya hesap',
          '40': 'Mesaj başlığı (sender) kayıtlı değil',
          '50': 'Abone hesabında yeterli kredi yok',
          '51': 'Gönderilecek numara formatı hatalı',
          '70': 'Hatalı sorgu. Gönderdiğiniz parametrelerden birisi hatalı veya zorunlu alanlardan birisi eksik'
        };
        
        return {
          success: false,
          message: errorMessages[responseText.trim()] || `SMS gönderilemedi: ${responseText.trim()}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `SMS gönderme hatası: ${error.message}`
      };
    }
  }

  /**
   * Netgsm üzerinden toplu SMS gönder
   */
  async sendBulkViaNetgsm(phones, message) {
    const { apiKey, apiSecret, sender } = this.config;
    
    // Netgsm toplu gönderim API endpoint
    const apiUrl = 'https://api.netgsm.com.tr/sms/send/bulk';
    
    // Telefon numaralarını virgülle ayırarak birleştir
    const gsmno = phones.join(',');
    
    const params = new URLSearchParams({
      usercode: apiKey,
      password: apiSecret,
      gsmno: gsmno,
      message: message,
      msgheader: sender || 'NETGSM',
      dil: 'TR'
    });

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const responseText = await response.text();
      
      if (responseText.startsWith('00')) {
        return {
          success: true,
          sent: phones.length,
          failed: 0,
          errors: []
        };
      } else {
        // Hata durumunda tek tek gönder
        const results = {
          sent: 0,
          failed: 0,
          errors: []
        };
        
        for (const phone of phones) {
          try {
            const result = await this.sendViaNetgsm(phone, message);
            if (result.success) {
              results.sent++;
            } else {
              results.failed++;
              results.errors.push({ phone, error: result.message });
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.failed++;
            results.errors.push({ phone, error: error.message });
          }
        }
        
        return results;
      }
    } catch (error) {
      throw new Error(`Toplu SMS gönderme hatası: ${error.message}`);
    }
  }

  /**
   * Twilio üzerinden SMS gönder (gelecekte eklenebilir)
   */
  async sendViaTwilio(phone, message) {
    // Twilio implementasyonu gelecekte eklenecek
    return {
      success: false,
      message: 'Twilio desteği henüz eklenmedi'
    };
  }

  /**
   * Telefon numarasını temizle ve formatla
   * @param {string} phone - Telefon numarası (çeşitli formatlar)
   * @returns {string|null} - Formatlanmış telefon numarası (5XXXXXXXXX) veya null
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Sadece rakamları al
    const digits = phone.replace(/\D/g, '');
    
    // Türkiye telefon numarası formatı kontrolü
    if (digits.length === 10 && digits.startsWith('5')) {
      // 5XXXXXXXXX formatı
      return digits;
    } else if (digits.length === 11 && digits.startsWith('05')) {
      // 05XXXXXXXXX formatı, başındaki 0'ı kaldır
      return digits.substring(1);
    } else if (digits.length === 13 && digits.startsWith('905')) {
      // 905XXXXXXXXX formatı, başındaki 90'ı kaldır
      return digits.substring(2);
    }
    
    return null;
  }

  /**
   * Mesaj formatını oluştur (planlanan toplantı/etkinlik için)
   * @param {string} memberName - Üye adı
   * @param {string} type - 'meeting' veya 'event'
   * @param {string} date - Tarih
   * @param {string} time - Saat
   * @param {string} customText - Özel metin
   * @returns {string} - Formatlanmış mesaj
   */
  formatScheduledMessage(memberName, type, date, time, customText = '') {
    const typeText = type === 'meeting' ? 'toplantı' : 'etkinlik';
    
    let message = `Sayın ${memberName}, ${date} tarihinde ${time} saatinde ${typeText} planlanmıştır.`;
    
    if (customText && customText.trim()) {
      message += ` ${customText}`;
    }
    
    return message;
  }

  /**
   * Toplu mesaj formatını oluştur
   * @param {string} memberName - Üye adı
   * @param {string} customText - Özel metin
   * @returns {string} - Formatlanmış mesaj
   */
  formatBulkMessage(memberName, customText) {
    return `Sn ${memberName}, ${customText}`;
  }
}

// Singleton instance
const smsService = new SmsService();

export default smsService;

