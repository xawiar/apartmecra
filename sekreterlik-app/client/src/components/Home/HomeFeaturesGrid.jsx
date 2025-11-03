import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeFeaturesGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Üyeler",
      description: "Yönetim kurulu üyelerini kaydedin, listeleyin ve yönetin.",
      features: [
        "TC, isim, soyisim, telefon, görev ve bölge bilgileri",
        "Excel ile toplu yükleme ve indirme",
        "Filtreleme ve sıralama özellikleri"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: "/members",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Toplantılar",
      description: "Toplantı oluşturun, yoklama alın ve toplantı notlarını kaydedin.",
      features: [
        "Bölge bazlı toplantı oluşturma",
        "Katılımcı yoklama sistemi",
        "Toplantı notları ve detaylar"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: "/meetings",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Arşiv",
      description: "Belgeleri arşivleyin ve geçmiş toplantıları/üyeleri görüntüleyin.",
      features: [
        "Belgeleri kaydedin ve indirin",
        "Arşivlenmiş toplantılar ve üyeler",
        "Geçmiş verilere erişim"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: "/archive",
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Görevler",
      description: "Parti görevlerini takip edin ve yönetin.",
      features: [
        "Görev atama ve takibi",
        "Görev durumları",
        "Zaman çizelgesi"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      path: "/tasks",
      color: "from-purple-500 to-indigo-600"
    },
    {
      title: "Ayarlar",
      description: "Bölge ve görev tanımlamalarını yönetin.",
      features: [
        "Bölge ekleme/silme/düzenleme",
        "Görev tanımlama",
        "Sistem ayarları"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: "/settings",
      color: "from-rose-500 to-pink-600"
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <div 
          key={index} 
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className={`bg-gradient-to-r ${feature.color} p-5`}>
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg text-white">
                {feature.icon}
              </div>
              <h2 className="text-xl font-bold text-white ml-3">{feature.title}</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">{feature.description}</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              {feature.features.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleNavigate(feature.path)}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              Git
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeFeaturesGrid;