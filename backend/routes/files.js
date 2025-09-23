const express = require('express');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// General file upload
router.post('/upload', authenticateToken, (req, res, next) => {
  const handler = upload.single('file');
  handler(req, res, function(err) {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    return res.status(201).json({ success: true, data: { path: req.file.path.replace(/\\/g, '/') } });
  });
});

module.exports = router;

