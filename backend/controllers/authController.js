const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/database');
const emailService = require('../services/emailService');
const { validateEmail, validatePassword, sanitizeInput } = require('../utils/validation');
const { generateId } = require('../utils/helpers');

class AuthController {
    // User registration
    async register(req, res) {
        console.log("Register request body:", req.body); 
        try {
            const { firstName, lastName, email, password, role, age, bio, gender, mobile, education, institution, currentPursuing, languages, availability, hourlyRate, upiId, profile_picture, avatar, skills, subjects } = req.body;

            // Validate input
            if (!firstName || !lastName || !email || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            if (!validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                });
            }

            if (!['mentor', 'mentee'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role'
                });
            }

            // Check if user exists
            const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const userId = generateId();
            const now = new Date().toISOString();
            
            await db.run(
                `INSERT INTO users (
                    id, firstName, lastName, email, password, role, 
                    isActive, emailVerified, settings, created_at, updated_at, age, bio, gender, phone, education, institution, current_pursuit, languages, available_hours, hourlyRate, upi_id, profile_picture, avatar, rating, qualifications, skills, subjects
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, 
                    sanitizeInput(firstName), 
                    sanitizeInput(lastName), 
                    email.toLowerCase(),
                    hashedPassword, 
                    role,
                    JSON.stringify({
                        emailNotifications: true,
                        pushNotifications: true,
                        theme: 'light'
                    }),
                    now, 
                    now,
                    age || null,
                    bio ? sanitizeInput(bio) : null,   
                    gender ? sanitizeInput(gender) : null,
                    mobile ? sanitizeInput(mobile) : null,
                    education ? sanitizeInput(education) : null,
                    institution ? sanitizeInput(institution) : null,
                    currentPursuing ? sanitizeInput(currentPursuing) : null,
                    languages ? JSON.stringify(languages) : null,
                    availability ? JSON.stringify(availability) : null,
                    hourlyRate || null,
                    upiId ? sanitizeInput(upiId) : null,
                    profile_picture ? sanitizeInput(profile_picture) : "/uploads/default.jpg",
                    avatar ? sanitizeInput(avatar) : "/uploads/default.jpg",
                    5.0,
                    bio ? sanitizeInput(bio) : null,
                    skills ? sanitizeInput(skills) : null,
                    subjects ? sanitizeInput(subjects) : null
                ]
            );

            // Generate JWT token
            const token = jwt.sign(
                { userId, email, role }, 
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail({
                    firstName: sanitizeInput(firstName),
                    email
                });
            } catch (emailError) {
                console.error('Welcome email failed:', emailError);
                // Don't fail registration if email fails
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    token,
                    user: {
                        id: userId,
                        firstName: sanitizeInput(firstName),
                        lastName: sanitizeInput(lastName),
                        email,
                        role,
                        isActive: true,
                        emailVerified: false
                    }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    }

    // User login
    async login(req, res) {
        try {
            const { email, password, rememberMe = false } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const user = await db.get(
                'SELECT * FROM users WHERE email = ? AND isActive = 1',
                [email.toLowerCase()]
            );

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            await db.run(
                'UPDATE users SET lastLogin = ? WHERE id = ?',
                [new Date().toISOString(), user.id]
            );

            const tokenExpiry = rememberMe ? '30d' : '7d';
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            const { password: _, ...userResponse } = user;

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        ...userResponse,
                        settings: JSON.parse(user.settings || '{}')
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed due to server error'
            });
        }
    }


    // User logout
    async logout(req, res) {
        try {
            // In a stateless JWT system, logout is handled client-side
            // Here we could implement token blacklisting if needed
            
            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }

    // Forgot password
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email || !validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid email is required'
                });
            }

            const user = await db.get(
                'SELECT * FROM users WHERE email = ? AND isActive = 1',
                [email.toLowerCase()]
            );

            if (!user) {
                // Don't reveal if user exists
                return res.json({
                    success: true,
                    message: 'If the email exists, you will receive password reset instructions'
                });
            }

            // Generate reset token
            const resetToken = generateId();
            const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

            // Store reset token
            await db.run(
                `INSERT INTO password_reset_tokens (id, userId, token, expiresAt, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [generateId(), user.id, resetToken, expiresAt, new Date().toISOString()]
            );

            // Send reset email
            try {
                await emailService.sendPasswordReset(user, resetToken);
            } catch (emailError) {
                console.error('Password reset email failed:', emailError);
            }

            res.json({
                success: true,
                message: 'If the email exists, you will receive password reset instructions'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset request failed'
            });
        }
    }

    // Reset password
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            if (!validatePassword(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                });
            }

            // Find valid token
            const resetRecord = await db.get(
                `SELECT * FROM password_reset_tokens 
                 WHERE token = ? AND used = 0 AND datetime(expiresAt) > datetime('now')`,
                [token]
            );

            if (!resetRecord) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            // Update password
            await db.run(
                'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
                [hashedPassword, new Date().toISOString(), resetRecord.userId]
            );

            // Mark token as used
            await db.run(
                'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
                [resetRecord.id]
            );

            res.json({
                success: true,
                message: 'Password reset successful'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset failed'
            });
        }
    }

    // Verify JWT token
    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await db.get(
                'SELECT id, firstName, lastName, email, role, isActive FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
}

module.exports = new AuthController();
