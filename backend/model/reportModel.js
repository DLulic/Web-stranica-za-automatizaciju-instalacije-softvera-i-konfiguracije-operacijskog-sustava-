const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const Report = sequelize.define('Report', {
  report_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  report_computer_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  report_task_type: {
    type: DataTypes.ENUM('windows settings', 'group policy', 'python dependencies', 'instalacija dodataka', 'instalacija programa', 'brisanje programa'),
    allowNull: false
  },
  report_task_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  report_status: {
    type: DataTypes.ENUM('success', 'failure', 'additional', ''),
    allowNull: false
  },
  report_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'REPORT',
  timestamps: false, // Disable createdAt and updatedAt columns since we have custom timestamp
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = Report;
