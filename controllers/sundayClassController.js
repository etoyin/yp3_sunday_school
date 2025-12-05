const SundayClass = require('../models/sundayClassModel');
const Student = require('../models/studentModel');
const User = require('../models/userModel');
const StudentAttendance = require('../models/studentAttendanceModel');
const { Op } = require('sequelize');

const createSundayClass = async (req, res) => {
  try {
    const { name, parishId } = req.body;

    // Check if the user is authorized to create the SundayClass (implementation in authMiddleware)
    if (!req.isAuthorized) {
      return res.status(403).json({ message: 'User not authorized to create SundayClass' });
    }

    const sundayClass = await SundayClass.create({ name, parishId });
    res.status(201).json(sundayClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating SundayClass' });
  }
};

const addStudentToSundayClass = async (req, res) => {
  try {
    const { firstName, lastName, dob, phoneNumber, email, sundayClassId } = req.body;

    // Check if the user is authorized to add students to the SundayClass (implementation in authMiddleware)
    // if (!req.isAuthorized) {
    //   return res.status(403).json({ message: 'User not authorized to add students to this SundayClass' });
    // }

    // return res.status(404).render('error', {
    //   message: 'SundayClass not found',
    //   error: { status: 500, stack: error.stack }
    // });

    const sundayClass = await SundayClass.findByPk(sundayClassId);
    if (!sundayClass) {
      return res.status(404).json({ message: 'SundayClass not found' });
    }

    // Create a new student
    const student = await Student.create({
      firstName,
      lastName,
      dob,
      phoneNumber,
      email,
      sundayClassId
    });

    // Redirect back to the Sunday class view page
    res.redirect(`/sunday-classes/${sundayClassId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding student to SundayClass', error: error.message });
  }
};

const viewSundayClass = async (req, res) => {
  try {
    const { id } = req.params;

    const sundayClass = await SundayClass.findByPk(id);

    if (!sundayClass) {
      return res.status(404).json({ message: 'SundayClass not found' });
    }

    const students = await Student.findAll({
      where: {
        sundayClassId: id
      }
    });

    // Fetch all Sunday classes in the same parish to allow moving students
    const classOptions = await SundayClass.findAll({
      where: { parishId: sundayClass.parishId },
      attributes: ['id', 'name']
    });

    // Generate the last 4 Sundays for attendance columns
    const sundays = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - ((today.getDay() + 7 - 0) % 7) - (7 * i));
      sundays.unshift(d); // Add to beginning of array to get oldest first
    }

    // Format dates for display
    const sundayDates = sundays.map(date => {
      return {
        display: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
        full: date.toISOString().split('T')[0] // YYYY-MM-DD format
      };
    });

    // Fetch attendance records for all students for these dates
    const attendanceRecords = await StudentAttendance.findAll({
      where: {
        studentId: {
          [Op.in]: students.map(student => student.id)
        },
        date: {
          [Op.in]: sundayDates.map(date => date.full)
        }
      }
    });

    // Organize attendance records by student and date
    const attendanceMap = {};
    students.forEach(student => {
      attendanceMap[student.id] = {};
      sundayDates.forEach(date => {
        attendanceMap[student.id][date.full] = 'absent'; // Default to absent
      });
    });

    // Update with actual attendance records
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId][record.date] = record.status;
    });

    res.render('sundayClass/view', { 
      sundayClass, 
      students, 
      sundayDates,
      attendanceMap,
      classOptions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching SundayClass details' });
  }
};

const updateStudentAttendance = async (req, res) => {
  try {
    const { studentId, date, status, sundayClassId } = req.body;

    // Check if the user is authorized to update attendance (implementation in authMiddleware)
    if (!req.isAuthorized) {
      return res.status(403).json({ message: 'User not authorized to update attendance' });
    }

    // Find or create attendance record
    const [attendance, created] = await StudentAttendance.findOrCreate({
      where: {
        studentId,
        date
      },
      defaults: {
        status,
        notes: ''
      }
    });

    // If record already exists, update it
    if (!created) {
      attendance.status = status;
      await attendance.save();
    }

    // Redirect back to the Sunday class view page
    res.redirect(`/sunday-classes/${sundayClassId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
};

const markAttendanceForm = async (req, res) => {
  try {
    const { id } = req.params;

    const sundayClass = await SundayClass.findByPk(id);

    if (!sundayClass) {
      return res.status(404).json({ message: 'SundayClass not found' });
    }

    const students = await Student.findAll({
      where: {
        sundayClassId: id
      }
    });

    // Get today's date or the most recent Sunday if today is not Sunday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    let currentDate;
    
    if (dayOfWeek === 0) {
      // Today is Sunday
      currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    } else {
      // Get the most recent Sunday
      const daysToSubtract = dayOfWeek;
      const mostRecentSunday = new Date(today);
      mostRecentSunday.setDate(today.getDate() - daysToSubtract);
      currentDate = mostRecentSunday.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Fetch attendance records for today/most recent Sunday
    const attendanceRecords = await StudentAttendance.findAll({
      where: {
        studentId: {
          [Op.in]: students.map(student => student.id)
        },
        date: currentDate
      }
    });

    // Create a map of student IDs to attendance status
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId] = record.status;
    });

    // Separate students into present and absent
    const presentStudents = [];
    const absentStudents = [];

    students.forEach(student => {
      if (attendanceMap[student.id] === 'present') {
        presentStudents.push(student);
      } else {
        absentStudents.push(student);
      }
    });

    res.render('sundayClass/markAttendance', { 
      sundayClass, 
      presentStudents, 
      absentStudents,
      currentDate
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching SundayClass details', error: error.message });
  }
};

const markStudentAttendance = async (req, res) => {
  try {
    const { studentId, date, status, sundayClassId } = req.body;

    console.log("LLLLLLLLLLLLLLL", req.isAuthorized);
    
    // Check if the user is authorized to update attendance (implementation in authMiddleware)
    // if (!req.isAuthorized) {     
    //   return res.status(403).json({ message: 'User not authorized to update attendance' });
    // }

    // Find or create attendance record
    const [attendance, created] = await StudentAttendance.findOrCreate({
      where: {
        studentId,
        date
      },
      defaults: {
        status,
        notes: ''
      }
    });

    // If record already exists, update it
    if (!created) {
      attendance.status = status;
      await attendance.save();
    }

    // Check if the request is AJAX (fetch)
    const isAjax = req.xhr || 
                  req.headers.accept && req.headers.accept.indexOf('json') > -1 || 
                  req.headers['content-type'] && req.headers['content-type'].indexOf('application/json') > -1;
    
    if (isAjax) {
      // Return JSON response for AJAX requests
      return res.status(200).json({ 
        success: true, 
        message: 'Attendance updated successfully',
        data: {
          studentId,
          date,
          status
        }
      });
    } else {
      // Redirect back to the mark attendance page for regular form submissions
      return res.redirect(`/sunday-classes/${sundayClassId}/mark-attendance`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
};

const classAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const sundayClass = await SundayClass.findByPk(id);

    if (!sundayClass) {
      return res.status(404).render('error', { message: 'Sunday Class not found' });
    }

    const students = await Student.findAll({ where: { sundayClassId: id } });
    const studentsCount = students.length;

    // Calculate last 8 Sundays
    const sundays = [];
    const today = new Date();
    const mostRecentSunday = new Date(today);
    mostRecentSunday.setDate(today.getDate() - ((today.getDay() + 7 - 0) % 7));

    for (let i = 0; i < 8; i++) {
      const d = new Date(mostRecentSunday);
      d.setDate(mostRecentSunday.getDate() - (7 * i));
      sundays.unshift(d);
    }

    const sundayDates = sundays.map(date => ({
      display: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
      full: date.toISOString().split('T')[0]
    }));

    const studentIds = students.map(s => s.id);
    const attendanceRecords = await StudentAttendance.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        date: { [Op.in]: sundayDates.map(d => d.full) }
      },
      raw: true
    });

    const perDate = {};
    let totalPresent = 0;
    const studentAttendance = {};

    sundayDates.forEach(date => {
      perDate[date.full] = { present: 0, absent: studentsCount };
    });

    attendanceRecords.forEach(record => {
      if (record.status === 'present') {
        perDate[record.date].present++;
        perDate[record.date].absent--;
        totalPresent++;
        studentAttendance[record.studentId] = (studentAttendance[record.studentId] || 0) + 1;
      }
    });

    const totalPossible = studentsCount * sundayDates.length;
    const attendanceRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

    const topAttendees = Object.entries(studentAttendance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([studentId, presentCount]) => {
        const student = students.find(s => s.id == studentId);
        return {
          name: `${student.firstName} ${student.lastName}`,
          presentCount
        };
      });

    res.render('sundayClass/analytics', {
      sundayClass,
      studentsCount,
      sundayDates,
      perDate,
      attendanceRate,
      topAttendees
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      message: 'Error fetching class analytics',
      error: { status: 500, stack: error.stack }
    });
  }
};

module.exports = { createSundayClass, addStudentToSundayClass, viewSundayClass, updateStudentAttendance, markAttendanceForm, markStudentAttendance, classAnalytics };

// Change a student's Sunday class
const changeStudentClass = async (req, res) => {
  try {
    const { id } = req.params; // student id
    const { sundayClassId } = req.body; // new class id

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const targetClass = await SundayClass.findByPk(sundayClassId);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Target Sunday Class not found' });
    }

    // Optionally: ensure same parish move (business rule). Skipped unless required.
    student.sundayClassId = sundayClassId;
    await student.save();

    return res.status(200).json({ success: true, message: 'Student class updated', data: { studentId: id, sundayClassId } });
  } catch (error) {
    console.error('Error changing student class:', error);
    return res.status(500).json({ success: false, message: 'Error changing student class' });
  }
};

// Delete a student and related attendance records
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params; // student id

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Remove attendance records to avoid FK issues
    await StudentAttendance.destroy({ where: { studentId: id } });
    await Student.destroy({ where: { id } });

    return res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ success: false, message: 'Error deleting student' });
  }
};

module.exports.changeStudentClass = changeStudentClass;
module.exports.deleteStudent = deleteStudent;

// Fetch single student (JSON)
const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).json({ success: false, message: 'Error fetching student' });
  }
};

// Update student info (and optional class)
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dob, phoneNumber, email, sundayClassId } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payload = {};
    if (firstName !== undefined) payload.firstName = firstName;
    if (lastName !== undefined) payload.lastName = lastName;
    if (dob !== undefined) payload.dob = dob;
    if (phoneNumber !== undefined) payload.phoneNumber = phoneNumber;
    if (email !== undefined) payload.email = email;
    if (sundayClassId !== undefined) payload.sundayClassId = sundayClassId;

    await student.update(payload);
    return res.status(200).json({ success: true, message: 'Student updated', data: student });
  } catch (error) {
    console.error('Error updating student:', error);
    // Handle common validation/uniqueness errors more clearly
    if (error && (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({ success: false, message: 'Email already in use by another student' });
    }
    if (error && error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed. Please check your inputs.' });
    }
    return res.status(500).json({ success: false, message: 'Error updating student' });
  }
};

module.exports.getStudent = getStudent;
module.exports.updateStudent = updateStudent;
