const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tank = sequelize.define('Tank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Tank": {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  "Name": DataTypes.STRING(100),
  "Code depot": {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  "Depot name": DataTypes.STRING(100),
  "Group": DataTypes.STRING(50)
}, {
  tableName: 'tanks',
  timestamps: false
});

module.exports = Tank;