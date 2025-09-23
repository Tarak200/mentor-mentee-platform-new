const db = require('./database');

class NotificationService {
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const offset = (page - 1) * limit;
    const where = ['userId = ?'];
    const params = [userId];
    if (unreadOnly) { where.push('isRead = 0'); }
    const rows = await db.all(
      `SELECT * FROM notifications WHERE ${where.join(' AND ')} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const countRow = await db.get(`SELECT COUNT(*) as count FROM notifications WHERE ${where.join(' AND ')}`, params);
    return { data: rows, page, limit, total: countRow?.count || 0 };
  }

  async getUnreadNotificationCount(userId) {
    const row = await db.get('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0', [userId]);
    return row?.count || 0;
  }

  async markAsRead(userId, notificationId) {
    const result = await db.run('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [notificationId, userId]);
    return { success: result.changes > 0, message: result.changes ? 'OK' : 'Not found' };
  }

  async markAllAsRead(userId) {
    await db.run('UPDATE notifications SET isRead = 1 WHERE userId = ?', [userId]);
  }

  async deleteNotification(userId, notificationId) {
    const result = await db.run('DELETE FROM notifications WHERE id = ? AND userId = ?', [notificationId, userId]);
    return { success: result.changes > 0, message: result.changes ? 'OK' : 'Not found' };
  }

  async getNotificationPreferences(userId) {
    const user = await db.get('SELECT settings FROM users WHERE id = ?', [userId]);
    const settings = user?.settings ? JSON.parse(user.settings) : {};
    return settings.notificationPreferences || { email: true, push: true };
  }

  async updateNotificationPreferences(userId, preferences) {
    const user = await db.get('SELECT settings FROM users WHERE id = ?', [userId]);
    const settings = user?.settings ? JSON.parse(user.settings) : {};
    settings.notificationPreferences = { ...(settings.notificationPreferences || {}), ...(preferences || {}) };
    await db.run('UPDATE users SET settings = ?, updatedAt = ? WHERE id = ?', [JSON.stringify(settings), new Date().toISOString(), userId]);
    return settings.notificationPreferences;
  }

  async createNotification(userId, { title, message, type = 'info', data = {} }) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO notifications (id, userId, type, title, message, data, isRead, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, type, title, message, JSON.stringify(data || {}), now]
    );
    return { id, userId, title, message, type, data, isRead: 0, createdAt: now };
  }
}

module.exports = new NotificationService();
