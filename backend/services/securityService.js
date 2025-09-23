const db = require('./database');

class SecurityService {
  async logSecurityEvent(event) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO security_events (id, userId, type, description, ipAddress, userAgent, data, severity, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, event.userId || null, event.type, event.description || '', event.ip || '', event.userAgent || '', JSON.stringify(event.data||{}), event.severity || 'medium', now]
    );
    return { id };
  }

  async getUserSecurityEvents(userId, { page = 1, limit = 50, eventType, dateFrom, dateTo, severity } = {}) {
    const where = ['(userId = ? OR userId IS NULL)'];
    const params = [userId];
    if (eventType) { where.push('type = ?'); params.push(eventType); }
    if (severity) { where.push('severity = ?'); params.push(severity); }
    if (dateFrom) { where.push('createdAt >= ?'); params.push(dateFrom); }
    if (dateTo) { where.push('createdAt <= ?'); params.push(dateTo); }
    const offset = (page - 1) * limit;
    const rows = await db.all(`SELECT * FROM security_events WHERE ${where.join(' AND ')} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { data: rows, page, limit };
  }

  async getSecuritySummary(userId, period = '7d') {
    const since = period === '30d' ? "datetime('now','-30 days')" : period === '90d' ? "datetime('now','-90 days')" : "datetime('now','-7 days')";
    const row = await db.get(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 ELSE 0 END) as high
         FROM security_events
        WHERE (userId = ? OR userId IS NULL) AND datetime(createdAt) >= ${since}`,[userId]);
    return { total: row?.total || 0, high: row?.high || 0, period };
  }

  async reportIncident(payload) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO security_events (id, userId, type, description, ipAddress, userAgent, data, severity, createdAt)
       VALUES (?, ?, 'incident', ?, ?, ?, ?, ?, ?)`,
      [id, payload.userId || null, payload.title + ' - ' + payload.description, payload.ip || '', payload.userAgent || '', JSON.stringify({ category: payload.category }), payload.severity || 'medium', now]
    );
    return { id };
  }

  async verifySessionIntegrity(userId, { sessionId }) {
    // Minimal mock
    return { valid: !!sessionId };
  }

  async getActiveSessions(userId) {
    // Minimal mock
    return [];
  }

  async terminateSession(userId, sessionId) {
    // Minimal mock
    return { success: true };
  }

  async getSecurityRecommendations(userId) {
    // Minimal mock
    return [
      { id: 'rec1', title: 'Enable 2FA', description: 'Add a second factor to protect your account.' },
      { id: 'rec2', title: 'Use a strong password', description: 'Use at least 12 characters with symbols.' }
    ];
  }

  async enableTwoFactorAuth(userId, method = 'totp') {
    // Mock values
    return { qrCode: 'data:image/png;base64,', backupCodes: ['ABCD-1234','EFGH-5678'], secret: 'SECRET' };
  }

  async verifyTwoFactorAuth(userId, token, secret) {
    // Mock verify
    return { valid: true, backupCodes: ['IJKL-9012','MNOP-3456'] };
  }

  async disableTwoFactorAuth(userId, password, token) {
    // Mock disable
    return { success: true };
  }
}

module.exports = new SecurityService();
