import React from 'react';

const LoginFooter = () => {
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Parti Sekreterliği Sistemi v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginFooter;