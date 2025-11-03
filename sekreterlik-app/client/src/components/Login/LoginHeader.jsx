import React from 'react';

const LoginHeader = () => {
  return (
    <div>
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
        Parti Sekreterliği Sistemi
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Devam etmek için giriş yapın
      </p>
    </div>
  );
};

export default LoginHeader;