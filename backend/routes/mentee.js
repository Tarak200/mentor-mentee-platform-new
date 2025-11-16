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
    const { subject, language, minPrice, maxPrice, gender, page, limit } = req.query;

    const skillList = subject ? [subject] : [];
      // ✅ Normalize filters before passing to DB
    const normalizedGender = gender ? gender.trim().toLowerCase() : undefined;
    const normalizedLanguage = language ? language.trim().toLowerCase() : undefined;

    // ✅ Use default price bounds to avoid undefined issues
    const minPriceValue = minPrice ? Number(minPrice) : 0;
    const maxPriceValue = maxPrice ? Number(maxPrice) : 1e6; // effectively "no upper limit"

    const data = await menteeService.findMentors(req.user.userId || req.user.id, {
      skills: skillList,
      minRating: undefined,
      minPrice: minPriceValue,
      maxRate: maxPriceValue,
      gender: normalizedGender,
      language: normalizedLanguage,
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      subject : subject || undefined
    });

    const normalized = (Array.isArray(data) ? data : []).map(row => ({
      id: row.id || row.mentorId || row.userId,
      firstName: row.firstName ?? row.first_name ?? '',
      lastName: row.lastName ?? row.last_name ?? '',
      education: row.education ?? '',
      institution: row.institution ?? '',
      rating: Number(row.rating ?? row.averageRating ?? 0),
      profile_picture: row.profile_picture ?? row.avatar ?? 'backend/uploads/default.jpg',
      qualifications: row.qualifications ?? '',
      bio: row.bio ?? '',
      total_sessions: row.total_sessions ?? row.menteeCount ?? 0,
      current_pursuit: row.current_pursuit ?? '',
      languages: Array.isArray(row.languages)
        ? row.languages
        : typeof row.languages === 'string'
          ? row.languages.split(',').filter(Boolean)
          : [],
      subjects: Array.isArray(row.subjects)
        ? row.subjects
        : Array.isArray(row.skills)
          ? row.skills
          : typeof row.skills === 'string'
            ? row.skills.split(',').filter(Boolean)
            : [],
      available_hours: Array.isArray(row.available_hours)
        ? row.available_hours
        : typeof row.available_hours === 'string'
          ? row.available_hours.split(',').filter(Boolean)
          : [],
      hourlyRate: row.hourlyRate ?? row.hourly_rate ?? null
    }));

    res.json({ success: true, data: normalized });
  } catch (err) {
    console.error('Error in find-mentors:', err);
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
      limit: Number(limit)||20,
    });

    res.json({ success: true, data });
    // console.log("Sessions data:", data);
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
    console.log("Mentee ID:", menteeId);
    console.log("Request Body:", req.body);
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
          created_at: new Date().toISOString(),
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
