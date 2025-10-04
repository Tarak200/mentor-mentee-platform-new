const jwt = require('jsonwebtoken');

// Setup realtime socket.io handlers
function setupRealtime(io) {
  // Authenticate sockets and place them in user-specific rooms
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Auth token required'));
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(new Error('Invalid token'));
        socket.user = user;
        return next();
      });
    } catch (e) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    try {
      const userId = socket.user && (socket.user.userId || socket.user.id || socket.user.user_id || socket.user.uid);
      const role = socket.user && (socket.user.role || socket.user.userType);
      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (role) {
        socket.join(`role:${role}`);
      }

      // Relay meeting chat messages between users
      socket.on('meeting:message', (payload = {}) => {
        try {
          const toUserId = payload.toUserId;
          const msg = {
            fromUserId: userId,
            text: payload.text || '',
            link: payload.link || null,
            at: new Date().toISOString()
          };
          if (toUserId) {
            notifyUser(io, toUserId, 'meeting:message', msg);
          }
        } catch (e) {
          // ignore
        }
      });

      socket.on('disconnect', () => {
        // No-op for now; rooms are managed automatically by socket.io
      });
    } catch (_) {
      // swallow
    }
  });
}

// Helper to notify a specific user by id
function notifyUser(io, userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = {
  setupRealtime,
  notifyUser,
};