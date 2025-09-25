const Sequelize = require('sequelize');
const mysql = require('mysql2');
const Province = require('./provinceModel');
const Area = require('./areaModel');
const Parish = require('./parishModel');
const SundayClass = require('./sundayClassModel');
// const User_Data = require('./User_Data');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});


const User = sequelize.define('users', {
  username: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.DataTypes.ENUM('superuser', 'province_officer', 'area_officer', 'parish_officer', 'class_teacher'),
    allowNull: false
  },
  provinceId: { // Foreign key for Province (only for province_officer)
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Province, // Use the table name
      key: 'id'
    }
  },
  areaId: { // Foreign key for Area (only for area_officer)
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Area, // Use the table name
      key: 'id'
    }
  },
  parishId: { // Foreign key for Parish (only for parish_officer)
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Parish, // Use the table name
      key: 'id'
    }
  },
  sundayClassId: { // Foreign key for SundayClass (only for class_teacher)
    type: Sequelize.DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: SundayClass, // Use the table name
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Associations are now defined in index.js

module.exports = User;
