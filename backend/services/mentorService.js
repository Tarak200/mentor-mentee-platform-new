const db = require('./database');

class MentorService {
    // Get dashboard statistics for mentor
    async getDashboardStats(mentorId) {
        try {
            const stats = {};

            // Get mentee count
            const menteeCount = await db.get(
                'SELECT COUNT(*) as count FROM mentor_mentee_relationships WHERE mentorId = ? AND status = "active"',
                [mentorId]
            );
            stats.mentees = menteeCount.count;

            // Get upcoming sessions count
            const upcomingSessionsCount = await db.get(
                'SELECT COUNT(*) as count FROM mentoring_sessions WHERE mentorId = ? AND status = "upcoming" AND scheduledAt > datetime("now")',
                [mentorId]
            );
            stats.upcomingSessions = upcomingSessionsCount.count;

            // Get monthly hours and earnings
            const monthlyStats = await db.get(
                `SELECT 
                    SUM(duration) as monthlyHours, 
                    SUM(amount) as monthlyEarnings 
                 FROM mentoring_sessions 
                 WHERE mentorId = ? AND status = "completed" 
                 AND datetime(scheduledAt) >= datetime('now', 'start of month')`,
                [mentorId]
            );
            stats.monthlyHours = Math.round((monthlyStats.monthlyHours || 0) / 60); // Convert to hours
            stats.monthlyEarnings = monthlyStats.monthlyEarnings || 0;

            return stats;
        } catch (error) {
            console.error('Error fetching mentor stats:', error);
            throw new Error('Failed to fetch dashboard statistics');
        }
    }

    // Get mentor's mentees
    async getMentees(mentorId, options = {}) {
        try {
            const { status, search, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT u.id, u.firstName, u.lastName, u.avatar, u.email, 
                       r.status, r.createdAt as relationshipStart,
                       COUNT(s.id) as sessionsCount,
                       MAX(s.scheduledAt) as lastSession
                FROM mentor_mentee_relationships r
                JOIN users u ON r.menteeId = u.id
                LEFT JOIN mentoring_sessions s ON s.menteeId = u.id AND s.mentorId = r.mentorId
                WHERE r.mentorId = ?
            `;
            
            const params = [mentorId];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            if (search) {
                sql += ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            sql += ' GROUP BY u.id, r.id ORDER BY r.createdAt DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const mentees = await db.all(sql, params);

            return mentees.map(mentee => ({
                ...mentee,
                name: `${mentee.firstName} ${mentee.lastName}`,
                sessionsCount: mentee.sessionsCount || 0
            }));
        } catch (error) {
            console.error('Error fetching mentees:', error);
            throw new Error('Failed to fetch mentees');
        }
    }

    // Get mentor details
    async getMentorDetails(mentorId) {
        try {
            const mentor = await db.get(
            `SELECT id, firstName AS first_name, lastName AS last_name, education, institution,
                    current_pursuit, languages, subjects, qualifications, bio, profile_picture
            FROM users
            WHERE id = ? AND role = 'mentor'`,
            [mentorId]
            );

            if (!mentor) return null;

            // Parse JSON fields if stored as text (e.g., ["English","Hindi"])
            if (typeof mentor.languages === 'string') {
            try { mentor.languages = JSON.parse(mentor.languages); } catch { mentor.languages = [mentor.languages]; }
            }
            if (typeof mentor.subjects === 'string') {
            try { mentor.subjects = JSON.parse(mentor.subjects); } catch { mentor.subjects = [mentor.subjects]; }
            }

            return mentor;
        } catch (error) {
            console.error('Error fetching mentor details from DB:', error);
            throw error;
        }
    }
    
    // Get mentor's sessions
    async getSessions(mentorId, options = {}) {
        try {
            const { status, menteeId, dateFrom, dateTo, page = 1, limit = 20 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT s.*, u.firstName, u.lastName,
                       u.firstName || ' ' || u.lastName as menteeName
                FROM mentoring_sessions s
                JOIN users u ON s.menteeId = u.id
                WHERE s.mentorId = ?
            `;
            
            const params = [mentorId];

            if (status) {
                sql += ' AND s.status = ?';
                params.push(status);
            }

            if (menteeId) {
                sql += ' AND s.menteeId = ?';
                params.push(menteeId);
            }

            if (dateFrom) {
                sql += ' AND s.scheduledAt >= ?';
                params.push(dateFrom);
            }

            if (dateTo) {
                sql += ' AND s.scheduledAt <= ?';
                params.push(dateTo);
            }

            sql += ' ORDER BY s.scheduledAt DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            return await db.all(sql, params);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw new Error('Failed to fetch sessions');
        }
    }

    // Create new session
    async createSession(sessionData) {
        try {
            const {
                mentorId, menteeId, title, date, time, duration, description = ''
            } = sessionData;

            // Combine date and time
            const scheduledAt = new Date(`${date}T${time}`);
            
            // Check for scheduling conflicts
            const conflictCheck = await db.get(
                `SELECT id FROM mentoring_sessions 
                 WHERE mentorId = ? AND status IN ('upcoming', 'in_progress')
                 AND datetime(scheduledAt) = datetime(?)`,
                [mentorId, scheduledAt.toISOString()]
            );

            if (conflictCheck) {
                throw new Error('You already have a session scheduled at this time');
            }

            // Get mentor's hourly rate
            const mentor = await db.get('SELECT hourlyRate FROM users WHERE id = ?', [mentorId]);
            const amount = (mentor.hourlyRate || 50) * (duration / 60); // Convert minutes to hours

            const sessionId = Date.now().toString();
            
            await db.run(
                `INSERT INTO mentoring_sessions 
                 (id, mentorId, menteeId, title, description, scheduledAt, duration, amount, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)`,
                [
                    sessionId, mentorId, menteeId, title, description,
                    scheduledAt.toISOString(), duration, amount,
                    new Date().toISOString(), new Date().toISOString()
                ]
            );

            return { id: sessionId, ...sessionData, amount, status: 'upcoming' };
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    // Get today's schedule
    async getTodaySchedule(mentorId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            return await db.all(
                `SELECT s.*, u.firstName, u.lastName,
                        u.firstName || ' ' || u.lastName as menteeName
                 FROM mentoring_sessions s
                 JOIN users u ON s.menteeId = u.id
                 WHERE s.mentorId = ? AND date(s.scheduledAt) = ?
                 ORDER BY s.scheduledAt ASC`,
                [mentorId, today]
            );
        } catch (error) {
            console.error('Error fetching today schedule:', error);
            throw new Error('Failed to fetch today\'s schedule');
        }
    }

    // Get recent activity
    async getRecentActivity(mentorId, limit = 10) {
        try {
            return await db.all(
                `SELECT type, description, createdAt, data 
                 FROM activity_logs 
                 WHERE userId = ? 
                 ORDER BY createdAt DESC 
                 LIMIT ?`,
                [mentorId, limit]
            );
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }

    // Get pending requests
    async getPendingRequests(mentorId) {
        try {
            return await db.all(
                `SELECT r.*, u.firstName, u.lastName, u.avatar, u.bio,
                        u.firstName || ' ' || u.lastName as menteeName
                 FROM mentoring_requests r
                 JOIN users u ON r.menteeId = u.id
                 WHERE r.mentorId = ? AND r.status = 'pending'
                 ORDER BY r.createdAt DESC`,
                [mentorId]
            );
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            return [];
        }
    }

    // Accept mentoring request
    async acceptRequest(mentorId, requestId) {
        try {
            const request = await db.get(
                'SELECT * FROM mentoring_requests WHERE id = ? AND mentorId = ?',
                [requestId, mentorId]
            );

            if (!request) {
                return { success: false, message: 'Request not found' };
            }

            // Begin transaction
            await db.run('BEGIN TRANSACTION');

            try {
                // Update request status
                await db.run(
                    'UPDATE mentoring_requests SET status = "accepted", updatedAt = ? WHERE id = ?',
                    [new Date().toISOString(), requestId]
                );

                // Create mentor-mentee relationship
                const relationshipId = Date.now().toString();
                await db.run(
                    `INSERT INTO mentor_mentee_relationships 
                     (id, mentorId, menteeId, status, createdAt, updatedAt)
                     VALUES (?, ?, ?, 'active', ?, ?)`,
                    [
                        relationshipId, mentorId, request.menteeId,
                        new Date().toISOString(), new Date().toISOString()
                    ]
                );

                await db.run('COMMIT');
                return { success: true, relationship: { id: relationshipId } };
            } catch (error) {
                await db.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            throw new Error('Failed to accept request');
        }
    }

    // Get earnings data
    async getEarnings(mentorId, options = {}) {
        try {
            const { period = 'month', year, month } = options;
            
            // Get current month earnings
            const currentMonth = await db.get(
                `SELECT SUM(amount) as currentMonth 
                 FROM mentoring_sessions 
                 WHERE mentorId = ? AND status = 'completed'
                 AND datetime(scheduledAt) >= datetime('now', 'start of month')`,
                [mentorId]
            );

            // Get total earnings
            const total = await db.get(
                `SELECT SUM(amount) as total 
                 FROM mentoring_sessions 
                 WHERE mentorId = ? AND status = 'completed'`,
                [mentorId]
            );

            // Get pending payments
            const pending = await db.get(
                `SELECT SUM(amount) as pending 
                 FROM mentoring_sessions 
                 WHERE mentorId = ? AND status = 'completed' AND paymentStatus != 'paid'`,
                [mentorId]
            );

            return {
                currentMonth: currentMonth.currentMonth || 0,
                total: total.total || 0,
                pending: pending.pending || 0,
                change: 0, // Calculate based on previous month comparison
                totalSessions: 0,
                pendingSessions: 0,
                transactions: []
            };
        } catch (error) {
            console.error('Error fetching earnings:', error);
            throw new Error('Failed to fetch earnings data');
        }
    }
}

module.exports = new MentorService();
