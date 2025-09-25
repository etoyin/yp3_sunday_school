// Import all models
// const Province = require('./models/provinceModel');
// const Area = require('./models/areaModel');
// const Parish = require('./models/parishModel');
// const SundayClass = require('./models/sundayClassModel');
// const Attendance = require('./models/attendanceModel');
// const Student = require('./models/studentModel');
// const User = require('./models/userModel');

const Area = require("./areaModel");
const Parish = require("./parishModel");
const Province = require("./provinceModel");
const Student = require("./studentModel");
const SundayClass = require("./sundayClassModel");
const User = require("./userModel");

// Define associations after all models are loaded
// Province associations
Province.hasMany(Area, { foreignKey: 'provinceId', as: 'areas' });
Province.hasMany(User, { foreignKey: 'provinceId', as: 'users' });

// Area associations
Area.belongsTo(Province, { foreignKey: 'provinceId', as: 'province' });
Area.hasMany(Parish, { foreignKey: 'areaId', as: 'parishes' });
Area.hasMany(User, { foreignKey: 'areaId', as: 'users' });

// Parish associations
Parish.belongsTo(Area, { foreignKey: 'areaId', as: 'parentArea' });
Parish.hasMany(SundayClass, { foreignKey: 'parishId', as: 'sundayClasses' });
Parish.hasMany(User, { foreignKey: 'parishId', as: 'users' });

// SundayClass associations
SundayClass.belongsTo(Parish, { foreignKey: 'parishId', as: 'parish' });
SundayClass.hasMany(Student, { foreignKey: 'sundayClassId', as: 'students' });
SundayClass.hasMany(User, { foreignKey: 'sundayClassId', as: 'users' });

// User associations
User.belongsTo(Province, { foreignKey: 'provinceId', as: 'province' });
User.belongsTo(Area, { foreignKey: 'areaId', as: 'userArea' });
User.belongsTo(Parish, { foreignKey: 'parishId', as: 'parish' });
User.belongsTo(SundayClass, { foreignKey: 'sundayClassId', as: 'sundayClass' });

// Student associations
Student.belongsTo(SundayClass, { foreignKey: 'sundayClassId', as: 'sundayClass' });

module.exports = {}; // You can export something if needed, or just use it for its side effects
