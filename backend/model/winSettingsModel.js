const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const WinSettings = sequelize.define('WinSettings', {
  settings_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  settings_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  settings_command: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  settings_enable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'WIN_SETTINGS',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = WinSettings;
