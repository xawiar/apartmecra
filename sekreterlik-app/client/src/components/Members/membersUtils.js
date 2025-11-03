// Function to calculate meeting statistics for a member
export const calculateMeetingStats = (member, meetings) => {
  // Safety checks
  if (!member || !meetings || !Array.isArray(meetings)) {
    return {
      totalMeetings: 0,
      attendedMeetings: 0,
      excusedMeetings: 0,
      attendancePercentage: 0
    };
  }

  // Filter meetings where this member is actually required to attend (in attendees list)
  const memberMeetings = meetings.filter(meeting => 
    meeting && meeting.attendees && Array.isArray(meeting.attendees) &&
    meeting.attendees.some(a => a.memberId === member.id)
  );
  
  // Count attended and excused meetings
  let attendedMeetings = 0;
  let excusedMeetings = 0;
  memberMeetings.forEach(meeting => {
    if (meeting.attendees && Array.isArray(meeting.attendees)) {
      const attendee = meeting.attendees.find(a => a.memberId === member.id);
      if (attendee) {
        if (attendee.attended) {
          attendedMeetings++;
        } else if (attendee.excuse && attendee.excuse.hasExcuse) {
          excusedMeetings++;
        }
      }
    }
  });
  
  const totalMeetings = memberMeetings.length;
  const attendancePercentage = totalMeetings > 0 
    ? Math.round((attendedMeetings / totalMeetings) * 100) 
    : 0;
  
  return {
    totalMeetings,
    attendedMeetings,
    excusedMeetings,
    attendancePercentage
  };
};

// Function to calculate member registrations
export const calculateMemberRegistrations = (memberId, memberRegistrations) => {
  if (!memberRegistrations) return 0;
  const memberRegs = memberRegistrations.filter(reg => reg.memberId === memberId);
  return memberRegs.reduce((sum, reg) => sum + reg.count, 0);
};

// Function to get attendance color based on percentage
export const getAttendanceColor = (percentage) => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Function to calculate summary statistics
export const calculateSummaryStats = (members, meetings) => {
  // Safety checks
  if (!members || !Array.isArray(members)) {
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalMeetings: 0,
      avgAttendanceRate: 0
    };
  }

  if (!meetings || !Array.isArray(meetings)) {
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => !m.archived).length,
      totalMeetings: 0,
      avgAttendanceRate: 0
    };
  }

  // Total members
  const totalMembers = members.length;
  
  // Active members
  const activeMembers = members.filter(m => !m.archived).length;
  
  // Total meetings
  const totalMeetings = meetings.length;
  
  // Calculate average attendance rate
  let totalAttendanceRate = 0;
  let validMembers = 0;
  
  members.forEach(member => {
    const stats = calculateMeetingStats(member, meetings);
    if (stats.totalMeetings > 0) {
      totalAttendanceRate += stats.attendancePercentage;
      validMembers++;
    }
  });
  
  const avgAttendanceRate = validMembers > 0 ? Math.round(totalAttendanceRate / validMembers) : 0;
  
  return {
    totalMembers,
    activeMembers,
    totalMeetings,
    avgAttendanceRate
  };
};