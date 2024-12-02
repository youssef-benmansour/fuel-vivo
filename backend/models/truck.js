const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Truck = sequelize.define('Truck', {
  Vehicle: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  "Vehicle-Type": DataTypes.STRING(100),
  "Class-Group": DataTypes.STRING(50),
  "MPGI": {
    type: DataTypes.STRING(100),
    field: 'MPGI'
  },
  "Haulier number": DataTypes.STRING(50),
  "Haulier name": DataTypes.STRING(100),
  "Trailer Number": DataTypes.STRING(20),
  "Driver name": DataTypes.STRING(100),
  "Driver CIN": DataTypes.STRING(50),
  "Seals": {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const value = this.getDataValue('Seals');
      return value === 'N' ? null : value;
    },
    set(value) {
      this.setDataValue('Seals', value === 'N' ? null : value);
    }
  },
  "Vehicle-Weight": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Vehicle-Weight', this.parseNumericValue(value));
    }
  },
  "Vehicule Capacity": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Vehicule Capacity', this.parseNumericValue(value));
    }
  },
  "Comp1": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp1', this.parseNumericValue(value));
    }
  },
  "Comp2": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp2', this.parseNumericValue(value));
    }
  },
  "Comp3": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp3', this.parseNumericValue(value));
    }
  },
  "Comp4": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp4', this.parseNumericValue(value));
    }
  },
  "Comp5": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp5', this.parseNumericValue(value));
    }
  },
  "Comp6": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp6', this.parseNumericValue(value));
    }
  },
  "Comp7": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp7', this.parseNumericValue(value));
    }
  },
  "Comp8": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp8', this.parseNumericValue(value));
    }
  },
  "Comp9": {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    set(value) {
      this.setDataValue('Comp9', this.parseNumericValue(value));
    }
  }
}, {
  tableName: 'trucks',
  timestamps: false,
  hooks: {
    beforeValidate: (truck, options) => {
      const numericFields = ['Vehicle-Weight', 'Vehicule Capacity', 'Comp1', 'Comp2', 'Comp3', 'Comp4', 'Comp5', 'Comp6', 'Comp7', 'Comp8', 'Comp9'];
      numericFields.forEach(field => {
        truck[field] = truck.parseNumericValue(truck[field]);
      });
    }
  }
});

Truck.prototype.parseNumericValue = function(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'object' && value.error === '#N/A') {
    return null;
  }
  if (typeof value === 'string' && value.toLowerCase() === '#n/a') {
    return null;
  }
  const numValue = Number(value);
  return isNaN(numValue) ? null : numValue;
};

module.exports = Truck;