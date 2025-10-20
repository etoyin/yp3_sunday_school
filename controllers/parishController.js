const Parish = require('../models/parishModel');
const SundayClass = require('../models/sundayClassModel');
const Area = require('../models/areaModel');
const Province = require('../models/provinceModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const StudentAttendance = require('../models/studentAttendanceModel');
const { Op, Sequelize } = require('sequelize');


const getParishById = async (req, res) => {
    try {
        const parishId = req.params.id;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;

        // Get the parish with its area and province
        const parish = await Parish.findByPk(parishId, {
            include: [{
                model: Area,
                as: 'parentArea',
                include: [{
                    model: Province,
                    as: 'province',
                    attributes: ['id', 'name']
                }],
                attributes: ['id', 'name', 'province_id']
            }],
            attributes: ['id', 'name', 'area_id']
        });

        if (!parish) {
            return res.status(404).render('error', {
                message: 'Parish not found',
                error: { status: 404, stack: '' }
            });
        }

        console.log("Parish::::::::::", userId, userRole);
        
        // Check if user is authorized to view this parish
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.province_id != parish.parentArea.province_id) {
                return res.status(403).render('error', {
                    message: 'You are not authorized to view this parish',
                    error: { status: 403, stack: '' }
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.area_id != parish.area_id) {
                return res.status(403).render('error', {
                    message: 'You are not authorized to view this parish',
                    error: { status: 403, stack: '' }
                });
            }
        } else if (userRole === 'parish_officer') {
            const user = await User.findByPk(userId);
            console.log("Parish::::::ID", userId, user, parishId);
            
            if (user.parishId != parishId) {
                return res.status(403).render('error', {
                    message: 'You are not authorized to view this parish',
                    error: { status: 403, stack: '' }
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).render('error', {
                message: 'You are not authorized to view this page',
                error: { status: 403, stack: '' }
            });
        }

        // Get Sunday classes in this parish
        const sundayClasses = await SundayClass.findAll({
            where: { parish_id: parishId },
            attributes: ['id', 'name', 'description', 'parish_id', [Sequelize.literal('(SELECT COUNT(*) FROM students WHERE students.sunday_class_id = sunday_classes.id)'), 'studentCount']],
            raw: true
        });

        // Get class teachers for this parish
        const classTeachers = await User.findAll({
            where: {
                role: 'class_teacher',
                sunday_class_id: {
                    [Op.in]: sundayClasses.map(sundayClass => sundayClass.id)
                }
            },
            include: [{
                model: SundayClass,
                as: 'sundayClass',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'username', 'email']
        });

        console.log("Parish::::::::::", sundayClasses);

        res.render('parish/view', {
            parish: parish,
            sundayClasses: sundayClasses,
            classTeachers: classTeachers,
            userRole: userRole
        });
    } catch (error) {
        console.error('Error fetching parish:', error);
        res.status(500).render('error', {
            message: 'An error occurred while fetching the parish',
            error: { status: 500, stack: error.stack }
        });
    }
};

const createSundayClassParish = async (req, res) => {
    try {
        const { name, parishId, description } = req.body;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;

        // Get the parish to check authorization
        const parish = await Parish.findByPk(parishId, {
            include: [{
                model: Area,
                as: 'parentArea',
                attributes: ['id', 'name', 'province_id']
            }],
            attributes: ['id', 'name', 'area_id']
        });

        if (!parish) {
            return res.status(404).json({
                success: 0,
                message: 'Parish not found'
            });
        }

        // Check if user is authorized to create a Sunday class in this parish
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.province_id != parish.parentArea.province_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create Sunday classes in this parish'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.area_id != parish.area_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create Sunday classes in this parish'
                });
            }
        } else if (userRole === 'parish_officer') {
            const user = await User.findByPk(userId);
            if (user.parish_id != parishId) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create Sunday classes in this parish'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({
                success: 0,
                message: 'You are not authorized to create Sunday classes'
            });
        }

        console.log("PARSIH ID:::::::::::", parishId)
        
        const sundayClass = await SundayClass.create({
            name,
            parishId: parishId,
            description
        }, {
            fields: ['name', 'parishId', 'description']
        });

        

        res.status(201).json({
            success: 1,
            message: 'Sunday class created successfully',
            sundayClass
        });
    } catch (error) {
        console.error('Error creating Sunday class:', error);
        res.status(500).json({
            success: 0,
            message: 'An error occurred while creating the Sunday class'
        });
    }
};

const getAllClassTeachers = async (req, res) => {
    try {
        const parishId = req.params.parishId;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;

        // Get the parish to check authorization
        const parish = await Parish.findByPk(parishId, {
            include: [{
                model: Area,
                as: 'parentArea',
                attributes: ['id', 'name', 'province_id']
            }],
            attributes: ['id', 'name', 'area_id']
        });

        if (!parish) {
            return res.status(404).json({
                success: 0,
                message: 'Parish not found'
            });
        }

        // Check if user is authorized to view class teachers in this parish
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.province_id != parish.parentArea.province_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to view class teachers in this parish'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.area_id != parish.area_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to view class teachers in this parish'
                });
            }
        } else if (userRole === 'parish_officer') {
            const user = await User.findByPk(userId);
            if (user.parish_id != parishId) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to view class teachers in this parish'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({
                success: 0,
                message: 'You are not authorized to view class teachers'
            });
        }

        // Get Sunday classes in this parish
        const sundayClasses = await SundayClass.findAll({
            where: { parish_id: parishId },
            attributes: ['id', 'name', 'parish_id']
        });

        const sundayClassIds = sundayClasses.map(sundayClass => sundayClass.id);

        // Get class teachers for these Sunday classes
        const classTeachers = await User.findAll({
            where: {
                role: 'class_teacher',
                sunday_class_id: {
                    [Op.in]: sundayClassIds
                }
            },
            include: [{
                model: SundayClass,
                as: 'sundayClass',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'username', 'email']
        });

        return res.status(200).json(classTeachers);
    } catch (error) {
        console.error('Error fetching class teachers:', error);
        return res.status(500).json({
            success: 0,
            message: 'An error occurred while fetching class teachers.'
        });
    }
};

const createClassTeacher = async (req, res) => {
    try {
        const { classTeacherName, classTeacherUsername, classTeacherPassword, classTeacherConfirmPassword, classTeacherSundayClass } = req.body;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;

        if (classTeacherPassword !== classTeacherConfirmPassword) {
            return res.status(400).json({ success: 0, message: 'Passwords do not match!' });
        }

        // Get the Sunday class to check its parish, area, and province
        const sundayClass = await SundayClass.findByPk(classTeacherSundayClass, {
            include: [{
                model: Parish,
                as: 'parish',
                include: [{
                    model: Area,
                    as: 'parentArea',
                    attributes: ['id', 'name', 'provinceId']
                }],
                attributes: ['id', 'name', 'areaId']
            }],
            attributes: ['id', 'name', 'parishId']
        });

        if (!sundayClass) {
            return res.status(404).json({ success: 0, message: 'Sunday class not found' });
        }

        console.log("SUNDAY CLASS:::::::::::", sundayClass.parishId, sundayClass.parish.areaId, sundayClass.parish.parentArea.provinceId,);
        


        // Check if user is authorized to create a class teacher in this Sunday class
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.province_id != sundayClass.parish.parentArea.province_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create class teachers in this Sunday class'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.area_id != sundayClass.parish.area_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create class teachers in this Sunday class'
                });
            }
        } else if (userRole === 'parish_officer') {
            const user = await User.findByPk(userId);
            if (user.parish_id != sundayClass.parish_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to create class teachers in this Sunday class'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({
                success: 0,
                message: 'You are not authorized to create class teachers'
            });
        }

        const existingUser = await User.findOne({ where: { email: classTeacherUsername } });
        if (existingUser) {
            return res.status(400).json({ success: 0, message: 'User exists already' });
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(classTeacherPassword, 10);

        const newUser = await User.create({
            username: classTeacherName,
            email: classTeacherUsername,
            password: hashedPassword,
            role: 'class_teacher',
            sundayClassId: classTeacherSundayClass,
            parishId: sundayClass.parishId,
            areaId: sundayClass.parish.areaId,
            provinceId: sundayClass.parish.parentArea.provinceId
        }, {
            fields: ['username', 'email', 'password', 'role', 'sundayClassId', 'parishId', 'areaId', 'provinceId']
        });

        res.status(200).json({ success: 1, message: 'Class Teacher created successfully' });
    } catch (error) {
        console.error('Error creating class teacher:', error);
        return res.status(500).json({
            success: 0,
            message: 'An error occurred while creating the class teacher.'
        });
    }
};

const deleteClassTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;

        const user = await User.findOne({
            where: {
                id: id,
                role: 'class_teacher'
            },
            include: [{
                model: SundayClass,
                as: 'sundayClass',
                include: [{
                    model: Parish,
                    as: 'parish',
                    include: [{
                        model: Area,
                        as: 'parentArea',
                        attributes: ['id', 'name', 'province_id']
                    }],
                    attributes: ['id', 'name', 'area_id']
                }],
                attributes: ['id', 'name', 'parish_id']
            }],
            attributes: ['id', 'username', 'email', 'role', 'sunday_class_id', 'parish_id', 'area_id', 'province_id']
        });

        if (!user) {
            return res.status(404).json({ success: 0, message: 'Class teacher not found.' });
        }

        // Check if user is authorized to delete this class teacher
        if (userRole === 'province_officer') {
            const currentUser = await User.findByPk(userId);
            if (currentUser.province_id != user.sundayClass.parish.parentArea.province_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to delete class teachers in this parish'
                });
            }
        } else if (userRole === 'area_officer') {
            const currentUser = await User.findByPk(userId);
            if (currentUser.area_id != user.sundayClass.parish.area_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to delete class teachers in this parish'
                });
            }
        } else if (userRole === 'parish_officer') {
            const currentUser = await User.findByPk(userId);
            if (currentUser.parish_id != user.sundayClass.parish_id) {
                return res.status(403).json({
                    success: 0,
                    message: 'You are not authorized to delete class teachers in this parish'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({
                success: 0,
                message: 'You are not authorized to delete class teachers'
            });
        }

        await user.destroy();

        return res.status(200).json({ success: 1, message: 'Class teacher deleted successfully.' });
    } catch (error) {
        console.error('Error deleting class teacher:', error);
        return res.status(500).json({
            success: 0,
            message: 'An error occurred while deleting the class teacher.'
        });
    }
};

const parishAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const parish = await Parish.findByPk(id, {
            include: [{ model: Area, as: 'parentArea', include: [{ model: Province, as: 'province' }] }]
        });

        if (!parish) {
            return res.status(404).render('error', { message: 'Parish not found' });
        }

        const sundayClasses = await SundayClass.findAll({ where: { parish_id: id } });
        const classIds = sundayClasses.map(c => c.id);

        const students = await Student.findAll({ where: { sundayClassId: { [Op.in]: classIds } } });
        
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

        const classMetrics = {};
        sundayClasses.forEach(c => {
            classMetrics[c.id] = {
                name: c.name,
                studentsCount: 0,
                totalPresent: 0,
                perDate: {}
            };
            sundayDates.forEach(date => {
                classMetrics[c.id].perDate[date.full] = { present: 0, absent: 0 };
            });
        });

        students.forEach(student => {
            if (classMetrics[student.sundayClassId]) {
                classMetrics[student.sundayClassId].studentsCount++;
            }
        });

        sundayDates.forEach(date => {
            sundayClasses.forEach(c => {
                classMetrics[c.id].perDate[date.full].absent = classMetrics[c.id].studentsCount;
            });
        });

        attendanceRecords.forEach(record => {
            const student = students.find(s => s.id === record.studentId);
            if (student && classMetrics[student.sundayClassId] && record.status === 'present') {
                classMetrics[student.sundayClassId].totalPresent++;
                classMetrics[student.sundayClassId].perDate[record.date].present++;
                classMetrics[student.sundayClassId].perDate[record.date].absent--;
            }
        });

        let parishTotalPresent = 0;
        let parishTotalPossible = 0;

        const metricsArray = Object.values(classMetrics).map(metrics => {
            const totalPossible = metrics.studentsCount * sundayDates.length;
            metrics.attendanceRate = totalPossible > 0 ? Math.round((metrics.totalPresent / totalPossible) * 100) : 0;
            parishTotalPresent += metrics.totalPresent;
            parishTotalPossible += totalPossible;
            return metrics;
        });

        const parishAttendanceRate = parishTotalPossible > 0 ? Math.round((parishTotalPresent / parishTotalPossible) * 100) : 0;

        const topClasses = metricsArray.sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5);

        const classNameById = sundayClasses.reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {});
        const presentByStudent = {};
        attendanceRecords.forEach(record => {
            if (record.status === 'present') {
                presentByStudent[record.studentId] = (presentByStudent[record.studentId] || 0) + 1;
            }
        });
        const topStudents = Object.entries(presentByStudent)
            .map(([studentId, presentCount]) => {
                const s = students.find(st => st.id === Number(studentId));
                return {
                    id: Number(studentId),
                    name: s ? `${s.firstName} ${s.lastName}` : `Student ${studentId}`,
                    className: s ? classNameById[s.sundayClassId] : 'Unknown',
                    presentCount
                };
            })
            .sort((a, b) => b.presentCount - a.presentCount)
            .slice(0, 10);

        res.render('parish/analytics', {
            parish,
            sundayDates,
            classes: metricsArray,
            parishAttendanceRate,
            topClasses,
            topStudents
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error fetching parish analytics',
            error: { status: 500, stack: error.stack }
        });
    }
};

module.exports = {
    getParishById,
    createSundayClassParish,
    getAllClassTeachers,
    createClassTeacher,
    deleteClassTeacher,
    parishAnalytics
};
