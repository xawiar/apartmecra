import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useRef } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SiteDashboard from './pages/SiteDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import ObserverDashboard from './pages/ObserverDashboard';
import PersonnelDashboard from './pages/PersonnelDashboard';
import Sites from './pages/Sites';
import Companies from './pages/Companies';
import Agreements from './pages/Agreements';
import Cashier from './pages/Cashier';
import PartnerShares from './pages/NewPartnerShares';
import Settings from './pages/NewSettings';
import CurrentStatus from './pages/CurrentStatus';
import PrivateRoute from './components/PrivateRoute';
import BootstrapLayout from './components/BootstrapLayout';
import withObserverRestrictions from './components/withObserverRestrictions';
import { getUser } from './utils/auth';

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
    return <SiteDashboard />;
  }
  if (user && user.role === 'observer') {
    // Check if observer has a specific site assigned
    if (user.siteId) {
      return <ObserverRestrictedSiteDashboard />;
    }
    // If no specific site, show general observer dashboard
    return <ObserverDashboard />;
  }
  if (user && user.role === 'company') {
    return <CompanyDashboard />;
  }
  if (user && user.role === 'personnel') {
    return <PersonnelDashboard />;
  }
  return <Dashboard />;
};

function App() {

  return (
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
                <CompanyDashboard />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/sites" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedSites />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/companies" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedCompanies />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/agreements" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedAgreements />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/cashier" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedCashier />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/partner-shares" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedPartnerShares />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <BootstrapLayout>
                <Settings />
              </BootstrapLayout>
            </PrivateRoute>
          } />
          <Route path="/current-status" element={
            <PrivateRoute>
              <BootstrapLayout>
                <ObserverRestrictedCurrentStatus />
              </BootstrapLayout>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;