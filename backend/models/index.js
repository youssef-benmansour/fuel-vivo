const config = require('../config/database');

// Import models
const Client = require('./client');
const Product = require('./product');
const Tank = require('./tank');
const Truck = require('./truck');
const Plant = require('./plant');
const Price = require('./price');
const Order = require('./order');
const ImportHistory = require('./importHistory');
const Trip = require('./trip');
const User = require('./user');

// Define relationships
Trip.belongsTo(Truck, { foreignKey: 'Vehicle Id', targetKey: 'Vehicle', as: 'Truck' });
Trip.hasMany(Order, { foreignKey: 'Trip Num', sourceKey: 'Trip Num', as: 'Orders' });
Order.belongsTo(Trip, { foreignKey: 'Trip Num', targetKey: 'Trip Num', as: 'Trip' });

// Client relationships
Client.hasMany(Order, { foreignKey: 'Customer', sourceKey: 'Customer Sold to', constraints: false, as: 'CustomerOrders' });
Client.hasMany(Order, { foreignKey: 'Ship To Party', sourceKey: 'Customer Ship to', constraints: false, as: 'ShipToOrders' });
Order.belongsTo(Client, { foreignKey: 'Customer', targetKey: 'Customer Sold to', constraints: false, as: 'CustomerInfo' });
Order.belongsTo(Client, { foreignKey: 'Ship To Party', targetKey: 'Customer Ship to', constraints: false, as: 'ShipToInfo' });

// Product relationships
Product.hasMany(Price, { foreignKey: 'SAP material', sourceKey: 'Material', as: 'Prices' });
Price.belongsTo(Product, { foreignKey: 'SAP material', targetKey: 'Material', as: 'Product' });
Product.hasMany(Order, { foreignKey: 'Material Code', sourceKey: 'Material', constraints: false, as: 'Orders' });
Order.belongsTo(Product, { foreignKey: 'Material Code', targetKey: 'Material', constraints: false, as: 'Product' });

// Plant relationships
Plant.hasMany(Order, { foreignKey: 'Plant', sourceKey: 'Plant Code', constraints: false, as: 'Orders' });
Order.belongsTo(Plant, { foreignKey: 'Plant', targetKey: 'Plant Code', constraints: false, as: 'PlantInfo' });

// Truck relationships
Truck.hasMany(Order, { foreignKey: 'Vehicle Id', constraints: false, as: 'Orders' });
Order.belongsTo(Truck, { foreignKey: 'Vehicle Id', constraints: false, as: 'Truck' });

// Price relationships
Client.hasMany(Price, { foreignKey: 'Ship to SAP', as: 'Prices' });
Price.belongsTo(Client, { foreignKey: 'Ship to SAP', as: 'Client' });


// Function to sync all models with the database
const syncModels = async () => {
  try {
    await config.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing the models:', error);
  }
};

module.exports = {
  sequelize: config,
  Client,
  Product,
  Tank,
  Truck,
  Plant,
  Price,
  Order,
  Trip,
  ImportHistory,
  User,
  syncModels
};