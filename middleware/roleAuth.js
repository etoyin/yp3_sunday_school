const User = require('../models/userModel');
const Province = require('../models/provinceModel');
const Area = require('../models/areaModel');
const Parish = require('../models/parishModel');
const SundayClass = require('../models/sundayClassModel');

// Middleware to check if user has required role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.decoded || !req.decoded.user) {
      return res.redirect('/auth/login');
    }

    const userRole = req.decoded.user.role;

    console.log("ROLE", userRole);
    
    
    
    if (roles.includes(userRole)) {
      console.log("ROLE", roles);
      next();
    } else {
      return res.status(403).render('error', { 
        message: 'Access denied. You do not have permission to access this resource.',
        error: { status: 403, stack: "" }
      });
    }
  };
};

// Middleware to check if user has access to a specific province
const checkProvinceAccess = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.decoded.user.id;
    const userRole = req.decoded.user.role;
    const provinceId = parseInt(req.params.id || req.params.provinceId || req.body.provinceId);

    // Superuser has access to all provinces
    if (userRole === 'superuser') {
      return next();
    }

    // Province officer can only access their assigned province
    if (userRole === 'province_officer') {
      const user = await User.findByPk(userId);
      if (user && user.provinceId === provinceId) {
        return next();
      }
    }

    // Area officers can access their parent province
    // if (userRole === 'area_officer') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.areaId) {
    //     const area = await Area.findByPk(user.areaId);
    //     if (area && area.provinceId === provinceId) {
    //       return next();
    //     }
    //   }
    // }

    // // Parish officers can access their grandparent province
    // if (userRole === 'parish_officer') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.parishId) {
    //     const parish = await Parish.findByPk(user.parishId);
    //     if (parish) {
    //       const area = await Area.findByPk(parish.areaId);
    //       if (area && area.provinceId === provinceId) {
    //         return next();
    //       }
    //     }
    //   }
    // }

    // // Class teachers can access their great-grandparent province
    // if (userRole === 'class_teacher') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.sundayClassId) {
    //     const sundayClass = await SundayClass.findByPk(user.sundayClassId);
    //     if (sundayClass) {
    //       const parish = await Parish.findByPk(sundayClass.parishId);
    //       if (parish) {
    //         const area = await Area.findByPk(parish.areaId);
    //         if (area && area.provinceId === provinceId) {
    //           return next();
    //         }
    //       }
    //     }
    //   }
    // }

    return res.status(403).render('error', { 
      message: 'Access denied. You do not have permission to access this resource.',
      error: { status: 403, stack: "" } 
    });
  } catch (error) {
    console.error('Error checking province access:', error);
    return res.status(500).render('error', { 
      message: 'Server error while checking permissions.',
      error: { status: 500, stack: "" }
    });
  }
};

// Middleware to check if user has access to a specific area
const checkAreaAccess = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.decoded.user.id;
    const userRole = req.decoded.user.role;
    const areaId = parseInt(req.params.id || req.params.areaId || req.body.areaId);

    // Superuser has access to all areas
    if (userRole === 'superuser') {
      return next();
    }

    // Province officer can access all areas in their province
    if (userRole === 'province_officer') {
      const user = await User.findByPk(userId);
      if (user && user.provinceId) {
        const area = await Area.findByPk(areaId);
        if (area && area.provinceId === user.provinceId) {
          return next();
        }
      }
    }

    // Area officer can only access their assigned area
    if (userRole === 'area_officer') {
      const user = await User.findByPk(userId);
      if (user && user.areaId === areaId) {
        return next();
      }
    }

    // Parish officers can access their parent area
    // if (userRole === 'parish_officer') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.parishId) {
    //     const parish = await Parish.findByPk(user.parishId);
    //     if (parish && parish.areaId === areaId) {
    //       return next();
    //     }
    //   }
    // }

    // Class teachers can access their grandparent area
    // if (userRole === 'class_teacher') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.sundayClassId) {
    //     const sundayClass = await SundayClass.findByPk(user.sundayClassId);
    //     if (sundayClass) {
    //       const parish = await Parish.findByPk(sundayClass.parishId);
    //       if (parish && parish.areaId === areaId) {
    //         return next();
    //       }
    //     }
    //   }
    // }
    return res.status(403).render('error', { 
      message: 'Access denied. You do not have permission to access this resource.',
      error: { status: 403, stack: "" }
    });
  } catch (error) {
    console.error('Error checking area access:', error);
    return res.status(500).render('error', { 
      message: 'Server error while checking permissions.',
      error: { status: 500, stack: "" }
    });
  }
};

// Middleware to check if user has access to a specific parish
const checkParishAccess = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.decoded.user.id;
    const userRole = req.decoded.user.role;
    const parishId = parseInt(req.params.id || req.params.parishId || req.body.parishId);

    console.log("PARISH:::::::::::::::::", parishId);
    
    // Superuser has access to all parishes
    if (userRole === 'superuser') {
      return next();
    }

    // Province officer can access all parishes in their province
    if (userRole === 'province_officer') {
      const user = await User.findByPk(userId);
      if (user && user.provinceId) {
        const parish = await Parish.findByPk(parishId);
        if (parish) {
          const area = await Area.findByPk(parish.areaId);
          if (area && area.provinceId === user.provinceId) {
            return next();
          }
        }
      }
    }

    // Area officer can access all parishes in their area
    if (userRole === 'area_officer') {
      const user = await User.findByPk(userId);
      if (user && user.areaId) {
        const parish = await Parish.findByPk(parishId);
        if (parish && parish.areaId === user.areaId) {
          return next();
        }
      }
    }

    // Parish officer can only access their assigned parish
    if (userRole === 'parish_officer') {
      const user = await User.findByPk(userId);
      if (user && user.parishId === parishId) {
        return next();
      }
    }

    // Class teachers can access their parent parish
    // if (userRole === 'class_teacher') {
    //   const user = await User.findByPk(userId);
    //   if (user && user.sundayClassId) {
    //     const sundayClass = await SundayClass.findByPk(user.sundayClassId);
    //     if (sundayClass && sundayClass.parishId === parishId) {
    //       return next();
    //     }
    //   }
    // }

    return res.status(403).render('error', { 
      message: 'Access denied. You do not have permission to access this resource.',
      error: { status: 403, stack: "" }
    });
  } catch (error) {
    console.error('Error checking parish access:', error);
    return res.status(500).render('error', { 
      message: 'Server error while checking permissions.',
      error: { status: 500, stack: "" }
    });
  }
};

// Middleware to check if user has access to a specific Sunday class
const checkSundayClassAccess = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.decoded.user.id;
    const userRole = req.decoded.user.role;
    const sundayClassId = parseInt(req.params.id || req.params.sundayClassId || req.body.sundayClassId);

    // Superuser has access to all Sunday classes
    if (userRole === 'superuser') {
      return next();
    }

    // Province officer can access all Sunday classes in their province
    if (userRole === 'province_officer') {
      const user = await User.findByPk(userId);
      if (user && user.provinceId) {
        const sundayClass = await SundayClass.findByPk(sundayClassId);
        if (sundayClass) {
          const parish = await Parish.findByPk(sundayClass.parishId);
          if (parish) {
            const area = await Area.findByPk(parish.areaId);
            if (area && area.provinceId === user.provinceId) {
              return next();
            }
          }
        }
      }
    }

    // Area officer can access all Sunday classes in their area
    if (userRole === 'area_officer') {
      const user = await User.findByPk(userId);
      if (user && user.areaId) {
        const sundayClass = await SundayClass.findByPk(sundayClassId);
        if (sundayClass) {
          const parish = await Parish.findByPk(sundayClass.parishId);
          if (parish && parish.areaId === user.areaId) {
            return next();
          }
        }
      }
    }

    // Parish officer can access all Sunday classes in their parish
    if (userRole === 'parish_officer') {
      const user = await User.findByPk(userId);
      if (user && user.parishId) {
        const sundayClass = await SundayClass.findByPk(sundayClassId);
        if (sundayClass && sundayClass.parishId === user.parishId) {
          return next();
        }
      }
    }

    // Class teacher can only access their assigned Sunday class
    if (userRole === 'class_teacher') {
      const user = await User.findByPk(userId);
      if (user && user.sundayClassId === sundayClassId) {
        return next();
      }
    }

    return res.status(403).render('error', { 
      message: 'Access denied. You do not have permission to access this resource.',
      error: { status: 403, stack: "" }
    });
  } catch (error) {
    console.error('Error checking Sunday class access:', error);
    return res.status(500).render('error', { 
      message: 'Server error while checking permissions.',
      error: { status: 500, stack: "" }
    });
  }
};

module.exports = {
  checkRole,
  checkProvinceAccess,
  checkAreaAccess,
  checkParishAccess,
  checkSundayClassAccess
};
