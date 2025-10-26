const express = require('express');
const router = express.Router();
const mentorService = require('../services/mentorService');
const authMiddleware = require('../middleware/auth');

// Middleware to ensure user is a mentor
const requireMentor = (req, res, next) => {
    if ((req.user.role || req.user.userType) !== 'mentor') {
        return res.status(403).json({ error: 'Access denied. Mentor account required.' });
    }
    next();
};

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

// GET /api/mentor/:mentorId
router.get('/:mentorId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { mentorId } = req.params;
    console.log("backend function called");

    // You can fetch mentor details from DB using a service or model
    const mentor = await mentorService.getMentorDetails(mentorId);

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


// Get mentor's sessions
router.get('/sessions', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { status, menteeId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

        const sessions = await mentorService.getSessions(mentorId, {
            status,
            menteeId,
            dateFrom,
            dateTo,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new session
router.post('/sessions', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
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

// Get earnings data
router.get('/earnings', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { period = 'month', year, month } = req.query;

        const earnings = await mentorService.getEarnings(mentorId, {
            period,
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined
        });

        res.json(earnings);
    } catch (error) {
        console.error('Error fetching earnings:', error);
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
        const requests = await mentorService.getPendingRequests(mentorId);
        
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
    try {
        const mentorId = req.user.id;
        const { requestId } = req.params;
        const { meetingTime, meetingLink } = req.body || {};

        // Lookup menteeId for realtime notification
        const db = require('../services/database');
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

// Decline mentoring request
router.post('/requests/:requestId/decline', authMiddleware.authenticateToken, requireMentor, async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { requestId } = req.params;
        const { reason } = req.body;

        const db = require('../services/database');
        const reqRow = await db.get('SELECT menteeId, mentorId, status FROM mentoring_requests WHERE id = ? AND mentorId = ?', [requestId, mentorId]);
        if (!reqRow) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (reqRow.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be declined' });
        }

        await db.run('UPDATE mentoring_requests SET status = "declined", updatedAt = ? WHERE id = ?', [new Date().toISOString(), requestId]);

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
