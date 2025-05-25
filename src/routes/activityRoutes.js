const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');

// Validation middleware
const validateActivity = [
  body('type').isIn(['workshop', 'mentoring', 'networking']).withMessage('Invalid activity type'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('date').isISO8601().toDate().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be a positive number'),
];

// Routes
router.get('/activities', activityController.getActivities);
router.get('/activities/upcoming', activityController.getUpcomingActivities);
router.get('/activities/recent', activityController.getRecentActivities);
router.get('/activities/:id', activityController.getActivityById);
router.post('/activities', validateActivity, activityController.createActivity);
router.put('/activities/:id', activityController.updateActivity);
router.delete('/activities/:id', activityController.deleteActivity);
router.post('/activities/sync', activityController.syncActivities);
router.post('/activities/:id/complete', activityController.completeActivity);
router.post('/activities/:id/cancel', activityController.cancelActivity);

// Additional endpoints
router.get('/mentors', activityController.getMentors);
router.get('/statistics', activityController.getStatistics);

module.exports = router; 
