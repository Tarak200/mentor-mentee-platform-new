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
    // Drop existing tables if they exist (for migration)
    console.log('Dropping existing tables if they exist...');
    db.run('DROP TABLE IF EXISTS payments');
    db.run('DROP TABLE IF EXISTS reviews');
    db.run('DROP TABLE IF EXISTS sessions');
    db.run('DROP TABLE IF EXISTS connection_requests');
    db.run('DROP TABLE IF EXISTS mentee_details');
    db.run('DROP TABLE IF EXISTS mentor_details');
    db.run('DROP TABLE IF EXISTS users');

    // Mentors table (complete mentor information)
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
        hourly_rate DECIMAL(10,2) NOT NULL,
        qualifications TEXT,
        subjects TEXT, -- JSON array of subjects they can mentor
        rating DECIMAL(3,2) DEFAULT 0.0,
        total_sessions INTEGER DEFAULT 0,
        total_earnings DECIMAL(10,2) DEFAULT 0.0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Mentees table (complete mentee information)
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
        interests TEXT, -- JSON array of subjects they want to learn
        budget_min DECIMAL(10,2),
        budget_max DECIMAL(10,2),
        preferred_mentor_gender TEXT,
        total_sessions INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Connection requests between mentors and mentees
    db.run(`CREATE TABLE IF NOT EXISTS connection_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentee_id INTEGER NOT NULL,
        mentor_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT,
        preferred_time TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE
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
        FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE,
        FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE
    )`);

    // Reviews and ratings
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('mentor', 'mentee')),
        reviewee_id INTEGER NOT NULL,
        reviewee_type TEXT NOT NULL CHECK (reviewee_type IN ('mentor', 'mentee')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
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
        FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE
    )`);

    console.log('✅ Separate mentor and mentee tables created successfully!');
    console.log('');
    console.log('📋 New Database Structure:');
    console.log('  📚 mentors - All mentor information');
    console.log('  🎓 mentees - All mentee information');
    console.log('  🔗 connection_requests - Requests between mentors/mentees');
    console.log('  📅 sessions - Scheduled mentoring sessions');
    console.log('  ⭐ reviews - Session ratings and feedback');
    console.log('  💰 payments - Payment transactions');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
        return;
    }
    console.log('Database connection closed.');
});
