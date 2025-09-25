const Sequelize = require('sequelize');
const mysql = require('mysql2');
const Province = require('./provinceModel');
// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});


const Area = sequelize.define('areas', {
  name: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  provinceId: { // Foreign key for Province
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Province, // Use the table name instead of model reference
      key: 'id'
    }
  }
}, {
  tableName: 'areas',
  timestamps: false,
  underscored: true
});

Area.sync()
  .then(() => {
    // console.log('User table created successfully!');
  })
  .catch(error => {
    console.error('Error creating User table:', error);
  });

// Associations are now defined in index.js

module.exports = Area;
