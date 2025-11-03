import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../utils/ApiService';
import MemberDetails from '../components/MemberDetails';
import { calculateMeetingStats } from '../components/Members/membersUtils';
import SettingsPage from './SettingsPage';
import EventsPage from './EventsPage';
import BallotBoxesPage from './BallotBoxesPage';
import ObserversPage from './ObserversPage';
import MemberForm from '../components/MemberForm';
import CreateMeetingForm from '../components/CreateMeetingForm';
import MembersPage from './MembersPage';
import MeetingsPage from './MeetingsPage';
import CalendarPage from './CalendarPage';
import DistrictsPage from './DistrictsPage';

const MemberDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [memberRegistrations, setMemberRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'stk-management', 'stk-events', 'ballot-boxes', 'observers', 'members-page', 'meetings-page', 'calendar-page', 'districts-page'
  const [grantedPermissions, setGrantedPermissions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (user && user.role === 'member') {
      fetchMemberData();
    }
  }, [user]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      
      // Fetch member details
      const memberResponse = await ApiService.getMemberById(user.memberId);
      setMember(memberResponse);
      
      // Fetch all members for management chart
      const membersResponse = await ApiService.getMembers();
      setMembers(membersResponse);
      
      // Fetch meetings
      const meetingsResponse = await ApiService.getMeetings();
      setMeetings(meetingsResponse);
      
      // Fetch events
      const eventsResponse = await ApiService.getEvents();
      setEvents(eventsResponse);
      
      // Fetch member registrations
      const registrationsResponse = await ApiService.getMemberRegistrations();
      setMemberRegistrations(registrationsResponse);

      // Fetch regions/positions for forms
      try {
        const [regionsRes, positionsRes] = await Promise.all([
          ApiService.getRegions(),
          ApiService.getPositions()
        ]);
        setRegions(Array.isArray(regionsRes) ? regionsRes : []);
        setPositions(Array.isArray(positionsRes) ? positionsRes : []);
      } catch (_) {}

      // load position-based permissions
      try {
        const perms = await ApiService.getPermissionsForPosition(memberResponse.position);
        setGrantedPermissions(Array.isArray(perms) ? perms : []);
      } catch (_) {
        setGrantedPermissions([]);
      }
      
    } catch (error) {
      console.error('Error fetching member data:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Kişisel bilgileriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata Oluştu</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Üye Bulunamadı</h2>
          <p className="text-gray-600">Üye bilgileri bulunamadı</p>
        </div>
      </div>
    );
  }

  // STK Management view
  if (currentView === 'stk-management') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">STK Yönetimi</h1>
                  <p className="mt-1 text-sm text-gray-600">STK ekleme, düzenleme ve silme işlemleri</p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SettingsPage tab="stks" />
        </div>
      </div>
    );
  }

  // STK Events view
  if (currentView === 'stk-events') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Etkinlik Yönetimi</h1>
                  <p className="mt-1 text-sm text-gray-600">Etkinlik oluşturma ve yönetimi</p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <EventsPage />
        </div>
      </div>
    );
  }

  // Add Member view
  if (currentView === 'add-member') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Üye Ekle</h1>
                  <p className="mt-1 text-sm text-gray-600">Yeni üye kaydı oluşturun</p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <MemberForm
              regions={regions.map(r => r.name)}
              positions={positions.map(p => p.name)}
              onClose={() => setCurrentView('dashboard')}
              onMemberSaved={() => setCurrentView('dashboard')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Create Meeting view
  if (currentView === 'create-meeting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Toplantı Oluştur</h1>
                  <p className="mt-1 text-sm text-gray-600">Seçili bölgelere toplantı planlayın</p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <CreateMeetingForm
              regions={regions}
              onClose={() => setCurrentView('dashboard')}
              onMeetingCreated={() => setCurrentView('dashboard')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Embedded Pages via permissions
  if (currentView === 'members-page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Üyeler</h1>
              <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Geri Dön</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MembersPage />
        </div>
      </div>
    );
  }
  if (currentView === 'meetings-page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Toplantılar</h1>
              <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Geri Dön</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MeetingsPage />
        </div>
      </div>
    );
  }
  if (currentView === 'calendar-page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
              <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Geri Dön</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CalendarPage />
        </div>
      </div>
    );
  }
  if (currentView === 'districts-page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6 lg:py-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">İlçeler</h1>
              <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Geri Dön</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <DistrictsPage />
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Hoş Geldiniz, {member.name}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                    {member.position} - {member.region}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Kullanıcı Adı</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Çıkış Yap</span>
                  <span className="sm:hidden">Çıkış</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Navigation */}
        {currentView !== 'dashboard' && (
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard'a Dön
            </button>
          </div>
        )}

        {/* Render different views */}
        {currentView === 'stk-management' && (
          <SettingsPage tab="stks" />
        )}
        
        {currentView === 'stk-events' && (
          <EventsPage />
        )}
        {currentView === 'ballot-boxes' && (
          <BallotBoxesPage />
        )}
        {currentView === 'observers' && (
          <ObserversPage />
        )}
        

        {currentView === 'dashboard' && (
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Kişisel Dashboard</h2>
                  <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">
                    Bu sayfada sadece sizin bilgileriniz ve katılım durumunuz görüntülenmektedir.
                  </p>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white bg-opacity-10 rounded-full -translate-y-8 sm:-translate-y-12 lg:-translate-y-16 translate-x-8 sm:translate-x-12 lg:translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white bg-opacity-10 rounded-full translate-y-6 sm:translate-y-8 lg:translate-y-12 -translate-x-6 sm:-translate-x-8 lg:-translate-x-12"></div>
          </div>

          {/* STK/Etkinlik Yönetimi - position-based permissions */}
          {(grantedPermissions.includes('manage_stk') || grantedPermissions.includes('create_event') || member.position === 'STK Birim Başkanı' || member.position === 'STK birim başk' || member.position === 'Stk Birim Başk') && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  STK Yönetimi
                </h3>
                <p className="text-sm text-gray-600 mt-1">STK ekleme ve etkinlik oluşturma işlemleri</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(grantedPermissions.includes('manage_stk') || member.position === 'STK Birim Başkanı' || member.position === 'STK birim başk' || member.position === 'Stk Birim Başk') && (
                  <button
                    onClick={() => {
                      console.log('STK Ekleme butonuna tıklandı');
                      setCurrentView('stk-management');
                    }}
                    className="group p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700">STK Ekleme</h4>
                        <p className="text-sm text-gray-600">Yeni STK ekleyin ve yönetin</p>
                      </div>
                    </div>
                  </button>
                  )}
                  
                  {(grantedPermissions.includes('create_event') || member.position === 'STK Birim Başkanı' || member.position === 'STK birim başk' || member.position === 'Stk Birim Başk') && (
                  <button
                    onClick={() => {
                      console.log('Etkinlik Oluşturma butonuna tıklandı');
                      setCurrentView('stk-events');
                    }}
                    className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">Etkinlik Oluşturma</h4>
                        <p className="text-sm text-gray-600">Yeni etkinlik oluşturun ve yönetin</p>
                      </div>
                    </div>
                  </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mesajlaşma kaldırıldı */}

          {/* Seçim Hazırlıkları - Sandıklar/Müşahitler erişimi */}
          {(grantedPermissions.includes('access_ballot_boxes') || grantedPermissions.includes('add_ballot_box') || grantedPermissions.includes('access_observers') || grantedPermissions.includes('add_observer')) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Seçim Hazırlıkları
                </h3>
                <p className="text-sm text-gray-600 mt-1">Sandıklar ve Müşahitler işlemleri</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(grantedPermissions.includes('access_ballot_boxes') || grantedPermissions.includes('add_ballot_box')) && (
                    <button
                      onClick={() => setCurrentView('ballot-boxes')}
                      className="group p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:from-amber-100 hover:to-amber-200 transition-all duration-200 hover:shadow-md text-left w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center group-hover:bg-amber-600 transition-colors duration-200">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 10h14l-1 9H6l-1-9zM8 7V5a4 4 0 118 0v2" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-amber-700">Sandıklar</h4>
                          <p className="text-sm text-gray-600">Listele ve {(grantedPermissions.includes('add_ballot_box')) ? 'sandık ekle' : 'görüntüle'}</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {(grantedPermissions.includes('access_observers') || grantedPermissions.includes('add_observer')) && (
                    <button
                      onClick={() => setCurrentView('observers')}
                      className="group p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 hover:shadow-md text-left w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-200">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700">Müşahitler</h4>
                          <p className="text-sm text-gray-600">Listele ve {(grantedPermissions.includes('add_observer')) ? 'müşahit ekle' : 'görüntüle'}</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hızlı İşlemler - görev bazlı */}
          {(grantedPermissions.includes('add_member') || grantedPermissions.includes('create_meeting') || grantedPermissions.includes('add_stk')) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Hızlı İşlemler
                </h3>
                <p className="text-sm text-gray-600 mt-1">Yetkilendirildiğiniz işlemler</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {grantedPermissions.includes('add_member') && (
                    <button
                      onClick={() => setCurrentView('add-member')}
                      className="group p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200 hover:from-teal-100 hover:to-teal-200 transition-all duration-200 hover:shadow-md text-left w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center group-hover:bg-teal-600 transition-colors duration-200">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M9 7a4 4 0 100 8 4 4 0 000-8z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-teal-700">Üye Ekle</h4>
                          <p className="text-sm text-gray-600">Yeni üye kaydı oluştur</p>
                        </div>
                      </div>
                    </button>
                  )}
                  {grantedPermissions.includes('create_meeting') && (
                    <button
                      onClick={() => setCurrentView('create-meeting')}
                      className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 hover:shadow-md text-left w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-200">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">Toplantı Oluştur</h4>
                          <p className="text-sm text-gray-600">Bölgelere toplantı planla</p>
                        </div>
                      </div>
                    </button>
                  )}
                  {grantedPermissions.includes('add_stk') && (
                    <button
                      onClick={() => setCurrentView('stk-management')}
                      className="group p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 hover:shadow-md text-left w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-200">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700">STK Ekle</h4>
                          <p className="text-sm text-gray-600">Yeni STK kaydı oluştur</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sayfa Erişimleri - görev bazlı */}
          {(grantedPermissions.includes('access_members_page') || grantedPermissions.includes('access_meetings_page') || grantedPermissions.includes('access_calendar_page') || grantedPermissions.includes('access_districts_page')) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-sky-100">
                <h3 className="text-lg font-semibold text-gray-900">Sayfa Erişimleri</h3>
                <p className="text-sm text-gray-600 mt-1">Yetkilendirildiğiniz sayfalara erişim</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {grantedPermissions.includes('access_members_page') && (
                    <button onClick={() => setCurrentView('members-page')} className="px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 text-left shadow-sm">Üyeler</button>
                  )}
                  {grantedPermissions.includes('access_meetings_page') && (
                    <button onClick={() => setCurrentView('meetings-page')} className="px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 text-left shadow-sm">Toplantılar</button>
                  )}
                  {grantedPermissions.includes('access_calendar_page') && (
                    <button onClick={() => setCurrentView('calendar-page')} className="px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 text-left shadow-sm">Takvim</button>
                  )}
                  {grantedPermissions.includes('access_districts_page') && (
                    <button onClick={() => setCurrentView('districts-page')} className="px-4 py-3 rounded-xl border bg-white hover:bg-gray-50 text-left shadow-sm">İlçeler</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Member Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <MemberDetails
              member={member}
              members={members}
              meetings={meetings}
              events={events}
              memberRegistrations={memberRegistrations}
              calculateMeetingStats={calculateMeetingStats}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboardPage;
