const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Initial Database Migration
 * Creates all the necessary tables for the mentor-mentee platform
 */

class InitialMigration {
    constructor(dbPath) {
        this.dbPath = dbPath || path.join(__dirname, '..', 'platform.db');
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database for migration.');
                resolve();
            });
        });
    }

    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async run() {
        try {
            await this.connect();
            await this.createTables();
            console.log('Initial migration completed successfully');
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async createTables() {
        const tables = [
            this.createMentorsTable(),
            this.createMenteesTable(),
            this.createConnectionRequestsTable(),
            this.createSessionsTable(),
            this.createReviewsTable(),
            this.createPaymentsTable(),
            this.createPasswordResetTokensTable(),
            this.createNotificationsTable()
        ];

        for (const tableQuery of tables) {
            await this.executeQuery(tableQuery);
        }
    }

    executeQuery(query) {
        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Error executing query:', err.message);
                    console.error('Query:', query);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    createMentorsTable() {
        return `CREATE TABLE IF NOT EXISTS mentors (
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
            hourly_rate DECIMAL(10,2) DEFAULT 500,
            qualifications TEXT,
            subjects TEXT, -- JSON array of subjects
            rating DECIMAL(3,2) DEFAULT 0.0,
            total_sessions INTEGER DEFAULT 0,
            total_earnings DECIMAL(10,2) DEFAULT 0.0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    }

    createMenteesTable() {
        return `CREATE TABLE IF NOT EXISTS mentees (
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
            total_sessions INTEGER DEFAULT 0,
            total_spent DECIMAL(10,2) DEFAULT 0.0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    }

    createConnectionRequestsTable() {
        return `CREATE TABLE IF NOT EXISTS connection_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mentee_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            message TEXT,
            preferred_time TEXT,
            meeting_link TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
            response_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE
        )`;
    }

    createSessionsTable() {
        return `CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mentor_id INTEGER NOT NULL,
            mentee_id INTEGER NOT NULL,
            connection_request_id INTEGER,
            subject TEXT NOT NULL,
            scheduled_time DATETIME NOT NULL,
            actual_start_time DATETIME,
            actual_end_time DATETIME,
            duration_planned INTEGER DEFAULT 60, -- in minutes
            duration_actual INTEGER, -- in minutes
            meeting_link TEXT,
            meeting_id TEXT,
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
            amount DECIMAL(10,2) NOT NULL,
            commission DECIMAL(10,2) NOT NULL,
            mentor_earnings DECIMAL(10,2) NOT NULL,
            payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
            cancellation_reason TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE,
            FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE,
            FOREIGN KEY (connection_request_id) REFERENCES connection_requests (id) ON DELETE SET NULL
        )`;
    }

    createReviewsTable() {
        return `CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            reviewee_id INTEGER NOT NULL,
            reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('mentor', 'mentee')),
            reviewee_type TEXT NOT NULL CHECK (reviewee_type IN ('mentor', 'mentee')),
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            is_anonymous BOOLEAN DEFAULT FALSE,
            is_visible BOOLEAN DEFAULT TRUE,
            helpful_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (reviewer_id) REFERENCES mentors (id) ON DELETE CASCADE,
            FOREIGN KEY (reviewee_id) REFERENCES mentees (id) ON DELETE CASCADE
        )`;
    }

    createPaymentsTable() {
        return `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            mentee_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            commission DECIMAL(10,2) NOT NULL,
            mentor_amount DECIMAL(10,2) NOT NULL,
            platform_amount DECIMAL(10,2) NOT NULL,
            transaction_id TEXT,
            payment_method TEXT DEFAULT 'upi',
            payment_gateway TEXT,
            gateway_transaction_id TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
            failure_reason TEXT,
            refund_amount DECIMAL(10,2),
            refund_transaction_id TEXT,
            refund_reason TEXT,
            processed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (mentee_id) REFERENCES mentees (id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES mentors (id) ON DELETE CASCADE
        )`;
    }

    createPasswordResetTokensTable() {
        return `CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            mobile_number TEXT NOT NULL,
            user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
            token TEXT NOT NULL UNIQUE,
            verification_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            used_at DATETIME,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    }

    createNotificationsTable() {
        return `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data TEXT, -- JSON data for additional context
            channel TEXT DEFAULT 'app' CHECK (channel IN ('app', 'email', 'sms', 'push')),
            status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
            priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            mobile_number TEXT,
            email_address TEXT,
            sms_sid TEXT,
            sms_status TEXT,
            email_message_id TEXT,
            read_at DATETIME,
            delivered_at DATETIME,
            failed_at DATETIME,
            failure_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    }
}

module.exports = InitialMigration;

// Allow running this migration directly
if (require.main === module) {
    const migration = new InitialMigration();
    migration.run()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}
