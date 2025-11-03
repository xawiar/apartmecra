import React from 'react';

const RegionBadge = ({ region }) => {
  return (
    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
      {region}
    </span>
  );
};

export default RegionBadge;