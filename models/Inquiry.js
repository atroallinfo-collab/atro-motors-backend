const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inquiry = sequelize.define('Inquiry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  vehicleId: {
    type: DataTypes.UUID,
    references: {
      model: 'Vehicles',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.ENUM(
      'vehicle-inquiry',
      'test-drive',
      'financing',
      'sell-car',
      'service',
      'general',
      'complaint',
      'partnership'
    ),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  vehicleInterest: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('new', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'new'
  },
  assignedTo: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = Inquiry;// placeholder
