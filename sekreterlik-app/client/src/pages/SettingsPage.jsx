import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSettings from '../components/AdminSettings';
import RegionsSettings from '../components/RegionsSettings';
import PositionsSettings from '../components/PositionsSettings';
import MemberUsersSettings from '../components/MemberUsersSettings';
import DistrictsSettings from '../components/DistrictsSettings';
import TownsSettings from '../components/TownsSettings';
import NeighborhoodsSettings from '../components/NeighborhoodsSettings';
import VillagesSettings from '../components/VillagesSettings';
import STKSettings from '../components/STKSettings';
import MosquesSettings from '../components/MosquesSettings';
import EventCategoriesSettings from '../components/EventCategoriesSettings';
import AuthorizationSettings from '../components/AuthorizationSettings';
import BylawsSettings from '../components/BylawsSettings';
import GroqApiSettings from '../components/GroqApiSettings';
import FirebaseConfigSettings from '../components/FirebaseConfigSettings';
import DeploymentConfigSettings from '../components/DeploymentConfigSettings';
import SmsSettings from '../components/SmsSettings';
import { 
  SettingsHeader, 
  SettingsSummaryCards, 
  SettingsTabs 
} from '../components/Settings';

const SettingsPage = ({ tab }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('admin');
  const isSTKManagement = searchParams.get('tab') === 'stks' || tab === 'stks';

  useEffect(() => {
    if (isSTKManagement) {
      setActiveTab('stks');
    }
  }, [isSTKManagement]);

  return (
    <div className="py-6">
      {/* Header Section */}
      {isSTKManagement ? (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">STK Yönetimi</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">STK ekleme, düzenleme ve silme işlemleri</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">STK Birim Başkanı</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SettingsHeader />
          <SettingsSummaryCards />
          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6">
          {activeTab === 'admin' && <AdminSettings />}
          {activeTab === 'regions' && <RegionsSettings />}
          {activeTab === 'positions' && <PositionsSettings />}
          {activeTab === 'member-users' && <MemberUsersSettings />}
          {activeTab === 'districts' && <DistrictsSettings />}
          {activeTab === 'towns' && <TownsSettings />}
          {activeTab === 'neighborhoods' && <NeighborhoodsSettings />}
          {activeTab === 'villages' && <VillagesSettings />}
          {activeTab === 'stks' && <STKSettings />}
          {activeTab === 'mosques' && <MosquesSettings />}
          {activeTab === 'event-categories' && <EventCategoriesSettings />}
          {activeTab === 'authorization' && <AuthorizationSettings />}
          {activeTab === 'bylaws' && <BylawsSettings />}
          {activeTab === 'groq-api' && <GroqApiSettings />}
          {activeTab === 'firebase-config' && <FirebaseConfigSettings />}
          {activeTab === 'deployment-config' && <DeploymentConfigSettings />}
          {activeTab === 'sms-config' && <SmsSettings />}
          {/* Push notifications removed */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;