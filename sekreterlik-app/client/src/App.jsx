import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import MeetingsPage from './pages/MeetingsPage';
import EventsPage from './pages/EventsPage';
import ArchivePage from './pages/ArchivePage';
import SettingsPage from './pages/SettingsPage';
import ManagementChartPage from './pages/ManagementChartPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import DistrictsPage from './pages/DistrictsPage';
import DistrictMembersPage from './pages/DistrictMembersPage';
import DistrictDetailsPage from './pages/DistrictDetailsPage';
import TownMembersPage from './pages/TownMembersPage';
import TownDetailsPage from './pages/TownDetailsPage';
import ElectionPreparationPage from './pages/ElectionPreparationPage';
import BallotBoxesPage from './pages/BallotBoxesPage';
import BallotBoxDetailsPage from './pages/BallotBoxDetailsPage';
import ObserversPage from './pages/ObserversPage';
import RepresentativesPage from './pages/RepresentativesPage';
import NeighborhoodsPage from './pages/NeighborhoodsPage';
import VillagesPage from './pages/VillagesPage';
import DistrictPresidentDashboardPage from './pages/DistrictPresidentDashboardPage';
import TownPresidentDashboardPage from './pages/TownPresidentDashboardPage';
import CalendarPage from './pages/CalendarPage';
import CreateAdminPage from './pages/CreateAdminPage';
import CheckAdminPage from './pages/CheckAdminPage';
import DebugFirebasePage from './pages/DebugFirebasePage';
import ClearAllDataPage from './pages/ClearAllDataPage';
import Sidebar from './components/Sidebar';
import PWANotification from './components/PWANotification';
import AppInstallBanner from './components/AppInstallBanner';
import OfflineStatus from './components/OfflineStatus';
// import PerformanceMonitor from './components/PerformanceMonitor'; // Disabled - causes localhost:5000 errors

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  return isLoggedIn ? children : <Navigate to="/login" />;
};

// Admin only route component
const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role === 'admin') return children;
  if (user?.role === 'member') return <Navigate to="/member-dashboard" />;
  if (user?.role === 'district_president') return <Navigate to="/district-president-dashboard" />;
  if (user?.role === 'town_president') return <Navigate to="/town-president-dashboard" />;
  return <Navigate to="/login" />;
};

// Member only route component
const MemberRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role === 'admin') return children; // Admin can access everything
  if (user?.role === 'member') return children;
  if (user?.role === 'district_president') return <Navigate to="/district-president-dashboard" />;
  if (user?.role === 'town_president') return <Navigate to="/town-president-dashboard" />;
  return <Navigate to="/login" />;
};

// STK Manager route component (for STK birim başk)
const STKManagerRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role === 'admin') return children; // Admin can access everything
  if (user?.role === 'member' && (user?.position === 'STK birim başk' || user?.position === 'Stk Birim Başk')) {
    return children;
  }
  return <Navigate to="/member-dashboard" />;
};

// District President route component
const DistrictPresidentRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role === 'admin') return children; // Admin can access everything
  if (user?.role === 'district_president') return children;
  return <Navigate to="/login" />;
};

// Town President route component
const TownPresidentRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role === 'admin') return children; // Admin can access everything
  if (user?.role === 'town_president') return children;
  return <Navigate to="/login" />;
};

// Public route component (redirects to appropriate dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  if (!isLoggedIn) return children;
  if (user?.role === 'admin') return <Navigate to="/" />;
  if (user?.role === 'member') return <Navigate to="/member-dashboard" />;
  if (user?.role === 'district_president') return <Navigate to="/district-president-dashboard" />;
  if (user?.role === 'town_president') return <Navigate to="/town-president-dashboard" />;
  return <Navigate to="/" />;
};

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="min-h-screen bg-neutral-50">
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/create-admin" 
            element={<CreateAdminPage />} 
          />
          <Route 
            path="/check-admin" 
            element={<CheckAdminPage />} 
          />
          <Route 
            path="/debug-firebase" 
            element={<DebugFirebasePage />} 
          />
          <Route 
            path="/clear-all-data" 
            element={
              <AdminRoute>
                <ClearAllDataPage />
              </AdminRoute>
            } 
          />
          {/* Member Dashboard Route */}
          <Route 
            path="/member-dashboard" 
            element={
              <MemberRoute>
                <MemberDashboardPage />
              </MemberRoute>
            } 
          />

          
          {/* District President Dashboard Route */}
          <Route 
            path="/district-president-dashboard" 
            element={
              <DistrictPresidentRoute>
                <DistrictPresidentDashboardPage />
              </DistrictPresidentRoute>
            } 
          />
          
          {/* Town President Dashboard Route */}
          <Route 
            path="/town-president-dashboard" 
            element={
              <TownPresidentRoute>
                <TownPresidentDashboardPage />
              </TownPresidentRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/*" 
            element={
              <AdminRoute>
                <div className="flex h-screen">
                  {/* Desktop Sidebar */}
                  <div className="hidden lg:block">
                    <Sidebar />
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col">
                    {/* Mobile Header with Hamburger */}
                    <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <h1 className="text-lg font-bold text-indigo-700">Parti Sekreterliği</h1>
                        <div className="w-10"></div> {/* Spacer for centering */}
                      </div>
                    </div>
                    
                    {/* Mobile Menu Overlay */}
                    {isMobileMenuOpen && (
                      <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
                          <Sidebar onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
                        </div>
                      </div>
                    )}
                    
                    <main className="flex-1 p-3 sm:p-6 overflow-auto bg-gray-50">
                      <div className="max-w-7xl mx-auto w-full">
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/members" element={<MembersPage />} />
                          <Route path="/districts" element={<DistrictsPage />} />
                          <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/districts/:id/members" element={<DistrictMembersPage />} />
            <Route path="/districts/:id/details" element={<DistrictDetailsPage />} />
            <Route path="/towns/:id/members" element={<TownMembersPage />} />
            <Route path="/towns/:id/details" element={<TownDetailsPage />} />
            <Route path="/election-preparation" element={<ElectionPreparationPage />} />
            <Route path="/election-preparation/ballot-boxes" element={<BallotBoxesPage />} />
            <Route path="/election-preparation/ballot-boxes/:id/details" element={<BallotBoxDetailsPage />} />
            <Route path="/election-preparation/observers" element={<ObserversPage />} />
            <Route path="/election-preparation/representatives" element={<RepresentativesPage />} />
            <Route path="/election-preparation/neighborhoods" element={<NeighborhoodsPage />} />
            <Route path="/election-preparation/villages" element={<VillagesPage />} />
                          <Route path="/meetings" element={<MeetingsPage />} />
                          <Route path="/events" element={<EventsPage />} />
                          <Route path="/archive" element={<ArchivePage />} />
                          <Route path="/management-chart" element={<ManagementChartPage />} />
                          <Route path="/settings/*" element={<SettingsPage />} />
                          
                          {/* STK Manager Routes */}
                          <Route path="/stk-management" element={
                            <STKManagerRoute>
                              <SettingsPage />
                            </STKManagerRoute>
                          } />
                          <Route path="/stk-events" element={
                            <STKManagerRoute>
                              <EventsPage />
                            </STKManagerRoute>
                          } />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </div>
              </AdminRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <PWANotification />
      <AppInstallBanner />
      <OfflineStatus />
      {/* PerformanceMonitor temporarily disabled - causes localhost:5000 errors */}
      {/* <PerformanceMonitor /> */}
    </AuthProvider>
  );
}

export default App;