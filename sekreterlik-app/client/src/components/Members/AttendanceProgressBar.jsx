import React from 'react';

const AttendanceProgressBar = ({ percentage, getAttendanceColor }) => {
  return (
    <div className="flex items-center">
      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
        <div 
          className={`h-1.5 rounded-full ${getAttendanceColor ? getAttendanceColor(percentage) : (percentage > 70 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500')}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-500">{percentage}%</span>
    </div>
  );
};

export default AttendanceProgressBar;