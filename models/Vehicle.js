const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  make: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  originalPrice: {
    type: DataTypes.DECIMAL(12, 2)
  },
  mileage: {
    type: DataTypes.INTEGER
  },
  fuelType: {
    type: DataTypes.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
    allowNull: false
  },
  transmission: {
    type: DataTypes.ENUM('automatic', 'manual', 'semi-automatic'),
    allowNull: false
  },
  bodyType: {
    type: DataTypes.ENUM('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck')
  },
  color: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('available', 'reserved', 'sold', 'coming-soon'),
    defaultValue: 'available'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  warrantyMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  inspectionReport: {
    type: DataTypes.JSON
  },
  location: {
    type: DataTypes.STRING
  },
  soldAt: {
    type: DataTypes.DATE
  }
});

module.exports = Vehicle; // placeholder
