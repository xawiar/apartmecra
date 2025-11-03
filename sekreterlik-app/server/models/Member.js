class Member {
  constructor({ id, tc, name, phone, position, region, district, archived = false }) {
    this.id = id;
    this.tc = tc;
    this.name = name;
    this.phone = phone;
    this.position = position;
    this.region = region;
    this.district = district;
    this.archived = archived;
  }

  static validate(member) {
    const errors = [];

    if (!member.tc || member.tc.length !== 11) {
      errors.push('TC kimlik numarası 11 haneli olmalıdır');
    }

    if (!member.name || member.name.trim().length === 0) {
      errors.push('İsim soyisim alanı zorunludur');
    }

    if (!member.phone || member.phone.trim().length === 0) {
      errors.push('Telefon numarası zorunludur');
    }

    if (!member.position || member.position.trim().length === 0) {
      errors.push('Görev alanı zorunludur');
    }

    if (!member.region || member.region.trim().length === 0) {
      errors.push('Bölge alanı zorunludur');
    }

    // District (ilçe) is optional - NOT REQUIRED
    // Removed district validation as it's not required

    return errors;
  }
}

module.exports = Member;
