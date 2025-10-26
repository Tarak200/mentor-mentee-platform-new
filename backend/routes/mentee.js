const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const menteeService = require('../services/menteeService');

// All mentee routes require authentication and role mentee
router.use(authenticateToken, requireRole('mentee'));

// GET /api/mentee/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await menteeService.getDashboardStats(req.user.userId || req.user.id || req.user.user_id || req.user.uid);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch stats' });
  }
});

// GET /api/mentee/mentors
router.get('/mentors', async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const data = await menteeService.getMentors(req.user.userId || req.user.id, { status, search, page: Number(page)||1, limit: Number(limit)||12 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch mentors' });
  }
});

// GET /api/mentee/find-mentors
router.get('/find-mentors', async (req, res) => {
  try {
    const { search, skills, minRating, maxRate, page, limit } = req.query;
    const skillList = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    const data = await menteeService.findMentors(req.user.userId || req.user.id, {
      search,
      skills: skillList,
      minRating: minRating ? Number(minRating) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
      page: Number(page)||1,
      limit: Number(limit)||12
    });

    // Normalize fields to the snake_case the mentee dashboard expects,
    // while preserving original fields for compatibility.
    const normalized = (Array.isArray(data) ? data : []).map(m => {
      const firstName = m.firstName ?? m.first_name ?? '';
      const lastName = m.lastName ?? m.last_name ?? '';
      const avatar = m.avatar ?? m.profile_picture ?? null;
      const hourlyRate = (m.hourlyRate ?? m.hourly_rate ?? null);
      const rating = Number(m.averageRating ?? m.rating ?? 4);
      const totalSessions = m.menteeCount ?? m.total_sessions ?? 0;
      const languages = Array.isArray(m.languages) ? m.languages : [];
      const subjects = Array.isArray(m.skills) ? m.skills : (typeof m.skills === 'string' ? m.skills.split(',').filter(Boolean) : []);
      const availableHours = Array.isArray(m.available_hours) ? m.available_hours : [];

      return {
        ...m,
        first_name: firstName,
        last_name: lastName,
        profile_picture: avatar,
        hourly_rate: hourlyRate,
        rating,
        total_sessions: totalSessions,
        languages,
        subjects,
        available_hours: availableHours,
        education: m.education ?? '',
        institution: m.institution ?? '',
        current_pursuit: m.current_pursuit ?? ''
      };
    });

    res.json({ success: true, data: normalized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to search mentors' });
  }
});

// GET /api/mentee/sessions
router.get('/sessions', async (req, res) => {
  try {
    const { status, mentorId, dateFrom, dateTo, page, limit } = req.query;
    const data = await menteeService.getSessions(req.user.userId || req.user.id, {
      status, mentorId, dateFrom, dateTo,
      page: Number(page)||1,
      limit: Number(limit)||20
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch sessions' });
  }
});

// POST /api/mentee/sessions (book)
router.post('/sessions', async (req, res) => {
  try {
    const payload = { ...req.body, menteeId: req.user.userId || req.user.id };
    const data = await menteeService.bookSession(payload);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Failed to book session' });
  }
});

// GET /api/mentee/requests
router.get('/requests', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const data = await menteeService.getRequests(req.user.userId || req.user.id, { status, page: Number(page)||1, limit: Number(limit)||10 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch requests' });
  }
});

// POST /api/mentee/request
router.post('/request', async (req, res) => {
  try {
    const menteeId = req.user.userId || req.user.id;
    const payload = { ...req.body, menteeId };
    const data = await menteeService.requestMentoring(payload);

    console.log('Request saved:', data); // log saved data

    // Emit realtime event to the mentor
    try {
      const io = req.app.get('io');
      if (io) {
        const userService = require('../services/userService');
        const mentee = await userService.getUserProfile(menteeId);
        const eventPayload = {
          requestId: data.id,
          mentorId: req.body.mentorId,
          mentee: {
            id: menteeId,
            firstName: mentee?.firstName || mentee?.first_name,
            lastName: mentee?.lastName || mentee?.last_name,
            email: mentee?.email,
            avatar: mentee?.avatar || mentee?.profile_picture,
          },
          subject: req.body.subject || null,
          message: req.body.message || null,
          preferredTime: req.body.preferredTime || null,
          createdAt: new Date().toISOString(),
        };
        const { notifyUser } = require('../realtime');
        notifyUser(io, req.body.mentorId, 'request:new', eventPayload);
      }
    } catch (e) {
      // Non-fatal: logging only
      console.warn('Realtime emit failed on mentee request:', e.message);
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Failed to send request' });
  }
});

// GET /api/mentee/today-schedule
router.get('/today-schedule', async (req, res) => {
  try {
    const data = await menteeService.getTodaySchedule(req.user.userId || req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch schedule' });
  }
});

// GET /api/mentee/progress
router.get('/progress', async (req, res) => {
  try {
    const data = await menteeService.getLearningProgress(req.user.userId || req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch progress' });
  }
});

module.exports = router;
