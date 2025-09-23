const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sessionService = require('../services/sessionService');

router.use(authenticateToken);

// GET /api/sessions/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const data = await sessionService.getUpcomingSessions(req.user.userId || req.user.id, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch upcoming sessions' });
  }
});

// GET /api/sessions/history
router.get('/history', async (req, res) => {
  try {
    const { status, dateFrom, dateTo, otherPartyId, page, limit } = req.query;
    const data = await sessionService.getSessionHistory(req.user.userId || req.user.id, {
      status: status ? (Array.isArray(status) ? status : [status]) : undefined,
      dateFrom,
      dateTo,
      otherPartyId,
      page: Number(page)||1,
      limit: Number(limit)||20
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch session history' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await sessionService.getSessionById(req.params.id, req.user.userId || req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message || 'Session not found' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', async (req, res) => {
  try {
    const result = await sessionService.updateSession(req.params.id, req.user.userId || req.user.id, req.body || {});
    res.json({ success: true, data: result.session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Failed to update session' });
  }
});

// POST /api/sessions/:id/start
router.post('/:id/start', async (req, res) => {
  try {
    const result = await sessionService.startSession(req.params.id, req.user.userId || req.user.id);
    res.json({ success: true, data: result.session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Cannot start session' });
  }
});

// POST /api/sessions/:id/end
router.post('/:id/end', async (req, res) => {
  try {
    const result = await sessionService.endSession(req.params.id, req.user.userId || req.user.id, req.body || {});
    res.json({ success: true, data: result.session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Cannot end session' });
  }
});

// PUT /api/sessions/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const reason = req.body?.reason || '';
    const result = await sessionService.cancelSession(req.params.id, req.user.userId || req.user.id, reason);
    res.json({ success: true, data: result.session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Cannot cancel session' });
  }
});

module.exports = router;

