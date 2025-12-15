// backend/config/database.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to PostgreSQL using the full connection string from .env
const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres',  // PostgreSQL
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // optional
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
});

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
