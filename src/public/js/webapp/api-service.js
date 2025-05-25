import { ActivityList, Activity } from "./classes.js"

const API_URL = "/api"

export const ApiService = {

  async fetchActivities() {
    try {
      const response = await fetch(`${API_URL}/activities`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      const activityList = ActivityList.getInstance()

      // Clear current list
      activityList.clear()

      // Add each activity from the API
      for (const a of data) {
        const activity = new Activity(a.type, a.title, a.date, a.time)

        // Copy all properties
        Object.keys(a).forEach((key) => {
          if (key !== "id") {
            // Preserve the original ID
            activity[key] = a[key]
          }
        })

        activityList.add(activity)
      }

      return data
    } catch (error) {
      console.error("Error fetching activities:", error)
      throw error
    }
  },

  async syncActivities() {
    try {
      const activityList = ActivityList.getInstance()
      const activities = activityList.toArray()

      const response = await fetch(`${API_URL}/activities/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activities),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error syncing activities:", error)
      throw error
    }
  },

  async addActivity(activity) {
    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activity),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error adding activity:", error)
      throw error
    }
  },

  async updateActivity(activity) {
    try {
      const response = await fetch(`${API_URL}/activities/${activity.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activity),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating activity:", error)
      throw error
    }
  },

  async deleteActivity(activityId) {
    try {
      const response = await fetch(`${API_URL}/activities/${activityId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error deleting activity:", error)
      throw error
    }
  },

  async completeActivity(activityId) {
    try {
      const response = await fetch(`${API_URL}/activities/${activityId}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error completing activity:", error)
      throw error
    }
  },

  async cancelActivity(activityId) {
    try {
      const response = await fetch(`${API_URL}/activities/${activityId}/cancel`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error cancelling activity:", error)
      throw error
    }
  },

  async getUpcomingActivities(limit = 10) {
    try {
      const response = await fetch(`${API_URL}/activities/upcoming?limit=${limit}`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching upcoming activities:", error)
      throw error
    }
  },

  async getRecentActivities(limit = 10) {
    try {
      const response = await fetch(`${API_URL}/activities/recent?limit=${limit}`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching recent activities:", error)
      throw error
    }
  },

  async getStatistics(startDate, endDate) {
    try {
      let url = `${API_URL}/statistics`
      const params = new URLSearchParams()

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching statistics:", error)
      throw error
    }
  },

  async getMentors() {
    try {
      const response = await fetch(`${API_URL}/mentors`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching mentors:", error)
      throw error
    }
  },

  async getActivitiesByType(type, filters = {}) {
    try {
      const params = new URLSearchParams({ type, ...filters })
      const response = await fetch(`${API_URL}/activities?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${type} activities:`, error)
      throw error
    }
  },

  async getDashboardData() {
    try {
      const [upcoming, recent, stats] = await Promise.all([
        this.getUpcomingActivities(5),
        this.getRecentActivities(5),
        this.getStatistics()
      ])

      return { upcoming, recent, stats }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      throw error
    }
  }
}
