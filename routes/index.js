const express = require('express');
const router = express.Router();
const SuperUserController = require('../controllers/SuperUserController');

// Import controller functions
const {
  createProvince,
  getAllProvinces,
  getProvinceById, 
  createArea, 
  getAllAreaOfficers, 
  createAreaOfficer,
  deleteAreaOfficer: deleteProvinceAreaOfficer,
  viewDashboard,
  viewProvinceDashboard
} = require('../controllers/provinceController');

const {
  getAreaById,
  createParish,
  getAllParishOfficers,
  createParishOfficer,
  deleteParishOfficer
} = require('../controllers/areaController');

const {
  getParishById,
  createSundayClassParish,
  getAllClassTeachers,
  createClassTeacher,
  deleteClassTeacher,
  parishAnalytics
} = require('../controllers/parishController');

const { index } = require('../controllers/SuperUserController');



const { createSundayClass, addStudentToSundayClass, viewSundayClass, updateStudentAttendance, markAttendanceForm, markStudentAttendance, classAnalytics } = require('../controllers/sundayClassController');
const { checkToken } = require('../middleware/auth');
const { 
  checkRole, 
  checkProvinceAccess, 
  checkAreaAccess, 
  checkParishAccess, 
  checkSundayClassAccess 
} = require('../middleware/roleAuth');
const User = require('../models/userModel');
const Province = require('../models/provinceModel');
const SundayClass = require('../models/sundayClassModel');

// Home route
router.get('/', checkToken, async (req, res) => {
  const userRole = req.decoded.user.role;
  const userId = req.decoded.user.id;
  const user = await User.findByPk(userId);

  res.render('index',{
    areaId: user.areaId,
    parishId: user.parishId,
    provinceId: user.provinceId,
    sundayClassId: user.sundayClassId
  });
});
// Dashboard routes with role-based access
router.get('/province/dashboard', checkToken, checkRole(['superuser', 'province_officer']), viewProvinceDashboard);

router.get('/area/dashboard', checkToken, checkRole(['superuser', 'province_officer', 'area_officer']), (req, res) => {
  res.render('area/dashboard', { parishes: [] }); // Replace with actual data fetching
});

router.get('/parish/dashboard', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer']), (req, res) => {
  res.render('parish/dashboard', { sundayClasses: [] }); // Replace with actual data fetching
});

// SundayClass routes with role-based access
router.post('/sunday-classes', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer']), createSundayClass);
router.post('/sunday-classes/add-student', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer', 'class_teacher']), addStudentToSundayClass);

// SundayClass view route with specific access control
router.get('/sunday-classes/:id', checkToken, checkSundayClassAccess, viewSundayClass);
router.get('/sunday-classes/:id/analytics', checkToken, checkSundayClassAccess, classAnalytics);

// Student attendance routes with specific access control
router.get('/sunday-classes/:id/mark-attendance', checkToken, checkSundayClassAccess, markAttendanceForm);
router.post('/student-attendance', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer', 'class_teacher']), updateStudentAttendance);
router.post('/student-attendance/mark', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer', 'class_teacher']), markStudentAttendance);

// Province routes with role-based access
router.post('/provinces/create', checkToken, checkRole(['superuser']), createProvince);
router.get('/provinces', checkToken, checkRole(['superuser', 'province_officer']), getAllProvinces);
router.get('/provinces/:id', checkToken, checkProvinceAccess, getProvinceById);
router.post('/provinces/:id/areas/create', checkToken, checkProvinceAccess, createArea);
router.get('/provinces/:provinceId/area-officers', checkToken, checkProvinceAccess, getAllAreaOfficers);
router.post('/provinces/:id/area-officers/create', checkToken, checkProvinceAccess, createAreaOfficer);
router.delete('/provinces/area-officer/:id', checkToken, checkRole(['superuser', 'province_officer']), deleteProvinceAreaOfficer);

// Area routes with role-based access
router.get('/areas/:id', checkToken, checkAreaAccess, getAreaById);
router.post('/areas/:id/parishes/create', checkToken, checkAreaAccess, createParish);
router.get('/areas/:areaId/parish-officers', checkToken, checkAreaAccess, getAllParishOfficers);
router.post('/areas/:id/parish-officers/create', checkToken, checkAreaAccess, createParishOfficer);
router.delete('/areas/parish-officer/:id', checkToken, checkRole(['superuser', 'province_officer', 'area_officer']), deleteParishOfficer);

// Parish routes with role-based access
router.get('/parishes/:id', checkToken, checkParishAccess, getParishById);
router.get('/parishes/:id/analytics', checkToken, checkParishAccess, parishAnalytics);
router.post('/parishes/:id/sunday-classes/create', checkToken, checkParishAccess, createSundayClassParish);
router.get('/parishes/:parishId/class-teachers', checkToken, checkParishAccess, getAllClassTeachers);
router.post('/parishes/:id/class-teachers/create', checkToken, checkParishAccess, createClassTeacher);
router.delete('/parishes/class-teacher/:id', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer']), deleteClassTeacher);

// Superuser dashboard route
router.get('/super/dashboard', checkToken, checkRole(['superuser']), index);
router.post('/provinces/officer/create', checkToken, checkRole(['superuser']), SuperUserController.createProvinceOfficer);
router.get('/provinces/officers', checkToken, checkRole(['superuser']), SuperUserController.getAllProvinceOfficers);
router.delete('/provinces/officer/:id', checkToken, checkRole(['superuser']), SuperUserController.deleteProvinceOfficer);

module.exports = router;
