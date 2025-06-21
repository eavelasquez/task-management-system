import { ActivityList } from './classes.js';

export const ChartRenderer = {
  // Render activity distribution chart
  renderActivityDistribution(containerId, startDate = null, endDate = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = ActivityList.getInstance().getStats(startDate, endDate);

    container.innerHTML = `
      <div class="placeholder-chart">
        <div>Activity Distribution</div>
        <div>Workshops: ${stats.byType.workshop}</div>
        <div>Mentoring: ${stats.byType.mentoring}</div>
        <div>Networking: ${stats.byType.networking}</div>
      </div>
    `;
  },

  // Render participant growth chart
  renderParticipantGrowth(containerId, _startDate = null, _endDate = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="placeholder-chart">
        <div>Participant Growth</div>
        <div>This would show participant growth over time</div>
      </div>
    `;
  },

  // Render completion rates chart
  renderCompletionRates(containerId, startDate = null, endDate = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = ActivityList.getInstance().getStats(startDate, endDate);

    container.innerHTML = `
      <div class="placeholder-chart">
        <div>Completion Rates</div>
        <div>Completion Rate: ${stats.completionRate.toFixed(1)}%</div>
        <div>Completed: ${stats.byStatus.completed}</div>
        <div>Upcoming: ${stats.byStatus.upcoming}</div>
        <div>Cancelled: ${stats.byStatus.cancelled}</div>
      </div>
    `;
  },
};
