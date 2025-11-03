import React from 'react';
import MemberAvatar from './MemberAvatar';
import { formatMemberName } from '../../utils/nameFormatter';

const MemberInfo = ({ name, tc }) => {
  const formattedName = formatMemberName(name);
  
  return (
    <div className="flex items-center">
      <MemberAvatar name={name} />
      <div className="ml-2">
        <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
          {formattedName}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[120px]">
          {tc}
        </div>
      </div>
    </div>
  );
};

export default MemberInfo;