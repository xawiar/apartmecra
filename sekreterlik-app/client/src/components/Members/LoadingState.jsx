import React from 'react';

const LoadingState = () => {
  return (
    <div className="py-6">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    </div>
  );
};

export default LoadingState;