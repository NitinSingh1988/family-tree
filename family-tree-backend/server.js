const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
require('dotenv').config(); // Load .env variables

const app = express();
app.use(cors());
app.use(bodyParser.json());


//const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Connect to MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
 // password: " ", // Change to your MySQL password
  database: "family_tree_db", // Use your database name
});

// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT, // Optional, defaults to 3306
});

// Test database connection
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to MySQL database.");
  }
});

// Configure multer to store uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder to save the uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save the file with a unique name
  },
});

const upload = multer({ storage: storage });

// API: Get all family members
app.get("/api/family", (req, res) => {
  const query = "SELECT * FROM family_tree";
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      const baseUrl = `${req.protocol}://${req.get('host')}`; // Dynamically construct the base URL

      const updatedResults = results.map((member) => ({
        ...member,
        avatar: member.avatar ? `${baseUrl}${member.avatar}` : null, // Use dynamic base URL
      }));
      res.json(updatedResults);
    }
  });
});


// API: Add a family member
app.post("/api/family", (req, res) => {
  const { name, parent_id } = req.body;
  const query = "INSERT INTO family_tree (name, parent_id) VALUES (?, ?)";
  connection.query(query, [name, parent_id || null], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send({ id: result.insertId, name, parent_id });
    }
  });
});

// API: Update a family member's details, including the avatar
app.put("/api/family/:id", upload.single('avatar'), (req, res) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;  // Include avatar in the request body
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
  // Query to update the family member's details
  const query = "UPDATE family_tree SET name = ?, parent_id = ?, avatar = IFNULL(?, avatar) WHERE id = ?";
  connection.query(query, [name, parent_id || null, avatarUrl || null, id], (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send({ message: "Member updated successfully" });
    }
  });
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// API: Delete a family member and their children
app.delete("/api/family/:id", (req, res) => {
    const { id } = req.params;
  
    // Delete the member and all its children
    const query = "DELETE FROM family_tree WHERE id = ? OR parent_id = ?";
    connection.query(query, [id, id], (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send({ message: "Member and its descendants deleted successfully" });
      }
    });
  });
  

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
