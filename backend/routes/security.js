const express = require('express');
const router = express.Router();
const securityService = require('../services/securityService');
const authMiddleware = require('../middleware/auth');

// Log security event
router.post('/log', authMiddleware.authenticateToken, async (req, res) => {
    try {
const userId = req.user.userId || req.user.id;
        const securityEvent = {
            ...req.body,
            userId,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        // Validate required fields
        if (!securityEvent.type) {
            return res.status(400).json({ error: 'Event type is required' });
        }

        const logEntry = await securityService.logSecurityEvent(securityEvent);
        res.status(201).json({ 
            message: 'Security event logged', 
            id: logEntry.id 
        });
    } catch (error) {
        console.error('Error logging security event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get security events for user (limited to their own events)
router.get('/events', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 50, 
            eventType, 
            dateFrom, 
            dateTo,
            severity 
        } = req.query;

        const events = await securityService.getUserSecurityEvents(userId, {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100), // Max 100 per request
            eventType,
            dateFrom,
            dateTo,
            severity
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching security events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get security summary for user
router.get('/summary', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '7d' } = req.query; // 7d, 30d, 90d

        const summary = await securityService.getSecuritySummary(userId, period);
        res.json(summary);
    } catch (error) {
        console.error('Error fetching security summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Report security incident
router.post('/incident', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            title, 
            description, 
            severity = 'medium',
            category = 'general'
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ 
                error: 'Title and description are required' 
            });
        }

        const incident = await securityService.reportIncident({
            userId,
            title,
            description,
            severity,
            category,
            reportedAt: new Date(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            message: 'Security incident reported successfully',
            incidentId: incident.id
        });
    } catch (error) {
        console.error('Error reporting security incident:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify session integrity
router.post('/verify-session', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = req.get('X-Session-ID');
        const userAgent = req.get('User-Agent');

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID required' });
        }

        const isValid = await securityService.verifySessionIntegrity(userId, {
            sessionId,
            userAgent,
            ip: req.ip || req.connection.remoteAddress
        });

        if (!isValid.valid) {
            return res.status(401).json({ 
                error: 'Session integrity check failed',
                reason: isValid.reason 
            });
        }

        res.json({ 
            valid: true,
            message: 'Session verified successfully' 
        });
    } catch (error) {
        console.error('Error verifying session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get active sessions
router.get('/sessions', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await securityService.getActiveSessions(userId);
        
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Terminate session
router.delete('/sessions/:sessionId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const result = await securityService.terminateSession(userId, sessionId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        res.json({ message: 'Session terminated successfully' });
    } catch (error) {
        console.error('Error terminating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get security recommendations
router.get('/recommendations', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendations = await securityService.getSecurityRecommendations(userId);
        
        res.json(recommendations);
    } catch (error) {
        console.error('Error fetching security recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enable two-factor authentication
router.post('/2fa/enable', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { method = 'totp' } = req.body;

        const result = await securityService.enableTwoFactorAuth(userId, method);
        
        res.json({
            message: '2FA setup initiated',
            qrCode: result.qrCode,
            backupCodes: result.backupCodes,
            secret: result.secret
        });
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify and confirm two-factor authentication
router.post('/2fa/verify', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, secret } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token required' });
        }

        const result = await securityService.verifyTwoFactorAuth(userId, token, secret);
        
        if (!result.valid) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        res.json({ 
            message: '2FA enabled successfully',
            backupCodes: result.backupCodes
        });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Disable two-factor authentication
router.post('/2fa/disable', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, token } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required to disable 2FA' });
        }

        const result = await securityService.disableTwoFactorAuth(userId, password, token);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
