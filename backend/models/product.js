const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Material: {
    type: DataTypes.STRING(50),
    unique : true,
    allowNull: false,
    set(value) {
      const stringValue = String(value);
      this.setDataValue('Material', stringValue.replace(/^0+/, ''));
    }
  },
  "DF at client level": DataTypes.STRING(50),
  "Material type": DataTypes.STRING(50),
  "Material Group": DataTypes.STRING(50),
  "Old Material Number": DataTypes.STRING(50),
  "Base Unit of Measure": DataTypes.STRING(10),
  "Lab/Office": DataTypes.STRING(50),
  "Gross Weight": DataTypes.DECIMAL(10, 3),
  "Net weight": DataTypes.DECIMAL(10, 3),
  "Weight unit": DataTypes.STRING(10),
  "Volume": DataTypes.DECIMAL(10, 3),
  "Volume unit": DataTypes.STRING(10),
  "Division": DataTypes.STRING(10),
  "Material description": DataTypes.STRING(100),
  "Tax": DataTypes.DECIMAL(10, 3),
  density: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  temp: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: false
});

module.exports = Product;