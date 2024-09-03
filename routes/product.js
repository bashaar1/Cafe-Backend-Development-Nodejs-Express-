const express = require("express");
const connection = require("../connection");
const router = express.Router();
const auth = require("../services/authentication");
const checkRole = require("../services/checkRole");

router.post("/add", auth.authenticateToken, checkRole.checkRole, (req, res) => {
  let product = req.body;
  query =
    "INSERT INTO product (name,categoryId,description,price,status) value (?,?,?,?,'true')";
  connection.query(
    query,
    [
      product.name,
      product.categoryId,
      product.description,
      product.price,
      product.status,
    ],
    (err, results) => {
      if (!err) {
        return res.status(200).json({ message: "Product Added Successfully." });
      } else {
        return res.status(500).json(err);
      }
    }
  );
});

router.get("/get", auth.authenticateToken, (req, res) => {
  query =
    "select p.name,p.description,p.price,p.status,c.id as categoryId ,c.name as categoryName from product p inner join category c on p.categoryId = c.id;";
  connection.query(query, (err, results) => {
    if (!err) {
      res.status(200).json(results);
    } else {
      res.status(500).json(err);
    }
  });
});

router.get("/getByCategory/:id", auth.authenticateToken, (req, res) => {
  let id = req.params.id;
  console.log(id);
  let query =
    "select id,name,categoryId,description,price from product where categoryId = ? and status = 'true'";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      console.log(results);
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/getById/:id", (req, res) => {
  if (!err) {
    const id = req.params.id;
    const query = "select id,name,description,price from product where id = ?";
    connection.query(query, [id], (err, results) => {
      if (!err) {
        return res.status(200).json(results[0]);
      } else {
        return res.status(500).json(err);
      }
    });
  } else {
    res.status(500).json(err);
  }
});

router.patch(
  "/update",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let product = req.body;
    const query =
      "Update product set set name=? ,categoryId = ?,description = ?,price = ? where id = ?";
    connection.query(
      query,
      [
        product.name,
        product.categoryId,
        product.description,
        produc.price,
        product.id,
      ],
      (err, results) => {
        if (!err) {
          if (results.affectedRows == 0) {
            return res
              .status(404)
              .json({ message: "Product ID Does Not Found" });
          } else {
            return res
              .status(200)
              .json({ message: "Product Updated Successfully" });
          }
        } else {
          return res.status(500).json(err);
        }
      }
    );
  }
);

router.delete(
  "/delete/:id",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    const id = req.params.id;
    const query = "delete from product where id = ?";
    connection.query(query, [id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          res.status(404).json({ message: "Product Id Does Not Found" });
        } else {
          res.status(200).json({ message: "Product Deleted Successfully" });
        }
      } else {
        res.status(500).json(err);
      }
    });
  }
);

router.patch(
  "/updateStatus",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let user = req.body;
    query = "UPDATE product SET status = ? where id = ?";
    connection.query(query, [user.status, user.id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res.status(404).json({ message: "Product Id Does not Found" });
        } else {
          return res
            .status(200)
            .json({ message: "Product Status Updated Successfully" });
        }
      } else {
        return res.status(500).json();
      }
    });
  }
);

module.exports = router;
