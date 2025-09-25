const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: process.env.DB_HOST
});
const Student = require('./studentModel');

const StudentAttendance = sequelize.define('StudentAttendance', {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent'),
    defaultValue: 'present'
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'student_attendances',
  timestamps: true,
  underscored: true
});

// Define association
StudentAttendance.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(StudentAttendance, { foreignKey: 'studentId' });

module.exports = StudentAttendance;
