const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); //Cross-Origin Resource Sharing
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  
    password: 'password',  
    database: 'crud_app' 
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the database');
});

// Get all users
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
        if (err) return res.status(500).json({ message: 'Error fetching users' });
        res.status(200).json(result);
    });
});

// Add a new user
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.query(query, [name, email], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error adding user' });
        res.status(201).json({ message: 'User added successfully', userId: result.insertId });
    });
});

// Delete a user & Reset ID if table is empty
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    
    db.query(deleteQuery, [userId], err => {
        if (err) return res.status(500).json({ message: 'Error deleting user' });
        
        // Check if table is empty and reset auto-increment
        db.query('SELECT COUNT(*) AS count FROM users', (err, result) => {
            if (!err && result[0].count === 0) {
                db.query('ALTER TABLE users AUTO_INCREMENT = 1');
            }
        });
        
        res.status(200).json({ message: 'User deleted successfully' });
    });
});

// Delete All Users & Reset ID
app.delete('/users', (req, res) => {
    db.query('DELETE FROM users', err => {
        if (err) return res.status(500).json({ message: 'Error deleting all users' });
        
        db.query('ALTER TABLE users AUTO_INCREMENT = 1', () => {
            res.status(200).json({ message: 'All users deleted, ID reset' });
        });
    });
});

// Create server with error handling
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy. Trying port ${PORT + 3}...`);
        server.close();
        // Try the next port
        app.listen(PORT + 3, () => {
            console.log(`Server running on http://localhost:${PORT + 3}`);
        });
    } else {
        console.error('Server error:', err);
    }
});