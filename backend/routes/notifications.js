const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');

// Get user notifications
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
    try {
const userId = req.user.userId || req.user.id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const notifications = await notificationService.getUserNotifications(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true'
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get notification count
router.get('/count', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notificationService.getUnreadNotificationCount(userId);
        
        res.json({ count });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark notification as read
router.put('/:notificationId/read', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const result = await notificationService.markAsRead(userId, notificationId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await notificationService.markAllAsRead(userId);
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete notification
router.delete('/:notificationId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const result = await notificationService.deleteNotification(userId, notificationId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get notification preferences
router.get('/preferences', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await notificationService.getNotificationPreferences(userId);
        
        res.json(preferences);
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update notification preferences
router.put('/preferences', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;

        const updatedPreferences = await notificationService.updateNotificationPreferences(userId, preferences);
        res.json(updatedPreferences);
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send test notification (for testing purposes)
router.post('/test', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, message, type = 'info' } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        const notification = await notificationService.createNotification(userId, {
            title,
            message,
            type,
            data: { test: true }
        });

        res.json(notification);
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
