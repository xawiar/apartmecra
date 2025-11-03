import React from 'react';
import ShowMemberButton from './ShowMemberButton';
import EditMemberButton from './EditMemberButton';
import ArchiveMemberButton from './ArchiveMemberButton';

const MemberActions = ({ memberId, onShowMember, onEditMember, onArchiveMember }) => {
  return (
    <div className="flex space-x-1">
      <ShowMemberButton onClick={() => onShowMember(memberId)} />
      <EditMemberButton onClick={() => onEditMember(memberId)} />
      <ArchiveMemberButton onClick={() => onArchiveMember(memberId)} />
    </div>
  );
};

export default MemberActions;