import { ActivityList, Activity } from './classes.js';
import { ActivityHistory } from './memento.js';
import { ApiService } from './api-service.js';

export class Command {
  name;
  args;
  constructor(name, args = []) {
    this.name = name;
    this.args = args;
  }
}

export const Commands = {
  ADD: 'add',
  UPDATE: 'update',
  DELETE: 'delete',
  COMPLETE: 'complete',
  CANCEL: 'cancel',
  UNDO: 'undo',
};

export const CommandExecutor = {
  async execute(command) {
    const activityList = ActivityList.getInstance();
    const DOM = globalThis.DOM;

    switch (command.name) {
      case Commands.ADD:
        const activityType = DOM.activityType.value;
        const activityTitle = DOM.activityTitle.value.trim();
        const activityDate = DOM.activityDate.value;
        const activityTime = DOM.activityTime.value;

        if (activityTitle !== '' && activityDate && activityTime) {
          const activityData = {
            type: activityType,
            title: activityTitle,
            date: activityDate,
            time: activityTime,
            description: DOM.activityDescription.value.trim(),
            location: DOM.activityLocation.value.trim(),
            capacity: DOM.activityCapacity.value
              ? Number.parseInt(DOM.activityCapacity.value)
              : null,
            createdAt: new Date().toISOString(),
          };

          // Set type-specific properties
          if (activityType === 'workshop') {
            activityData.presenter = DOM.workshopPresenter.value.trim();
            activityData.materials = DOM.workshopMaterials.value.trim();
          } else if (activityType === 'mentoring') {
            activityData.mentor = DOM.mentoringMentorInput.value.trim();
            activityData.mentee = DOM.mentoringMentee.value.trim();
            activityData.focus = DOM.mentoringFocus.value.trim();
          } else if (activityType === 'networking') {
            activityData.format = DOM.networkingFormat.value;
            activityData.partners = DOM.networkingPartners.value.trim();
          }

          try {
            const newActivity = await ApiService.addActivity(activityData);
            // Update local list
            const activity = new Activity(
              newActivity.type,
              newActivity.title,
              newActivity.date,
              newActivity.time
            );
            Object.assign(activity, newActivity);
            activityList.add(activity);

            if (globalThis.showStatus) {
              globalThis.showStatus('Activity created successfully');
            }
          } catch (error) {
            console.error('Error creating activity:', error);
            if (globalThis.showStatus) {
              globalThis.showStatus('Failed to create activity', true);
            }
          }
        }
        break;

      case Commands.UPDATE:
        const [activityId] = command.args;
        const activity = activityList.findById(activityId);

        if (activity) {
          const activityType = DOM.activityType.value;
          const activityTitle = DOM.activityTitle.value.trim();
          const activityDate = DOM.activityDate.value;
          const activityTime = DOM.activityTime.value;

          if (activityTitle !== '' && activityDate && activityTime) {
            const data = {
              title: activityTitle,
              date: activityDate,
              time: activityTime,
              description: DOM.activityDescription.value.trim(),
              location: DOM.activityLocation.value.trim(),
              capacity: DOM.activityCapacity.value
                ? Number.parseInt(DOM.activityCapacity.value)
                : null,
            };

            // Add type-specific properties
            if (activityType === 'workshop') {
              data.presenter = DOM.workshopPresenter.value.trim();
              data.materials = DOM.workshopMaterials.value.trim();
            } else if (activityType === 'mentoring') {
              data.mentor = DOM.mentoringMentorInput.value.trim();
              data.mentee = DOM.mentoringMentee.value.trim();
              data.focus = DOM.mentoringFocus.value.trim();
            } else if (activityType === 'networking') {
              data.format = DOM.networkingFormat.value;
              data.partners = DOM.networkingPartners.value.trim();
            }

            try {
              const updatedActivity = await ApiService.updateActivity({
                ...activity,
                ...data,
              });
              // Update local list
              activityList.update(activityId, data);

              if (globalThis.showStatus) {
                globalThis.showStatus('Activity updated successfully');
              }
            } catch (error) {
              console.error('Error updating activity:', error);
              if (globalThis.showStatus) {
                globalThis.showStatus('Failed to update activity', true);
              }
            }
          }
        }
        break;

      case Commands.DELETE:
        const [idToDelete] = command.args;
        try {
          await ApiService.deleteActivity(idToDelete);
          activityList.delete(idToDelete);

          if (globalThis.showStatus) {
            globalThis.showStatus('Activity deleted successfully');
          }
        } catch (error) {
          console.error('Error deleting activity:', error);
          if (globalThis.showStatus) {
            globalThis.showStatus('Failed to delete activity', true);
          }
        }
        break;

      case Commands.COMPLETE:
        const [idToComplete] = command.args;
        ApiService.completeActivity(idToComplete)
          .then(() => {
            activityList.complete(idToComplete);
          })
          .catch(error => {
            console.error('Error completing activity:', error);
            // Show error message to user
            if (globalThis.showStatus) {
              globalThis.showStatus('Failed to complete activity', true);
            }
          });
        break;

      case Commands.CANCEL:
        const [idToCancel] = command.args;
        ApiService.cancelActivity(idToCancel)
          .then(() => {
            activityList.cancel(idToCancel);
          })
          .catch(error => {
            console.error('Error cancelling activity:', error);
            // Show error message to user
            if (globalThis.showStatus) {
              globalThis.showStatus('Failed to cancel activity', true);
            }
          });
        break;

      case Commands.UNDO:
        const previousList = ActivityHistory.pop();
        if (previousList) {
          activityList.replaceList(previousList);
        }
        break;
    }
  },
};
