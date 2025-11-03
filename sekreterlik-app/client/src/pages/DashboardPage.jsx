import React, { useState, useEffect } from 'react';
import ApiService from '../utils/ApiService';
import { 
  DashboardHeader, 
  DashboardStatsCards, 
  TopRegistrarsTable, 
  TopAttendeesTable 
} from '../components/Dashboard';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalMeetings: 0,
    avgAttendanceRate: 0
  });
  
  const [topRegistrars, setTopRegistrars] = useState([]);
  const [topAttendees, setTopAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [members, meetings, memberRegistrations] = await Promise.all([
        ApiService.getMembers(),
        ApiService.getMeetings(),
        ApiService.getMemberRegistrations()
      ]);
      
      // Calculate total members
      const totalMembers = members.length;
      
      // Calculate total meetings
      const totalMeetings = meetings.length;
      
      // Calculate average attendance rate
      let totalAttendanceRate = 0;
      let validMeetings = 0;
      
      meetings.forEach(meeting => {
        if (meeting.attendees && meeting.attendees.length > 0) {
          const totalExpected = meeting.attendees.length;
          const attendedCount = meeting.attendees.filter(a => a.attended).length;
          const attendanceRate = (attendedCount / totalExpected) * 100;
          totalAttendanceRate += attendanceRate;
          validMeetings++;
        }
      });
      
      const avgAttendanceRate = validMeetings > 0 ? (totalAttendanceRate / validMeetings) : 0;
      
      // Set stats
      setStats({
        totalMembers,
        totalMeetings,
        avgAttendanceRate: Math.round(avgAttendanceRate)
      });
      
      // Calculate top 3 registrars (members with most registrations)
      const memberRegistrationCounts = {};
      members.forEach(member => {
        memberRegistrationCounts[member.id] = {
          member,
          count: 0
        };
      });
      
      memberRegistrations.forEach(reg => {
        if (memberRegistrationCounts[reg.memberId]) {
          memberRegistrationCounts[reg.memberId].count += reg.count;
        }
      });
      
      const sortedRegistrars = Object.values(memberRegistrationCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      setTopRegistrars(sortedRegistrars);
      
      // Calculate top 3 attendees (members with most meeting attendances)
      const memberAttendanceCounts = {};
      members.forEach(member => {
        memberAttendanceCounts[member.id] = {
          member,
          count: 0
        };
      });
      
      meetings.forEach(meeting => {
        if (meeting.attendees) {
          meeting.attendees.forEach(attendee => {
            if (attendee.attended && memberAttendanceCounts[attendee.memberId]) {
              memberAttendanceCounts[attendee.memberId].count += 1;
            }
          });
        }
      });
      
      const sortedAttendees = Object.values(memberAttendanceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      setTopAttendees(sortedAttendees);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <DashboardHeader />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <DashboardHeader />

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Registrars */}
        <TopRegistrarsTable topRegistrars={topRegistrars} />

        {/* Top Attendees */}
        <TopAttendeesTable topAttendees={topAttendees} />
      </div>
    </div>
  );
};

export default DashboardPage;