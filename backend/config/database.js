const { Sequelize } = require('sequelize');

// Environment variables should be used for sensitive information in production
const DB_NAME = process.env.DB_NAME || 'fuel_delivery';
const DB_USER = process.env.DB_USER || 'admin';
const DB_PASSWORD = process.env.DB_PASSWORD || 'adminpassword';
const DB_HOST = process.env.DB_HOST || 'db'; // 'db' is the service name in docker-compose
const DB_PORT = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres', // Specify the dialect explicitly
  logging: console.log, // Set to false to disable logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;