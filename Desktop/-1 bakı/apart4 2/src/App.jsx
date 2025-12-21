import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useRef, lazy, Suspense, useEffect } from 'react';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import BootstrapLayout from './components/BootstrapLayout';
import withObserverRestrictions from './components/withObserverRestrictions';
import ErrorBoundary from './components/ErrorBoundary';
import { getUser } from './utils/auth';
import { initializeKeepAlive, cleanupKeepAlive } from './utils/keepAlive';

// Lazy load pages for code splitting - reduces initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SiteDashboard = lazy(() => import('./pages/SiteDashboard'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const CompanyOrders = lazy(() => import('./pages/CompanyOrders'));
const ObserverDashboard = lazy(() => import('./pages/ObserverDashboard'));
const PersonnelDashboard = lazy(() => import('./pages/PersonnelDashboard'));
const Sites = lazy(() => import('./pages/Sites'));
const Companies = lazy(() => import('./pages/Companies'));
const Agreements = lazy(() => import('./pages/Agreements'));
const Cashier = lazy(() => import('./pages/Cashier'));
const PartnerShares = lazy(() => import('./pages/NewPartnerShares'));
const Settings = lazy(() => import('./pages/NewSettings'));
const CurrentStatus = lazy(() => import('./pages/CurrentStatus'));
const SitesMap = lazy(() => import('./pages/SitesMap'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
    <div className="text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
      <p className="mt-3 text-muted">Sayfa yükleniyor...</p>
    </div>
  </div>
);

// Apply observer restrictions to pages that need them
const ObserverRestrictedSites = withObserverRestrictions(Sites);
const ObserverRestrictedCompanies = withObserverRestrictions(Companies);
const ObserverRestrictedAgreements = withObserverRestrictions(Agreements);
const ObserverRestrictedCashier = withObserverRestrictions(Cashier);
const ObserverRestrictedPartnerShares = withObserverRestrictions(PartnerShares);
const ObserverRestrictedCurrentStatus = withObserverRestrictions(CurrentStatus);
const ObserverRestrictedSiteDashboard = withObserverRestrictions(SiteDashboard);

// Component to determine which dashboard to show - using ref to prevent re-renders
const DashboardRoute = () => {
  const userRef = useRef(null);
  if (userRef.current === null) {
    userRef.current = getUser();
  }
  const user = userRef.current;
  
  if (user && user.role === 'site_user') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SiteDashboard />
      </Suspense>
    );
  }
  if (user && user.role === 'observer') {
    // Check if observer has a specific site assigned
    if (user.siteId) {
      return (
        <Suspense fallback={<PageLoader />}>
          <ObserverRestrictedSiteDashboard />
        </Suspense>
      );
    }
    // If no specific site, show general observer dashboard
    return (
      <Suspense fallback={<PageLoader />}>
        <ObserverDashboard />
      </Suspense>
    );
  }
  if (user && user.role === 'company') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CompanyDashboard />
      </Suspense>
    );
  }
  if (user && user.role === 'personnel') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PersonnelDashboard />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  );
};

function App() {
  // Initialize keep-alive when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // User is logged in, start keep-alive
      initializeKeepAlive().catch(error => {
        console.error('Failed to initialize keep-alive:', error);
      });
    } else {
      // User is not logged in, stop keep-alive
      cleanupKeepAlive().catch(error => {
        console.error('Failed to cleanup keep-alive:', error);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (!localStorage.getItem('token')) {
        cleanupKeepAlive().catch(error => {
          console.error('Failed to cleanup keep-alive on unmount:', error);
        });
      }
    };
  }, []);

  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <BootstrapLayout>
                <DashboardRoute />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/company-dashboard" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <CompanyDashboard />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/company-orders" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <CompanyOrders />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/sites" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedSites />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/companies" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedCompanies />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/agreements" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedAgreements />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/cashier" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedCashier />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/partner-shares" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedPartnerShares />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/current-status" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Suspense fallback={<PageLoader />}>
                  <ObserverRestrictedCurrentStatus />
                </Suspense>
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/sites-map" element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <SitesMap />
              </Suspense>
            </PrivateRoute>
          } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;