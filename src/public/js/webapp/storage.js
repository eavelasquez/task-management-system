import { ActivityList, Activity } from "./classes.js";

const activityList = ActivityList.getInstance();

export const LocalStorage = {
  STORAGE_KEY: "task_management_system_activities",

  load() {
    try {
      if (localStorage.getItem(this.STORAGE_KEY)) {
        const activities = JSON.parse(localStorage.getItem(this.STORAGE_KEY));

        // Clear current list before loading
        activityList.clear();

        // Add each activity to the list
        for (const a of activities) {
          const activity = new Activity(a.type, a.title, a.date, a.time);

          // Copy all properties
          Object.keys(a).forEach((key) => {
            if (key !== "id") {
              // Preserve the original ID
              activity[key] = a[key];
            }
          });

          activityList.add(activity);
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  },

  save() {
    try {
      const array = activityList.toArray();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },
};

// Register observer to save on changes
activityList.addObserver(LocalStorage.save.bind(LocalStorage));
