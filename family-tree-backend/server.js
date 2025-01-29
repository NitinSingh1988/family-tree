const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
//const upload = multer(); // Use multer to handle multipart form data
const path = require('path');
require('dotenv').config(); // Load .env variables
const { createClient } = require('@supabase/supabase-js'); // Import the supabase client

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

//console.log(process.env.SUPABASE_URL); // Check the URL
//console.log(process.env.SUPABASE_SERVICE_ROLE_KEY); // Check the key
//console.log(supabase);
//const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Connect to MySQL database
{/*
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
 // password: " ", // Change to your MySQL password
  database: "family_tree_db", // Use your database name
});
*/}
// Create MySQL connection
{/*
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
*/}

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
{/*
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
*/}

// API: Get all family members
app.get("/api/family", async (req, res) => {
  try {
    // Query Supabase for all family members from the 'family_tree' table
    const { data, error } = await supabase.from('family_tree1').select('*');

    if (error) {
      return res.status(500).send(error.message);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`; // Dynamically construct the base URL

    // Modify avatar URLs to include the base URL
    const updatedResults = data.map((member) => ({
      ...member,
      avatar: member.avatar ? `${baseUrl}${member.avatar}` : null,
    }));

    res.json(updatedResults);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// API: Add a family member
app.post("/api/family", async (req, res) => {
  const { name, parent_id } = req.body;
  
  try {
    // Insert the new family member into the 'family_tree' table
    const { data, error } = await supabase
      .from('family_tree1')
      .insert([
        {
          name: name,
          parent_id: parent_id || null,
        },
      ]);

    if (error) {
      return res.status(500).send({ error: error.message });
    }

    // Respond with the new family member's data
    res.status(201).send({ id: data[0].id, name, parent_id });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// API: Delete a family member and their children
app.delete("/api/family/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Delete the family member and all descendants (children)
    const { data: descendants, error: fetchError } = await supabase
      .from('family_tree1')
      .select('id')
      .or(`id.eq.${id},parent_id.eq.${id}`);
    
    if (fetchError) {
      return res.status(500).send({ error: fetchError.message });
    }

    // Delete the member and its descendants
    const { data, error } = await supabase
      .from('family_tree1')
      .delete()
      .in('id', descendants.map(member => member.id));
    
    if (error) {
      return res.status(500).send({ error: error.message });
    }

    res.send({ message: "Member and its descendants deleted successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// API: Update a family member's details, including the avatar
app.put("/api/family/:id", upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;  // Include avatar in the request body
  const avatarFile = req.file;  // Get avatar file from the request

  if (avatarFile) {
    try {
      // Step 1: Upload the avatar image to Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('avatars') // Specify the bucket name
        .upload(`${avatarFile.originalname}`, avatarFile.buffer, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError.message);
        return res.status(500).send(uploadError.message);
      }

      // Step 2: Get the public URL of the uploaded file
      const avatarPublicUrl = `https://hjlmluiixkjifyjvvfch.supabase.co/storage/v1/object/avatars/${data.Key}`;

      // Step 3: Update the family member's details, including the avatar URL
      const query = "UPDATE family_tree1 SET name = ?, parent_id = ?, avatar = IFNULL(?, avatar) WHERE id = ?";
      connection.query(query, [name, parent_id || null, avatarPublicUrl, id], (err, result) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send({ message: "Member updated successfully" });
        }
      });
    } catch (err) {
      console.error('Error processing avatar upload:', err);
      res.status(500).send('Error processing avatar upload');
    }
  } else {
    // If no avatar, update the member without changing the avatar
    const query = "UPDATE family_tree1 SET name = ?, parent_id = ? WHERE id = ?";
    connection.query(query, [name, parent_id || null, id], (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send({ message: "Member updated successfully without avatar" });
      }
    });
  }
});


{/*
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
  
*/}

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
