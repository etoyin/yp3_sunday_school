const Sequelize = require('sequelize');
const mysql = require('mysql2');
const Province = require('./provinceModel');
const Area = require('./areaModel');
// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});


const Parish = sequelize.define('Parish', {
  name: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  areaId: { // Foreign key for Area
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Area, // Use the table name instead of model reference
      key: 'id'
    }
  }
}, {
  tableName: 'parishes',
  timestamps: false,
  underscored: true
});

Parish.sync()
  .then(() => {
    // console.log('User table created successfully!');
  })
  .catch(error => {
    console.error('Error creating User table:', error);
  });


// Associations are now defined in index.js

module.exports = Parish;
