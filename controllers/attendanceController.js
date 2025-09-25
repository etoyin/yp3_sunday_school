const Attendance = require('../models/attendanceModel');

/**
 * Get all attendance records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.findAll();
    
    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Get attendance record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAttendanceById = async (req, res) => {
  try {
    const id = req.params.id;
    
    const attendance = await Attendance.findByPk(id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Create new attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Update attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAttendance = async (req, res) => {
  try {
    const id = req.params.id;
    
    const attendance = await Attendance.update(req.body, {
      where: {
        id: id
      }
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * Delete attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const id = req.params.id;
    
    const attendance = await Attendance.destroy({
      where: {
        id: id
      }
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
