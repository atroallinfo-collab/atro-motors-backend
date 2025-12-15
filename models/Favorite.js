const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
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
    },
    allowNull: false
  },
  vehicleId: {
    type: DataTypes.UUID,
    references: {
      model: 'Vehicles',
      key: 'id'
    },
    allowNull: false
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'vehicleId']
    }
  ]
});

module.exports = Favorite;// placeholder
