const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("dlulic", "dlulic", "11", {
  host: "student.veleri.hr",
  dialect: "mysql",
  dialectModule: require("mysql2"), // Optional, Sequelize should auto-detect the module
});

module.exports = sequelize;