class Meeting {
  constructor({ id, name, regions, notes, date, archived = false, attendees = [] }) {
    this.id = id;
    this.name = name;
    this.regions = regions;
    this.notes = notes;
    this.date = date;
    this.archived = archived;
    // Each attendee has { memberId, attended, excuse: { hasExcuse, reason } }
    this.attendees = attendees;
  }

  static validate(meeting) {
    const errors = [];

    if (!meeting.name || meeting.name.trim().length === 0) {
      errors.push('Toplantı adı zorunludur');
    }

    if (!meeting.regions || meeting.regions.length === 0) {
      errors.push('En az bir bölge seçilmelidir');
    }

    if (!meeting.date) {
      errors.push('Toplantı tarihi zorunludur');
    }

    return errors;
  }

  addAttendee(memberId, attended, excuse = null) {
    const existing = this.attendees.find(a => a.memberId === memberId);
    if (existing) {
      existing.attended = attended;
      // Update excuse information if provided
      if (excuse !== null) {
        existing.excuse = excuse;
      }
    } else {
      this.attendees.push({ 
        memberId, 
        attended,
        excuse: excuse || { hasExcuse: false, reason: '' }
      });
    }
  }

  // Method to update excuse information for a member
  updateExcuse(memberId, hasExcuse, reason = '') {
    const attendee = this.attendees.find(a => a.memberId === memberId);
    if (attendee) {
      attendee.excuse = { hasExcuse, reason };
      // If they have an excuse, they are considered as not attended
      if (hasExcuse) {
        attendee.attended = false;
      }
    } else {
      // If attendee doesn't exist, add them with excuse
      this.attendees.push({ 
        memberId, 
        attended: !hasExcuse, // Attended if no excuse
        excuse: { hasExcuse, reason }
      });
    }
  }

  getAttendanceRate() {
    if (this.attendees.length === 0) return 0;
    const attendedCount = this.attendees.filter(a => a.attended).length;
    return Math.round((attendedCount / this.attendees.length) * 100);
  }

  // Get count of members with excuses
  getExcusedCount() {
    return this.attendees.filter(a => a.excuse && a.excuse.hasExcuse).length;
  }
}

module.exports = Meeting;