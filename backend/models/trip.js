const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Trip Num": {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  "Tour Start Date": {
    type: DataTypes.DATE,
    allowNull: false
  },
  "Requested delivery date": {
    type: DataTypes.DATE,
    allowNull: false
  },
  "Vehicle Id": {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'trucks',
      key: 'Vehicle'
    }
  },
  "Order Qty": {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  "Status": {
    type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Planned'
  },
  sealnumbers: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  totalorders: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  uniquesalesorders: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  "Driver Name": {
    type: DataTypes.STRING,
    allowNull: true
  },
  "Driver CIN": {
    type: DataTypes.STRING,
    allowNull: true
  },
  numlivraison: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  numfacture: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'trips',
  timestamps: false
});

module.exports = Trip;