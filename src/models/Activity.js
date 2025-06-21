const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['workshop', 'mentoring', 'networking'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      type: Number,
      default: null,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      required: true,
    },
    completedDate: {
      type: String,
      default: null,
    },

    // Workshop specific fields
    presenter: {
      type: String,
      default: '',
      trim: true,
    },
    materials: {
      type: String,
      default: '',
      trim: true,
    },

    // Mentoring specific fields
    mentor: {
      type: String,
      default: '',
      trim: true,
    },
    mentee: {
      type: String,
      default: '',
      trim: true,
    },
    focus: {
      type: String,
      default: '',
      trim: true,
    },

    // Networking specific fields
    format: {
      type: String,
      default: 'mixer',
      enum: ['mixer', 'roundtable', 'speed-networking', 'panel', 'other'],
    },
    partners: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
activitySchema.index({ type: 1, date: 1 });
activitySchema.index({ completed: 1, cancelled: 1 });
activitySchema.index({ date: 1 });

// Virtual for checking if activity is upcoming
activitySchema.virtual('isUpcoming').get(function () {
  const activityDate = new Date(this.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return activityDate >= today && !this.completed && !this.cancelled;
});

// Virtual for checking if activity is past due
activitySchema.virtual('isPastDue').get(function () {
  const activityDate = new Date(this.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return activityDate < today && !this.completed && !this.cancelled;
});

// Instance methods
activitySchema.methods.complete = function () {
  this.completed = true;
  this.completedDate = new Date().toISOString();
  return this.save();
};

activitySchema.methods.cancel = function () {
  this.cancelled = true;
  return this.save();
};

// Static methods
activitySchema.statics.findByType = function (type) {
  return this.find({ type });
};

activitySchema.statics.findUpcoming = function () {
  const today = new Date().toISOString().split('T')[0];
  return this.find({
    date: { $gte: today },
    completed: false,
    cancelled: false,
  }).sort({ date: 1 });
};

activitySchema.statics.findCompleted = function () {
  return this.find({ completed: true }).sort({ completedDate: -1 });
};

activitySchema.statics.getStatistics = async function (startDate, endDate) {
  const query = {};
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  const activities = await this.find(query);

  const stats = {
    total: activities.length,
    byType: {
      workshop: 0,
      mentoring: 0,
      networking: 0,
    },
    byStatus: {
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    },
    completionRate: 0,
  };

  let completable = 0;
  let completed = 0;

  activities.forEach(activity => {
    // Count by type
    stats.byType[activity.type]++;

    // Count by status
    if (activity.cancelled) {
      stats.byStatus.cancelled++;
    } else if (activity.completed) {
      stats.byStatus.completed++;
      completed++;
    } else {
      stats.byStatus.upcoming++;
    }

    // Count completable activities (not cancelled)
    if (!activity.cancelled) {
      completable++;
    }
  });

  // Calculate completion rate
  stats.completionRate = completable > 0 ? (completed / completable) * 100 : 0;

  return stats;
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
