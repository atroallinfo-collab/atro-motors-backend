const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const financingController = require('../controllers/financing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

// Validation rules
const financingValidation = [
  body('employmentStatus').isIn(['employed', 'self-employed', 'unemployed', 'student']),
  body('monthlyIncome').isFloat({ min: 0 }),
  body('loanAmount').isFloat({ min: 0 }),
  body('downPayment').isFloat({ min: 0 }),
  body('loanTerm').isInt({ min: 1, max: 84 }) // Max 7 years
];

// Public route (apply for financing)
router.post('/apply', financingValidation, financingController.applyForFinancing);

// Protected routes
router.get('/my-applications', authMiddleware, financingController.getMyApplications);
router.get('/:id', authMiddleware, financingController.getApplicationById);
router.post('/:id/documents', authMiddleware, uploadMiddleware.array('documents', 5), financingController.uploadDocuments);

// Admin routes
router.get('/', authMiddleware, financingController.getAllApplications);
router.put('/:id/status', authMiddleware, financingController.updateApplicationStatus);
router.post('/:id/calculate', authMiddleware, financingController.calculatePayment);

module.exports = router;// placeholder
