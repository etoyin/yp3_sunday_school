const Sequelize = require('sequelize');
const mysql = require('mysql2');
// const Province = require('./provinceModel');
// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});

const Province = sequelize.define('Province', {
  name: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'provinces',
  timestamps: false,
  underscored: true
});

Province.sync()
  .then(() => {
    // console.log('User table created successfully!');
  })
  .catch(error => {
    console.error('Error creating User table:', error);
  });

// Associations are now defined in index.js

module.exports = Province;
