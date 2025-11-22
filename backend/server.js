const express = require('express');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
let port = Number(process.env.PORT) || 3000;

// Import middleware
const corsMiddleware = require('./middleware/cors');
const authMiddleware = require('./middleware/auth');
const sessionMiddleware = require('./middleware/session');

// Import routes
const authRoutes = require('./routes/auth');
const mentorRoutes = require('./routes/mentor');
const menteeRoutes = require('./routes/mentee');
const sessionRoutes = require('./routes/sessions');
const reviewRoutes = require('./routes/reviews');
const fileRoutes = require('./routes/files');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notifications');
const securityRoutes = require('./routes/security');

// Apply middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// setting X-Frame-Options header to DENY
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
});


// Setup Socket.IO and realtime
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
const { setupRealtime } = require('./realtime');
setupRealtime(io);
app.set('io', io);

// Configure static file serving with proper MIME types
app.use(express.static(path.join(__dirname, '..', 'frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

app.use(sessionMiddleware);

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/mentee', menteeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/security', securityRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'home', 'home.html'));
});

// Mentor routes
app.get('/mentor/login', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentor', 'login', 'mentor-login.html'));
});

// Mentee routes
app.get('/mentee/login', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'login', 'mentee-login.html'));
});

// Registration pages
app.get('/mentor/register', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentor', 'register', 'register.html'));
});     
// app.get('/mentee/register', (req, res) => {
//     res.setHeader('Content-Type', 'text/html');
//     res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'register', 'menregister.html'));
// });

app.get('/mentee/login', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'login', 'mentee-login.html'));
});

// Forgot Password pages
app.get('/mentor/forgot-password', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentor', 'forgot-password', 'forgot-password.html'));
});

app.get('/mentee/forgot-password', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'forgot-password', 'forgot-password.html'));
});

// Reset Password pages
app.get('/mentor/reset-password', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentor', 'reset-password', 'reset-password.html'));
});

app.get('/mentee/reset-password', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'reset-password', 'reset-password.html'));
});

app.get('/mentor-dashboard', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentor', 'dashboard', 'mentor-dashboard.html'));
});

app.get('/mentee-dashboard', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'components', 'mentee', 'dashboard', 'mentee-dashboard.html'));
});

// Test page for debugging connection requests and popup
app.get('/test-popup', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'test-popup.html'));
});

// Platform configuration endpoint
app.get('/api/platform-config', (req, res) => {
    res.json({
        commissionPercentage: 10,
        upiId: 'platform@upi'
    });
});

// Profile picture upload endpoint (basic stub)
app.post('/api/upload-profile-pic', sessionMiddleware, (req, res) => {
    // This is a basic stub - in a real app you'd handle file upload properly
    res.json({
        success: true,
        profilePicture: '/uploads/default-avatar.png',
        message: 'Profile picture updated successfully'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

function startServer(desiredPort, maxAttempts = 10) {
    let attempts = 0;
    function tryListen(p) {
        server.listen(p, () => {
            console.log(`Server running on port ${p}`);
            console.log(`Access the application at http://localhost:${p}`);
        });
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE' && attempts < maxAttempts) {
                attempts += 1;
                const nextPort = p + 1;
                console.warn(`Port ${p} in use, trying ${nextPort}...`);
                tryListen(nextPort);
            } else {
                console.error('Failed to start server:', err);
                process.exitCode = 1;
            }
        });
    }
    tryListen(desiredPort);
}

startServer(port);

module.exports = app;
