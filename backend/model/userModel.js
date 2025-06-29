const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin'),
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'USER',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = User;
