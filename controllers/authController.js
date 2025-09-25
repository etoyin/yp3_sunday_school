const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Province = require('../models/provinceModel');
const Area = require('../models/areaModel');
const Parish = require('../models/parishModel');
const SundayClass = require('../models/sundayClassModel');

const loginPage = (req, res) => {
  res.render('login');
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      return res.status(400).json({ success: 0, message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ success: 0, message: 'Invalid credentials' });
    }

    // Create token with user role and ID
    const token = jwt.sign({ 
      user: { 
        id: user.id, 
        role: user.role,
        provinceId: user.provinceId,
        areaId: user.areaId,
        parishId: user.parishId,
        sundayClassId: user.sundayClassId
      } 
    }, process.env.JWT_SECRET);
    
    res.cookie('user', token);
    user.password = "";
    
    // Redirect based on user role
    let redirectUrl = '/';
    switch(user.role) {
      case 'superuser':
        redirectUrl = '/super/dashboard';
        break;
      case 'province_officer':
        redirectUrl = '/province/dashboard';
        break;
      case 'area_officer':
        redirectUrl = '/area/dashboard';
        break;
      case 'parish_officer':
        redirectUrl = '/parish/dashboard';
        break;
      case 'class_teacher':
        redirectUrl = `/sunday-classes/${user.sundayClassId}`;
        break;
    }
    
    // Send token and redirect URL in the response body
    return res.status(200).json({ 
      success: 1, 
      token, 
      user,
      redirectUrl 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: 0, message: 'Server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('user');
  res.redirect('/auth/login');
};

// Form rendering functions
const createSuperuserForm = (req, res) => {
  res.render('createSuperuser');
};

const createProvinceOfficerForm = (req, res) => {
  res.render('createProvinceOfficer');
};

const createAreaOfficerForm = async (req, res) => {
  try {
    const provinces = await Province.findAll();
    const areas = await Area.findAll();
    res.render('createAreaOfficer', { provinces, areas });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

const createParishOfficerForm = async (req, res) => {
  try {
    const areas = await Area.findAll();
    const parishes = await Parish.findAll();
    res.render('createParishOfficer', { areas, parishes });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

const createClassTeacherForm = async (req, res) => {
  try {
    const parishes = await Parish.findAll();
    const sundayClasses = await SundayClass.findAll();
    res.render('createClassTeacher', { parishes, sundayClasses });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

// User creation functions
const createSuperuser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'superuser'
    });

    user.password = undefined; // Don't return password in response
    res.status(201).json({ success: 1, message: 'Superuser created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const createProvinceOfficer = async (req, res) => {
  const { username, email, password, provinceId } = req.body;

  try {
    // Validate province exists
    const province = await Province.findByPk(provinceId);
    if (!province) {
      return res.status(400).json({ success: 0, message: 'Province not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'province_officer',
      provinceId
    });

    user.password = undefined; // Don't return password in response
    res.status(201).json({ success: 1, message: 'Province officer created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const createAreaOfficer = async (req, res) => {
  const { username, email, password, areaId } = req.body;

  try {
    // Validate area exists
    const area = await Area.findByPk(areaId);
    if (!area) {
      return res.status(400).json({ success: 0, message: 'Area not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'area_officer',
      areaId
    });

    user.password = undefined; // Don't return password in response
    res.status(201).json({ success: 1, message: 'Area officer created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const createParishOfficer = async (req, res) => {
  const { username, email, password, parishId } = req.body;

  try {
    // Validate parish exists
    const parish = await Parish.findByPk(parishId);
    if (!parish) {
      return res.status(400).json({ success: 0, message: 'Parish not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'parish_officer',
      parishId
    });

    user.password = undefined; // Don't return password in response
    res.status(201).json({ success: 1, message: 'Parish officer created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const createClassTeacher = async (req, res) => {
  const { username, email, password, sundayClassId } = req.body;

  try {
    // Validate Sunday class exists
    const sundayClass = await SundayClass.findByPk(sundayClassId);
    if (!sundayClass) {
      return res.status(400).json({ success: 0, message: 'Sunday class not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'class_teacher',
      sundayClassId
    });

    user.password = undefined; // Don't return password in response
    res.status(201).json({ success: 1, message: 'Class teacher created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

module.exports = { 
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
};
