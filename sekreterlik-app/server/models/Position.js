class Position {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  static validate(position) {
    const errors = [];

    if (!position.name || position.name.trim().length === 0) {
      errors.push('Görev adı zorunludur');
    }

    return errors;
  }
}

module.exports = Position;