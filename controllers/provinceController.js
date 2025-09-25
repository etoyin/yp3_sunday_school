const Province = require('../models/provinceModel');
const Area = require('../models/areaModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');

const viewProvinceDashboard = async (req, res) => {
    
    res.render('province/dashboard', { areas: [] });
}

const createProvince = async (req, res) => {
    const { name } = req.body;

    try {
        const province = await Province.create({ name });
        res.status(201).json({ message: 'Province created successfully', province });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllProvinces = async (req, res) => {
    try {
        const provinces = await Province.findAll();
        res.status(200).json(provinces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProvinceById = async (req, res) => {
    try {
        const provinceId = req.params.id;
        const userRole = req.decoded.user.role;
        const userId = req.decoded.user.id;
        
        // Authorization is now handled by middleware
        
        const province = await Province.findByPk(provinceId, {
            include: [{
                model: Area,
                as: 'areas',
                attributes: ['id', 'name', 'provinceId']
            }]
        });
        
        if (!province) {
            return res.status(404).render('error', { 
                message: 'Province not found',
                error: { status: 404, stack: '' }
            });
        }
        
        // Get area officers for this province
        const areaOfficers = await User.findAll({
            where: {
                role: 'area_officer',
                areaId: {
                    [Op.in]: province.areas.map(area => area.id)
                }
            },
            include: [{
                model: Area,
                as: 'userArea',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'username', 'email']
        });
        
        res.render('province/view', { 
            province: province, 
            areas: province.areas,
            areaOfficers: areaOfficers,
            userRole: userRole
        });
    } catch (error) {
        console.error('Error fetching province:', error);
        res.status(500).render('error', { 
            message: 'An error occurred while fetching the province',
            error: { status: 500, stack: error.stack }
        });
    }
};

const createArea = async (req, res) => {
    try {
        const { name, provinceId } = req.body;
        
        // Authorization is now handled by middleware
        
        const area = await Area.create({ 
            name, 
            provinceId 
        }, {
            fields: ['name', 'provinceId']
        });
        
        res.status(201).json({ 
            success: 1,
            message: 'Area created successfully', 
            area 
        });
    } catch (error) {
        console.error('Error creating area:', error);
        res.status(500).json({ 
            success: 0,
            message: 'An error occurred while creating the area'
        });
    }
};

const getAllAreaOfficers = async (req, res) => {
    try {
        const provinceId = req.params.provinceId;
        
        // Authorization is now handled by middleware
        
        // Get areas in this province
        const areas = await Area.findAll({
            where: { provinceId: provinceId },
            attributes: ['id', 'name', 'provinceId']
        });
        
        const areaIds = areas.map(area => area.id);
        
        // Get area officers for these areas
        const areaOfficers = await User.findAll({
            where: {
                role: 'area_officer',
                areaId: {
                    [Op.in]: areaIds
                }
            },
            include: [{
                model: Area,
                as: 'userArea',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'username', 'email']
        });
        
        return res.status(200).json(areaOfficers);
    } catch (error) {
        console.error('Error fetching area officers:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while fetching area officers.'
        });
    }
};

const createAreaOfficer = async (req, res) => {
    try {
        const { areaOfficerName, areaOfficerUsername, areaOfficerPassword, areaOfficerConfirmPassword, areaOfficerArea } = req.body;
        
        if (areaOfficerPassword !== areaOfficerConfirmPassword) {
            return res.status(400).json({ success: 0, message: 'Passwords do not match!' });
        }
        
        // Get the area to check its province
        const area = await Area.findByPk(areaOfficerArea);
        if (!area) {
            return res.status(404).json({ success: 0, message: 'Area not found' });
        }
        
        // Authorization is now handled by middleware
        
        const existingUser = await User.findOne({ where: { email: areaOfficerUsername } });
        if (existingUser) {
            return res.status(400).json({ success: 0, message: 'User exists already' });
        }
        
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(areaOfficerPassword, 10);
        
        const newUser = await User.create({
            username: areaOfficerName,
            email: areaOfficerUsername,
            password: hashedPassword,
            role: 'area_officer',
            areaId: areaOfficerArea,
            provinceId: area.provinceId
        }, {
            fields: ['username', 'email', 'password', 'role', 'areaId', 'provinceId']
        });
        
        res.status(200).json({ success: 1, message: 'Area Officer created successfully' });
    } catch (error) {
        console.error('Error creating area officer:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while creating the area officer.'
        });
    }
};

const deleteAreaOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findOne({
            where: {
                id: id,
                role: 'area_officer'
            },
            include: [{
                model: Area,
                as: 'userArea',
                attributes: ['id', 'name', 'provinceId']
            }],
            attributes: ['id', 'username', 'email', 'role', 'areaId', 'provinceId']
        });
        
        if (!user) {
            return res.status(404).json({ success: 0, message: 'Area officer not found.' });
        }
        
        // Authorization is now handled by middleware
        
        await user.destroy();
        
        return res.status(200).json({ success: 1, message: 'Area officer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting area officer:', error);
        return res.status(500).json({ 
            success: 0, 
            message: 'An error occurred while deleting the area officer.'
        });
    }
};

module.exports = { 
    viewProvinceDashboard,
    createProvince, 
    getAllProvinces, 
    getProvinceById, 
    createArea, 
    getAllAreaOfficers, 
    createAreaOfficer, 
    deleteAreaOfficer 
};
