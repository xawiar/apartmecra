import React from 'react';

const LoginFooter = () => {
  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/80 text-gray-500">
            Parti Sekreterliği Sistemi v2.0
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>© 2025 <a href="https://www.datdijital.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors font-medium">DAT Dijital</a>. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
};

export default LoginFooter;