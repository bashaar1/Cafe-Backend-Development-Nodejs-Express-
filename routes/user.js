const express = require("express");
const connection = require("../connection");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const auth = require("../services/authentication");
const checkRole = require("../services/checkRole");

require("dotenv").config();

router.post("/signup", (req, res) => {
  let user = req.body;
  query = "select email,password,role,status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        query =
          "insert into user (name,contactNumber,email,password,status,role) values (?,?,?,?,'false','user')";
        connection.query(
          query,
          [user.name, user.contactNumber, user.email, user.password],
          (err, results) => {
            if (!err) {
              return res
                .status(200)
                .json({ message: "Successfully Registered" });
            } else {
              return res.status(500).json(err);
            }
          }
        );
      } else {
        return res.status(400).json({ message: "Email Already Exists." });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

router.post("/login", (req, res) => {
  let user = req.body;
  query = "select email,password,role,status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0 || results[0].password != user.password) {
        return res
          .status(401)
          .json({ message: "Incorrect Username or Password" });
      } else if (results[0].status == "false") {
        return res.status(401).json({ message: "Wait for Admin Approval" });
      } else if (results[0].password == user.password) {
        const response = {
          email: results[0].email,
          role: results[0].role,
        };
        const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, {
          expiresIn: "2h",
        });
        return res.status(200).json({ token: accessToken });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong.Please try again later" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
});

router.post("/forgetPassword", (req, res) => {
  const user = req.body;
  query = "select email,password from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res
          .status(404)
          .json({ message: "Please Enter the Valid Email Address." });
      } else {
        let mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: "Password by Cafe Management System",
          html: `<p><b>Your Login Details for Cafe Management System</b><br><b>Email: </b>${results[0].email}<br><b>Password: </b>${results[0].password}<br><a href = "http://localhost4200/">Click Here to Login</a></p>`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log(`Email Sent: ${info.response}`);
          }
        });
        return res.status(200).json({
          message: "Password Sent Successfully To Your Email Address.",
        });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/get", auth.authenticateToken, checkRole.checkRole, (req, res) => {
  let query =
    "SELECT id,name,email,contactNumber,status from user where role = 'user'";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.patch("/update", auth.authenticateToken, (req, res) => {
  let user = req.body;
  let query = "update user set status = ? where id = ?";
  connection.query(query, [user.status, user.id], (err, results) => {
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({ message: "User ID Does Not Exists" });
      } else {
        res.status(200).json({ message: "User Updated Successfully." });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/checkToken", auth.authenticateToken, (req, res) => {
  return res.status(200).json({ message: "true" });
});

router.post("/changePassword", auth.authenticateToken, (req, res) => {
  const user = req.body;
  const email = res.locals.email;
  const query = "UPDATE user SET password = ? WHERE email = ?";

  connection.query(query, [user.newPassword, email], (err, results) => {
    if (!err) {
      if (results.affectedRows == 0) {
        res
          .status(500)
          .json({ message: "Password Could not be Change try again" });
      } else {
        res.status(200).json({ message: "Password Changed Successfully" });
      }
    } else {
      res.status(500).json(err);
    }
  });
});

module.exports = router;
