const ActivityService = require("../services/activityService");
const Activity = require("../models/Activity");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

// Get all activities with optional filters
exports.getActivities = async (req, res) => {
  try {
    const activities = await ActivityService.getActivities(req.query);
    res.json(activities);
  } catch (error) {
    logger.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

// Get a single activity by ID
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findOne({ id });

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json(activity);
  } catch (error) {
    logger.error("Error fetching activity:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
};

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const activity = await ActivityService.createActivity(req.body);
    res.status(201).json(activity);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Activity with this ID already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update an activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await ActivityService.updateActivity(id, req.body);
    res.json(activity);
  } catch (error) {
    if (error.message === "Activity not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    await ActivityService.deleteActivity(id);
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    if (error.message === "Activity not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Sync activities (bulk update/create)
exports.syncActivities = async (req, res) => {
  try {
    const activities = req.body;

    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: "Expected an array of activities" });
    }

    // Get all activity IDs from the database
    const existingActivities = await Activity.find({}, "id");
    const existingIds = new Set(
      existingActivities.map((activity) => activity.id),
    );

    // Process each activity
    const operations = [];
    for (const activity of activities) {
      if (existingIds.has(activity.id)) {
        // Update existing activity
        operations.push({
          updateOne: {
            filter: { id: activity.id },
            update: activity,
            upsert: false,
          },
        });
      } else {
        // Create new activity
        operations.push({
          insertOne: {
            document: activity,
          },
        });
      }
    }

    // Execute bulk operations
    if (operations.length > 0) {
      await Activity.bulkWrite(operations);
    }

    // Get updated list of all activities
    const updatedActivities = await Activity.find().sort({ date: 1, time: 1 });
    res.json(updatedActivities);
  } catch (error) {
    logger.error("Error syncing activities:", error);
    res.status(500).json({ error: "Failed to sync activities" });
  }
};

// Complete an activity
exports.completeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findOne({ id });

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (activity.cancelled) {
      return res
        .status(400)
        .json({ error: "Cannot complete a cancelled activity" });
    }

    await activity.complete();
    res.json(activity);
  } catch (error) {
    logger.error("Error completing activity:", error);
    res.status(500).json({ error: "Failed to complete activity" });
  }
};

// Cancel an activity
exports.cancelActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findOne({ id });

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (activity.completed) {
      return res
        .status(400)
        .json({ error: "Cannot cancel a completed activity" });
    }

    await activity.cancel();
    res.json(activity);
  } catch (error) {
    logger.error("Error cancelling activity:", error);
    res.status(500).json({ error: "Failed to cancel activity" });
  }
};

// Get unique mentors
exports.getMentors = async (req, res) => {
  try {
    const mentoringSessions = await Activity.find({ type: "mentoring" });
    const mentors = [
      ...new Set(
        mentoringSessions.map((session) => session.mentor).filter(Boolean),
      ),
    ];
    res.json(mentors);
  } catch (error) {
    logger.error("Error fetching mentors:", error);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await Activity.getStatistics(startDate, endDate);
    res.json(stats);
  } catch (error) {
    logger.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// Get upcoming activities
exports.getUpcomingActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await Activity.findUpcoming().limit(parseInt(limit));
    res.json(activities);
  } catch (error) {
    logger.error("Error fetching upcoming activities:", error);
    res.status(500).json({ error: "Failed to fetch upcoming activities" });
  }
};

// Get recent completed activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await Activity.findCompleted().limit(parseInt(limit));
    res.json(activities);
  } catch (error) {
    logger.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
};
