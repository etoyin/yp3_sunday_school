const { verify } = require("jsonwebtoken");

require('dotenv').config();
// res.redirect('/');
module.exports = {
  checkToken: (req, res, next) => {
    
    console.log("Cookies::::::::::::", req.cookies);
    
    let token = req.cookies.user;
    if(token){
      // token = token.slice(7);
      verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if(error){
          res.redirect('/auth/login');
        }else{
            req.decoded = decoded;
            next();
        }
      })
    }else{
      // res.json({
      //   success: 0,
      //   message: "Access denied! unauthorised user",
      //   validToken: false
      // })
      res.redirect('/auth/login');
    }
  }
}
