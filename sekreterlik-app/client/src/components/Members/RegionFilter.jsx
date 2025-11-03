import React from 'react';

const RegionFilter = ({ value, onChange, regions }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
    >
      <option value="">Tüm Bölgeler</option>
      {regions.map(region => (
        <option key={region.id} value={region.name}>{region.name}</option>
      ))}
    </select>
  );
};

export default RegionFilter;