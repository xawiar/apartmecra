import React from 'react';

const variantToClass = {
  primary: 'bg-indigo-100 text-indigo-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
};

const Badge = ({ children, variant = 'neutral', className }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantToClass[variant]} ${className || ''}`}>
      {children}
    </span>
  );
};

export default Badge;


