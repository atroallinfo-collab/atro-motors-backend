const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inquiryController = require('../controllers/inquiry.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Validation rules
const inquiryValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
];

// Public route (contact form)
router.post('/', inquiryValidation, inquiryController.createInquiry);

// Protected routes
router.get('/', authMiddleware, inquiryController.getInquiries);
router.get('/my-inquiries', authMiddleware, inquiryController.getMyInquiries);
router.get('/:id', authMiddleware, inquiryController.getInquiryById);
router.put('/:id/status', authMiddleware, inquiryController.updateStatus);
router.post('/:id/response', authMiddleware, inquiryController.addResponse);

// Admin routes
router.get('/stats/daily', authMiddleware, inquiryController.getDailyStats);

module.exports = router;// placeholder
