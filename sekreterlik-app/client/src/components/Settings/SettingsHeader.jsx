import React from 'react';

const SettingsHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Sistem ayarlarını yönetin</p>
      </div>
    </div>
  );
};

export default SettingsHeader;