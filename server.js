const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const path = require("path")

process.loadEnvFile()

// Create Express app
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, ".")))

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/task-management-system", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
  })

// Activity Schema
const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ["workshop", "mentoring", "networking"] },
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  capacity: { type: Number, default: null },
  completed: { type: Boolean, default: false },
  cancelled: { type: Boolean, default: false },
  createdAt: { type: String, required: true },
  completedDate: { type: String, default: null },

  // Workshop specific
  presenter: { type: String, default: "" },
  materials: { type: String, default: "" },

  // Mentoring specific
  mentor: { type: String, default: "" },
  mentee: { type: String, default: "" },
  focus: { type: String, default: "" },

  // Networking specific
  format: { type: String, default: "mixer" },
  partners: { type: String, default: "" },
})

const Activity = mongoose.model("Activity", activitySchema)

// API Routes
app.get("/api/activities", async (req, res) => {
  try {
    const activities = await Activity.find()
    res.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    res.status(500).json({ error: "Failed to fetch activities" })
  }
})

app.post("/api/activities", async (req, res) => {
  try {
    const activity = new Activity(req.body)
    await activity.save()
    res.status(201).json(activity)
  } catch (error) {
    console.error("Error creating activity:", error)
    res.status(500).json({ error: "Failed to create activity" })
  }
})

app.put("/api/activities/:id", async (req, res) => {
  try {
    const { id } = req.params
    const activity = await Activity.findOneAndUpdate({ id }, req.body, { new: true })

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" })
    }

    res.json(activity)
  } catch (error) {
    console.error("Error updating activity:", error)
    res.status(500).json({ error: "Failed to update activity" })
  }
})

app.delete("/api/activities/:id", async (req, res) => {
  try {
    const { id } = req.params
    const activity = await Activity.findOneAndDelete({ id })

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" })
    }

    res.json({ message: "Activity deleted successfully" })
  } catch (error) {
    console.error("Error deleting activity:", error)
    res.status(500).json({ error: "Failed to delete activity" })
  }
})

app.post("/api/activities/sync", async (req, res) => {
  try {
    const activities = req.body

    // Get all activity IDs from the database
    const existingActivities = await Activity.find({}, "id")
    const existingIds = new Set(existingActivities.map((activity) => activity.id))

    // Process each activity
    for (const activity of activities) {
      if (existingIds.has(activity.id)) {
        // Update existing activity
        await Activity.findOneAndUpdate({ id: activity.id }, activity)
      } else {
        // Create new activity
        await new Activity(activity).save()
      }
    }

    // Get updated list of all activities
    const updatedActivities = await Activity.find()
    res.json(updatedActivities)
  } catch (error) {
    console.error("Error syncing activities:", error)
    res.status(500).json({ error: "Failed to sync activities" })
  }
})

// Get mentors for dropdown
app.get("/api/mentors", async (req, res) => {
  try {
    const mentoringSessions = await Activity.find({ type: "mentoring" })
    const mentors = [...new Set(mentoringSessions.map((session) => session.mentor).filter(Boolean))]
    res.json(mentors)
  } catch (error) {
    console.error("Error fetching mentors:", error)
    res.status(500).json({ error: "Failed to fetch mentors" })
  }
})

// Get statistics
app.get("/api/statistics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Build query
    const query = {}
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate }
    }

    const activities = await Activity.find(query)

    // Count by type
    const countByType = {
      workshop: 0,
      mentoring: 0,
      networking: 0,
    }

    // Count by status
    const countByStatus = {
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    }

    // Calculate completion rate
    let completable = 0
    let completed = 0

    // Process activities
    activities.forEach((activity) => {
      // Count by type
      countByType[activity.type]++

      // Count by status
      if (activity.cancelled) {
        countByStatus.cancelled++
      } else if (activity.completed) {
        countByStatus.completed++
        completed++
      } else {
        countByStatus.upcoming++
      }

      // Count completable activities (not cancelled)
      if (!activity.cancelled) {
        completable++
      }
    })

    // Calculate completion rate
    const completionRate = completable > 0 ? (completed / completable) * 100 : 0

    res.json({
      total: activities.length,
      byType: countByType,
      byStatus: countByStatus,
      completionRate: completionRate,
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

// Serve the main HTML file for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
