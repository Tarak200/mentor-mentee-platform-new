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

    //Get mentor details
    async getMentorDetails(userId) {
        try {
            console.log("Fetching mentor of ID:", userId);
            const user = await db.get(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            
            if (user) {
                // Parse JSON fields
                if (user.expertise) user.expertise = JSON.parse(user.expertise);
                if (user.availability) user.availability = JSON.parse(user.availability);
                if (user.interests) user.interests = JSON.parse(user.interests);
                if (user.paymentMethods) user.paymentMethods = JSON.parse(user.paymentMethods);
            }
            
            return user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw new Error('Failed to fetch user profile');
        }
    }

    // Get mentor's mentees
    async getMentees(mentorId, options = {}) {
        try {
            const { status, search, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT u.id, u.firstName, u.lastName, u.avatar, u.email, 
                       r.status, r.created_at as relationshipStart,
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

            sql += ' GROUP BY u.id, r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
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
    async getAllMentors() {
        try {
            console.log("📊 Starting getAllMentors query...");
            const startTime = Date.now();
            
            const query = `
                SELECT 
                    u.id, 
                    u.firstName AS first_name, 
                    u.lastName AS last_name, 
                    u.education, 
                    u.institution, 
                    u.current_pursuit, 
                    u.languages, 
                    u.subjects, 
                    u.qualifications, 
                    u.bio, 
                    u.profile_picture, 
                    u.hourlyRate AS hourly_rate, 
                    u.rating, 
                    u.available_hours,
                    COUNT(ms.id) AS total_sessions
                FROM users u
                LEFT JOIN mentoring_sessions ms ON u.id = ms.mentorId AND ms.status = 'completed'
                WHERE u.role = 'mentor'
                GROUP BY u.id, u.firstName, u.lastName, u.education, u.institution, 
                        u.current_pursuit, u.languages, u.subjects, u.qualifications, 
                        u.bio, u.profile_picture, u.hourlyRate, u.rating, u.available_hours
            `;
            
            const rows = await db.all(query, []);
            
            console.log(`✅ Found ${rows?.length || 0} mentors in ${Date.now() - startTime}ms`);
            
            const mentors = rows.map(row => ({
                id : row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                education: row.education,   
                institution: row.institution,
                rating: row.rating,
                profile_picture: row.profile_picture,
                qualifications: row.qualifications,
                bio: row.bio,
                total_sessions: row.total_sessions,
                current_pursuit: row.current_pursuit,   
                languages: this.parseArrayField(row.languages),
                subjects: this.parseArrayField(row.subjects),
                available_hours: this.parseArrayField(row.available_hours),
                hourlyRate: row.hourly_rate,
            }));
            
            return mentors;
        } catch (error) {
            console.error('❌ Error fetching mentors from DB:', error);
            throw error;
        }
    }

    // Helper method to parse array fields (handles multiple formats)
    parseArrayField(value) {
        if (!value) return [];
        
        // Already an array
        if (Array.isArray(value)) return value;
        
        // Try parsing as JSON first
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // If JSON parse fails, treat as comma-separated string
                return value.split(',').map(item => item.trim()).filter(Boolean);
            }
        }
        
        return [value];
    }

    // Get mentor's sessions
    async getSessions(mentorId, options = {}) {
        try {
            const { status, menteeId, dateFrom, dateTo, page = 1, limit = 20 } = options;
            // console.log("query is triggered");

            // console.log("mentorId being queried:", mentorId);
            // console.log("mentorId type:", typeof mentorId);

            // Base query
            let query = `
                SELECT 
                    s.id,
                    s.mentorId AS mentor_id,
                    s.menteeId AS mentee_id,
                    s.title,
                    s.description,
                    s.scheduledAt AS scheduled_time,
                    s.duration,
                    s.amount,
                    s.paymentStatus AS payment_status,
                    s.status,
                    s.created_at,
                    u.firstName AS mentee_first_name,
                    u.lastName AS mentee_last_name,
                    u.current_pursuit AS mentee_current_pursuit,
                    u.education AS mentee_education,
                    u.institution AS mentee_institution,
                    u.email AS mentee_email,
                    u.languages AS mentee_languages,
                    u.subjects AS mentee_subjects,
                    u.qualifications AS mentee_qualifications,
                    u.profile_picture as profilePic
                FROM mentoring_sessions s
                JOIN users u ON s.menteeId = u.id
                WHERE s.mentorId = ?
            `;
            const params = [mentorId];
            
            // Apply optional filters
            if (status) {
                query += ` AND s.status = ?`;
                params.push(status);
            }
            if (menteeId) {
                query += ` AND s.menteeId = ?`;
                params.push(menteeId);
            }
            if (dateFrom) {
                query += ` AND s.scheduledAt >= ?`;
                params.push(dateFrom);
            }
            if (dateTo) {
                query += ` AND s.scheduledAt <= ?`;
                params.push(dateTo);
            }

            // Ordering and pagination
            query += ` ORDER BY s.scheduledAt DESC`;
            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            // Execute session query
            const sessions = await db.all(query, params);
            // console.log("queried successfully !")
            // console.log("getSessions sessions:", sessions);

            // Count query for pagination
            let countQuery = `
                SELECT COUNT(*) AS total
                FROM mentoring_sessions s
                WHERE s.mentorId = ?
            `;
            const countParams = [mentorId];

            if (status) {
                countQuery += ` AND s.status = ?`;
                countParams.push(status);
            }
            if (menteeId) {
                countQuery += ` AND s.menteeId = ?`;
                countParams.push(menteeId);
            }
            if (dateFrom) {
                countQuery += ` AND s.scheduledAt >= ?`;
                countParams.push(dateFrom);
            }
            if (dateTo) {
                countQuery += ` AND s.scheduledAt <= ?`;
                countParams.push(dateTo);
            }

            const countResult = await db.get(countQuery, countParams);
            const total = countResult ? countResult.total : 0;
            
            const result = {
                sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
            
            return result;
            
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw new Error('Failed to fetch sessions: ' + error.message);
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
                 (id, mentorId, menteeId, title, description, scheduledAt, duration, amount, status, created_at, updated_at)
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
                `SELECT type, description, created_at, data 
                 FROM activity_logs 
                 WHERE userId = ? 
                 ORDER BY created_at DESC 
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
            // console.log('Querying pending requests for mentorId:', mentorId);
            return await db.all(
                `SELECT r.*, u.firstName, u.lastName, u.avatar, u.bio,
                        u.firstName || ' ' || u.lastName as menteeName, u.email, u.education, u.institution, u.current_pursuit, u.languages, u.subjects, u.qualifications
                 FROM mentoring_requests r
                 JOIN users u ON r.menteeId = u.id
                 WHERE r.mentorId = ? AND r.status = 'pending'
                 ORDER BY r.created_at DESC`,
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
                    'UPDATE mentoring_requests SET status = "accepted", updated_at = ? WHERE id = ?',
                    [new Date().toISOString(), requestId]
                );

                // Create mentor-mentee relationship
                const relationshipId = Date.now().toString();
                await db.run(
                    `INSERT INTO mentor_mentee_relationships 
                     (id, mentorId, menteeId, status, created_at, updated_at)
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


    // update mentor profile
    async updateProfile(mentorId, profileData) {
        try {
            const { name, phone, skills, bio, availableHours, hourlyRate, education, institution, languages, subjects } = profileData;

            // Split name into first and last name
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            // Update query
            const updateQuery = `
                UPDATE users 
                SET 
                    firstName = ?,
                    lastName = ?,
                    phone = ?,
                    current_pursuit = ?,
                    institution = ?,
                    languages = ?,
                    subjects = ?,
                    hourlyRate = ?,
                    bio = ?,
                    skills = ?,
                    updated_at = CURRENT_TIMESTAMP,
                    available_hours = ?
                WHERE id = ? AND role = 'mentor'
            `;

            const values = [
                firstName,
                lastName,
                phone || null,
                education || null,
                institution || null,
                languages || null,
                subjects || null,
                hourlyRate || null,
                bio || null,
                skills || null,
                availableHours || null,
                mentorId
            ];

            const result = await db.run(updateQuery, values);

            if (result.changes === 0) {
                throw new Error('Mentor profile not found or update failed');
            }

            // Fetch updated profile
            const updatedUser = await db.get(
                `SELECT 
                    id,
                    firstName,
                    lastName,
                    email,
                    phone,
                    education,
                    institution,
                    current_pursuit as specialization,
                    bio,
                    profile_picture, 
                    hourlyRate,
                    skills,
                    languages,
                    subjects,
                    available_hours

                FROM users 
                WHERE id = ?`,
                [mentorId]
            );

            return {
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser[0]
            };

        } catch (error) {
            console.error('Error in updateProfile service:', error);
            throw error;
        }
    }


    // Get earnings data
    async getEarnings(mentorId, options = {}) {
    try {
        const { period = 'month', year, month } = options;
        
        // Now run your actual queries with fixed datetime handling
        // Get current month earnings
        const currentMonth = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as currentMonth 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed'
             AND date(scheduledAt) >= date('now', 'start of month')`,
            [mentorId]
        );

        // Get previous month earnings
        const previousMonth = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as previousMonth 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed'
             AND date(scheduledAt) >= date('now', 'start of month', '-1 month')
             AND date(scheduledAt) < date('now', 'start of month')`,
            [mentorId]
        );

        // Calculate change
        let change = 0;
        if (previousMonth.previousMonth > 0) {
            change = ((currentMonth.currentMonth - previousMonth.previousMonth) / previousMonth.previousMonth) * 100;
        }

        // Get total earnings
        const total = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed'`,
            [mentorId]
        );

        // Get pending payments
        const pending = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as pending 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed' AND paymentStatus = 'pending'`,
            [mentorId]
        );

        // Get total completed sessions
        const totalSessions = await db.get(
            `SELECT COUNT(*) as count 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed'`,
            [mentorId]
        );

        // Get pending sessions
        const pendingSessions = await db.get(
            `SELECT COUNT(*) as count 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'upcoming'
             AND datetime(scheduledAt) > datetime('now')`,
            [mentorId]
        );

        // Get future calls amount
        const futureCallsAmount = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as futureAmount 
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'upcoming'
             AND datetime(scheduledAt) > datetime('now')`,
            [mentorId]
        );

        // Calculate balance after commission
        const totalBalance = pending.pending;

        // Get transactions
        const transactions = await db.all(
            `SELECT id, menteeId, title, amount, scheduledAt, status, paymentStatus
             FROM mentoring_sessions 
             WHERE mentorId = ? AND status = 'completed'
             ORDER BY scheduledAt DESC
             LIMIT 10`,
            [mentorId]
        );

        return {
            currentMonth: currentMonth.currentMonth,
            total: total.total,
            pending: pending.pending,
            totalBalance: totalBalance,
            change: Math.round(change * 100) / 100,
            totalSessions: totalSessions.count,
            pendingSessions: pendingSessions.count,
            futureCallsAmount: futureCallsAmount.futureAmount,
            transactions: transactions
        };
    } catch (error) {
        console.error('Error fetching earnings:', error);
        throw new Error('Failed to fetch earnings data');
    }
}


}

module.exports = new MentorService();
