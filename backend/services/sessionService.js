const db = require('./database');

class SessionService {
    // Get session by ID
    async getSessionById(sessionId, userId) {
        try {
            const session = await db.get(
                `SELECT s.*, 
                        mentor.firstName as mentorFirstName, mentor.lastName as mentorLastName,
                        mentor.avatar as mentorAvatar, mentor.email as mentorEmail,
                        mentee.firstName as menteeFirstName, mentee.lastName as menteeLastName,
                        mentee.avatar as menteeAvatar, mentee.email as menteeEmail
                 FROM mentoring_sessions s
                 JOIN users mentor ON s.mentorId = mentor.id
                 JOIN users mentee ON s.menteeId = mentee.id
                 WHERE s.id = ? AND (s.mentorId = ? OR s.menteeId = ?)`,
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            return {
                ...session,
                mentor: {
                    id: session.mentorId,
                    name: `${session.mentorFirstName} ${session.mentorLastName}`,
                    firstName: session.mentorFirstName,
                    lastName: session.mentorLastName,
                    avatar: session.mentorAvatar,
                    email: session.mentorEmail
                },
                mentee: {
                    id: session.menteeId,
                    name: `${session.menteeFirstName} ${session.menteeLastName}`,
                    firstName: session.menteeFirstName,
                    lastName: session.menteeLastName,
                    avatar: session.menteeAvatar,
                    email: session.menteeEmail
                }
            };
        } catch (error) {
            console.error('Error fetching session:', error);
            throw error;
        }
    }

    // Update session
    async updateSession(sessionId, userId, updated_ata) {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            const allowedFields = ['title', 'description', 'scheduledAt', 'duration', 'status', 'notes'];
            const updates = {};
            
            Object.keys(updated_ata).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates[key] = updated_ata[key];
                }
            });

            if (Object.keys(updates).length === 0) {
                throw new Error('No valid fields to update');
            }

            // Handle date/time updates
            if (updates.scheduledAt) {
                updates.scheduledAt = new Date(updates.scheduledAt).toISOString();
            }

            updates.updated_at = new Date().toISOString();

            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), sessionId];

            await db.run(
                `UPDATE mentoring_sessions SET ${setClause} WHERE id = ?`,
                values
            );

            return { success: true, session: { ...session, ...updates } };
        } catch (error) {
            console.error('Error updating session:', error);
            throw error;
        }
    }

    // Start session
    async startSession(sessionId, userId) {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            if (session.status !== 'upcoming') {
                throw new Error('Session cannot be started');
            }

            const now = new Date().toISOString();
            
            await db.run(
                'UPDATE mentoring_sessions SET status = "in_progress", actualStartTime = ?, updated_at = ? WHERE id = ?',
                [now, now, sessionId]
            );

            return { success: true, session: { ...session, status: 'in_progress', actualStartTime: now } };
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    }

    // End session
    async endSession(sessionId, userId, sessionData = {}) {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            if (session.status !== 'in_progress') {
                throw new Error('Session is not in progress');
            }

            const now = new Date().toISOString();
            const { notes = '', summary = '' } = sessionData;
            
            await db.run(
                `UPDATE mentoring_sessions 
                 SET status = "completed", actualEndTime = ?, notes = ?, summary = ?, updated_at = ? 
                 WHERE id = ?`,
                [now, notes, summary, now, sessionId]
            );

            return { 
                success: true, 
                session: { 
                    ...session, 
                    status: 'completed', 
                    actualEndTime: now, 
                    notes, 
                    summary 
                } 
            };
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    // Cancel session
    async cancelSession(sessionId, userId, reason = '') {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            if (!['upcoming', 'in_progress'].includes(session.status)) {
                throw new Error('Session cannot be cancelled');
            }

            const now = new Date().toISOString();
            
            await db.run(
                'UPDATE mentoring_sessions SET status = "cancelled", cancellationReason = ?, updated_at = ? WHERE id = ?',
                [reason, now, sessionId]
            );

            return { success: true, session: { ...session, status: 'cancelled', cancellationReason: reason } };
        } catch (error) {
            console.error('Error cancelling session:', error);
            throw error;
        }
    }

    // Reschedule session
    async rescheduleSession(sessionId, userId, newScheduledAt, reason = '') {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            if (session.status !== 'upcoming') {
                throw new Error('Only upcoming sessions can be rescheduled');
            }

            // Check for conflicts
            const conflictCheck = await db.get(
                `SELECT id FROM mentoring_sessions 
                 WHERE (mentorId = ? OR menteeId = ?) 
                 AND status IN ('upcoming', 'in_progress')
                 AND datetime(scheduledAt) = datetime(?)
                 AND id != ?`,
                [session.mentorId, session.mentorId, newScheduledAt, sessionId]
            );

            if (conflictCheck) {
                throw new Error('Time slot is already occupied');
            }

            const now = new Date().toISOString();
            const scheduledAt = new Date(newScheduledAt).toISOString();
            
            await db.run(
                `UPDATE mentoring_sessions 
                 SET scheduledAt = ?, rescheduleReason = ?, updated_at = ? 
                 WHERE id = ?`,
                [scheduledAt, reason, now, sessionId]
            );

            return { 
                success: true, 
                session: { 
                    ...session, 
                    scheduledAt: scheduledAt,
                    rescheduleReason: reason 
                } 
            };
        } catch (error) {
            console.error('Error rescheduling session:', error);
            throw error;
        }
    }

    // Get session notes
    async getSessionNotes(sessionId, userId) {
        try {
            const session = await db.get(
                'SELECT notes, summary FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            return {
                notes: session.notes || '',
                summary: session.summary || ''
            };
        } catch (error) {
            console.error('Error fetching session notes:', error);
            throw error;
        }
    }

    // Update session notes
    async updateSessionNotes(sessionId, userId, notes, summary = '') {
        try {
            const session = await db.get(
                'SELECT * FROM mentoring_sessions WHERE id = ? AND (mentorId = ? OR menteeId = ?)',
                [sessionId, userId, userId]
            );

            if (!session) {
                throw new Error('Session not found or access denied');
            }

            const now = new Date().toISOString();
            
            await db.run(
                'UPDATE mentoring_sessions SET notes = ?, summary = ?, updated_at = ? WHERE id = ?',
                [notes, summary, now, sessionId]
            );

            return { success: true, notes, summary };
        } catch (error) {
            console.error('Error updating session notes:', error);
            throw error;
        }
    }

    // Get upcoming sessions for user
    async getUpcomingSessions(userId, limit = 5) {
        try {
            return await db.all(
                `SELECT s.*, 
                        CASE WHEN s.mentorId = ? THEN 
                            mentee.firstName || ' ' || mentee.lastName
                        ELSE 
                            mentor.firstName || ' ' || mentor.lastName
                        END as otherPartyName,
                        CASE WHEN s.mentorId = ? THEN 
                            mentee.avatar
                        ELSE 
                            mentor.avatar
                        END as otherPartyAvatar
                 FROM mentoring_sessions s
                 JOIN users mentor ON s.mentorId = mentor.id
                 JOIN users mentee ON s.menteeId = mentee.id
                 WHERE (s.mentorId = ? OR s.menteeId = ?) 
                 AND s.status = 'upcoming' 
                 AND s.scheduledAt > datetime('now')
                 ORDER BY s.scheduledAt ASC
                 LIMIT ?`,
                [userId, userId, userId, userId, limit]
            );
        } catch (error) {
            console.error('Error fetching upcoming sessions:', error);
            return [];
        }
    }

    // Get session history with filters
    async getSessionHistory(userId, options = {}) {
        try {
            const { 
                status, 
                dateFrom, 
                dateTo, 
                otherPartyId,
                page = 1, 
                limit = 20 
            } = options;
            
            const offset = (page - 1) * limit;

            let sql = `
                SELECT s.*, 
                       mentor.firstName as mentorFirstName, mentor.lastName as mentorLastName,
                       mentor.avatar as mentorAvatar,
                       mentee.firstName as menteeFirstName, mentee.lastName as menteeLastName,
                       mentee.avatar as menteeAvatar
                FROM mentoring_sessions s
                JOIN users mentor ON s.mentorId = mentor.id
                JOIN users mentee ON s.menteeId = mentee.id
                WHERE (s.mentorId = ? OR s.menteeId = ?)
            `;
            
            const params = [userId, userId];

            if (status && status.length > 0) {
                const statusPlaceholders = status.map(() => '?').join(',');
                sql += ` AND s.status IN (${statusPlaceholders})`;
                params.push(...status);
            }

            if (otherPartyId) {
                sql += ' AND (s.mentorId = ? OR s.menteeId = ?)';
                params.push(otherPartyId, otherPartyId);
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

            const sessions = await db.all(sql, params);

            return sessions.map(session => ({
                ...session,
                mentor: {
                    id: session.mentorId,
                    name: `${session.mentorFirstName} ${session.mentorLastName}`,
                    avatar: session.mentorAvatar
                },
                mentee: {
                    id: session.menteeId,
                    name: `${session.menteeFirstName} ${session.menteeLastName}`,
                    avatar: session.menteeAvatar
                },
                isUserMentor: session.mentorId === userId
            }));
        } catch (error) {
            console.error('Error fetching session history:', error);
            throw new Error('Failed to fetch session history');
        }
    }

    // Get session statistics
    async getSessionStats(userId, period = 'month') {
        try {
            let dateFilter = '';
            switch (period) {
                case 'week':
                    dateFilter = "datetime('now', '-7 days')";
                    break;
                case 'month':
                    dateFilter = "datetime('now', '-30 days')";
                    break;
                case 'year':
                    dateFilter = "datetime('now', '-1 year')";
                    break;
                default:
                    dateFilter = "datetime('now', '-30 days')";
            }

            const stats = await db.get(
                `SELECT 
                    COUNT(*) as totalSessions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedSessions,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledSessions,
                    COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcomingSessions,
                    AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avgDuration,
                    SUM(CASE WHEN status = 'completed' THEN duration ELSE 0 END) as totalDuration
                 FROM mentoring_sessions 
                 WHERE (mentorId = ? OR menteeId = ?) 
                 AND scheduledAt >= ${dateFilter}`,
                [userId, userId]
            );

            return {
                ...stats,
                totalDuration: Math.round((stats.totalDuration || 0) / 60), // Convert to hours
                avgDuration: Math.round((stats.avgDuration || 0)), // Keep in minutes
                completionRate: stats.totalSessions > 0 ? 
                    ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Error fetching session stats:', error);
            return {
                totalSessions: 0,
                completedSessions: 0,
                cancelledSessions: 0,
                upcomingSessions: 0,
                totalDuration: 0,
                avgDuration: 0,
                completionRate: 0
            };
        }
    }

    // Check session availability
    async checkAvailability(userId, scheduledAt, duration = 60, excludeSessionId = null) {
        try {
            const startTime = new Date(scheduledAt);
            const endTime = new Date(startTime.getTime() + (duration * 60000)); // Convert minutes to ms

            let sql = `
                SELECT COUNT(*) as conflicts 
                FROM mentoring_sessions 
                WHERE (mentorId = ? OR menteeId = ?) 
                AND status IN ('upcoming', 'in_progress')
                AND (
                    (datetime(scheduledAt) BETWEEN datetime(?) AND datetime(?))
                    OR (datetime(scheduledAt, '+' || duration || ' minutes') BETWEEN datetime(?) AND datetime(?))
                    OR (datetime(?) BETWEEN datetime(scheduledAt) AND datetime(scheduledAt, '+' || duration || ' minutes'))
                    OR (datetime(?) BETWEEN datetime(scheduledAt) AND datetime(scheduledAt, '+' || duration || ' minutes'))
                )
            `;

            const params = [
                userId, userId,
                startTime.toISOString(), endTime.toISOString(),
                startTime.toISOString(), endTime.toISOString(),
                startTime.toISOString(), endTime.toISOString()
            ];

            if (excludeSessionId) {
                sql += ' AND id != ?';
                params.push(excludeSessionId);
            }

            const result = await db.get(sql, params);
            
            return {
                available: result.conflicts === 0,
                conflicts: result.conflicts
            };
        } catch (error) {
            console.error('Error checking availability:', error);
            return { available: false, conflicts: 0 };
        }
    }
}

module.exports = new SessionService();
