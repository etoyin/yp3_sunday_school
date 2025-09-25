const Sequelize = require('sequelize');
const mysql = require('mysql2');

// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});

const Student = sequelize.define('Student', {
  firstName: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  dob: {
    type: Sequelize.DataTypes.DATE,
    allowNull: false
  },
  phoneNumber: {
    type: Sequelize.DataTypes.STRING,
    allowNull: true // Making it optional
  },
  email: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  sundayClassId: { // Foreign key for SundayClass
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sunday_classes', // Use the table name instead of model reference
      key: 'id'
    }
  }
}, {
  tableName: 'students',
  timestamps: true,
  underscored: true
});

// Associations are now defined in index.js

module.exports = Student;
