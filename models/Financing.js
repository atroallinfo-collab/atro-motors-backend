const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Financing = sequelize.define('Financing', {
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
  employmentStatus: {
    type: DataTypes.ENUM('employed', 'self-employed', 'unemployed', 'student'),
    allowNull: false
  },
  monthlyIncome: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  loanAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  downPayment: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  loanTerm: {
    type: DataTypes.INTEGER, // months
    allowNull: false
  },
  creditScore: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'under-review'),
    defaultValue: 'pending'
  },
  approvedAmount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2)
  },
  monthlyPayment: {
    type: DataTypes.DECIMAL(10, 2)
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  remarks: {
    type: DataTypes.TEXT
  }
});

module.exports = Financing;// placeholder
