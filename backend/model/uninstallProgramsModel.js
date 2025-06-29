const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const UninstallPrograms = sequelize.define('UninstallPrograms', {
  uninstall_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  uninstall_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  uninstall_name_program: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  uninstall_source: {
    type: DataTypes.ENUM('AppxPackage', 'Winget'),
    allowNull: false
  }
}, {
  tableName: 'UNINSTALL_PROGRAMS',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = UninstallPrograms;
