const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../services/database');

router.use(authenticateToken);

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { mentorId, sessionId, rating, comment = '' } = req.body || {};
    if (!mentorId || !rating) {
      return res.status(400).json({ success: false, message: 'mentorId and rating are required' });
    }
    const id = Date.now().toString();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO reviews (id, mentorId, menteeId, sessionId, rating, comment, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mentorId, req.user.userId || req.user.id, sessionId || null, Number(rating), String(comment).slice(0, 1000), now, now]
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Failed to create review' });
  }
});

// GET /api/reviews/by-mentor/:mentorId
router.get('/by-mentor/:mentorId', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT r.*, u.firstName, u.lastName
       FROM reviews r
       JOIN users u ON u.id = r.menteeId
       WHERE r.mentorId = ?
       ORDER BY r.createdAt DESC
       LIMIT 50`,
      [req.params.mentorId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch reviews' });
  }
});

module.exports = router;
