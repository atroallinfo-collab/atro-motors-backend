// placeholder
const Inquiry = require('../models/Inquiry');
const Vehicle = require('../models/User');
const { sendEmail } = require('../utils/email');
const { validationResult } = require('express-validator');

// Create inquiry (contact form)
exports.createInquiry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      subject,
      message,
      vehicleId,
      vehicleInterest
    } = req.body;

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      subject,
      message,
      vehicleId,
      vehicleInterest,
      userId: req.userId || null
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Thank you for contacting Atro Motors',
      template: 'inquiry-confirmation',
      data: { name, subject, message }
    });

    // Notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Inquiry Received',
      template: 'new-inquiry',
      data: { name, email, phone, subject, message }
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We\'ll contact you soon.',
      inquiry
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
};

// Get all inquiries (admin)
exports.getInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Inquiry.findAndCountAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['make', 'model', 'year'] },
        { model: User, as: 'assignedAgent', attributes: ['name', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      inquiries: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
};

// Get my inquiries
exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      where: { userId: req.userId },
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['make', 'model', 'year', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    console.error('Get my inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
};

// Get inquiry by ID
exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'assignedAgent', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Check permissions
    if (inquiry.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
};

// Update inquiry status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;

    await inquiry.update(updates);

    // Notify customer of status change
    if (status && status !== inquiry.status) {
      await sendEmail({
        to: inquiry.email,
        subject: `Update on your inquiry: ${inquiry.subject}`,
        template: 'inquiry-status-update',
        data: { name: inquiry.name, status, inquiryId: inquiry.id }
      });
    }

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      inquiry
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
};

// Add response to inquiry
exports.addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, internal } = req.body;

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Add response to inquiry (you might want a separate Response model)
    const responses = inquiry.responses || [];
    responses.push({
      message,
      internal: internal || false,
      userId: req.userId,
      timestamp: new Date()
    });

    await inquiry.update({ responses });

    // Send email to customer if not internal
    if (!internal) {
      await sendEmail({
        to: inquiry.email,
        subject: `Response to your inquiry: ${inquiry.subject}`,
        template: 'inquiry-response',
        data: { name: inquiry.name, message }
      });
    }

    res.json({
      success: true,
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
};

// Get daily inquiry stats
exports.getDailyStats = async (req, res) => {
  try {
    // Check admin role
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get total inquiries
    const total = await Inquiry.count({ where });

    // Get by status
    const byStatus = await Inquiry.findAll({
      attributes: ['status', [sequelize.fn('COUNT', 'status'), 'count']],
      where,
      group: ['status']
    });

    // Get daily counts for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await Inquiry.count({
        where: {
          createdAt: {
            [Op.between]: [date, nextDay]
          }
        }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    res.json({
      success: true,
      stats: {
        total,
        byStatus,
        last7Days
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};