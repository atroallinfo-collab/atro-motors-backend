const TestDrive = require('../models/TestDrive');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { Op } = require('sequelize');

// Schedule test drive
exports.scheduleTestDrive = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      preferredDate,
      preferredTime,
      location,
      vehicleId,
      notes
    } = req.body;

    // Check if vehicle exists
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check availability (simplified - in real app, check against existing bookings)
    const existingBooking = await TestDrive.findOne({
      where: {
        vehicleId,
        preferredDate: new Date(preferredDate),
        preferredTime,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const testDrive = await TestDrive.create({
      userId: req.userId || null,
      vehicleId,
      name,
      email,
      phone,
      preferredDate: new Date(preferredDate),
      preferredTime,
      location,
      notes
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Test Drive Scheduled - Atro Motors',
      template: 'test-drive-confirmation',
      data: {
        name,
        vehicle: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
        date: preferredDate,
        time: preferredTime,
        location
      }
    });

    // Send SMS reminder
    await sendSMS(
      phone,
      `Your test drive for ${vehicle.make} ${vehicle.model} is scheduled for ${preferredDate} at ${preferredTime}.`
    );

    // Notify sales team
    await sendEmail({
      to: process.env.SALES_EMAIL,
      subject: 'New Test Drive Scheduled',
      template: 'new-test-drive',
      data: {
        name,
        phone,
        email,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        date: preferredDate,
        time: preferredTime
      }
    });

    res.status(201).json({
      success: true,
      message: 'Test drive scheduled successfully',
      testDrive
    });
  } catch (error) {
    console.error('Schedule test drive error:', error);
    res.status(500).json({ error: 'Failed to schedule test drive' });
  }
};

// Get my test drives
exports.getMyTestDrives = async (req, res) => {
  try {
    const testDrives = await TestDrive.findAll({
      where: { userId: req.userId },
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year', 'images'] }
      ],
      order: [['preferredDate', 'DESC']]
    });

    res.json({
      success: true,
      testDrives
    });
  } catch (error) {
    console.error('Get test drives error:', error);
    res.status(500).json({ error: 'Failed to fetch test drives' });
  }
};

// Get test drive by ID
exports.getTestDriveById = async (req, res) => {
  try {
    const { id } = req.params;

    const testDrive = await TestDrive.findByPk(id, {
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year', 'price', 'images'] },
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!testDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    // Check permissions
    if (testDrive.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      testDrive
    });
  } catch (error) {
    console.error('Get test drive error:', error);
    res.status(500).json({ error: 'Failed to fetch test drive' });
  }
};

// Cancel test drive
exports.cancelTestDrive = async (req, res) => {
  try {
    const { id } = req.params;

    const testDrive = await TestDrive.findByPk(id, {
      include: [
        { model: Vehicle, attributes: ['make', 'model'] },
        { model: User, as: 'user', attributes: ['email', 'phone'] }
      ]
    });

    if (!testDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    // Check permissions
    if (testDrive.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can only cancel if not completed
    if (testDrive.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed test drive' });
    }

    await testDrive.update({ status: 'cancelled' });

    // Send cancellation email
    if (testDrive.user) {
      await sendEmail({
        to: testDrive.user.email,
        subject: 'Test Drive Cancelled',
        template: 'test-drive-cancelled',
        data: {
          name: testDrive.name,
          vehicle: `${testDrive.Vehicle.make} ${testDrive.Vehicle.model}`,
          date: testDrive.preferredDate
        }
      });
    }

    res.json({
      success: true,
      message: 'Test drive cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel test drive error:', error);
    res.status(500).json({ error: 'Failed to cancel test drive' });
  }
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    const testDrive = await TestDrive.findByPk(id, {
      include: [
        { model: Vehicle, attributes: ['make', 'model'] }
      ]
    });

    if (!testDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    // Check permissions and status
    if (testDrive.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (testDrive.status !== 'completed') {
      return res.status(400).json({ error: 'Can only submit feedback for completed test drives' });
    }

    await testDrive.update({
      feedback,
      rating: rating ? parseInt(rating) : null
    });

    // Notify admin of new feedback
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Test Drive Feedback Received',
      template: 'test-drive-feedback',
      data: {
        vehicle: `${testDrive.Vehicle.make} ${testDrive.Vehicle.model}`,
        rating,
        feedback: feedback.substring(0, 200) + '...'
      }
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// Get all test drives (admin)
exports.getAllTestDrives = async (req, res) => {
  try {
    // Check admin role
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20, status, date } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (date) where.preferredDate = new Date(date);

    const { count, rows } = await TestDrive.findAndCountAll({
      where,
      include: [
        { model: Vehicle, attributes: ['make', 'model', 'year'] },
        { model: User, as: 'user', attributes: ['name', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['preferredDate', 'ASC']]
    });

    res.json({
      success: true,
      testDrives: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all test drives error:', error);
    res.status(500).json({ error: 'Failed to fetch test drives' });
  }
};

// Update test drive status
exports.updateTestDriveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check admin role
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const testDrive = await TestDrive.findByPk(id, {
      include: [
        { model: Vehicle, attributes: ['make', 'model'] },
        { model: User, as: 'user', attributes: ['email', 'phone'] }
      ]
    });

    if (!testDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    await testDrive.update({ status });

    // Send status update notification
    if (testDrive.user) {
      await sendEmail({
        to: testDrive.user.email,
        subject: `Test Drive Status Update`,
        template: 'test-drive-status-update',
        data: {
          name: testDrive.name,
          status,
          vehicle: `${testDrive.Vehicle.make} ${testDrive.Vehicle.model}`,
          date: testDrive.preferredDate
        }
      });
    }

    res.json({
      success: true,
      message: 'Test drive status updated successfully'
    });
  } catch (error) {
    console.error('Update test drive status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Get available time slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, vehicleId } = req.query;

    if (!date || !vehicleId) {
      return res.status(400).json({ error: 'Date and vehicleId are required' });
    }

    const selectedDate = new Date(date);
    
    // Define available time slots (9 AM to 6 PM, hourly)
    const allSlots = [
      '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Get booked slots for the selected date and vehicle
    const bookedSlots = await TestDrive.findAll({
      where: {
        vehicleId,
        preferredDate: selectedDate,
        status: { [Op.in]: ['pending', 'confirmed'] }
      },
      attributes: ['preferredTime']
    });

    const bookedTimes = bookedSlots.map(slot => slot.preferredTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      success: true,
      date: selectedDate.toISOString().split('T')[0],
      availableSlots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};// placeholder
