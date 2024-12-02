const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Price = sequelize.define('Price', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  "Ship to SAP": {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  "SAP material": {
    type: DataTypes.STRING(50),
    allowNull: false,
    set(value) {
      const stringValue = String(value);
      this.setDataValue('SAP material', stringValue.replace(/^0+/, ''));
    },
  },
  "Price Unit (HT)": {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
    set(value) {
      if (typeof value === 'string') {
        value = value.replace(',', '.');
      }
      this.setDataValue('Price Unit (HT)', value);
    }
  }
}, {
  tableName: 'prices',
  timestamps: false,
});

module.exports = Price;