const Province = require('../models/provinceModel');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

require('dotenv').config();

const index = async (req, res) => {
    let user = req.decoded.user;
    console.log("User!!!!!", user);

    const provinces = await Province.findAll();
    res.render('superuser/dashboard', { provinces: provinces });
    // Replace with actual data fetching
}

const createProvinceOfficer = async (req, res) => {
    // Handle the form submission
    console.log(req.body);
    const { provinceOfficerName, provinceOfficerUsername, provinceOfficerPassword, provinceOfficerConfirmPassword, provinceOfficerProvince } = req.body;

    if (provinceOfficerPassword !== provinceOfficerConfirmPassword) {
        console.log('Passwords do not match!');
        return res.status(400).json({ message: 'Passwords do not match!' });
    }

    try {
        const existingUser = await User.findOne({ where: { email: provinceOfficerUsername } });

        if (existingUser) {
            return res.status(400).json({success: 0, message: 'User exists already' });
        }

        const hashedPassword = await bcrypt.hash(provinceOfficerPassword, 10);

        const newUser = await User.create(
            {
                username: provinceOfficerName,
                email: provinceOfficerUsername,
                password: hashedPassword,
                role: 'province_officer',
                provinceId: provinceOfficerProvince
            }
        );

        console.log('Province Officer created successfully!');
        res.status(200).json({success: 1, message: 'Province Officer created successfully.' })
    } catch (error) {
        console.error('Error creating province officer:', error);
        return res.status(500).json({ success: 0, message: 'An error occurred while creating the province officer.' });
    }
}

const getAllProvinceOfficers = async (req, res) => {
    
    try {
        const provinceOfficers = await User.findAll({
            where: {
                role: 'province_officer'
            },
            include: [{
                model: Province,
                as: 'province',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'username', 'email']
        });

        return res.status(200).json(provinceOfficers);
    } catch (error) {
        console.error('Error fetching province officers:', error);
        return res.status(500).json({ success: 0, message: 'An error occurred while fetching province officers.' });
    }
};

const deleteProvinceOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findOne({
            where: {
                id: id,
                role: 'province_officer'
            }
        });

        if (!user) {
            return res.status(404).json({ success: 0, message: 'Province officer not found.' });
        }

        await user.destroy();
        
        return res.status(200).json({ success: 1, message: 'Province officer deleted successfully.' });
    } catch (error) {
        console.error('Error deleting province officer:', error);
        return res.status(500).json({ success: 0, message: 'An error occurred while deleting the province officer.' });
    }
};

module.exports = { index, createProvinceOfficer, getAllProvinceOfficers, deleteProvinceOfficer };
