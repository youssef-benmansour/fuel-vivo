const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportHistory = sequelize.define('ImportHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  importType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recordsImported: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'import_history',
  timestamps: true,
  underscored: true // This will use snake_case for the database column names
});

module.exports = ImportHistory;