import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../utils/ApiService';

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // month, week, day

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [eventsResponse, meetingsResponse] = await Promise.all([
        ApiService.getEvents(),
        ApiService.getMeetings()
      ]);

      // console.log('Events response:', eventsResponse);
      // console.log('Meetings response:', meetingsResponse);

      // Events API returns array directly, not wrapped in success object
      if (Array.isArray(eventsResponse)) {
        setEvents(eventsResponse);
      } else if (eventsResponse.success) {
        setEvents(eventsResponse.events || []);
      }

      // Meetings API returns array directly, not wrapped in success object
      if (Array.isArray(meetingsResponse)) {
        setMeetings(meetingsResponse);
      } else if (meetingsResponse.success) {
        setMeetings(meetingsResponse.meetings || []);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    
    // console.log('Looking for events on date:', dateString);
    // console.log('All events:', events.length, 'events');
    // console.log('All meetings:', meetings.length, 'meetings');
    
    const dayEvents = events.filter(event => {
      if (!event.date) return false;
      
      let eventDate;
      try {
        // Handle different date formats
        if (event.date.includes('T')) {
          // Handle ISO format like "2025-10-31T10:00"
          eventDate = new Date(event.date).toISOString().split('T')[0];
        } else if (event.date.includes('.')) {
          // Handle DD.MM.YYYY format like "31.08.2025"
          const [day, month, year] = event.date.split('.');
          eventDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        } else if (event.date.includes('-')) {
          // Handle YYYY-MM-DD format
          eventDate = event.date.split('T')[0];
        } else {
          eventDate = new Date(event.date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error parsing event date:', event.date, e);
        return false;
      }
      
      const matches = eventDate === dateString;
      // if (matches) {
      //   console.log('Found matching event:', event);
      // }
      return matches;
    });

    const dayMeetings = meetings.filter(meeting => {
      if (!meeting.date) return false;
      
      let meetingDate;
      try {
        // Handle different date formats
        if (meeting.date.includes('T')) {
          // Handle ISO format like "2025-10-31T10:00"
          meetingDate = new Date(meeting.date).toISOString().split('T')[0];
        } else if (meeting.date.includes('.')) {
          // Handle DD.MM.YYYY format like "31.08.2025"
          const [day, month, year] = meeting.date.split('.');
          meetingDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        } else if (meeting.date.includes('-')) {
          // Handle YYYY-MM-DD format
          meetingDate = meeting.date.split('T')[0];
        } else {
          meetingDate = new Date(meeting.date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error parsing meeting date:', meeting.date, e);
        return false;
      }
      
      const matches = meetingDate === dateString;
      // if (matches) {
      //   console.log('Found matching meeting:', meeting);
      // }
      return matches;
    });

    const result = [...dayEvents, ...dayMeetings];
    // console.log('Events for date', dateString, ':', result);
    return result;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
          <p className="text-gray-600">Etkinlik ve toplantılarınızı takip edin</p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Bugün
              </button>
              
              <div className="flex bg-gray-100 rounded-lg">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Ay
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Hafta
                </button>
                <button
                  onClick={() => setView('day')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Gün
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {days.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysInMonth.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentDay = isToday(day);
              const isSelectedDay = isSelected(day);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                    day ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                  } ${isCurrentDay ? 'bg-blue-50' : ''} ${isSelectedDay ? 'bg-blue-100' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((item, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`text-xs p-1 rounded truncate ${
                              item.name ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}
                            title={item.name || item.title}
                          >
                            {item.name || item.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} daha
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-4">
              {getEventsForDate(selectedDate.getDate()).map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    item.name ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.name || item.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatTime(item.date)}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <p className="text-sm text-gray-500">
                        📍 {item.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {getEventsForDate(selectedDate.getDate()).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Bu tarihte etkinlik veya toplantı bulunmuyor
                </p>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Etkinlikler</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Toplantılar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
