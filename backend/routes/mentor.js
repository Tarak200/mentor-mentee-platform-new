const express = require('express');
const router = express.Router();
const mentorService = require('../services/mentorService');
const authMiddleware = require('../middleware/auth');
const db = require('../services/database');

// Middleware to ensure user is a mentor
const requireMentor = (req, res, next) => {
    if ((req.user.role || req.user.userType) !== 'mentor') {
        return res.status(403).json({ error: 'Access denied. Mentor account required.' });
    }
    next();
};


// Fetch all mentors
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const mentors = await mentorService.getAllMentors(); // returns array of mentor objects
        // console.log('Number of mentors fetched:', mentors.length);
        res.json(mentors);
        // console.log('Fetched mentors:', mentors);
    } catch (err) {
        console.error('Error fetching mentors:', err);
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
});

// Get mentor dashboard stats
router.get('/stats', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
const mentorId = req.user.userId || req.user.id;
        const stats = await mentorService.getDashboardStats(mentorId);
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching mentor stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentor's mentees
router.get('/mentees', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { status, search, page = 1, limit = 10 } = req.query;

        const mentees = await mentorService.getMentees(mentorId, {
            status,
            search,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific mentee details
router.get('/mentees/:menteeId', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { menteeId } = req.params;
        const mentee = await mentorService.getMenteeDetails(mentorId, menteeId);
        
        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }

        res.json(mentee);
    } catch (error) {
        console.error('Error fetching mentee details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentor's sessions
router.get('/sessions', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    // console.log("sessions api is triggered")
    try {
        // console.log("request user:", req.user);
        const mentorId = req.user.userId;
        // console.log("mentorId:", mentorId);
        const { status, menteeId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

        const sessions = await mentorService.getSessions(mentorId, {
            status,
            menteeId,
            dateFrom,
            dateTo,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        // console.log("sessions fetched:", sessions)
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get earnings data
router.get('/earnings', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {

        const mentorId = req.user.userId;
        const { period = 'month', year, month } = req.query;

        const earnings = await mentorService.getEarnings(mentorId, {
            period,
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined
        });

        res.json(earnings);
        // console.log("Earnings data sent:", earnings);
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update mentor profile
router.put('/profile/update', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.userId;
        const { 
            name, 
            phone, 
            skills, 
            bio, 
            availableHours, 
            hourlyRate, 
            education, 
            institution, 
            languages, 
            subjects 
        } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ 
                error: 'Name is required' 
            });
        }

        const updatedProfile = await mentorService.updateProfile(mentorId, {
            name,
            phone,
            skills,
            bio,
            availableHours,
            hourlyRate,
            education,
            institution,
            languages,
            subjects
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating mentor profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /api/mentor/:mentorId
router.get('/:mentorId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { mentorId } = req.params;
    // console.log("backend function called");

    // You can fetch mentor details from DB using a service or model
    const mentor = await mentorService.getMentorDetails(mentorId);
    // console.log("Mentor details:", mentor);

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Respond in a format expected by frontend
    res.json({
      success: true,
      mentor
    });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new session
router.post('/sessions', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    // console.log("sessions api is triggered")
    try {
        const mentorId = req.user.id;
        const sessionData = {
            ...req.body,
            mentorId
        };

        // Validate required fields
        const requiredFields = ['menteeId', 'title', 'date', 'time', 'duration'];
        const missingFields = requiredFields.filter(field => !sessionData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        const session = await mentorService.createSession(sessionData);
        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        if (error.message.includes('conflict') || error.message.includes('already scheduled')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update session
router.put('/sessions/:sessionId', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { sessionId } = req.params;
        const updateData = req.body;

        const session = await mentorService.updateSession(mentorId, sessionId, updateData);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cancel session
router.delete('/sessions/:sessionId', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { sessionId } = req.params;
        const { reason } = req.body;

        const result = await mentorService.cancelSession(mentorId, sessionId, reason);
        
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        res.json({ message: 'Session cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentor's schedule
router.get('/schedule', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { date, week, month } = req.query;

        const schedule = await mentorService.getSchedule(mentorId, {
            date,
            week,
            month
        });

        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get today's schedule
router.get('/schedule/today', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const todaySchedule = await mentorService.getTodaySchedule(mentorId);
        
        res.json(todaySchedule);
    } catch (error) {
        console.error('Error fetching today\'s schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update availability
router.put('/availability', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const availabilityData = req.body;

        const availability = await mentorService.updateAvailability(mentorId, availabilityData);
        res.json(availability);
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent activity
router.get('/activity', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { limit = 10 } = req.query;

        const activities = await mentorService.getRecentActivity(mentorId, parseInt(limit));
        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pending requests
router.get('/requests/pending', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.userId || req.user.id;
        // console.log('Fetching pending requests for mentorId:', mentorId);
        const requests = await mentorService.getPendingRequests(mentorId);
        // console.log('Pending requests fetched:', requests);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Helper to create a pseudo Google Meet link
function generateMeetLink() {
    const alph = 'abcdefghijklmnopqrstuvwxyz';
    function part(n){ return Array.from({length:n},()=>alph[Math.floor(Math.random()*alph.length)]).join(''); }
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

// Accept mentoring request
router.post('/requests/:requestId/accept', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    console.log("Accept request API is called");
    try {
        const mentorId = req.user.userId;
        const { requestId } = req.params;
        const { meetingTime, meetingLink } = req.body || {};

        // Lookup menteeId for realtime notification
        const reqRow = await db.get('SELECT menteeId, mentorId FROM mentoring_requests WHERE id = ?', [requestId]);

        const result = await mentorService.acceptRequest(mentorId, requestId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        // Realtime notify mentee immediately and schedule meeting
        try {
            const io = req.app.get('io');
            if (io && reqRow && reqRow.menteeId) {
                const { notifyUser } = require('../realtime');
                notifyUser(io, reqRow.menteeId, 'request:decision', {
                    requestId,
                    status: 'accepted',
                    mentorId,
                    decidedAt: new Date().toISOString(),
                });

                // Schedule a meeting start event at provided time or 5 minutes later
                const when = meetingTime ? new Date(meetingTime) : new Date(Date.now() + 5 * 60 * 1000);
                const link = meetingLink || generateMeetLink();
                const menteeId = reqRow.menteeId;
                const delay = Math.max(0, when.getTime() - Date.now());

                setTimeout(() => {
                    try {
                        const payload = {
                            requestId,
                            mentorId,
                            menteeId,
                            scheduledAt: when.toISOString(),
                            meetLink: link
                        };
                        notifyUser(io, mentorId, 'meeting:start', payload);
                        notifyUser(io, menteeId, 'meeting:start', payload);
                    } catch (e) {
                        console.warn('Failed to emit meeting:start:', e.message);
                    }
                }, delay);
            }
        } catch (e) {
            console.warn('Realtime emit failed on accept:', e.message);
        }

        res.json({ message: 'Request accepted successfully', relationship: result.relationship, meetingScheduledAt: meetingTime || null });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentoring request with mentee details
router.get('/mentoring-requests/:requestId', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const query = `
            SELECT 
                mr.id as requestId,
                mr.message,
                mr.goals,
                mr.status,
                mr.preferredSchedule,
                mr.created_at,
                u.firstName,
                u.lastName,
                u.avatar,
                u.email,
                u.bio,
                u.skills
            FROM mentoring_requests mr
            INNER JOIN users u ON mr.menteeId = u.id
            WHERE mr.id = ?
        `;
        
        const row = await db.get(query, [requestId]);
        
        if (!row) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json(row);
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Decline mentoring request
router.post('/requests/:requestId/decline', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        // console.log("request :", req);
        const mentorId = req.user.id || req.user.userId;
        // console.log("mentorId:", mentorId);
        const { requestId } = req.params;
        const { reason } = req.body;
        const reqRow = await db.get('SELECT menteeId, mentorId, status FROM mentoring_requests WHERE id = ? AND mentorId = ?', [requestId, mentorId]);
        if (!reqRow) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (reqRow.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be declined' });
        }

        await db.run('UPDATE mentoring_requests SET status = "declined", updated_at = ? WHERE id = ?', [new Date().toISOString(), requestId]);

        // Realtime notify mentee immediately
        try {
            const io = req.app.get('io');
            if (io && reqRow.menteeId) {
                const { notifyUser } = require('../realtime');
                notifyUser(io, reqRow.menteeId, 'request:decision', {
                    requestId,
                    status: 'declined',
                    mentorId,
                    reason: reason || null,
                    decidedAt: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.warn('Realtime emit failed on decline:', e.message);
        }

        res.json({ message: 'Request declined successfully' });
    } catch (error) {
        console.error('Error declining request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Decline connection request
// POST /api/mentor/connection-requests/:id/status
router.post('/connection-requests/:id/status', authMiddleware.authenticateToken, requireMentor, async (req, res) => {

    try {
        const requestId = req.params.id;
        const reason = req.body.body.reason || req.body.body.meetingMessage; 
        const status = req.body.body.status;
        
        
        if (!reason || !reason.trim()) {
            console.warn('missing reason');
            return res.status(400).json({ error: 'reason is required' });
        }
        
        // Fetch mentor and mentee IDs from mentoring_requests
        const getPairSql = `SELECT mentorId, menteeId, preferredSchedule, message FROM mentoring_requests WHERE id = ? LIMIT 1`;
        const row = await db.get(getPairSql, [requestId]);
        
        if (!row) {
            console.warn('mentoring request not found', { requestId });
            return res.status(404).json({ error: 'Mentoring request not found' });
        }
        
        const { mentorId, menteeId, preferredSchedule, message } = row; // FIX: Removed status, mentorTime, meetingLink, mentorMessage from destructuring
        const mentorTime = req.body.body.mentorTime; // FIX: Get from request body
        const meetingLink = req.body.body.meeting_link; // FIX: Get from request body
        const mentorMessage = req.body.body.mentorMessage; // FIX: Get from request body
        
        
        // Try to update existing connection_request
        const updateSql = `
            UPDATE connection_requests
            SET mentor_id = ?, 
                mentee_id = ?, 
                mentee_message = ?, 
                mentee_preferred_time = ?, 
                meeting_datetime = ?,
                meeting_link = ?,
                mentor_message = ?,
                status = ?,
                reason = ?, 
                responded_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const updateResult = await db.run(updateSql, [
            mentorId, 
            menteeId, 
            message || null, 
            preferredSchedule || null, 
            mentorTime || null,
            meetingLink || null,
            mentorMessage || null,
            status,
            reason.trim(), 
            requestId,
        ]);
        
        // If no rows were updated, insert a new record
        if (updateResult.changes === 0) {
            const insertSql = `
                INSERT INTO connection_requests
                    (id, mentor_id, mentee_id, mentee_message, mentee_preferred_time, meeting_datetime, meeting_link,
                    mentor_message, status, reason, responded_at, updated_at, created_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`; // FIX: Fixed SQL syntax
            
            await db.run(insertSql, [
                requestId, 
                mentorId, 
                menteeId, 
                message || null, 
                preferredSchedule || null,
                mentorTime || null,
                meetingLink || null,
                mentorMessage || null, 
                status,
                reason.trim()
            ]);
            console.log('inserted row id', requestId);
            return res.json({ success: true, created: true });
        } else {
            console.log('updated row id', requestId);
            return res.json({ success: true, updated: true });
        }
        
    } catch (error) {
        console.error('error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentor reviews/ratings
router.get('/reviews', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await mentorService.getReviews(mentorId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update mentor pricing
router.put('/pricing', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { hourlyRate } = req.body;

        if (!hourlyRate || hourlyRate < 10) {
            return res.status(400).json({ error: 'Hourly rate must be at least $10' });
        }

        const result = await mentorService.updatePricing(mentorId, { hourlyRate });
        res.json(result);
    } catch (error) {
        console.error('Error updating pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get mentor performance metrics
router.get('/metrics', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { period = '6months' } = req.query;

        const metrics = await mentorService.getPerformanceMetrics(mentorId, period);
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
