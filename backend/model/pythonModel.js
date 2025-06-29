const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const Python = sequelize.define('Python', {
  python_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  python_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  python_desc: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'PYTHON',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = Python;
