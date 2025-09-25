const express = require('express');
const router = express.Router();
const { 
  loginPage, 
  login, 
  logout, 
  createSuperuser, 
  createProvinceOfficer,
  createAreaOfficer,
  createParishOfficer,
  createClassTeacher,
  createSuperuserForm,
  createProvinceOfficerForm,
  createAreaOfficerForm,
  createParishOfficerForm,
  createClassTeacherForm
} = require('../controllers/authController');
const { checkToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');

// Public routes
router.get('/login', loginPage);
router.post('/login', login);
router.get('/logout', logout);

// Superuser creation route (typically used only once during initial setup)
router.get('/create-superuser-form', createSuperuserForm);
router.post('/create-superuser', createSuperuser);

// Protected routes for creating different user types
// Only superuser can create province officers
router.get('/create-province-officer-form', checkToken, checkRole(['superuser']), createProvinceOfficerForm);
router.post('/create-province-officer', checkToken, checkRole(['superuser']), createProvinceOfficer);

// Only superuser and province officers can create area officers
router.get('/create-area-officer-form', checkToken, checkRole(['superuser', 'province_officer']), createAreaOfficerForm);
router.post('/create-area-officer', checkToken, checkRole(['superuser', 'province_officer']), createAreaOfficer);

// Only superuser, province officers, and area officers can create parish officers
router.get('/create-parish-officer-form', checkToken, checkRole(['superuser', 'province_officer', 'area_officer']), createParishOfficerForm);
router.post('/create-parish-officer', checkToken, checkRole(['superuser', 'province_officer', 'area_officer']), createParishOfficer);

// Only superuser, province officers, area officers, and parish officers can create class teachers
router.get('/create-class-teacher-form', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer']), createClassTeacherForm);
router.post('/create-class-teacher', checkToken, checkRole(['superuser', 'province_officer', 'area_officer', 'parish_officer']), createClassTeacher);

module.exports = router;
