const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Sales Order": {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  "Order Type": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Customer": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Customer Name": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Plant": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Plant Name": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Ship To Party": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Ship To Name": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Valution Type": {
    type: DataTypes.STRING
  },
  "City(Ship To)": {
    type: DataTypes.STRING
  },
  "Item": {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  "Material Code": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Material Name": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Order Qty": {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  "Sls.UOM": {
    type: DataTypes.STRING,
    allowNull: false
  },
  "Requested delivery date": {
    type: DataTypes.DATE,
    allowNull: false
  },
  "Pat.Doc": {
    type: DataTypes.STRING
  },
  "Trip Num": {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  "Tour Start Date": {
    type: DataTypes.DATE
  },
  "Org Name": {
    type: DataTypes.STRING
  },
  "Driver Name": {
    type: DataTypes.STRING
  },
  "Vehicle Id": {
    type: DataTypes.STRING
  },
  "status": {
    type: DataTypes.ENUM('Created', 'Truck Loading Confirmation', 'Loading Confirmed', 'BL & Invoice', 'Completed'),
    defaultValue: 'Created'
  },
  "order_type": {
    type: DataTypes.ENUM('PACK', 'VRAC'),
    allowNull: false
  },
  "Total Price": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;