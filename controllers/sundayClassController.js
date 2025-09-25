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
      attendanceMap
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

module.exports = { createSundayClass, addStudentToSundayClass, viewSundayClass, updateStudentAttendance, markAttendanceForm, markStudentAttendance };
