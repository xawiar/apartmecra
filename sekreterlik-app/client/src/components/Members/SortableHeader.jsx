import React from 'react';

const SortableHeader = ({ children, onSort, sortKey, sortConfig, getSortIndicator, className }) => {
  return (
    <th 
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 ${className || ''}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {children}
        {getSortIndicator(sortKey) && (
          <span className="ml-1 text-indigo-600">{getSortIndicator(sortKey)}</span>
        )}
      </div>
    </th>
  );
};

export default SortableHeader;