class Region {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  static validate(region) {
    const errors = [];

    if (!region.name || region.name.trim().length === 0) {
      errors.push('Bölge adı zorunludur');
    }

    return errors;
  }
}

module.exports = Region;