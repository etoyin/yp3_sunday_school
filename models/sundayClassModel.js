const Sequelize = require('sequelize');
const mysql = require('mysql2');
const Province = require('./provinceModel');
const Parish = require('./parishModel');
// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});

const SundayClass = sequelize.define('sunday_classes', {
  name: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  parishId: { // Foreign key for Parish
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Parish, // Use the table name instead of model reference
      key: 'id'
    }
  }
}, {
  tableName: 'sunday_classes',
  timestamps: false,
  underscored: true
});

SundayClass.sync()
  .then(() => {
    // console.log('User table created successfully!');
  })
  .catch(error => {
    console.error('Error creating User table:', error);
  });


// Associations are now defined in index.js

module.exports = SundayClass;
