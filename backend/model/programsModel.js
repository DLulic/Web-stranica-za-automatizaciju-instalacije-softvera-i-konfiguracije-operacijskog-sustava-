const { DataTypes } = require('sequelize');
const sequelize = require('../sequelizeInstance');

const Programs = sequelize.define('Programs', {
  program_id: {
    type: DataTypes.INTEGER(6),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  program_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  program_desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  program_category: {
    type: DataTypes.ENUM('Instalacija dodataka', 'Instalacija programa'),
    allowNull: false
  },
  program_package: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  program_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'PROGRAMS',
  timestamps: false, // Disable createdAt and updatedAt columns
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = Programs;
