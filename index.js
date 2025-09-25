require('dotenv').config()
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const config = require('./config/config.json');
const Sequelize = require('sequelize');

const authRoutes = require('./routes/authRoutes');
const routes = require('./routes');

var cookieParser = require('cookie-parser');

require("./models/association");
// First, create a connection without specifying a database


  // Set EJS as the view engine
  app.set('view engine', 'ejs');

  // Middleware for parsing JSON and urlencoded form data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser needs to be before i18next middleware
  app.use(cookieParser());

  // Middleware to extract user role from JWT token and pass it to views
  app.use((req, res, next) => {
    const jwt = require('jsonwebtoken');
    const token = req.cookies.user;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.locals.userRole = decoded.user.role;
        res.locals.userId = decoded.user.id;
        res.locals.user = decoded.user;
      } catch (error) {
        console.error('JWT verification error:', error);
        res.locals.userRole = null;
        res.locals.userId = null;
        res.locals.user = null;
      }
    } else {
      res.locals.userRole = null;
      res.locals.userId = null;
      res.locals.user = null;
    }
    
    next();
  });

  // Serve static files from the 'public' directory
  app.use(express.static('public'));

  // Use the routes
  app.use('/auth', authRoutes); // Use the auth routes
  app.use('/', routes); // Use the main routes

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
