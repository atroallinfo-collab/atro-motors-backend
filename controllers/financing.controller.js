const Financing = require('../models/Financing');
const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/email');

// Apply for financing
exports.applyForFinancing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employmentStatus,
      monthlyIncome,
      loanAmount,
      downPayment,
      loanTerm,
      vehicleId,
      creditScore
    } = req.body;

    // Check if vehicle exists
    if (vehicleId) {
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
    }

    const financing = await Financing.create({
      userId: req.userId || null,
      vehicleId,
      employmentStatus,
      monthlyIncome: parseFloat(monthlyIncome),
      loanAmount: parseFloat(loanAmount),
      downPayment: parseFloat(downPayment),
      loanTerm: parseInt(loanTerm),
      creditScore: creditScore ? parseInt(creditScore) : null
    });

    // Send confirmation email
    if (req.userId) {
      const user = await User.findByPk(req.userId);
      await sendEmail({
        to: user.email,
        subject: 'Financing Application Received',
        template: 'financing-confirmation',
        data: {
          name: user.name,
          loanAmount,
          loanTerm
        }
      });
    }

    // Notify financing team
    await sendEmail({
      to: process.env.FINANCING_EMAIL,
      subject: 'New Financing Application',
      template: 'new-financing',
      data: financing.toJSON()
    });

    res.status(201).json({
      success: true,
      message: 'Financing application submitted successfully',
      application: financing
    });
  } catch (error) {
    console.error('Apply financing error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// Get my applications
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Financing.findAll({
      where: { userId: req.userId },
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year', 'price', 'images'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

// Get application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Financing.findByPk(id, {
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year', 'price'] },
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check permissions
    if (application.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

// Upload documents
exports.uploadDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Financing.findByPk(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check permissions
    if (application.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = application.documents || [];
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          path: file.path,
          type: file.mimetype,
          uploadedAt: new Date()
        });
      });

      await application.update({ 
        documents,
        status: 'under-review' 
      });
    }

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Get all applications (admin)
exports.getAllApplications = async (req, res) => {
  try {
    // Check admin role
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Financing.findAndCountAll({
      where,
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year'] },
        { model: User, as: 'user', attributes: ['name', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      applications: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedAmount, interestRate, remarks } = req.body;

    // Check admin role
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const application = await Financing.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
        { model: Vehicle, attributes: ['make', 'model', 'year'] }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updates = { status };
    if (approvedAmount) updates.approvedAmount = parseFloat(approvedAmount);
    if (interestRate) updates.interestRate = parseFloat(interestRate);
    if (remarks) updates.remarks = remarks;

    // Calculate monthly payment if approved
    if (status === 'approved' && approvedAmount && interestRate && application.loanTerm) {
      const monthlyRate = interestRate / 100 / 12;
      const payment = approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, application.loanTerm) /
                     (Math.pow(1 + monthlyRate, application.loanTerm) - 1);
      updates.monthlyPayment = payment;
    }

    await application.update(updates);

    // Notify customer
    if (application.user) {
      await sendEmail({
        to: application.user.email,
        subject: `Update on your financing application`,
        template: 'financing-status-update',
        data: {
          name: application.user.name,
          status,
          approvedAmount,
          interestRate,
          monthlyPayment: updates.monthlyPayment
        }
      });

      // Send SMS for important updates
      if (status === 'approved') {
        await sendSMS(
          application.user.phone,
          `Your financing application has been approved! Check your email for details.`
        );
      }
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
};

// Calculate payment
exports.calculatePayment = async (req, res) => {
  try {
    const { loanAmount, interestRate, loanTerm, downPayment } = req.body;

    const principal = parseFloat(loanAmount) - (parseFloat(downPayment) || 0);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const months = parseInt(loanTerm);

    if (principal <= 0 || monthlyRate <= 0 || months <= 0) {
      return res.status(400).json({ error: 'Invalid input values' });
    }

    const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
                          (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    res.json({
      success: true,
      calculation: {
        principal,
        monthlyPayment: monthlyPayment.toFixed(2),
        totalPayment: totalPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        downPayment: parseFloat(downPayment) || 0
      }
    });
  } catch (error) {
    console.error('Calculate payment error:', error);
    res.status(500).json({ error: 'Failed to calculate payment' });
  }
};// placeholder
