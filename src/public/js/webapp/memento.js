import { ActivityList } from "./classes.js"

export const ActivityHistory = {
  history: [],
  push(state) {
    if (state) {
      this.history.push(new Set([...state]))
      // Limit history size to prevent memory issues
      if (this.history.length > 50) {
        this.history.shift()
      }
    }
  },
  pop() {
    if (this.history.length > 1) {
      this.history.pop()
      return this.history.pop()
    }
    return null
  },
}

ActivityList.getInstance().addObserver(() => {
  ActivityHistory.push(ActivityList.getInstance().items)
})
