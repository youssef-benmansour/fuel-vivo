const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plant = sequelize.define('Plant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Plant Code": {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
    field: 'Plant Code'
  },
  "Description": DataTypes.STRING(100),
  "Plant Category": DataTypes.STRING(50),
  "Old code": DataTypes.STRING(50)
}, {
  tableName: 'plants',
  timestamps: false
});

module.exports = Plant;