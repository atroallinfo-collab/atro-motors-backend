const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const testDriveController = require('../controllers/test-drive.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Validation rules
const testDriveValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('preferredDate').isISO8601().withMessage('Valid date is required'),
  body('preferredTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required'),
  body('location').notEmpty().withMessage('Location is required')
];

// Public route (schedule test drive)
router.post('/schedule', testDriveValidation, testDriveController.scheduleTestDrive);

// Protected routes
router.get('/my-test-drives', authMiddleware, testDriveController.getMyTestDrives);
router.get('/:id', authMiddleware, testDriveController.getTestDriveById);
router.put('/:id/cancel', authMiddleware, testDriveController.cancelTestDrive);
router.post('/:id/feedback', authMiddleware, testDriveController.submitFeedback);

// Admin routes
router.get('/', authMiddleware, testDriveController.getAllTestDrives);
router.put('/:id/status', authMiddleware, testDriveController.updateTestDriveStatus);
router.get('/calendar/available-slots', authMiddleware, testDriveController.getAvailableSlots);

module.exports = router;// placeholder
