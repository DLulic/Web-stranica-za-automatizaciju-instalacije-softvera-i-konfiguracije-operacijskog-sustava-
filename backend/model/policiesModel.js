const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const Policies = sequelize.define('Policies', {
  policies_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  policies_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  policies_regName: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  policies_regPath: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  policies_regVaule: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  policies_regVauleRevert: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  policies_type: {
    type: DataTypes.ENUM('DWORD', 'String'),
    allowNull: false
  },
  policies_enable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'POLICIES',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = Policies;

