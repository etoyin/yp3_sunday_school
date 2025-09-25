const Area = require('../models/areaModel');
const Parish = require('../models/parishModel');
const Province = require('../models/provinceModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');

const getAreaById = async (req, res) => {
    try {
        const areaId = req.params.id;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        // Get the area with its province
        const area = await Area.findByPk(areaId, {
            include: [{
                model: Province,
                as: 'province',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'name', 'provinceId']
        });
        
        if (!area) {
            return res.status(404).render('error', { 
                message: 'Area not found',
                error: { status: 404, stack: '' }
            });
        }
        
        // Check if user is authorized to view this area
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.provinceId != area.provinceId) {
                return res.status(403).render('error', { 
                    message: 'You are not authorized to view this area',
                    error: { status: 403, stack: '' }
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.areaId != areaId) {
                return res.status(403).render('error', { 
                    message: 'You are not authorized to view this area',
                    error: { status: 403, stack: '' }
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).render('error', { 
                message: 'You are not authorized to view this page',
                error: { status: 403, stack: '' }
            });
        }
        
        // Get parishes in this area
        const parishes = await Parish.findAll({
            where: { areaId: areaId },
            attributes: ['id', 'name', 'areaId'],
        });
        
        // Get parish officers for this area
        const parishOfficers = await User.findAll({
            where: {
                role: 'parish_officer',
                parishId: {
                    [Op.in]: parishes.map(parish => parish.id)
                }
            },
            include: [{
                model: Parish,
                as: 'parish',
                attributes: ['id', 'name', 'areaId']
            }],
            attributes: ['id', 'username', 'email']
        });
        
        res.render('area/view', { 
            area: area, 
            parishes: parishes,
            parishOfficers: parishOfficers,
            userRole: userRole
        });
    } catch (error) {
        console.error('Error fetching area:', error);
        res.status(500).render('error', { 
            message: 'An error occurred while fetching the area',
            error: { status: 500, stack: error.stack }
        });
    }
};

const createParish = async (req, res) => {
    try {
        const { name, areaId } = req.body;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        // Get the area to check authorization
        const area = await Area.findByPk(areaId, {
            attributes: ['id', 'name', 'provinceId']
        });
        
        if (!area) {
            return res.status(404).json({ 
                success: 0,
                message: 'Area not found'
            });
        }
        
        // Check if user is authorized to create a parish in this area
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.provinceId != area.provinceId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to create parishes in this area'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.areaId != areaId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to create parishes in this area'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({ 
                success: 0,
                message: 'You are not authorized to create parishes'
            });
        }
        
        const parish = await Parish.create({
            name,
            areaId
        }, {
            fields: ['name', 'areaId'],
        });
        
        res.status(201).json({ 
            success: 1,
            message: 'Parish created successfully', 
            parish 
        });
    } catch (error) {
        console.error('Error creating parish:', error);
        res.status(500).json({ 
            success: 0,
            message: 'An error occurred while creating the parish'
        });
    }
};

const getAllParishOfficers = async (req, res) => {
    try {
        const areaId = req.params.areaId;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        // Get the area to check authorization
        const area = await Area.findByPk(areaId, {
            attributes: ['id', 'name', 'provinceId']
        });
        
        if (!area) {
            return res.status(404).json({ 
                success: 0,
                message: 'Area not found'
            });
        }
        
        // Check if user is authorized to view parish officers in this area
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.provinceId != area.provinceId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to view parish officers in this area'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.areaId != areaId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to view parish officers in this area'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({ 
                success: 0,
                message: 'You are not authorized to view parish officers'
            });
        }
        
        // Get parishes in this area
        const parishes = await Parish.findAll({
            where: { areaId: areaId },
            attributes: ['id', 'name', 'areaId']
        });
        
        const parishIds = parishes.map(parish => parish.id);
        
        // Get parish officers for these parishes
        const parishOfficers = await User.findAll({
            where: {
                role: 'parish_officer',
                parishId: {
                    [Op.in]: parishIds
                }
            },
            include: [{
                model: Parish,
                as: 'parish',
                attributes: ['id', 'name', 'areaId']
            }],
            attributes: ['id', 'username', 'email']
        });
        
        return res.status(200).json(parishOfficers);
    } catch (error) {
        console.error('Error fetching parish officers:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while fetching parish officers.'
        });
    }
};

const createParishOfficer = async (req, res) => {
    try {
        const { parishOfficerName, parishOfficerUsername, parishOfficerPassword, parishOfficerConfirmPassword, parishOfficerParish } = req.body;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        if (parishOfficerPassword !== parishOfficerConfirmPassword) {
            return res.status(400).json({ success: 0, message: 'Passwords do not match!' });
        }
        
        // Get the parish to check its area and province
        const parish = await Parish.findByPk(parishOfficerParish, {
            include: [{
                model: Area,
                as: 'parentArea',
                attributes: ['id', 'name', 'provinceId']
            }],
            attributes: ['id', 'name', 'areaId']
        });
        
        if (!parish) {
            return res.status(404).json({ success: 0, message: 'Parish not found' });
        }
        
        // Check if user is authorized to create a parish officer in this area
        if (userRole === 'province_officer') {
            const user = await User.findByPk(userId);
            if (user.provinceId != parish.parentArea.provinceId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to create parish officers in this area'
                });
            }
        } else if (userRole === 'area_officer') {
            const user = await User.findByPk(userId);
            if (user.areaId != parish.areaId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to create parish officers in this area'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({ 
                success: 0,
                message: 'You are not authorized to create parish officers'
            });
        }
        
        const existingUser = await User.findOne({ where: { email: parishOfficerUsername } });
        if (existingUser) {
            return res.status(400).json({ success: 0, message: 'User exists already' });
        }
        
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(parishOfficerPassword, 10);
        
        const newUser = await User.create({
            username: parishOfficerName,
            email: parishOfficerUsername,
            password: hashedPassword,
            role: 'parish_officer',
            parishId: parishOfficerParish,
            areaId: parish.areaId,
            provinceId: parish.parentArea.provinceId
        }, {
            fields: ['username', 'email', 'password', 'role', 'parishId', 'areaId', 'provinceId'],
        });
        
        res.status(200).json({ success: 1, message: 'Parish Officer created successfully' });
    } catch (error) {
        console.error('Error creating parish officer:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while creating the parish officer.'
        });
    }
};

const deleteParishOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        const user = await User.findOne({
            where: {
                id: id,
                role: 'parish_officer'
            },
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
            attributes: ['id', 'username', 'email', 'role', 'parishId', 'areaId', 'provinceId'],
        });
        
        if (!user) {
            return res.status(404).json({ success: 0, message: 'Parish officer not found.' });
        }
        
        // Check if user is authorized to delete this parish officer
        if (userRole === 'province_officer') {
            const currentUser = await User.findByPk(userId);
            if (currentUser.provinceId != user.parish.parentArea.provinceId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to delete parish officers in this area'
                });
            }
        } else if (userRole === 'area_officer') {
            const currentUser = await User.findByPk(userId);
            if (currentUser.areaId != user.parish.areaId) {
                return res.status(403).json({ 
                    success: 0,
                    message: 'You are not authorized to delete parish officers in this area'
                });
            }
        } else if (userRole !== 'superuser') {
            return res.status(403).json({ 
                success: 0,
                message: 'You are not authorized to delete parish officers'
            });
        }
        
        await user.destroy();
        
        return res.status(200).json({ success: 1, message: 'Parish officer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting parish officer:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while deleting the parish officer.'
        });
    }
};

module.exports = { 
    getAreaById, 
    createParish, 
    getAllParishOfficers, 
    createParishOfficer, 
    deleteParishOfficer 
};
