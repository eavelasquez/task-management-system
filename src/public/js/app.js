import { ActivityList } from "./webapp/classes.js"
import { CommandExecutor, Command, Commands } from "./webapp/command.js"
import { LocalStorage } from "./webapp/storage.js"
import { ApiService } from "./webapp/api-service.js"
import { ChartRenderer } from "./webapp/chart-renderer.js"

// Global DOM references
globalThis.DOM = {}
const DOM = globalThis.DOM

// Current view
let currentView = "dashboard"

// Show status message
function showStatus(message, isError = false) {
  DOM.statusMessage.textContent = message
  DOM.statusMessage.classList.add("show")

  if (isError) {
    DOM.statusMessage.style.backgroundColor = "#ef4444"
  } else {
    DOM.statusMessage.style.backgroundColor = "#10b981"
  }

  setTimeout(() => {
    DOM.statusMessage.classList.remove("show")
  }, 3000)
}

// Make showStatus globally available
globalThis.showStatus = showStatus

// Format date for display
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

// Format time for display
function formatTime(timeString) {
  const options = { hour: "2-digit", minute: "2-digit" }
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(undefined, options)
}

// Render upcoming activities in dashboard
async function renderUpcomingActivities() {
  const upcomingList = DOM.upcomingList
  upcomingList.innerHTML = `<div class="loading">Loading upcoming activities...</div>`

  try {
    const upcoming = await ApiService.getUpcomingActivities(5)

    upcomingList.innerHTML = ""

    if (upcoming.length === 0) {
      upcomingList.innerHTML = `<div class="empty-state">No upcoming activities</div>`
      return
    }

    for (const activity of upcoming) {
      const activityItem = document.createElement("div")
      activityItem.className = "activity-item"
      activityItem.dataset.id = activity.id

      activityItem.innerHTML = `
        <div class="activity-color ${activity.type}"></div>
        <div class="activity-details">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-meta">
            <span class="activity-date">${formatDate(activity.date)} at ${formatTime(activity.time)}</span>
            <span class="activity-type ${activity.type}">${activity.type}</span>
          </div>
        </div>
        <div class="activity-actions">
          <button class="activity-btn edit-btn">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="activity-btn complete-btn">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </button>
        </div>
      `

      upcomingList.appendChild(activityItem)
    }
  } catch (error) {
    console.error('Error loading upcoming activities:', error)
    upcomingList.innerHTML = `<div class="error-state">Failed to load upcoming activities</div>`
  }
}

// Render recent activities in dashboard
async function renderRecentActivities() {
  const recentList = DOM.recentList
  recentList.innerHTML = `<div class="loading">Loading recent activities...</div>`

  try {
    const recent = await ApiService.getRecentActivities(5)

    recentList.innerHTML = ""

    if (recent.length === 0) {
      recentList.innerHTML = `<div class="empty-state">No recent activities</div>`
      return
    }

    for (const activity of recent) {
      const activityItem = document.createElement("div")
      activityItem.className = "activity-item"
      activityItem.dataset.id = activity.id

      activityItem.innerHTML = `
        <div class="activity-color ${activity.type}"></div>
        <div class="activity-details">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-meta">
            <span class="activity-date">Completed on ${formatDate(activity.completedDate)}</span>
            <span class="activity-type ${activity.type}">${activity.type}</span>
          </div>
        </div>
        <div class="activity-actions">
          <button class="activity-btn view-btn">
            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          </button>
        </div>
      `

      recentList.appendChild(activityItem)
    }
  } catch (error) {
    console.error('Error loading recent activities:', error)
    recentList.innerHTML = `<div class="error-state">Failed to load recent activities</div>`
  }
}

// Render workshops
async function renderWorkshops() {
  const workshopsGrid = DOM.workshopsGrid
  workshopsGrid.innerHTML = `<div class="loading">Loading workshops...</div>`

  try {
    // Get filter values
    const statusFilter = DOM.workshopStatus.value
    const dateStartFilter = DOM.workshopDateStart.value
    const dateEndFilter = DOM.workshopDateEnd.value

    // Build filter object
    const filters = {
      type: 'workshop'
    }

    if (statusFilter !== 'all') {
      filters.status = statusFilter
    }

    if (dateStartFilter) {
      filters.startDate = dateStartFilter
    }

    if (dateEndFilter) {
      filters.endDate = dateEndFilter
    }

    // Fetch workshops from API
    const workshops = await ApiService.getActivitiesByType('workshop', filters)

    workshopsGrid.innerHTML = ""

    if (workshops.length === 0) {
      workshopsGrid.innerHTML = `<div class="empty-state">No workshops found</div>`
      return
    }

    for (const workshop of workshops) {
      const workshopCard = document.createElement("div")
      workshopCard.className = "workshop-card"
      workshopCard.dataset.id = workshop.id

      let statusClass = "status-upcoming"
      let statusText = "Upcoming"

      if (workshop.cancelled) {
        statusClass = "status-cancelled"
        statusText = "Cancelled"
      } else if (workshop.completed) {
        statusClass = "status-completed"
        statusText = "Completed"
      }

      workshopCard.innerHTML = `
      <div class="workshop-header">
        <h3 class="workshop-title">${workshop.title}</h3>
        <div class="workshop-meta">
          <span>${formatDate(workshop.date)}</span>
          <span>${formatTime(workshop.time)}</span>
        </div>
      </div>
      <div class="workshop-body">
        <p class="workshop-description">${workshop.description || "No description provided."}</p>
        <div class="workshop-details">
          <span class="detail-label">Presenter:</span>
          <span>${workshop.presenter || "Not specified"}</span>
          
          <span class="detail-label">Location:</span>
          <span>${workshop.location || "Not specified"}</span>
          
          <span class="detail-label">Capacity:</span>
          <span>${workshop.capacity || "Unlimited"}</span>
        </div>
      </div>
      <div class="workshop-footer">
        <span class="workshop-status ${statusClass}">${statusText}</span>
        <div class="activity-actions">
          <button class="activity-btn edit-btn">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          ${!workshop.completed && !workshop.cancelled
          ? `
            <button class="activity-btn complete-btn">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
          `
          : ""
        }
          ${!workshop.cancelled
          ? `
            <button class="activity-btn cancel-btn">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          `
          : ""
        }
        </div>
      </div>
    `

      workshopsGrid.appendChild(workshopCard)
    }
  } catch (error) {
    console.error('Error loading workshops:', error)
    workshopsGrid.innerHTML = `<div class="error-state">Failed to load workshops</div>`
  }
}

// Render mentoring sessions
function renderMentoringSessions() {
  const activities = ActivityList.getInstance()
  const mentoringList = DOM.mentoringList
  mentoringList.innerHTML = ""

  // Get filter values
  const statusFilter = DOM.mentoringStatus.value
  const mentorFilter = DOM.mentoringMentor.value

  // Filter mentoring sessions
  const mentoringSessions = Array.from(activities.items)
    .filter((activity) => {
      // Filter by type
      if (activity.type !== "mentoring") return false

      // Filter by status
      if (statusFilter !== "all") {
        if (statusFilter === "scheduled" && (activity.completed || activity.cancelled)) return false
        if (statusFilter === "completed" && !activity.completed) return false
        if (statusFilter === "cancelled" && !activity.cancelled) return false
      }

      // Filter by mentor
      if (mentorFilter !== "all" && activity.mentor !== mentorFilter) return false

      return true
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (mentoringSessions.length === 0) {
    mentoringList.innerHTML = `<div class="empty-state">No mentoring sessions found</div>`
    return
  }

  for (const session of mentoringSessions) {
    const sessionDate = new Date(session.date)
    const day = sessionDate.getDate()
    const month = sessionDate.toLocaleString("default", { month: "short" })

    const mentoringItem = document.createElement("div")
    mentoringItem.className = "mentoring-item"
    mentoringItem.dataset.id = session.id

    let statusClass = ""
    if (session.cancelled) statusClass = "cancelled"
    else if (session.completed) statusClass = "completed"

    mentoringItem.innerHTML = `
      <div class="mentoring-date">
        <div class="mentoring-day">${day}</div>
        <div class="mentoring-month">${month}</div>
        <div class="mentoring-time">${formatTime(session.time)}</div>
      </div>
      <div class="mentoring-content ${statusClass}">
        <h3 class="mentoring-title">${session.title}</h3>
        <div class="mentoring-participants">
          <div class="mentor">
            <span class="mentor-label">Mentor:</span>
            <span>${session.mentor || "Not assigned"}</span>
          </div>
          <div class="mentee">
            <span class="mentee-label">Mentee:</span>
            <span>${session.mentee || "Not assigned"}</span>
          </div>
        </div>
        <div class="mentoring-focus">
          <strong>Focus:</strong> ${session.focus || "General mentoring"}
        </div>
      </div>
      <div class="mentoring-actions">
        <button class="activity-btn edit-btn">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        ${!session.completed && !session.cancelled
        ? `
          <button class="activity-btn complete-btn">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </button>
        `
        : ""
      }
        ${!session.cancelled
        ? `
          <button class="activity-btn cancel-btn">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        `
        : ""
      }
      </div>
    `

    mentoringList.appendChild(mentoringItem)
  }
}

// Render networking events
function renderNetworkingEvents() {
  const activities = ActivityList.getInstance()
  const networkingGrid = DOM.networkingGrid
  networkingGrid.innerHTML = ""

  // Get filter values
  const statusFilter = DOM.networkingStatus.value
  const typeFilter = DOM.networkingType.value

  // Filter networking events
  const networkingEvents = Array.from(activities.items)
    .filter((activity) => {
      // Filter by type
      if (activity.type !== "networking") return false

      // Filter by status
      if (statusFilter !== "all") {
        if (statusFilter === "upcoming" && (activity.completed || activity.cancelled)) return false
        if (statusFilter === "completed" && !activity.completed) return false
        if (statusFilter === "cancelled" && !activity.cancelled) return false
      }

      // Filter by networking type
      if (typeFilter !== "all" && activity.format !== typeFilter) return false

      return true
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (networkingEvents.length === 0) {
    networkingGrid.innerHTML = `<div class="empty-state">No networking events found</div>`
    return
  }

  for (const event of networkingEvents) {
    const networkingCard = document.createElement("div")
    networkingCard.className = "networking-card"
    networkingCard.dataset.id = event.id

    let statusClass = "status-upcoming"
    let statusText = "Upcoming"

    if (event.cancelled) {
      statusClass = "status-cancelled"
      statusText = "Cancelled"
    } else if (event.completed) {
      statusClass = "status-completed"
      statusText = "Completed"
    }

    networkingCard.innerHTML = `
      <div class="networking-header">
        <h3 class="networking-title">${event.title}</h3>
        <div class="networking-meta">
          <span>${formatDate(event.date)}</span>
          <span>${formatTime(event.time)}</span>
        </div>
      </div>
      <div class="networking-body">
        <p class="networking-description">${event.description || "No description provided."}</p>
        <div class="networking-details">
          <span class="detail-label">Format:</span>
          <span>${event.format || "Not specified"}</span>
          
          <span class="detail-label">Location:</span>
          <span>${event.location || "Not specified"}</span>
          
          <span class="detail-label">Partners:</span>
          <span>${event.partners || "None"}</span>
          
          <span class="detail-label">Capacity:</span>
          <span>${event.capacity || "Unlimited"}</span>
        </div>
      </div>
      <div class="networking-footer">
        <span class="networking-status ${statusClass}">${statusText}</span>
        <div class="activity-actions">
          <button class="activity-btn edit-btn">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          ${!event.completed && !event.cancelled
        ? `
            <button class="activity-btn complete-btn">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
          `
        : ""
      }
          ${!event.cancelled
        ? `
            <button class="activity-btn cancel-btn">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          `
        : ""
      }
        </div>
      </div>
    `

    networkingGrid.appendChild(networkingCard)
  }
}

// Render analytics
function renderAnalytics() {
  // Get date range values
  const startDate = DOM.analyticsDateStart.value
  const endDate = DOM.analyticsDateEnd.value

  // Render charts
  ChartRenderer.renderActivityDistribution("activity-distribution-chart", startDate, endDate)
  ChartRenderer.renderParticipantGrowth("participant-growth-chart", startDate, endDate)
  ChartRenderer.renderCompletionRates("completion-rates-chart", startDate, endDate)
}

// Switch view
async function switchView(viewName) {
  // Hide all views
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active")
  })

  // Show selected view
  document.getElementById(`${viewName}-view`).classList.add("active")

  // Update navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
  })
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add("active")

  // Update current view
  currentView = viewName

  // Render view content
  switch (viewName) {
    case "dashboard":
      await renderUpcomingActivities()
      await renderRecentActivities()
      break
    case "workshops":
      await renderWorkshops()
      break
    case "mentoring":
      renderMentoringSessions()
      break
    case "networking":
      renderNetworkingEvents()
      break
    case "analytics":
      renderAnalytics()
      break
  }
}

// Show activity modal
function showActivityModal(activity = null) {
  const modal = DOM.activityModal
  const modalTitle = DOM.modalTitle
  const form = DOM.activityForm
  const activityType = DOM.activityType

  // Reset form
  form.reset()

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0]
  DOM.activityDate.value = today

  // Set default time
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  DOM.activityTime.value = `${hours}:${minutes}`

  // Hide all type-specific fields
  document.querySelectorAll(".activity-type-fields").forEach((field) => {
    field.style.display = "none"
  })

  // If editing an existing activity
  if (activity) {
    modalTitle.textContent = "Edit Activity"

    // Fill form with activity data
    activityType.value = activity.type
    DOM.activityTitle.value = activity.title
    DOM.activityDescription.value = activity.description || ""
    DOM.activityDate.value = activity.date
    DOM.activityTime.value = activity.time
    DOM.activityLocation.value = activity.location || ""
    DOM.activityCapacity.value = activity.capacity || ""

    // Fill type-specific fields
    if (activity.type === "workshop") {
      DOM.workshopPresenter.value = activity.presenter || ""
      DOM.workshopMaterials.value = activity.materials || ""
      document.getElementById("workshop-fields").style.display = "block"
    } else if (activity.type === "mentoring") {
      DOM.mentoringMentorInput.value = activity.mentor || ""
      DOM.mentoringMentee.value = activity.mentee || ""
      DOM.mentoringFocus.value = activity.focus || ""
      document.getElementById("mentoring-fields").style.display = "block"
    } else if (activity.type === "networking") {
      DOM.networkingFormat.value = activity.format || "mixer"
      DOM.networkingPartners.value = activity.partners || ""
      document.getElementById("networking-fields").style.display = "block"
    }

    // Store activity ID for update
    form.dataset.activityId = activity.id
  } else {
    modalTitle.textContent = "Add New Activity"

    // Show fields for default activity type
    document.getElementById(`${activityType.value}-fields`).style.display = "block"

    // Clear activity ID
    delete form.dataset.activityId
  }

  // Show modal
  modal.style.display = "block"
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Create DOM references
  DOM.upcomingList = document.getElementById("upcoming-list")
  DOM.recentList = document.getElementById("recent-list")
  DOM.workshopsGrid = document.getElementById("workshops-grid")
  DOM.mentoringList = document.getElementById("mentoring-list")
  DOM.networkingGrid = document.getElementById("networking-grid")
  DOM.statusMessage = document.getElementById("status-message")
  DOM.activityModal = document.getElementById("activity-modal")
  DOM.modalTitle = document.getElementById("modal-title")
  DOM.activityForm = document.getElementById("activity-form")
  DOM.activityType = document.getElementById("activity-type")
  DOM.activityTitle = document.getElementById("activity-title")
  DOM.activityDescription = document.getElementById("activity-description")
  DOM.activityDate = document.getElementById("activity-date")
  DOM.activityTime = document.getElementById("activity-time")
  DOM.activityLocation = document.getElementById("activity-location")
  DOM.activityCapacity = document.getElementById("activity-capacity")
  DOM.workshopPresenter = document.getElementById("workshop-presenter")
  DOM.workshopMaterials = document.getElementById("workshop-materials")
  DOM.mentoringMentorInput = document.getElementById("mentoring-mentor-input")
  DOM.mentoringMentee = document.getElementById("mentoring-mentee")
  DOM.mentoringFocus = document.getElementById("mentoring-focus")
  DOM.networkingFormat = document.getElementById("networking-format")
  DOM.networkingPartners = document.getElementById("networking-partners")
  DOM.workshopStatus = document.getElementById("workshop-status")
  DOM.workshopDateStart = document.getElementById("workshop-date-start")
  DOM.workshopDateEnd = document.getElementById("workshop-date-end")
  DOM.mentoringStatus = document.getElementById("mentoring-status")
  DOM.mentoringMentor = document.getElementById("mentoring-mentor")
  DOM.networkingStatus = document.getElementById("networking-status")
  DOM.networkingType = document.getElementById("networking-type")
  DOM.analyticsDateStart = document.getElementById("analytics-date-start")
  DOM.analyticsDateEnd = document.getElementById("analytics-date-end")
  DOM.syncBtn = document.getElementById("sync-btn")

  // Set default dates for filters
  const today = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(today.getMonth() - 1)
  const oneMonthLater = new Date()
  oneMonthLater.setMonth(today.getMonth() + 1)

  const formatDateForInput = (date) => {
    return date.toISOString().split("T")[0]
  }

  DOM.workshopDateStart.value = formatDateForInput(oneMonthAgo)
  DOM.workshopDateEnd.value = formatDateForInput(oneMonthLater)
  DOM.analyticsDateStart.value = formatDateForInput(oneMonthAgo)
  DOM.analyticsDateEnd.value = formatDateForInput(today)

  // Navigation event listeners
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", async () => {
      await switchView(item.dataset.view)
    })
  })

  // Add activity buttons
  document.getElementById("add-activity-btn").addEventListener("click", () => {
    showActivityModal()
  })

  document.getElementById("add-workshop-btn").addEventListener("click", () => {
    const modal = showActivityModal()
    DOM.activityType.value = "workshop"
    document.querySelectorAll(".activity-type-fields").forEach((field) => {
      field.style.display = "none"
    })
    document.getElementById("workshop-fields").style.display = "block"
  })

  document.getElementById("add-mentoring-btn").addEventListener("click", () => {
    const modal = showActivityModal()
    DOM.activityType.value = "mentoring"
    document.querySelectorAll(".activity-type-fields").forEach((field) => {
      field.style.display = "none"
    })
    document.getElementById("mentoring-fields").style.display = "block"
  })

  document.getElementById("add-networking-btn").addEventListener("click", () => {
    const modal = showActivityModal()
    DOM.activityType.value = "networking"
    document.querySelectorAll(".activity-type-fields").forEach((field) => {
      field.style.display = "none"
    })
    document.getElementById("networking-fields").style.display = "block"
  })

  // Activity type change
  DOM.activityType.addEventListener("change", () => {
    document.querySelectorAll(".activity-type-fields").forEach((field) => {
      field.style.display = "none"
    })
    document.getElementById(`${DOM.activityType.value}-fields`).style.display = "block"
  })

  // Close modal
  document.querySelector(".close-modal").addEventListener("click", () => {
    DOM.activityModal.style.display = "none"
  })

  document.querySelector(".cancel-btn").addEventListener("click", () => {
    DOM.activityModal.style.display = "none"
  })

  // Click outside modal to close
  window.addEventListener("click", (event) => {
    if (event.target === DOM.activityModal) {
      DOM.activityModal.style.display = "none"
    }
  })

  // Form submission
  DOM.activityForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const activityId = DOM.activityForm.dataset.activityId
    const isEdit = !!activityId

    // Create command
    const cmd = new Command(isEdit ? Commands.UPDATE : Commands.ADD, isEdit ? [activityId] : [])

    // Execute command
    await CommandExecutor.execute(cmd)

    // Close modal
    DOM.activityModal.style.display = "none"

    // Refresh current view to show updated data
    await switchView(currentView)
  })

  // Filter application
  document.getElementById("apply-workshop-filters").addEventListener("click", async () => {
    await renderWorkshops()
  })

  document.getElementById("apply-mentoring-filters").addEventListener("click", () => {
    renderMentoringSessions()
  })

  document.getElementById("apply-networking-filters").addEventListener("click", () => {
    renderNetworkingEvents()
  })

  document.getElementById("apply-analytics-dates").addEventListener("click", () => {
    renderAnalytics()
  })

  // Sync button
  DOM.syncBtn.addEventListener("click", async () => {
    try {
      DOM.syncBtn.disabled = true
      DOM.syncBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="sync-icon spinning"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25 1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <span>Syncing...</span>
      `

      await ApiService.syncActivities()
      showStatus("Activities synchronized successfully")

      // Refresh current view
      await switchView(currentView)
    } catch (error) {
      showStatus("Failed to synchronize activities", true)
      console.error("Sync error:", error)
    } finally {
      DOM.syncBtn.disabled = false
      DOM.syncBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="sync-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <span>Sync Data</span>
      `
    }
  })

  // Activity list event delegation
  document.addEventListener("click", async (event) => {
    // Edit button
    if (event.target.closest(".edit-btn")) {
      const activityItem = event.target.closest("[data-id]")
      if (activityItem) {
        const activityId = activityItem.dataset.id
        const activity = ActivityList.getInstance().findById(activityId)
        if (activity) {
          showActivityModal(activity)
        }
      }
    }

    // Complete button
    if (event.target.closest(".complete-btn")) {
      const activityItem = event.target.closest("[data-id]")
      if (activityItem) {
        const activityId = activityItem.dataset.id
        const cmd = new Command(Commands.COMPLETE, [activityId])
        await CommandExecutor.execute(cmd)
        await switchView(currentView)
      }
    }

    // Cancel button
    if (event.target.closest(".cancel-btn")) {
      const activityItem = event.target.closest("[data-id]")
      if (activityItem) {
        const activityId = activityItem.dataset.id
        const cmd = new Command(Commands.CANCEL, [activityId])
        await CommandExecutor.execute(cmd)
        await switchView(currentView)
      }
    }
  })

  // Load activities from local storage first
  LocalStorage.load()

  // Then try to fetch from API
  ApiService.fetchActivities()
    .then(() => {
      showStatus("Activities loaded from server")
    })
    .catch((error) => {
      console.error("Error fetching activities:", error)
      showStatus("Using locally stored activities", true)
    })
    .finally(async () => {
      // Initialize view
      await switchView("dashboard")
    })
})
