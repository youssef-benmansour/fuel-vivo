const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Customer Sold to": {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  "Customer Sold to name": DataTypes.STRING(100),
  "Customer Sold to city": DataTypes.STRING(100),
  "Statut de droit": DataTypes.STRING(10),
  "Statut de droit name": DataTypes.STRING(100),
  "ID Fiscal": DataTypes.STRING(50),
  "ICE": DataTypes.STRING(50),
  "Distribution channel": DataTypes.STRING(10),
  "Division": DataTypes.STRING(10),
  "Customer Ship to": {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  "Customer ship to name": DataTypes.STRING(100),
  "Customer ship to Address": DataTypes.STRING(200),
  "Customer ship to city": DataTypes.STRING(100),
  "Postal code": DataTypes.STRING(20),
  "Country": DataTypes.STRING(10),
  "Paiement terms": DataTypes.STRING(100),
  "Shipping condition": DataTypes.STRING(50),
  "Transport mode": DataTypes.STRING(10),
  "Delivering plant": DataTypes.STRING(10),
  "Transportation zone": DataTypes.STRING(20)
}, {
  tableName: 'clients',
  timestamps: false
});

module.exports = Client;