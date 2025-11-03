import React from 'react';

const MemberAvatar = ({ name, photo }) => {
  return (
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
      {photo ? (
        <img
          src={`http://localhost:5000${photo}`}
          alt={name}
          className="h-8 w-8 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span className={`text-indigo-800 text-xs font-medium ${photo ? 'hidden' : ''}`}>
        {name.charAt(0)}
      </span>
    </div>
  );
};

export default MemberAvatar;