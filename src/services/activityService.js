const Activity = require("../models/Activity");
const logger = require("../utils/logger");

class ActivityService {
  // Generate unique ID for activities
  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Create a new activity with validation
  static async createActivity(activityData) {
    try {
      // Generate ID if not provided
      if (!activityData.id) {
        activityData.id = this.generateId();
      }

      // Set creation date if not provided
      if (!activityData.createdAt) {
        activityData.createdAt = new Date().toISOString();
      }

      const activity = new Activity(activityData);
      await activity.save();

      logger.info(`Activity created: ${activity.id} - ${activity.title}`);
      return activity;
    } catch (error) {
      logger.error(`Error creating activity: ${error.message}`);
      throw error;
    }
  }

  // Get activities with advanced filtering
  static async getActivities(filters = {}) {
    try {
      const query = this.buildQuery(filters);
      logger.debug(query);
      const activities = await Activity.find(query).sort({ date: 1, time: 1 });

      logger.debug(
        `Retrieved ${activities.length} activities with filters:`,
        filters,
      );
      return activities;
    } catch (error) {
      logger.error(`Error fetching activities: ${error.message}`);
      throw error;
    }
  }

  // Build query object from filters
  static buildQuery(filters) {
    const query = {};
    const { type, status, startDate, endDate, mentor, location, capacity } =
      filters;

    if (type) {
      query.type = type;
    }

    if (status) {
      const STATUS_QUERIES = {
        upcoming: {
          completed: false,
          cancelled: false,
          date: { $gte: new Date().toISOString().split("T")[0] },
        },
        completed: {
          completed: true,
        },
        cancelled: {
          cancelled: true,
        },
        "past-due": {
          completed: false,
          cancelled: false,
          date: { $lt: new Date().toISOString().split("T")[0] },
        },
      };
      Object.assign(query, STATUS_QUERIES[status]);
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (mentor) {
      query.mentor = new RegExp(mentor, "i"); // Case-insensitive search
    }

    if (location) {
      query.location = new RegExp(location, "i");
    }

    if (capacity) {
      query.capacity = { $gte: parseInt(capacity) };
    }

    return query;
  }

  // Update activity with business logic
  static async updateActivity(id, updateData) {
    try {
      const activity = await Activity.findOne({ id });

      if (!activity) {
        throw new Error("Activity not found");
      }

      // Prevent certain updates based on status
      if (activity.completed && updateData.date) {
        throw new Error("Cannot change date of completed activity");
      }

      if (activity.cancelled && updateData.completed) {
        throw new Error("Cannot complete a cancelled activity");
      }

      const updatedActivity = await Activity.findOneAndUpdate(
        { id },
        updateData,
        { new: true, runValidators: true },
      );

      logger.info(`Activity updated: ${id} - ${updatedActivity.title}`);
      return updatedActivity;
    } catch (error) {
      logger.error(`Error updating activity ${id}: ${error.message}`);
      throw error;
    }
  }

  // Complete activity with validation
  static async completeActivity(id) {
    try {
      const activity = await Activity.findOne({ id });

      if (!activity) {
        throw new Error("Activity not found");
      }

      if (activity.cancelled) {
        throw new Error("Cannot complete a cancelled activity");
      }

      if (activity.completed) {
        throw new Error("Activity is already completed");
      }

      await activity.complete();
      logger.info(`Activity completed: ${id} - ${activity.title}`);
      return activity;
    } catch (error) {
      logger.error(`Error completing activity ${id}: ${error.message}`);
      throw error;
    }
  }

  // Cancel activity with validation
  static async cancelActivity(id) {
    try {
      const activity = await Activity.findOne({ id });

      if (!activity) {
        throw new Error("Activity not found");
      }

      if (activity.completed) {
        throw new Error("Cannot cancel a completed activity");
      }

      if (activity.cancelled) {
        throw new Error("Activity is already cancelled");
      }

      await activity.cancel();
      logger.info(`Activity cancelled: ${id} - ${activity.title}`);
      return activity;
    } catch (error) {
      logger.error(`Error cancelling activity ${id}: ${error.message}`);
      throw error;
    }
  }

  // Bulk sync activities
  static async syncActivities(activities) {
    try {
      if (!Array.isArray(activities)) {
        throw new Error("Expected an array of activities");
      }

      const existingActivities = await Activity.find({}, "id");
      const existingIds = new Set(
        existingActivities.map((activity) => activity.id),
      );

      const operations = [];
      let newCount = 0;
      let updateCount = 0;

      for (const activity of activities) {
        if (existingIds.has(activity.id)) {
          operations.push({
            updateOne: {
              filter: { id: activity.id },
              update: activity,
              upsert: false,
            },
          });
          updateCount++;
        } else {
          operations.push({
            insertOne: {
              document: activity,
            },
          });
          newCount++;
        }
      }

      if (operations.length > 0) {
        await Activity.bulkWrite(operations);
      }

      logger.info(
        `Sync completed: ${newCount} new, ${updateCount} updated activities`,
      );

      const updatedActivities = await Activity.find().sort({
        date: 1,
        time: 1,
      });
      return updatedActivities;
    } catch (error) {
      logger.error(`Error syncing activities: ${error.message}`);
      throw error;
    }
  }

  // Get dashboard data
  static async getDashboardData() {
    try {
      const [upcoming, recent, stats] = await Promise.all([
        Activity.findUpcoming().limit(5),
        Activity.findCompleted().limit(5),
        Activity.getStatistics(),
      ]);

      return {
        upcoming,
        recent,
        stats,
      };
    } catch (error) {
      logger.error(`Error fetching dashboard data: ${error.message}`);
      throw error;
    }
  }

  // Get activities by type with additional filtering
  static async getActivitiesByType(type, filters = {}) {
    try {
      const query = { type, ...this.buildQuery(filters) };
      const activities = await Activity.find(query).sort({ date: 1, time: 1 });

      logger.debug(`Retrieved ${activities.length} ${type} activities`);
      return activities;
    } catch (error) {
      logger.error(`Error fetching ${type} activities: ${error.message}`);
      throw error;
    }
  }

  // Delete activity with validation
  static async deleteActivity(id) {
    try {
      const activity = await Activity.findOneAndDelete({ id });

      if (!activity) {
        throw new Error("Activity not found");
      }

      logger.info(`Activity deleted: ${id} - ${activity.title}`);
      return activity;
    } catch (error) {
      logger.error(`Error deleting activity ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ActivityService;
