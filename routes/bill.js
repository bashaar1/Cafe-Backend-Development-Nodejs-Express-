const express = require("express");
const connection = require("../connection");
const router = express.Router();
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
const fs = require("fs");
const uuid = require("uuid");
const auth = require("../services/authentication");
//I KNOW YOU WILL COME BACK TO THIS FILE REMEMBER TO
//ALWAYS PASS THE ARRAY TO THE API WHEN PASSING THE VALUE FOR THE productDetails

router.post("/generateReport", auth.authenticateToken, (req, res) => {
  const generatedUuid = uuid.v1();
  const orderDetails = req.body;
  const productDetailsReport = orderDetails.productDetails.map((e) => {
    return JSON.parse(e);
  });
  let convertingArrayOfStrIntoSingleString = "";
  orderDetails.productDetails.forEach((e) => {
    convertingArrayOfStrIntoSingleString += e;
  });

  const query =
    "INSERT INTO bill (name,uuid,email,contactNumber,paymentMethod,total,productDetails,createdBy) values(?,?,?,?,?,?,?,?)";
  connection.query(
    query,
    [
      orderDetails.name,
      generatedUuid,
      orderDetails.email,
      orderDetails.contactNumber,
      orderDetails.paymentMethod,
      orderDetails.totalAmount,
      JSON.stringify(convertingArrayOfStrIntoSingleString),
      res.locals.email,
    ],
    (err, results) => {
      if (!err) {
        ejs.renderFile(
          path.join(__dirname, "", "report.ejs"),
          {
            productDetails: productDetailsReport,
            name: orderDetails.name,
            email: orderDetails.email,
            contactNumber: orderDetails.contactNumber,
            paymentMethod: orderDetails.paymentMethod,
            totalAmount: orderDetails.totalAmount,
          },
          (err, results) => {
            if (!err) {
              pdf
                .create(results)
                .toFile(
                  "./generated_pdf/" + generatedUuid + ".pdf",
                  function (err, data) {
                    if (err) {
                      return res.status(500).json(err);
                    } else {
                      return res.status(200).json({ uuid: generatedUuid });
                    }
                  }
                );
            } else {
              return res.status(500).json(err);
            }
          }
        );
      } else {
        return res.status(500).json(err);
      }
    }
  );
});

router.post("/getPdf", auth.authenticateToken, (req, res) => {
  const orderDetails = req.body;
  const pdfPath = path.join("../generated_pdf", orderDetails.uuid + ".pdf"); // Correct path concatenation

  // Parse product details from stringified JSON
  const productDetailsReport = orderDetails.productDetails.map((e) =>
    JSON.parse(e)
  );

  // Check if the PDF file exists asynchronously
  fs.access(pdfPath, fs.constants.F_OK, (err) => {
    if (!err) {
      // File exists, serve it
      console.log("File Exists");
      res.contentType("application/pdf");
      fs.createReadStream(pdfPath).pipe(res);
    } else {
      // File doesn't exist, generate it
      ejs.renderFile(
        path.join(__dirname, "", "report.ejs"), // Make sure this path is correct
        {
          productDetails: productDetailsReport,
          name: orderDetails.name,
          email: orderDetails.email,
          contactNumber: orderDetails.contactNumber,
          paymentMethod: orderDetails.paymentMethod,
          totalAmount: orderDetails.totalAmount,
        },
        (err, results) => {
          if (!err) {
            pdf.create(results).toFile(pdfPath, function (err, data) {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Error generating PDF", details: err });
              } else {
                res.contentType("application/pdf");
                fs.createReadStream(pdfPath).pipe(res);
              }
            });
          } else {
            return res
              .status(500)
              .json({ error: "Error rendering PDF", details: err });
          }
        }
      );
    }
  });
});

router.get("/getBills", auth.authenticateToken, (req, res) => {
  const query = "Select * from bill order by id DESC";
  connection.query(query, (err, results) => {
    if (!err) {
      res.status(200).json(results);
    } else {
      res.status(500).json(err);
    }
  });
});

router.delete("/delete/:id", auth.authenticateToken, (req, res) => {
  const id = req.params.id;
  const query = "delete from bill where id =?";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      if (results.affectedRows == 0) {
        res.status(404).json({ message: "Id is Incorrect." });
      } else {
        res.status(200).json({ message: "Successfully Deleted." });
      }
    } else {
      res.status(500).json(err);
    }
  });
});

module.exports = router;
