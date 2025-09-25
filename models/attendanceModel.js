const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../index').sequelize;

const Attendance = sequelize.define('Attendance', {
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half-day'),
    defaultValue: 'present'
  },
  notes: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'attendances',
  timestamps: true,
  underscored: true
});

module.exports = Attendance;
