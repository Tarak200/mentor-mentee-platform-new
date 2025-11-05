const db = require('./database');

class MenteeService {
    // Get dashboard statistics for mentee
    async getDashboardStats(menteeId) {
        try {
            const stats = {};

            // Get active mentor count
            const activeMentorCount = await db.get(
                'SELECT COUNT(*) as count FROM mentor_mentee_relationships WHERE menteeId = ? AND status = "active"',
                [menteeId]
            );
            stats.mentors = activeMentorCount.count;

            // Get upcoming sessions count
            const upcomingSessionsCount = await db.get(
                'SELECT COUNT(*) as count FROM mentoring_sessions WHERE menteeId = ? AND status = "upcoming" AND scheduledAt > datetime("now")',
                [menteeId]
            );
            stats.upcomingSessions = upcomingSessionsCount.count;

            // Get completed sessions count this month
            const monthlySessionsCount = await db.get(
                `SELECT COUNT(*) as count 
                 FROM mentoring_sessions 
                 WHERE menteeId = ? AND status = "completed" 
                 AND datetime(scheduledAt) >= datetime('now', 'start of month')`,
                [menteeId]
            );
            stats.monthlySessions = monthlySessionsCount.count;

            // Get total learning hours
            const totalHours = await db.get(
                `SELECT SUM(duration) as totalMinutes 
                 FROM mentoring_sessions 
                 WHERE menteeId = ? AND status = "completed"`,
                [menteeId]
            );
            stats.totalHours = Math.round((totalHours.totalMinutes || 0) / 60); // Convert to hours

            return stats;
        } catch (error) {
            console.error('Error fetching mentee stats:', error);
            throw new Error('Failed to fetch dashboard statistics');
        }
    }

    // Get mentee's mentors
    async getMentors(menteeId, options = {}) {
        try {
            const { status, search, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT u.id, u.firstName, u.lastName, u.avatar, u.email, u.bio, u.skills, u.hourlyRate,
                       r.status, r.created_at as relationshipStart,
                       COUNT(s.id) as sessionsCount,
                       MAX(s.scheduledAt) as lastSession,
                       AVG(CASE WHEN rev.rating IS NOT NULL THEN rev.rating ELSE NULL END) as averageRating
                FROM mentor_mentee_relationships r
                JOIN users u ON r.mentorId = u.id
                LEFT JOIN mentoring_sessions s ON s.mentorId = u.id AND s.menteeId = r.menteeId
                LEFT JOIN reviews rev ON rev.mentorId = u.id
                WHERE r.menteeId = ?
            `;
            
            const params = [menteeId];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            if (search) {
                sql += ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ? OR u.skills LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            sql += ' GROUP BY u.id, r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const mentors = await db.all(sql, params);

            return mentors.map(mentor => ({
                ...mentor,
                name: `${mentor.firstName} ${mentor.lastName}`,
                sessionsCount: mentor.sessionsCount || 0,
                averageRating: mentor.averageRating ? parseFloat(mentor.averageRating).toFixed(1) : null,
                skills: mentor.skills ? mentor.skills.split(',') : []
            }));
        } catch (error) {
            console.error('Error fetching mentors:', error);
            throw new Error('Failed to fetch mentors');
        }
    }

    // Get mentee's sessions
    // In your menteeService.js file
    async getSessions(menteeId, options = {}) {
        // console.log("=== Entered getSessions function ===");
        try {
            // console.log("=== getSessions called ===");
            // console.log("menteeId:", menteeId);
            // console.log("options:", options);
            
            const { status, mentorId, dateFrom, dateTo, page = 1, limit = 20 } = options;

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
                    u.firstName AS mentor_first_name,
                    u.lastName AS mentor_last_name,
                    u.subjects AS subject,
                    u.profile_picture as profilePic
                FROM mentoring_sessions s
                JOIN users u ON s.mentorId = u.id
                WHERE s.menteeId = ?
            `;

            const params = [menteeId];
            
            // Apply optional filters
            if (status) {
                // console.log("Adding status filter:", status);
                query += ` AND s.status = ?`;
                params.push(status);
            }
            if (mentorId) {
                // console.log("Adding mentorId filter:", mentorId);
                query += ` AND s.mentorId = ?`;
                params.push(mentorId);
            }
            if (dateFrom) {
                // console.log("Adding dateFrom filter:", dateFrom);
                query += ` AND s.scheduledAt >= ?`;
                params.push(dateFrom);
            }
            if (dateTo) {
                // console.log("Adding dateTo filter:", dateTo);
                query += ` AND s.scheduledAt <= ?`;
                params.push(dateTo);
            }

            // Ordering and pagination
            query += ` ORDER BY s.scheduledAt DESC`;
            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            // console.log("=== Final Query ===");
            // console.log("Query:", query);
            // console.log("Params:", params);

            // Execute session query
            // console.log("Executing session query...");
            const sessions = await db.all(query, params);
            // console.log("Sessions returned:", sessions.length);
            // console.log("First session (if any):", sessions[0] || "No sessions found");

            // Count query for pagination
            let countQuery = `
                SELECT COUNT(*) AS total
                FROM mentoring_sessions s
                WHERE s.menteeId = ?
            `;
            const countParams = [menteeId];

            if (status) {
                countQuery += ` AND s.status = ?`;
                countParams.push(status);
            }
            if (mentorId) {
                countQuery += ` AND s.mentorId = ?`;
                countParams.push(mentorId);
            }
            if (dateFrom) {
                countQuery += ` AND s.scheduledAt >= ?`;
                countParams.push(dateFrom);
            }
            if (dateTo) {
                countQuery += ` AND s.scheduledAt <= ?`;
                countParams.push(dateTo);
            }

            // console.log("=== Count Query ===");
            // console.log("Count Query:", countQuery);
            // console.log("Count Params:", countParams);

            const countResult = await db.get(countQuery, countParams);
            // console.log("Count Result:", countResult);
            
            const total = countResult ? countResult.total : 0;
            // console.log("Total sessions found:", total);
            
            const result = {
                sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
            
            // console.log("=== Returning Result ===");
            // console.log("Result structure:", result);
            
            return result;
            
        } catch (error) {
            console.error('=== ERROR in getSessions ===');
            // console.error('Error message:', error.message);
            // console.error('Error stack:', error.stack);
            // console.error('Error object:', error);
            throw new Error('Failed to fetch sessions: ' + error.message);
        }
    }

    // Placeholder for the booking function
    async bookSession(sessionData) {
        try {
            const {
                mentorId,
                menteeId,
                scheduledAt,
                duration,
                amount,
                paymentStatus = 'pending',
                meetingLink = null,
                status = 'scheduled'
            } = sessionData;

            const query = `
                INSERT INTO mentoring_sessions (
                    mentorId,
                    menteeId,
                    scheduledAt,
                    duration,
                    amount,
                    paymentStatus,
                    meeting_link,
                    status,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `;

            const params = [
                mentorId,
                menteeId,
                scheduledAt,
                duration,
                amount,
                paymentStatus,
                meetingLink,
                status
            ];

            const result = await db.run(query, params);
            return { message: 'Session booked successfully', sessionId: result.lastID };
        } catch (error) {
            console.error('Error booking session:', error);
            throw new Error('Failed to book session: ' + error.message);
        }
    }


    // Find mentors
    async findMentors(menteeId, options = {}) {
        try {
            const { skills, search, minRating, maxRate, page = 1, limit = 12 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT u.id, u.firstName, u.lastName, u.avatar, u.bio, u.skills, u.hourlyRate,
                       AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE NULL END) as averageRating,
                       COUNT(r.id) as reviewCount,
                       COUNT(DISTINCT mr.menteeId) as menteeCount
                FROM users u
                LEFT JOIN reviews r ON r.mentorId = u.id
                LEFT JOIN mentor_mentee_relationships mr ON mr.mentorId = u.id AND mr.status = 'active'
                WHERE u.role = 'mentor' AND u.isActive = 1
                AND u.id NOT IN (
                    SELECT mentorId FROM mentor_mentee_relationships 
                    WHERE menteeId = ? AND status IN ('active', 'pending')
                )
            `;
            
            const params = [menteeId];

            if (skills && skills.length > 0) {
                const skillConditions = skills.map(() => 'u.skills LIKE ?').join(' OR ');
                sql += ` AND (${skillConditions})`;
                skills.forEach(skill => params.push(`%${skill}%`));
            }

            if (search) {
                sql += ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.bio LIKE ? OR u.skills LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            sql += ' GROUP BY u.id';

            if (minRating) {
                sql += ' HAVING averageRating >= ?';
                params.push(minRating);
            }

            if (maxRate) {
                sql += ' AND u.hourlyRate <= ?';
                params.push(maxRate);
            }

            sql += ' ORDER BY averageRating DESC, reviewCount DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const mentors = await db.all(sql, params);

            return mentors.map(mentor => ({
                ...mentor,
                name: `${mentor.firstName} ${mentor.lastName}`,
                averageRating: mentor.averageRating ? parseFloat(mentor.averageRating).toFixed(1) : null,
                reviewCount: mentor.reviewCount || 0,
                menteeCount: mentor.menteeCount || 0,
                skills: mentor.skills ? mentor.skills.split(',') : []
            }));
        } catch (error) {
            console.error('Error finding mentors:', error);
            throw new Error('Failed to find mentors');
        }
    }

    // Request mentoring
    async requestMentoring(requestData) {
        try {
            const { menteeId, mentorId, message, goals, preferredSchedule } = requestData;

            // Check if request already exists
            const existingRequest = await db.get(
                `SELECT id FROM mentoring_requests 
                 WHERE menteeId = ? AND mentorId = ? AND status IN ('pending', 'accepted')`,
                [menteeId, mentorId]
            );

            if (existingRequest) {
                throw new Error('You already have an active request with this mentor');
            }

            const requestId = Date.now().toString();
            
            await db.run(
                `INSERT INTO mentoring_requests 
                 (id, menteeId, mentorId, message, goals, preferredSchedule, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [
                    requestId, menteeId, mentorId, message, goals, preferredSchedule,
                    new Date().toISOString(), new Date().toISOString()
                ]
            );

            return { id: requestId, status: 'pending' };
        } catch (error) {
            console.error('Error creating mentoring request:', error);
            throw error;
        }
    }

    // Get mentee's requests
    async getRequests(menteeId, options = {}) {
        try {
            const { status, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT r.*, u.firstName, u.lastName, u.avatar, u.bio,
                       u.firstName || ' ' || u.lastName as mentorName
                FROM mentoring_requests r
                JOIN users u ON r.mentorId = u.id
                WHERE r.menteeId = ?
            `;
            
            const params = [menteeId];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            return await db.all(sql, params);
        } catch (error) {
            console.error('Error fetching requests:', error);
            throw new Error('Failed to fetch requests');
        }
    }

    // Book session with mentor
    async bookSession(sessionData) {
        try {
            const {
                menteeId, mentorId, title, date, time, duration = 60, message = ''
            } = sessionData;

            // Combine date and time
            const scheduledAt = new Date(`${date}T${time}`);
            
            // Check if mentee has active relationship with mentor
            const relationship = await db.get(
                'SELECT id FROM mentor_mentee_relationships WHERE menteeId = ? AND mentorId = ? AND status = "active"',
                [menteeId, mentorId]
            );

            if (!relationship) {
                throw new Error('You must have an active mentoring relationship to book sessions');
            }

            // Check for scheduling conflicts
            const conflictCheck = await db.get(
                `SELECT id FROM mentoring_sessions 
                 WHERE menteeId = ? AND status IN ('upcoming', 'in_progress')
                 AND datetime(scheduledAt) = datetime(?)`,
                [menteeId, scheduledAt.toISOString()]
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
                    sessionId, mentorId, menteeId, title, message,
                    scheduledAt.toISOString(), duration, amount,
                    new Date().toISOString(), new Date().toISOString()
                ]
            );

            return { id: sessionId, ...sessionData, amount, status: 'upcoming' };
        } catch (error) {
            console.error('Error booking session:', error);
            throw error;
        }
    }

    // Get today's schedule
    async getTodaySchedule(menteeId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            return await db.all(
                `SELECT s.*, u.firstName, u.lastName,
                        u.firstName || ' ' || u.lastName as mentorName,
                        u.avatar as mentorAvatar
                 FROM mentoring_sessions s
                 JOIN users u ON s.mentorId = u.id
                 WHERE s.menteeId = ? AND date(s.scheduledAt) = ?
                 ORDER BY s.scheduledAt ASC`,
                [menteeId, today]
            );
        } catch (error) {
            console.error('Error fetching today schedule:', error);
            throw new Error('Failed to fetch today\'s schedule');
        }
    }

    // Get learning progress
    async getLearningProgress(menteeId, options = {}) {
        try {
            const { period = 'month' } = options;
            
            // Get monthly session counts for the last 6 months
            const monthlyProgress = await db.all(
                `SELECT 
                    strftime('%Y-%m', scheduledAt) as month,
                    COUNT(*) as sessions,
                    SUM(duration) as totalMinutes
                 FROM mentoring_sessions 
                 WHERE menteeId = ? AND status = 'completed'
                 AND datetime(scheduledAt) >= datetime('now', '-6 months')
                 GROUP BY strftime('%Y-%m', scheduledAt)
                 ORDER BY month DESC`,
                [menteeId]
            );

            // Get skill-based sessions
            const skillProgress = await db.all(
                `SELECT 
                    u.skills,
                    COUNT(s.id) as sessions,
                    SUM(s.duration) as totalMinutes,
                    AVG(r.rating) as averageRating
                 FROM mentoring_sessions s
                 JOIN users u ON s.mentorId = u.id
                 LEFT JOIN reviews r ON r.sessionId = s.id
                 WHERE s.menteeId = ? AND s.status = 'completed'
                 GROUP BY u.skills
                 HAVING u.skills IS NOT NULL`,
                [menteeId]
            );

            return {
                monthly: monthlyProgress.map(month => ({
                    ...month,
                    totalHours: Math.round((month.totalMinutes || 0) / 60)
                })),
                skills: skillProgress.map(skill => ({
                    ...skill,
                    skills: skill.skills ? skill.skills.split(',') : [],
                    totalHours: Math.round((skill.totalMinutes || 0) / 60)
                }))
            };
        } catch (error) {
            console.error('Error fetching learning progress:', error);
            throw new Error('Failed to fetch learning progress');
        }
    }

    // Get recent activity
    async getRecentActivity(menteeId, limit = 10) {
        try {
            return await db.all(
                `SELECT type, description, created_at, data 
                 FROM activity_logs 
                 WHERE userId = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [menteeId, limit]
            );
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }

    // Cancel mentoring request
    async cancelRequest(menteeId, requestId) {
        try {
            const request = await db.get(
                'SELECT * FROM mentoring_requests WHERE id = ? AND menteeId = ?',
                [requestId, menteeId]
            );

            if (!request) {
                return { success: false, message: 'Request not found' };
            }

            if (request.status !== 'pending') {
                return { success: false, message: 'Can only cancel pending requests' };
            }

            await db.run(
                'UPDATE mentoring_requests SET status = "cancelled", updated_at = ? WHERE id = ?',
                [new Date().toISOString(), requestId]
            );

            return { success: true };
        } catch (error) {
            console.error('Error cancelling request:', error);
            throw new Error('Failed to cancel request');
        }
    }
}

module.exports = new MenteeService();
