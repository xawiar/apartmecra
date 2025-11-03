class Task {
  constructor({ id, title, assignee, priority, status, dueDate }) {
    this.id = id;
    this.title = title;
    this.assignee = assignee;
    this.priority = priority;
    this.status = status;
    this.dueDate = dueDate;
  }

  static validate(task) {
    const errors = [];

    if (!task.title || task.title.trim().length === 0) {
      errors.push('Görev başlığı zorunludur');
    }

    if (!task.assignee || task.assignee.trim().length === 0) {
      errors.push('Atanan kişi zorunludur');
    }

    if (!task.priority || task.priority.trim().length === 0) {
      errors.push('Öncelik seviyesi zorunludur');
    }

    if (!task.status || task.status.trim().length === 0) {
      errors.push('Durum bilgisi zorunludur');
    }

    if (!task.dueDate) {
      errors.push('Bitiş tarihi zorunludur');
    }

    return errors;
  }
}

module.exports = Task;