const express = require("express");
const connection = require("../connection");
const router = express.Router();
const auth = require("../services/authentication");
const checkRole = require("../services/checkRole");

router.post(
  "/add",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    let category = req.body;
    query = "INSERT INTO category (name) values (?)";
    connection.query(query, [category.name], (err, results) => {
      if (!err) {
        return res.status(200).json({ message: "Category Added Sucessfully." });
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get("/get", auth.authenticateToken, (req, res) => {
  let query = "select id,name from category group by name";
  connection.query(query, (err, results) => {
    if (!err) {
      res.status(200).json(results);
    } else {
      res.status(500).json(err);
    }
  });
});

router.patch(
  "/update",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let product = req.body;
    let query = "update category set name = ? where id = ?";
    connection.query(query, [product.name, product.id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res
            .status(404)
            .json({ message: "Category Id Does not Found" });
        } else {
          return res
            .status(200)
            .json({ message: "Category Updated Successfully" });
        }
      } else {
        res.status(500).json(err);
      }
    });
  }
);

module.exports = router;
