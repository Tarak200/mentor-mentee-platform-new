const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class DatabaseService {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'data', 'mentorship.db');
        this.isInitialized = false;
    }

    // Initialize database connection
    async initialize() {
        try {
            if (this.isInitialized) return;

            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Connect to database
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to SQLite database:', err);
                    throw err;
                }
                console.log('Connected to SQLite database');
            });

            // Enable foreign keys
            await this.run('PRAGMA foreign_keys = ON');
            
            // Create tables
            await this.createTables();
            
            this.isInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    // Create database tables
    async createTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('mentor', 'mentee', 'admin')) NOT NULL,
                bio TEXT,
                skills TEXT,
                avatar TEXT,
                hourlyRate REAL DEFAULT 0,
                isActive INTEGER DEFAULT 1,
                emailVerified INTEGER DEFAULT 0,
                phone TEXT,
                timezone TEXT DEFAULT 'UTC',
                settings TEXT DEFAULT '{}',
                lastLogin TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )`,

            // Mentoring sessions table
            `CREATE TABLE IF NOT EXISTS mentoring_sessions (
                id TEXT PRIMARY KEY,
                mentorId TEXT NOT NULL,
                menteeId TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                scheduledAt TEXT NOT NULL,
                duration INTEGER DEFAULT 60,
                amount REAL DEFAULT 0,
                status TEXT CHECK(status IN ('upcoming', 'in_progress', 'completed', 'cancelled')) DEFAULT 'upcoming',
                actualStartTime TEXT,
                actualEndTime TEXT,
                notes TEXT,
                summary TEXT,
                cancellationReason TEXT,
                rescheduleReason TEXT,
                paymentStatus TEXT DEFAULT 'pending',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (mentorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (menteeId) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Mentor-mentee relationships table
            `CREATE TABLE IF NOT EXISTS mentor_mentee_relationships (
                id TEXT PRIMARY KEY,
                mentorId TEXT NOT NULL,
                menteeId TEXT NOT NULL,
                status TEXT CHECK(status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                UNIQUE(mentorId, menteeId),
                FOREIGN KEY (mentorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (menteeId) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Mentoring requests table
            `CREATE TABLE IF NOT EXISTS mentoring_requests (
                id TEXT PRIMARY KEY,
                mentorId TEXT NOT NULL,
                menteeId TEXT NOT NULL,
                message TEXT NOT NULL,
                goals TEXT,
                preferredSchedule TEXT,
                status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (mentorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (menteeId) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Reviews table
            `CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                mentorId TEXT NOT NULL,
                menteeId TEXT NOT NULL,
                sessionId TEXT,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
                comment TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL,
                FOREIGN KEY (mentorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (menteeId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (sessionId) REFERENCES mentoring_sessions(id) ON DELETE SET NULL
            )`,

            // Notifications table
            `CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data TEXT DEFAULT '{}',
                isRead INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Activity logs table
            `CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                data TEXT DEFAULT '{}',
                createdAt TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Security events table
            `CREATE TABLE IF NOT EXISTS security_events (
                id TEXT PRIMARY KEY,
                userId TEXT,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                ipAddress TEXT,
                userAgent TEXT,
                data TEXT DEFAULT '{}',
                severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
                createdAt TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )`,

            // Password reset tokens table
            `CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                token TEXT NOT NULL,
                expiresAt TEXT NOT NULL,
                used INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const tableSQL of tables) {
            await this.run(tableSQL);
        }

        // Create indexes for better performance
        await this.createIndexes();
    }

    // Create database indexes
    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON mentoring_sessions(mentorId)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_mentee ON mentoring_sessions(menteeId)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON mentoring_sessions(scheduledAt)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_status ON mentoring_sessions(status)',
            'CREATE INDEX IF NOT EXISTS idx_relationships_mentor ON mentor_mentee_relationships(mentorId)',
            'CREATE INDEX IF NOT EXISTS idx_relationships_mentee ON mentor_mentee_relationships(menteeId)',
            'CREATE INDEX IF NOT EXISTS idx_requests_mentor ON mentoring_requests(mentorId)',
            'CREATE INDEX IF NOT EXISTS idx_requests_mentee ON mentoring_requests(menteeId)',
            'CREATE INDEX IF NOT EXISTS idx_requests_status ON mentoring_requests(status)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead)',
            'CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(userId)',
            'CREATE INDEX IF NOT EXISTS idx_security_user ON security_events(userId)',
            'CREATE INDEX IF NOT EXISTS idx_security_type ON security_events(type)',
            'CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(userId)',
            'CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token)'
        ];

        for (const indexSQL of indexes) {
            await this.run(indexSQL);
        }
    }

    // Promisify database operations
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Transaction support
    async beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    async commit() {
        return this.run('COMMIT');
    }

    async rollback() {
        return this.run('ROLLBACK');
    }

    // Execute multiple operations in a transaction
    async transaction(callback) {
        try {
            await this.beginTransaction();
            const result = await callback();
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    // Close database connection
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Initialize on import
databaseService.initialize().catch(console.error);

module.exports = databaseService;
