import { observerMixin } from './mixins.js';

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class Activity {
  constructor(type, title, date, time) {
    this.id = generateId();
    this.type = type;
    this.title = title;
    this.date = date;
    this.time = time;
    this.completed = false;
    this.cancelled = false;
    this.createdAt = new Date().toISOString();
    this.completedDate = null;

    // Common properties
    this.description = '';
    this.location = '';
    this.capacity = null;

    // Type-specific properties
    if (type === 'workshop') {
      this.presenter = '';
      this.materials = '';
    } else if (type === 'mentoring') {
      this.mentor = '';
      this.mentee = '';
      this.focus = '';
    } else if (type === 'networking') {
      this.format = 'mixer';
      this.partners = '';
    }
  }

  equals(other) {
    return this.id === other.id;
  }

  complete() {
    this.completed = true;
    this.completedDate = new Date().toISOString();
    return this;
  }

  cancel() {
    this.cancelled = true;
    return this;
  }

  update(data) {
    // Update common properties
    this.title = data.title || this.title;
    this.date = data.date || this.date;
    this.time = data.time || this.time;
    this.description = data.description || this.description;
    this.location = data.location || this.location;
    this.capacity = data.capacity || this.capacity;

    // Update type-specific properties
    if (this.type === 'workshop') {
      this.presenter = data.presenter || this.presenter;
      this.materials = data.materials || this.materials;
    } else if (this.type === 'mentoring') {
      this.mentor = data.mentor || this.mentor;
      this.mentee = data.mentee || this.mentee;
      this.focus = data.focus || this.focus;
    } else if (this.type === 'networking') {
      this.format = data.format || this.format;
      this.partners = data.partners || this.partners;
    }

    return this;
  }
}

export class ActivityList {
  // Data
  #data = new Set();
  get items() {
    return this.#data;
  }

  // Singleton
  static instance = null;
  static {
    this.instance = new ActivityList();
  }
  static getInstance() {
    return this.instance;
  }
  constructor() {
    if (ActivityList.instance) {
      throw new Error('Use ActivityList.getInstance() instead.');
    }
  }

  // List Behavior
  add(activity) {
    const array = Array.from(this.#data);
    const activityExists = array.filter(a => a.equals(activity)).length > 0;
    if (!activityExists) {
      this.#data.add(activity);
      this.notify();
    }
  }

  delete(activityId) {
    const array = Array.from(this.#data);
    const activityToDelete = array.find(a => a.id === activityId);
    if (activityToDelete) {
      this.#data.delete(activityToDelete);
      this.notify();
    }
  }

  findById(id) {
    const array = Array.from(this.#data);
    return array.find(a => a.id === id);
  }

  update(activityId, data) {
    const activity = this.findById(activityId);
    if (activity) {
      activity.update(data);
      this.notify();
    }
  }

  complete(activityId) {
    const activity = this.findById(activityId);
    if (activity) {
      activity.complete();
      this.notify();
    }
  }

  cancel(activityId) {
    const activity = this.findById(activityId);
    if (activity) {
      activity.cancel();
      this.notify();
    }
  }

  replaceList(list) {
    this.#data = list;
    this.notify();
  }

  clear() {
    this.#data.clear();
    this.notify();
  }

  toArray() {
    return Array.from(this.#data);
  }

  // Statistics
  getStats(startDate = null, endDate = null) {
    const activities = this.toArray();

    // Filter by date range if provided
    let filteredActivities = activities;
    if (startDate && endDate) {
      filteredActivities = activities.filter(activity => {
        return activity.date >= startDate && activity.date <= endDate;
      });
    }

    // Count by type
    const countByType = {
      workshop: 0,
      mentoring: 0,
      networking: 0,
    };

    // Count by status
    const countByStatus = {
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };

    // Calculate completion rate
    let completable = 0;
    let completed = 0;

    // Process activities
    filteredActivities.forEach(activity => {
      // Count by type
      countByType[activity.type]++;

      // Count by status
      if (activity.cancelled) {
        countByStatus.cancelled++;
      } else if (activity.completed) {
        countByStatus.completed++;
        completed++;
      } else {
        countByStatus.upcoming++;
      }

      // Count completable activities (not cancelled)
      if (!activity.cancelled) {
        completable++;
      }
    });

    // Calculate completion rate
    const completionRate = completable > 0 ? (completed / completable) * 100 : 0;

    return {
      total: filteredActivities.length,
      byType: countByType,
      byStatus: countByStatus,
      completionRate: completionRate,
    };
  }
}

// Apply Observer mixin
Object.assign(ActivityList.prototype, observerMixin);
