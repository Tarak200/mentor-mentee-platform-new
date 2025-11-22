// utils/notificationHelper.js
const { v4: uuidv4 } = require('uuid');
const pool = require('../services/database');

/**
 * Create and send a notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {string} type - Notification type (info, success, warning, error, message, session, payment)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data (optional)
 * @param {object} io - Socket.IO instance for real-time delivery
 */
async function createNotification(userId, type, title, message, data = {}, io = null) {
    try {
        const notificationId = uuidv4();
        const createdAt = new Date().toISOString();
        
        const result = await pool.query(
            `INSERT INTO notifications (id, userId, type, title, message, data, isRead, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                notificationId,
                userId,
                type,
                title,
                message,
                JSON.stringify(data),
                0,
                createdAt
            ]
        );
        
        const notification = result.rows[0];
        
        // Send real-time notification via Socket.IO if available
        if (io) {
            io.to(userId).emit('new-notification', notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

module.exports = { createNotification };
