const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const importRoutes = require('./routes/importRoutes');
const orderRoutes = require('./routes/ordersRoutes');
const tripRoutes = require('./routes/tripsRoutes');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'fuel_delivery',
  process.env.DB_USER || 'admin',
  process.env.DB_PASSWORD || 'adminpassword',
  {
    host: process.env.DB_HOST || 'db',
    dialect: 'postgres',
    logging: false, // Set to console.log to see the SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const models = require('./models');

// Initialize model associations
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Routes
app.use('/api/import', importRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Fuel Delivery Management System API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectWithRetry = async (retries) => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    
    // Sync models without creating constraints
    await sequelize.sync({ force: false, alter: false });
    console.log('Database synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database or sync models:', err);
    if (retries > 0) {
      console.log(`Retrying in ${RETRY_INTERVAL/1000} seconds... (${retries} retries left)`);
      setTimeout(() => connectWithRetry(retries - 1), RETRY_INTERVAL);
    } else {
      console.error('Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

connectWithRetry(MAX_RETRIES);

module.exports = app;