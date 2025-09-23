const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './database/platform.db';

// Create database and tables
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Create tables
db.serialize(() => {
    // Users table (both mentors and mentees)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        google_id TEXT,
        user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        age INTEGER,
        education TEXT,
        institution TEXT,
        gender TEXT,
        languages TEXT, -- JSON array of languages
        current_pursuit TEXT,
        mobile_number TEXT,
        upi_id TEXT,
        profile_picture TEXT,
        available_hours TEXT, -- JSON array of available hours
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Mentor specific details
    db.run(`CREATE TABLE IF NOT EXISTS mentor_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hourly_rate DECIMAL(10,2) NOT NULL,
        qualifications TEXT,
        subjects TEXT, -- JSON array of subjects they can mentor
        rating DECIMAL(3,2) DEFAULT 0.0,
        total_sessions INTEGER DEFAULT 0,
        total_earnings DECIMAL(10,2) DEFAULT 0.0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Mentee specific details
    db.run(`CREATE TABLE IF NOT EXISTS mentee_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        interests TEXT, -- JSON array of subjects they want to learn
        budget_min DECIMAL(10,2),
        budget_max DECIMAL(10,2),
        preferred_mentor_gender TEXT,
        total_sessions INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Connection requests between mentors and mentees
    db.run(`CREATE TABLE IF NOT EXISTS connection_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentee_id INTEGER NOT NULL,
        mentor_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT,
        preferred_time TEXT,
        meeting_link TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentee_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Scheduled sessions
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_id INTEGER NOT NULL,
        mentee_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        duration INTEGER DEFAULT 60, -- in minutes
        meeting_link TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) NOT NULL,
        payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'transferred')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (mentee_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Reviews and ratings
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewee_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (reviewee_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Payment transactions
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        mentee_id INTEGER NOT NULL,
        mentor_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) NOT NULL,
        mentor_amount DECIMAL(10,2) NOT NULL,
        transaction_id TEXT,
        payment_method TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (mentee_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // Password reset tokens
    db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        mobile_number TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
        token TEXT NOT NULL,
        verification_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Update mentors table to match server.js expectations
    db.run(`CREATE TABLE IF NOT EXISTS mentors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        google_id TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        age INTEGER,
        education TEXT,
        institution TEXT,
        gender TEXT,
        languages TEXT, -- JSON array of languages
        current_pursuit TEXT,
        mobile_number TEXT,
        upi_id TEXT,
        profile_picture TEXT,
        available_hours TEXT, -- JSON array of available hours
        hourly_rate DECIMAL(10,2),
        qualifications TEXT,
        subjects TEXT, -- JSON array of subjects
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Update mentees table to match server.js expectations
    db.run(`CREATE TABLE IF NOT EXISTS mentees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        google_id TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        age INTEGER,
        education TEXT,
        institution TEXT,
        gender TEXT,
        languages TEXT, -- JSON array of languages
        current_pursuit TEXT,
        mobile_number TEXT,
        upi_id TEXT,
        profile_picture TEXT,
        available_hours TEXT, -- JSON array of available hours
        interests TEXT, -- JSON array of interests
        budget_min DECIMAL(10,2),
        budget_max DECIMAL(10,2),
        preferred_mentor_gender TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Notifications log
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        mobile_number TEXT,
        sms_sid TEXT,
        sms_status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables created successfully!');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
        return;
    }
    console.log('Database connection closed.');
});
