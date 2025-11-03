class Event {
  constructor({ id, name, date, location, description, archived = false, attendees = [] }) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.location = location;
    this.description = description;
    this.archived = archived;
    // Each attendee has { memberId, attended, excuse: { hasExcuse, reason } }
    this.attendees = attendees;
  }

  static validate(event) {
    const errors = [];

    if (!event.name || event.name.trim().length === 0) {
      errors.push('Etkinlik adı zorunludur');
    }

    if (!event.date) {
      errors.push('Etkinlik tarihi zorunludur');
    }

    // Location is now optional as it's generated from selected locations
    // if (!event.location || event.location.trim().length === 0) {
    //   errors.push('Etkinlik yeri zorunludur');
    // }

    return errors;
  }
}

module.exports = Event;
