import React from 'react';
import { 
  HomeHeader, 
  HomeSummaryCards, 
  HomeFeaturesGrid 
} from '../components/Home';

const HomePage = () => {
  return (
    <div className="py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Parti Sekreterliği Sistemi</h1>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg">
          Siyasi parti sekreterlerinin toplantı oluşturma, yönetim kurulu üyesi ekleme, 
          yoklama alma ve belge kaydetme gibi işlemleri yapabileceği kapsamlı bir sistem.
        </p>
      </div>

      {/* Summary Cards */}
      <HomeSummaryCards />

      {/* Features Grid */}
      <HomeFeaturesGrid />
    </div>
  );
};

export default HomePage;