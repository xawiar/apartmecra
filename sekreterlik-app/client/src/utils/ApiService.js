import FirebaseApiService from './FirebaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Firebase kullanımı kontrolü - Environment variable ile kontrol edilir
// Render.com'da bu değer 'true' (string) olarak set edilmeli
const VITE_USE_FIREBASE_ENV = import.meta.env.VITE_USE_FIREBASE;
const USE_FIREBASE = 
  VITE_USE_FIREBASE_ENV === 'true' || 
  VITE_USE_FIREBASE_ENV === true ||
  String(VITE_USE_FIREBASE_ENV).toLowerCase() === 'true' ||
  // Production'da Render.com'da genellikle 'true' string olarak gelir
  (typeof window !== 'undefined' && window.location.hostname.includes('render.com') && VITE_USE_FIREBASE_ENV !== undefined);

// Debug log - ZORUNLU (production debug için)
if (typeof window !== 'undefined') {
  console.log('[ApiService] Firebase check:', {
    VITE_USE_FIREBASE: VITE_USE_FIREBASE_ENV,
    VITE_USE_FIREBASE_TYPE: typeof VITE_USE_FIREBASE_ENV,
    USE_FIREBASE,
    MODE: import.meta.env.MODE,
    HOSTNAME: window.location.hostname,
    WILL_USE_FIREBASE: USE_FIREBASE
  });
  
  // Uyarı: Eğer Firebase kullanılması gerekiyorsa ama kullanılmıyorsa
  if (VITE_USE_FIREBASE_ENV && !USE_FIREBASE) {
    console.warn('[ApiService] WARNING: VITE_USE_FIREBASE is set but USE_FIREBASE is false!', {
      env: VITE_USE_FIREBASE_ENV,
      type: typeof VITE_USE_FIREBASE_ENV
    });
  }
}

class ApiService {
  // Firebase kullanılıyorsa FirebaseApiService'i kullan
  static getService() {
    return USE_FIREBASE ? FirebaseApiService : ApiService;
  }

  static async fetchJsonWithRetry(url, options = {}, retryOnce = true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && retryOnce && (res.status === 429 || res.status >= 500)) {
        await new Promise(r => setTimeout(r, 400));
        const res2 = await fetch(url, options);
        return res2.json();
      }
      return res.json();
    } catch (e) {
      if (retryOnce) {
        await new Promise(r => setTimeout(r, 400));
        const res3 = await fetch(url, options);
        return res3.json();
      }
      throw e;
    }
  }
  // Helper method to get auth headers
  static getAuthHeaders(includeContentType = true) {
    const headers = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    // In a real implementation, you would add the auth token here
    // For now, we'll just return the headers as is since the backend 
    // doesn't actually validate tokens in this demo
    return headers;
  }

  // Auth API
  static async login(username, password) {
    // Firebase kullanılıyorsa FirebaseApiService'i kullan
    if (USE_FIREBASE) {
      return FirebaseApiService.login(username, password);
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    // Even on 401, return the response data so AuthContext can check response.success
    // The backend returns { success: false, message: '...' } on 401
    return data;
  }

  static async logout() {
    if (USE_FIREBASE) {
      return FirebaseApiService.logout();
    }

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Admin API
  static async getAdminInfo() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getAdminInfo();
    }
    const response = await fetch(`${API_BASE_URL}/auth/admin`);
    return response.json();
  }

  static async updateAdminCredentials(username, password, currentPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/admin`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username, password, currentPassword }),
    });
    return response.json();
  }

  // Member Users API
  static async getMemberUsers() {
    const response = await fetch(`${API_BASE_URL}/auth/member-users`);
    return response.json();
  }

  static async createMemberUser(memberId, username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/member-users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ memberId, username, password }),
    });
    return response.json();
  }

  static async updateMemberUser(id, username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/member-users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  }

  static async toggleMemberUserStatus(id) {
    const response = await fetch(`${API_BASE_URL}/auth/member-users/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async deleteMemberUser(id) {
    const response = await fetch(`${API_BASE_URL}/auth/member-users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Members API
  static async getMembers(archived = false) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMembers(archived);
    }
    
    const timestamp = Date.now();
    return this.fetchJsonWithRetry(`${API_BASE_URL}/members?archived=${archived}&_t=${timestamp}`);
  }

  static async getMemberById(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMemberById(id);
    }

    const response = await fetch(`${API_BASE_URL}/members/${id}`);
    return response.json();
  }

  static async createMember(memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createMember(memberData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(memberData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // If there are validation errors, include them in the error message
        let errorMessage = responseData.message || `HTTP ${response.status}: Unknown error`;
        if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          errorMessage += '\n\n' + responseData.errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
        }
        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createMember:', error);
      throw error;
    }
  }

  static async updateMember(id, memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateMember(id, memberData);
    }

    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Üye güncellenirken hata oluştu');
    }
    
    return response.json();
  }

  static async archiveMember(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.archiveMember(id);
    }

    const response = await fetch(`${API_BASE_URL}/members/${id}/archive`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Üye arşivlenirken bir hata oluştu' }));
      throw new Error(errorData.message || 'Üye arşivlenirken bir hata oluştu');
    }
    
    return response.json();
  }

  static async restoreMember(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.restoreMember(id);
    }

    const response = await fetch(`${API_BASE_URL}/members/${id}/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(false),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Üye geri yüklenirken bir hata oluştu' }));
      throw new Error(errorData.message || 'Üye geri yüklenirken bir hata oluştu');
    }
    
    return response.json();
  }

  static async importMembersFromExcel(file) {
    // Create FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Send the file to the server
    const response = await fetch(`${API_BASE_URL}/members/import`, {
      method: 'POST',
      // Don't set Content-Type when sending FormData, browser will set it correctly
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Üyeler içe aktarılırken hata oluştu');
    }
    
    return response.json();
  }

  static async exportMembersToExcel() {
    // In the updated implementation, this is handled directly in the component
    // This function is kept for compatibility but doesn't make an API call
    return Promise.resolve({ message: 'Export handled in component' });
  }

  // Meetings API
  static async getMeetings(archived = false) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMeetings(archived);
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    return this.fetchJsonWithRetry(`${API_BASE_URL}/meetings?archived=${archived}&_t=${timestamp}`);
  }

  static async getMeetingById(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMeetingById(id);
    }

    const response = await fetch(`${API_BASE_URL}/meetings/${id}`);
    return response.json();
  }

  static async createMeeting(meetingData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createMeeting(meetingData);
    }

    const response = await fetch(`${API_BASE_URL}/meetings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Toplantı oluşturulurken hata oluştu');
    }
    
    return response.json();
  }

  static async updateMeeting(id, meetingData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateMeeting(id, meetingData);
    }

    const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(meetingData),
    });
    return response.json();
  }

  static async archiveMeeting(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.archiveMeeting(id);
    }

    const response = await fetch(`${API_BASE_URL}/meetings/${id}/archive`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    return response.json();
  }

  static async updateAttendance(meetingId, memberId, attended) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateAttendance(meetingId, memberId, attended);
    }

    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/attendance`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ memberId, attended }),
    });
    return response.json();
  }

  // Add the new excuse update method
  static async updateExcuse(meetingId, memberId, hasExcuse, reason) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateExcuse(meetingId, memberId, hasExcuse, reason);
    }

    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/excuse`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ memberId, hasExcuse, reason }),
    });
    return response.json();
  }

  // Regions API
  static async getRegions() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getRegions();
    }
    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    return this.fetchJsonWithRetry(`${API_BASE_URL}/regions?_t=${timestamp}`);
  }

  static async createRegion(regionData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createRegion(regionData);
    }

    const response = await fetch(`${API_BASE_URL}/regions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(regionData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Bölge oluşturulamadı (HTTP ${response.status})`);
    }
    return data;
  }

  static async updateRegion(id, regionData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateRegion(id, regionData);
    }

    const response = await fetch(`${API_BASE_URL}/regions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(regionData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Bölge güncellenemedi (HTTP ${response.status})`);
    }
    return data;
  }

  static async deleteRegion(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteRegion(id);
    }

    const response = await fetch(`${API_BASE_URL}/regions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Bölge silinemedi (HTTP ${response.status})`);
    }
    return data;
  }

  // Positions API
  static async getPositions() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getPositions();
    }
    return this.fetchJsonWithRetry(`${API_BASE_URL}/positions`);
  }

  static async createPosition(positionData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createPosition(positionData);
    }

    const response = await fetch(`${API_BASE_URL}/positions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(positionData),
    });
    return response.json();
  }

  static async updatePosition(id, positionData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updatePosition(id, positionData);
    }

    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(positionData),
    });
    return response.json();
  }

  static async deletePosition(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deletePosition(id);
    }

    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    return response.json();
  }

  // Member Registrations API
  static async getMemberRegistrations() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMemberRegistrations();
    }
    
    return this.fetchJsonWithRetry(`${API_BASE_URL}/member-registrations`);
  }

  static async createMemberRegistration(registrationData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createMemberRegistration(registrationData);
    }

    const response = await fetch(`${API_BASE_URL}/member-registrations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(registrationData),
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  static async updateMemberRegistration(id, registrationData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateMemberRegistration(id, registrationData);
    }

    const response = await fetch(`${API_BASE_URL}/member-registrations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(registrationData),
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  static async deleteMemberRegistration(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteMemberRegistration(id);
    }

    const response = await fetch(`${API_BASE_URL}/member-registrations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Document Archive API
  static async getDocuments() {
    const response = await fetch(`${API_BASE_URL}/archive/documents`);
    if (!response.ok) {
      throw new Error('Belgeler getirilirken hata oluştu');
    }
    return response.json();
  }

  static async uploadDocument(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/archive/documents`, {
        method: 'POST',
        // Don't set Content-Type header when sending FormData
        body: formData,
      });
      
      // Check if response is ok
      if (!response.ok) {
        // Try to parse error response as JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          // If JSON parsing fails, it might be an HTML error page
          if (jsonError instanceof SyntaxError && response.status >= 500) {
            throw new Error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
          }
          // Re-throw if it's not a JSON parsing error
          throw jsonError;
        }
      }
      
      return response.json();
    } catch (error) {
      // Handle network errors or other fetch issues
      if (error instanceof TypeError) {
        throw new Error('Ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin.');
      }
      throw error;
    }
  }

  static async downloadDocument(id) {
    const response = await fetch(`${API_BASE_URL}/archive/documents/${id}/download`);
    if (!response.ok) {
      throw new Error('Belge indirilemedi');
    }
    return response.blob();
  }

  static async deleteDocument(id) {
    const response = await fetch(`${API_BASE_URL}/archive/documents/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Belge silinirken hata oluştu');
    }
    
    return response.json();
  }

  // Clear archived data API
  static async clearArchivedMembers() {
    const response = await fetch(`${API_BASE_URL}/archive/members/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Arşivlenmiş üyeler temizlenirken hata oluştu');
    }
    
    return response.json();
  }

  static async clearArchivedMeetings() {
    const response = await fetch(`${API_BASE_URL}/archive/meetings/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Arşivlenmiş toplantılar temizlenirken hata oluştu');
    }
    
    return response.json();
  }

  static async clearArchivedEvents() {
    const response = await fetch(`${API_BASE_URL}/archive/events/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Arşivlenmiş etkinlikler temizlenirken hata oluştu');
    }
    return response.json();
  }

  static async clearDocuments() {
    const response = await fetch(`${API_BASE_URL}/archive/documents/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Belgeler temizlenirken hata oluştu');
    }
    
    return response.json();
  }

  static async deleteArchivedMember(id) {
    // Debug: Firebase kontrolü - ZORUNLU
    const firebaseCheck = {
      id,
      USE_FIREBASE,
      VITE_USE_FIREBASE: VITE_USE_FIREBASE_ENV,
      VITE_USE_FIREBASE_TYPE: typeof VITE_USE_FIREBASE_ENV,
      API_BASE_URL,
      MODE: import.meta.env.MODE,
      HOSTNAME: typeof window !== 'undefined' ? window.location.hostname : 'server'
    };
    
    console.log('[ApiService.deleteArchivedMember] Called with:', firebaseCheck);

    // Firebase kullanılıyorsa KESİNLİKLE FirebaseApiService'i kullan
    if (USE_FIREBASE) {
      console.log('[ApiService.deleteArchivedMember] ✅ Using FirebaseApiService');
      try {
        const result = await FirebaseApiService.deleteArchivedMember(id);
        console.log('[ApiService.deleteArchivedMember] ✅ Firebase success:', result);
        return result;
      } catch (error) {
        console.error('[ApiService.deleteArchivedMember] ❌ Firebase error:', error);
        throw error;
      }
    }

    // UYARI: Firebase kullanılmıyorsa backend API'ye istek at
    console.warn('[ApiService.deleteArchivedMember] ⚠️ WARNING: Using backend API (Firebase disabled)!', `${API_BASE_URL}/archive/members/${id}`);
    console.warn('[ApiService.deleteArchivedMember] ⚠️ Environment check:', firebaseCheck);
    
    // Sadece Firebase kullanılmıyorsa backend API'ye istek at
    const response = await fetch(`${API_BASE_URL}/archive/members/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Arşivlenmiş üye silinirken hata oluştu');
    }

    return response.json();
  }

  static async deleteArchivedMeeting(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteArchivedMeeting(id);
    }

    const response = await fetch(`${API_BASE_URL}/archive/meetings/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(false),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Arşivlenmiş toplantı silinirken hata oluştu');
    }
    
    return response.json();
  }

  // Events API
  static async getEvents(archived = false) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getEvents(archived);
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    return this.fetchJsonWithRetry(`${API_BASE_URL}/events?archived=${archived}&_t=${timestamp}`);
  }

  static async getEventById(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getEventById(id);
    }

    const response = await fetch(`${API_BASE_URL}/events/${id}`);
    return response.json();
  }

  static async createEvent(eventData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createEvent(eventData);
    }

    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Etkinlik oluşturulurken hata oluştu');
    }
    
    return response.json();
  }

  static async updateEvent(id, eventData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateEvent(id, eventData);
    }

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData),
    });
    return response.json();
  }

  static async archiveEvent(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.archiveEvent(id);
    }

    const response = await fetch(`${API_BASE_URL}/events/${id}/archive`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async deleteEvent(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteEvent(id);
    }

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Etkinlik silinemedi (HTTP ${response.status})`);
    }
    return data;
  }

  // Personal Documents API methods
  static async getDocumentTypes() {
    const response = await fetch(`${API_BASE_URL}/personal-documents/document-types`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getPersonalDocuments(memberId) {
    const response = await fetch(`${API_BASE_URL}/personal-documents/member/${memberId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async uploadPersonalDocument(memberId, documentType, file) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);

    const response = await fetch(`${API_BASE_URL}/personal-documents/member/${memberId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Belge yüklenirken hata oluştu');
    }

    return response.json();
  }

  static async downloadPersonalDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/personal-documents/download/${documentId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Belge indirilirken hata oluştu');
    }

    return response.blob();
  }

  static async deletePersonalDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/personal-documents/${documentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Belge silinirken hata oluştu');
    }

    return response.json();
  }

  // Districts API
  static async getDistricts() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getDistricts();
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/districts?_t=${timestamp}`);
    return response.json();
  }

  static async createDistrict(districtData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createDistrict(districtData);
    }

    const response = await fetch(`${API_BASE_URL}/districts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(districtData),
    });
    return response.json();
  }

  static async updateDistrict(id, districtData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateDistrict(id, districtData);
    }

    const response = await fetch(`${API_BASE_URL}/districts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(districtData),
    });
    return response.json();
  }

  static async deleteDistrict(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteDistrict(id);
    }

    const response = await fetch(`${API_BASE_URL}/districts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `İlçe silinemedi (HTTP ${response.status})`);
    }
    return data;
  }

  // Towns API
  static async getTowns() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getTowns();
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/towns?_t=${timestamp}`);
    return response.json();
  }

  static async getTownById(townId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getTownById ? FirebaseApiService.getTownById(townId) : FirebaseService.getById('towns', townId);
    }

    const response = await fetch(`${API_BASE_URL}/towns/${townId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async getTownsByDistrict(districtId) {
    if (USE_FIREBASE) {
      const towns = await FirebaseApiService.getTowns();
      return towns ? towns.filter(t => t.district_id === districtId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/towns/district/${districtId}`);
    return response.json();
  }

  static async createTown(townData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createTown(townData);
    }

    const response = await fetch(`${API_BASE_URL}/towns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(townData),
    });
    return response.json();
  }

  static async updateTown(id, townData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateTown(id, townData);
    }

    const response = await fetch(`${API_BASE_URL}/towns/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(townData),
    });
    return response.json();
  }

  static async deleteTown(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteTown(id);
    }

    const response = await fetch(`${API_BASE_URL}/towns/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Belde silinemedi (HTTP ${response.status})`);
    }
    return data;
  }

  // Neighborhoods API
  static async getNeighborhoods() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getNeighborhoods();
    }

    const response = await fetch(`${API_BASE_URL}/neighborhoods`);
    return response.json();
  }

  static async getNeighborhoodsByDistrict(districtId) {
    if (USE_FIREBASE) {
      const neighborhoods = await FirebaseApiService.getNeighborhoods();
      return neighborhoods ? neighborhoods.filter(n => n.district_id === districtId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/neighborhoods/district/${districtId}`);
    return response.json();
  }

  static async createNeighborhood(neighborhoodData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createNeighborhood(neighborhoodData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhoods`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(neighborhoodData),
    });
    return response.json();
  }

  static async updateNeighborhood(id, neighborhoodData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateNeighborhood(id, neighborhoodData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhoods/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(neighborhoodData),
    });
    return response.json();
  }

  static async deleteNeighborhood(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteNeighborhood(id);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhoods/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Villages API
  static async getVillages() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getVillages();
    }

    const response = await fetch(`${API_BASE_URL}/villages`);
    return response.json();
  }

  static async getVillagesByDistrict(districtId) {
    if (USE_FIREBASE) {
      const villages = await FirebaseApiService.getVillages();
      return villages ? villages.filter(v => v.district_id === districtId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/villages/district/${districtId}`);
    return response.json();
  }

  static async createVillage(villageData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createVillage(villageData);
    }

    const response = await fetch(`${API_BASE_URL}/villages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(villageData),
    });
    return response.json();
  }

  static async updateVillage(id, villageData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateVillage(id, villageData);
    }

    const response = await fetch(`${API_BASE_URL}/villages/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(villageData),
    });
    return response.json();
  }

  static async deleteVillage(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteVillage(id);
    }

    const response = await fetch(`${API_BASE_URL}/villages/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // STKs API
  static async getSTKs() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getSTKs();
    }

    const response = await fetch(`${API_BASE_URL}/stks`);
    return response.json();
  }

  static async createSTK(stkData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createSTK(stkData);
    }

    const response = await fetch(`${API_BASE_URL}/stks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stkData),
    });
    return response.json();
  }

  static async updateSTK(id, stkData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateSTK(id, stkData);
    }

    const response = await fetch(`${API_BASE_URL}/stks/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stkData),
    });
    return response.json();
  }

  static async deleteSTK(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteSTK(id);
    }

    const response = await fetch(`${API_BASE_URL}/stks/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Mosques API
  static async getMosques() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getMosques();
    }

    const response = await fetch(`${API_BASE_URL}/mosques`);
    return response.json();
  }

  static async getMosquesByDistrict(districtId) {
    if (USE_FIREBASE) {
      const mosques = await FirebaseApiService.getMosques();
      return mosques ? mosques.filter(m => m.district_id === districtId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/mosques/district/${districtId}`);
    return response.json();
  }

  static async createMosque(mosqueData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createMosque(mosqueData);
    }

    const response = await fetch(`${API_BASE_URL}/mosques`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mosqueData),
    });
    return response.json();
  }

  static async updateMosque(id, mosqueData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateMosque(id, mosqueData);
    }

    const response = await fetch(`${API_BASE_URL}/mosques/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mosqueData),
    });
    return response.json();
  }

  static async deleteMosque(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteMosque(id);
    }

    const response = await fetch(`${API_BASE_URL}/mosques/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Event Categories API
  static async getEventCategories() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getEventCategories();
    }

    const response = await fetch(`${API_BASE_URL}/event-categories`);
    return response.json();
  }

  static async createEventCategory(categoryData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createEventCategory(categoryData);
    }

    const response = await fetch(`${API_BASE_URL}/event-categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });
    return response.json();
  }

  static async updateEventCategory(id, categoryData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateEventCategory(id, categoryData);
    }

    const response = await fetch(`${API_BASE_URL}/event-categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });
    return response.json();
  }

  static async deleteEventCategory(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteEventCategory(id);
    }

    const response = await fetch(`${API_BASE_URL}/event-categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Neighborhood Representatives API
  static async getNeighborhoodRepresentatives() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getNeighborhoodRepresentatives();
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-representatives`);
    return response.json();
  }

  static async getNeighborhoodRepresentativesByNeighborhood(neighborhoodId) {
    if (USE_FIREBASE) {
      const representatives = await FirebaseApiService.getNeighborhoodRepresentatives();
      return representatives ? representatives.filter(r => r.neighborhood_id === neighborhoodId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-representatives/neighborhood/${neighborhoodId}`);
    return response.json();
  }

  static async createNeighborhoodRepresentative(representativeData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createNeighborhoodRepresentative(representativeData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-representatives`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(representativeData),
    });
    return response.json();
  }

  static async updateNeighborhoodRepresentative(id, representativeData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateNeighborhoodRepresentative(id, representativeData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-representatives/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(representativeData),
    });
    return response.json();
  }

  static async deleteNeighborhoodRepresentative(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteNeighborhoodRepresentative(id);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-representatives/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Village Representatives API
  static async getVillageRepresentatives() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getVillageRepresentatives();
    }

    const response = await fetch(`${API_BASE_URL}/village-representatives`);
    return response.json();
  }

  static async getVillageRepresentativesByVillage(villageId) {
    if (USE_FIREBASE) {
      const representatives = await FirebaseApiService.getVillageRepresentatives();
      return representatives ? representatives.filter(r => r.village_id === villageId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/village-representatives/village/${villageId}`);
    return response.json();
  }

  static async createVillageRepresentative(representativeData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createVillageRepresentative(representativeData);
    }

    const response = await fetch(`${API_BASE_URL}/village-representatives`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(representativeData),
    });
    return response.json();
  }

  static async updateVillageRepresentative(id, representativeData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateVillageRepresentative(id, representativeData);
    }

    const response = await fetch(`${API_BASE_URL}/village-representatives/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(representativeData),
    });
    return response.json();
  }

  static async deleteVillageRepresentative(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteVillageRepresentative(id);
    }

    const response = await fetch(`${API_BASE_URL}/village-representatives/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Neighborhood Supervisors API
  static async getNeighborhoodSupervisors() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getNeighborhoodSupervisors();
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-supervisors`);
    return response.json();
  }

  static async getNeighborhoodSupervisorsByNeighborhood(neighborhoodId) {
    if (USE_FIREBASE) {
      const supervisors = await FirebaseApiService.getNeighborhoodSupervisors();
      return supervisors ? supervisors.filter(s => s.neighborhood_id === neighborhoodId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-supervisors/neighborhood/${neighborhoodId}`);
    return response.json();
  }

  static async createNeighborhoodSupervisor(supervisorData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createNeighborhoodSupervisor(supervisorData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-supervisors`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(supervisorData),
    });
    return response.json();
  }

  static async updateNeighborhoodSupervisor(id, supervisorData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateNeighborhoodSupervisor(id, supervisorData);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-supervisors/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(supervisorData),
    });
    return response.json();
  }

  static async deleteNeighborhoodSupervisor(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteNeighborhoodSupervisor(id);
    }

    const response = await fetch(`${API_BASE_URL}/neighborhood-supervisors/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Village Supervisors API
  static async getVillageSupervisors() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getVillageSupervisors();
    }

    const response = await fetch(`${API_BASE_URL}/village-supervisors`);
    return response.json();
  }

  static async getVillageSupervisorsByVillage(villageId) {
    if (USE_FIREBASE) {
      const supervisors = await FirebaseApiService.getVillageSupervisors();
      return supervisors ? supervisors.filter(s => s.village_id === villageId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/village-supervisors/village/${villageId}`);
    return response.json();
  }

  static async createVillageSupervisor(supervisorData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createVillageSupervisor(supervisorData);
    }

    const response = await fetch(`${API_BASE_URL}/village-supervisors`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(supervisorData),
    });
    return response.json();
  }

  static async updateVillageSupervisor(id, supervisorData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateVillageSupervisor(id, supervisorData);
    }

    const response = await fetch(`${API_BASE_URL}/village-supervisors/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(supervisorData),
    });
    return response.json();
  }

  static async deleteVillageSupervisor(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteVillageSupervisor(id);
    }

    const response = await fetch(`${API_BASE_URL}/village-supervisors/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // District Officials API
  static async getDistrictOfficials() {
    const response = await fetch(`${API_BASE_URL}/district-officials`);
    return response.json();
  }

  static async getDistrictOfficialsByDistrict(districtId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getDistrictOfficials(districtId);
    }

    const response = await fetch(`${API_BASE_URL}/district-officials/district/${districtId}`);
    return response.json();
  }

  static async createOrUpdateDistrictOfficials(officialsData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createOrUpdateDistrictOfficials(officialsData);
    }

    const response = await fetch(`${API_BASE_URL}/districts/officials`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(officialsData),
    });
    return response.json();
  }

  static async deleteDistrictOfficials(districtId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteDistrictOfficials(districtId);
    }

    const response = await fetch(`${API_BASE_URL}/district-officials/district/${districtId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getDistrictDeputyInspectors(districtId) {
    const response = await fetch(`${API_BASE_URL}/districts/${districtId}/deputy-inspectors`);
    return response.json();
  }

  static async getAllDistrictDeputyInspectors() {
    const response = await fetch(`${API_BASE_URL}/district-deputy-inspectors`);
    return response.json();
  }

  // Town Officials API
  static async getTownOfficials() {
    const response = await fetch(`${API_BASE_URL}/town-officials`);
    return response.json();
  }

  static async getTownOfficialsByTown(townId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getTownOfficials(townId);
    }

    const response = await fetch(`${API_BASE_URL}/town-officials/town/${townId}`);
    return response.json();
  }

  static async createOrUpdateTownOfficials(officialsData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createOrUpdateTownOfficials(officialsData);
    }

    const response = await fetch(`${API_BASE_URL}/town-officials`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(officialsData),
    });
    return response.json();
  }

  static async deleteTownOfficials(townId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteTownOfficials(townId);
    }

    const response = await fetch(`${API_BASE_URL}/town-officials/town/${townId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getTownDeputyInspectors(townId) {
    const response = await fetch(`${API_BASE_URL}/towns/${townId}/deputy-inspectors`);
    return response.json();
  }

  static async getAllTownDeputyInspectors() {
    const response = await fetch(`${API_BASE_URL}/town-deputy-inspectors`);
    return response.json();
  }

  // District Management Members API
  static async getDistrictManagementMembers(districtId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getDistrictManagementMembers(districtId);
    }

    const response = await fetch(`${API_BASE_URL}/district-management-members/district/${districtId}`);
    return response.json();
  }

  static async createDistrictManagementMember(memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createDistrictManagementMember(memberData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/district-management-members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(memberData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createDistrictManagementMember:', error);
      throw error;
    }
  }

  static async updateDistrictManagementMember(id, memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateDistrictManagementMember(id, memberData);
    }

    const response = await fetch(`${API_BASE_URL}/district-management-members/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(memberData),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  static async deleteDistrictManagementMember(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteDistrictManagementMember(id);
    }

    const response = await fetch(`${API_BASE_URL}/district-management-members/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  // Town Management Members API
  static async getTownManagementMembers(townId) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getTownManagementMembers(townId);
    }

    const response = await fetch(`${API_BASE_URL}/town-management-members/town/${townId}`);
    return response.json();
  }

  static async createTownManagementMember(memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createTownManagementMember(memberData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/town-management-members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(memberData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Include detailed validation errors if available
        let errorMessage = responseData.message || `HTTP ${response.status}`;
        if (responseData.errors && Array.isArray(responseData.errors)) {
          errorMessage = `Doğrulama hatası\n${responseData.errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`;
        }
        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createTownManagementMember:', error);
      throw error;
    }
  }

  static async updateTownManagementMember(id, memberData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateTownManagementMember(id, memberData);
    }

    const response = await fetch(`${API_BASE_URL}/town-management-members/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(memberData),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  static async deleteTownManagementMember(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteTownManagementMember(id);
    }

    const response = await fetch(`${API_BASE_URL}/town-management-members/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  // Ballot Boxes API
  static async getBallotBoxes() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getBallotBoxes();
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes`);
    return response.json();
  }

  static async getBallotBoxesByNeighborhood(neighborhoodId) {
    if (USE_FIREBASE) {
      const ballotBoxes = await FirebaseApiService.getBallotBoxes();
      return ballotBoxes ? ballotBoxes.filter(b => b.neighborhood_id === neighborhoodId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/neighborhood/${neighborhoodId}`);
    return response.json();
  }

  static async getBallotBoxesByVillage(villageId) {
    if (USE_FIREBASE) {
      const ballotBoxes = await FirebaseApiService.getBallotBoxes();
      return ballotBoxes ? ballotBoxes.filter(b => b.village_id === villageId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/village/${villageId}`);
    return response.json();
  }

  static async getBallotBox(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getBallotBoxById(id);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/${id}`);
    return response.json();
  }

  static async getBallotBoxById(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.getBallotBoxById(id);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/${id}`);
    return response.json();
  }

  // Update all user credentials
  static async updateAllCredentials() {
    const response = await fetch(`${API_BASE_URL}/auth/update-all-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // Push Notification API
  static async getVapidKey() {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/vapid-key`);
    return response.json();
  }

  static async subscribeToPush(subscriptionData) {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/subscribe`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(subscriptionData),
    });
    return response.json();
  }

  static async unsubscribeFromPush() {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/unsubscribe`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async sendTestNotification() {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({}),
    });
    return response.json();
  }

  static async sendNotificationToAll(title, body) {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/send-to-all`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title, body }),
    });
    return response.json();
  }

  static async getAllPushSubscriptions() {
    const response = await fetch(`${API_BASE_URL}/push-subscriptions/all`);
    return response.json();
  }

  // Position-based permissions
  static async getAllPermissions() {
    const res = await fetch(`${API_BASE_URL}/permissions`, { headers: this.getAuthHeaders() });
    return res.json();
  }

  static async getPermissionsForPosition(position) {
    const res = await fetch(`${API_BASE_URL}/permissions/${encodeURIComponent(position)}`, { headers: this.getAuthHeaders() });
    return res.json();
  }

  static async setPermissionsForPosition(position, permissions) {
    const res = await fetch(`${API_BASE_URL}/permissions/${encodeURIComponent(position)}`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Yetkiler kaydedilemedi');
    }
    return res.json();
  }

  // Message API (MongoDB)
  static async sendMessageToGroup(messageData) {
    const response = await fetch(`${API_BASE_URL}/mongo-messages/send-to-group`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    return response.json();
  }

  static async sendMessageToUser(messageData) {
    const response = await fetch(`${API_BASE_URL}/messages/send-to-user`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    return response.json();
  }

  static async getGroupMessages(groupId, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/mongo-messages/group/${groupId}?limit=${limit}&offset=${offset}`);
    return response.json();
  }

  static async getUserMessages(limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE_URL}/mongo-messages/user?limit=${limit}&offset=${offset}`);
    return response.json();
  }

  static async markMessageAsRead(messageId) {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/messages/unread-count`);
    return response.json();
  }

  static async deleteMessage(messageId) {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  // Message Group API
  static async createMessageGroup(groupData) {
    const response = await fetch(`${API_BASE_URL}/messages/groups`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(groupData),
    });
    return response.json();
  }

  static async getAllMessageGroups() {
    const response = await fetch(`${API_BASE_URL}/messages/groups`);
    return response.json();
  }

  static async getMessageGroupById(id) {
    const response = await fetch(`${API_BASE_URL}/messages/groups/${id}`);
    return response.json();
  }

  static async updateMessageGroup(id, groupData) {
    const response = await fetch(`${API_BASE_URL}/messages/groups/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(groupData),
    });
    return response.json();
  }

  static async deleteMessageGroup(id) {
    const response = await fetch(`${API_BASE_URL}/messages/groups/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getOrCreateGeneralGroup() {
    const response = await fetch(`${API_BASE_URL}/mongo-messages/groups/general/get-or-create`);
    return response.json();
  }

  static async createBallotBox(ballotBoxData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createBallotBox(ballotBoxData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ballot-boxes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ballotBoxData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createBallotBox:', error);
      throw error;
    }
  }

  static async updateBallotBox(id, ballotBoxData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateBallotBox(id, ballotBoxData);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(ballotBoxData),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  static async deleteBallotBox(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteBallotBox(id);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-boxes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  // Ballot Box Observers API
  static async getBallotBoxObservers() {
    if (USE_FIREBASE) {
      return FirebaseApiService.getBallotBoxObservers();
    }

    const response = await fetch(`${API_BASE_URL}/ballot-box-observers`);
    return response.json();
  }

  static async getBallotBoxObserversByBallotBox(ballotBoxId) {
    if (USE_FIREBASE) {
      const observers = await FirebaseApiService.getBallotBoxObservers();
      return observers ? observers.filter(o => o.ballot_box_id === ballotBoxId) : [];
    }

    const response = await fetch(`${API_BASE_URL}/ballot-box-observers/ballot-box/${ballotBoxId}`);
    return response.json();
  }

  static async getBallotBoxObserver(id) {
    if (USE_FIREBASE) {
      const observers = await FirebaseApiService.getBallotBoxObservers();
      return observers ? observers.find(o => o.id === id) : null;
    }

    const response = await fetch(`${API_BASE_URL}/ballot-box-observers/${id}`);
    return response.json();
  }

  static async createBallotBoxObserver(observerData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.createBallotBoxObserver(observerData);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ballot-box-observers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(observerData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createBallotBoxObserver:', error);
      throw error;
    }
  }

  static async updateBallotBoxObserver(id, observerData) {
    if (USE_FIREBASE) {
      return FirebaseApiService.updateBallotBoxObserver(id, observerData);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-box-observers/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(observerData),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  static async deleteBallotBoxObserver(id) {
    if (USE_FIREBASE) {
      return FirebaseApiService.deleteBallotBoxObserver(id);
    }

    const response = await fetch(`${API_BASE_URL}/ballot-box-observers/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
    }
    
    return responseData;
  }

  // Visit Counts API
  static async incrementVisit(locationType, locationId) {
    const response = await fetch(`${API_BASE_URL}/visits/increment/${locationType}/${locationId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async getVisitCount(locationType, locationId) {
    const response = await fetch(`${API_BASE_URL}/visits/count/${locationType}/${locationId}`);
    return response.json();
  }

  static async getAllVisitCounts(locationType) {
    const response = await fetch(`${API_BASE_URL}/visits/counts/${locationType}`);
    return response.json();
  }

  static async resetVisitCount(locationType, locationId) {
    const response = await fetch(`${API_BASE_URL}/visits/reset/${locationType}/${locationId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  static async processEventLocations(eventId, selectedLocationTypes, selectedLocations) {
    const response = await fetch(`${API_BASE_URL}/visits/process-event`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        eventId,
        selectedLocationTypes,
        selectedLocations
      }),
    });
    return response.json();
  }

}

export default ApiService;