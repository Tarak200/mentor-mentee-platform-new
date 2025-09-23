const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const twilio = require('twilio');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const db = new sqlite3.Database(process.env.DATABASE_PATH || './database/platform.db');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Platform Configuration
const PLATFORM_CONFIG = {
    UPI_ID: process.env.PLATFORM_UPI_ID || 'mentorplatform@paytm',
    COMMISSION_PERCENTAGE: process.env.PLATFORM_COMMISSION_PERCENTAGE || 10,
    PAYMENT_REQUIRED_MESSAGE: 'Payment is mandatory before session starts. Unpaid sessions will be cancelled.'
};

// Google Calendar Configuration
const googleAuth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/google/callback'
);

const calendar = google.calendar({ version: 'v3', auth: googleAuth });

// Twilio Configuration
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Google Meet Configuration
const GOOGLE_MEET_ENABLED = process.env.GOOGLE_MEET_ENABLED === 'true';
const SMS_NOTIFICATIONS_ENABLED = process.env.SMS_NOTIFICATIONS_ENABLED === 'true';

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        const user = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE google_id = ?", [profile.id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (user) {
            return done(null, user);
        } else {
            // Create new user
            const newUser = {
                google_id: profile.id,
                email: profile.emails[0].value,
                first_name: profile.name.givenName,
                last_name: profile.name.familyName,
                profile_picture: profile.photos[0].value
            };
            
            return done(null, newUser);
        }
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
        done(err, user);
    });
});

// Helper Functions
async function generateGoogleMeetLink(meetingTitle, description, startDateTime, endDateTime, attendeeEmails) {
    if (!GOOGLE_MEET_ENABLED) {
        return null;
    }

    try {
        const event = {
            summary: meetingTitle,
            description: description,
            start: {
                dateTime: startDateTime,
                timeZone: 'Asia/Kolkata'
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'Asia/Kolkata'
            },
            attendees: attendeeEmails.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    },
                    requestId: uuidv4()
                }
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        });

        return {
            meetingLink: response.data.conferenceData?.entryPoints?.[0]?.uri || null,
            eventId: response.data.id,
            eventLink: response.data.htmlLink
        };
    } catch (error) {
        console.error('Error creating Google Meet:', error);
        return null;
    }
}

async function sendSMSNotification(phoneNumber, message, userId, userType, notificationType = 'general') {
    if (!SMS_NOTIFICATIONS_ENABLED || !twilioClient) {
        console.log('SMS notifications disabled or not configured');
        return null;
    }

    try {
        const smsMessage = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        // Log notification in database
        db.run(`INSERT INTO notifications (user_id, user_type, type, title, message, mobile_number, sms_sid, sms_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
               [userId, userType, notificationType, 'Meeting Notification', message, phoneNumber, smsMessage.sid, smsMessage.status]);

        return smsMessage;
    } catch (error) {
        console.error('SMS sending failed:', error);
        return null;
    }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Platform Configuration API
app.get('/api/platform-config', (req, res) => {
    res.json({
        upiId: PLATFORM_CONFIG.UPI_ID,
        commissionPercentage: PLATFORM_CONFIG.COMMISSION_PERCENTAGE,
        paymentRequiredMessage: PLATFORM_CONFIG.PAYMENT_REQUIRED_MESSAGE
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/mentor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mentor-dashboard.html'));
});

app.get('/mentee-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mentee-dashboard.html'));
});

// Google OAuth routes
app.get('/auth/google', (req, res, next) => {
    const userType = req.query.userType || 'mentee';
    req.session.pendingUserType = userType;
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: userType
    })(req, res, next);
});

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
        try {
            const userType = req.session.pendingUserType || 'mentee';
            const googleUser = req.user;
            
            console.log('OAuth Debug - Selected userType:', userType);
            console.log('OAuth Debug - Google user email:', googleUser.emails[0].value);
            
            // Check if user exists based on selected type first
            let user = null;
            let actualUserType = userType;
            
            if (userType === 'mentor') {
                console.log('OAuth Debug - Checking mentors table first');
                // Check mentors table first for mentor login
                const existingMentor = await new Promise((resolve, reject) => {
                    db.get("SELECT * FROM mentors WHERE email = ? OR google_id = ?", 
                        [googleUser.emails[0].value, googleUser.id], 
                        (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        });
                });
                
                if (existingMentor) {
                    console.log('OAuth Debug - Found mentor record, logging in as mentor');
                    user = existingMentor;
                    actualUserType = 'mentor';
                } else {
                    console.log('OAuth Debug - No mentor record found');
                }
            } else {
                console.log('OAuth Debug - Checking mentees table first');
                // Check mentees table first for mentee login
                const existingMentee = await new Promise((resolve, reject) => {
                    db.get("SELECT * FROM mentees WHERE email = ? OR google_id = ?", 
                        [googleUser.emails[0].value, googleUser.id], 
                        (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        });
                });
                
                if (existingMentee) {
                    console.log('OAuth Debug - Found mentee record, logging in as mentee');
                    user = existingMentee;
                    actualUserType = 'mentee';
                } else {
                    console.log('OAuth Debug - No mentee record found');
                }
            }
            
            if (!user) {
                // Create new user based on selected type
                const userData = {
                    google_id: googleUser.id,
                    email: googleUser.emails[0].value,
                    first_name: googleUser.name.givenName,
                    last_name: googleUser.name.familyName,
                    profile_picture: googleUser.photos[0].value,
                    // Set some default values
                    age: null,
                    education: '',
                    institution: '',
                    gender: '',
                    languages: JSON.stringify(['English']),
                    current_pursuit: '',
                    mobile_number: '',
                    upi_id: '',
                    available_hours: JSON.stringify(['Morning (9-12 PM)', 'Evening (4-8 PM)']),
                    is_active: 1
                };
                
                if (userType === 'mentor') {
                    user = await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO mentors (
                            google_id, email, first_name, last_name, profile_picture, age, education, 
                            institution, gender, languages, current_pursuit, mobile_number, upi_id, 
                            available_hours, hourly_rate, qualifications, subjects, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [userData.google_id, userData.email, userData.first_name, userData.last_name,
                         userData.profile_picture, userData.age, userData.education, userData.institution,
                         userData.gender, userData.languages, userData.current_pursuit, userData.mobile_number,
                         userData.upi_id, userData.available_hours, 500, '', JSON.stringify(['General']), userData.is_active],
                        function(err) {
                            if (err) reject(err);
                            // Get the created user
                            db.get("SELECT * FROM mentors WHERE id = ?", [this.lastID], (err, row) => {
                                if (err) reject(err);
                                resolve(row);
                            });
                        });
                    });
                    actualUserType = 'mentor';
                } else {
                    user = await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO mentees (
                            google_id, email, first_name, last_name, profile_picture, age, education, 
                            institution, gender, languages, current_pursuit, mobile_number, upi_id, 
                            available_hours, interests, budget_min, budget_max, preferred_mentor_gender, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [userData.google_id, userData.email, userData.first_name, userData.last_name,
                         userData.profile_picture, userData.age, userData.education, userData.institution,
                         userData.gender, userData.languages, userData.current_pursuit, userData.mobile_number,
                         userData.upi_id, userData.available_hours, JSON.stringify(['General Learning']), 
                         null, null, '', userData.is_active],
                        function(err) {
                            if (err) reject(err);
                            // Get the created user
                            db.get("SELECT * FROM mentees WHERE id = ?", [this.lastID], (err, row) => {
                                if (err) reject(err);
                                resolve(row);
                            });
                        });
                    });
                    actualUserType = 'mentee';
                }
            }
            
            // Create JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, userType: actualUserType },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Set token in a way that frontend can access it
            res.cookie('authToken', token, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours
            
            // Redirect to appropriate dashboard
            console.log('OAuth Debug - Final actualUserType:', actualUserType);
            if (actualUserType === 'mentor') {
                console.log('OAuth Debug - Redirecting to mentor dashboard');
                res.redirect('/mentor-dashboard?token=' + encodeURIComponent(token));
            } else {
                console.log('OAuth Debug - Redirecting to mentee dashboard');
                res.redirect('/mentee-dashboard?token=' + encodeURIComponent(token));
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect('/login?error=oauth_processing_failed');
        }
    }
);

// Registration
app.post('/api/register', async (req, res) => {
    try {
        const {
            email, password, userType, firstName, lastName, age, education, 
            institution, gender, languages, currentPursuit, mobileNumber, 
            upiId, availableHours, hourlyRate, qualifications, subjects,
            interests, budgetMin, budgetMax, preferredMentorGender
        } = req.body;

        // Check if user already exists in either table
        const checkEmailQuery = userType === 'mentor' ? 
            "SELECT id FROM mentors WHERE email = ?" : 
            "SELECT id FROM mentees WHERE email = ?";
            
        db.get(checkEmailQuery, [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            if (userType === 'mentor') {
                // Insert mentor
                db.run(`INSERT INTO mentors (
                    email, password, first_name, last_name, age, education, 
                    institution, gender, languages, current_pursuit, mobile_number, 
                    upi_id, available_hours, hourly_rate, qualifications, subjects
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, firstName, lastName, age, education, 
                 institution, gender, JSON.stringify(languages), currentPursuit, 
                 mobileNumber, upiId, JSON.stringify(availableHours), hourlyRate, 
                 qualifications, JSON.stringify(subjects)],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error creating mentor' });
                    }
                    res.status(201).json({ message: 'Mentor registered successfully', userId: this.lastID });
                });
            } else {
                // Insert mentee
                db.run(`INSERT INTO mentees (
                    email, password, first_name, last_name, age, education, 
                    institution, gender, languages, current_pursuit, mobile_number, 
                    upi_id, available_hours, interests, budget_min, budget_max, preferred_mentor_gender
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, firstName, lastName, age, education, 
                 institution, gender, JSON.stringify(languages), currentPursuit, 
                 mobileNumber, upiId, JSON.stringify(availableHours), 
                 JSON.stringify(interests), budgetMin, budgetMax, preferredMentorGender],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error creating mentee' });
                    }
                    res.status(201).json({ message: 'Mentee registered successfully', userId: this.lastID });
                });
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ message: 'Email, password and userType are required' });
        }

        const table = userType === 'mentor' ? 'mentors' : 'mentees';

        db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ message: `No ${userType} found with this email` });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, userType },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    userType,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            });
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email, mobile, userType } = req.body;

        if (!email || !mobile || !userType) {
            return res.status(400).json({ message: 'Email, mobile number and userType are required' });
        }

        const table = userType === 'mentor' ? 'mentors' : 'mentees';

        // Check if user exists with matching email and mobile
        db.get(`SELECT * FROM ${table} WHERE email = ? AND mobile_number = ?`, [email, mobile], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ message: 'No user found with this email and mobile number combination' });
            }

            // Generate reset token and verification code
            const resetToken = uuidv4();
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

            // Store reset token in database
            db.run(`INSERT INTO password_reset_tokens (email, mobile_number, user_type, token, verification_code, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                   [email, mobile, userType, resetToken, verificationCode, expiresAt.toISOString()],
                   async function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error generating reset token' });
                }

                // Send SMS with verification code
                if (SMS_NOTIFICATIONS_ENABLED && twilioClient) {
                    try {
                        const message = await twilioClient.messages.create({
                            body: `Your password reset verification code is: ${verificationCode}. This code expires in 15 minutes.`,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: mobile
                        });
                        
                        // Log notification
                        db.run(`INSERT INTO notifications (user_id, user_type, type, title, message, mobile_number, sms_sid, sms_status)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                               [user.id, userType, 'password_reset', 'Password Reset Code', 
                                `Verification code sent for password reset`, mobile, message.sid, message.status]);
                    } catch (smsError) {
                        console.error('SMS sending failed:', smsError);
                        // Continue anyway - user might still be able to use the system
                    }
                }

                res.json({ 
                    message: 'Verification code sent to your mobile number',
                    token: resetToken
                });
            });
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, code, newPassword, userType } = req.body;

        if (!token || !code || !newPassword || !userType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify reset token and code
        db.get(`SELECT * FROM password_reset_tokens 
                WHERE token = ? AND verification_code = ? AND user_type = ? AND used = FALSE AND expires_at > datetime('now')`,
               [token, code, userType], async (err, resetRecord) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (!resetRecord) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }

            try {
                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                const table = userType === 'mentor' ? 'mentors' : 'mentees';

                // Update password
                db.run(`UPDATE ${table} SET password = ? WHERE email = ?`,
                       [hashedPassword, resetRecord.email], function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error updating password' });
                    }

                    // Mark reset token as used
                    db.run(`UPDATE password_reset_tokens SET used = TRUE WHERE id = ?`,
                           [resetRecord.id], (err) => {
                        if (err) {
                            console.error('Error marking reset token as used:', err);
                        }
                    });

                    res.json({ message: 'Password reset successfully' });
                });
            } catch (hashError) {
                res.status(500).json({ message: 'Error processing password' });
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const { userType, userId } = req.user;
    const tableName = userType === 'mentor' ? 'mentors' : 'mentees';
    
    db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Parse JSON fields
        if (user.languages) user.languages = JSON.parse(user.languages);
        if (user.available_hours) user.available_hours = JSON.parse(user.available_hours);
        if (user.subjects) user.subjects = JSON.parse(user.subjects);
        if (user.interests) user.interests = JSON.parse(user.interests);

        res.json(user);
    });
});

// Search mentors (for mentees)
app.get('/api/mentors', authenticateToken, (req, res) => {
    const { subject, minPrice, maxPrice, gender, language } = req.query;
    
    let query = `SELECT * FROM mentors WHERE is_active = 1`;
    let params = [];

    if (minPrice) {
        query += ' AND hourly_rate >= ?';
        params.push(minPrice);
    }
    if (maxPrice) {
        query += ' AND hourly_rate <= ?';
        params.push(maxPrice);
    }
    if (gender) {
        query += ' AND gender = ?';
        params.push(gender);
    }

    db.all(query, params, (err, mentors) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        // Filter by subject and language (stored as JSON)
        const filteredMentors = mentors.filter(mentor => {
            let matches = true;
            
            if (subject && mentor.subjects) {
                const subjects = JSON.parse(mentor.subjects);
                matches = matches && subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
            }
            
            if (language && mentor.languages) {
                const languages = JSON.parse(mentor.languages);
                matches = matches && languages.some(l => l.toLowerCase().includes(language.toLowerCase()));
            }
            
            return matches;
        });

        // Parse JSON fields for response
        filteredMentors.forEach(mentor => {
            if (mentor.languages) mentor.languages = JSON.parse(mentor.languages);
            if (mentor.available_hours) mentor.available_hours = JSON.parse(mentor.available_hours);
            if (mentor.subjects) mentor.subjects = JSON.parse(mentor.subjects);
        });

        res.json(filteredMentors);
    });
});

// Send connection request
app.post('/api/connection-request', authenticateToken, async (req, res) => {
    const { mentorId, subject, message, preferredTime } = req.body;
    const menteeId = req.user.userId;

    try {
        // Insert connection request
        db.run(`INSERT INTO connection_requests (mentee_id, mentor_id, subject, message, preferred_time)
                VALUES (?, ?, ?, ?, ?)`,
               [menteeId, mentorId, subject, message, preferredTime],
               async function(err) {
                   if (err) {
                       return res.status(500).json({ message: 'Error sending request' });
                   }

                   const requestId = this.lastID;

                   try {
                       // Get mentor and mentee details for notifications
                       const mentor = await new Promise((resolve, reject) => {
                           db.get(`SELECT * FROM mentors WHERE id = ?`, [mentorId], (err, row) => {
                               if (err) reject(err);
                               resolve(row);
                           });
                       });

                       const mentee = await new Promise((resolve, reject) => {
                           db.get(`SELECT * FROM mentees WHERE id = ?`, [menteeId], (err, row) => {
                               if (err) reject(err);
                               resolve(row);
                           });
                       });

                       if (!mentor || !mentee) {
                           return res.status(404).json({ message: 'User not found' });
                       }

                       // Generate Google Meet link if enabled
                       let meetingDetails = null;
                       if (GOOGLE_MEET_ENABLED && preferredTime) {
                           const startTime = new Date(preferredTime);
                           const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour session
                           
                           meetingDetails = await generateGoogleMeetLink(
                               `Mentoring Session: ${subject}`,
                               `Mentoring session between ${mentor.first_name} ${mentor.last_name} and ${mentee.first_name} ${mentee.last_name}. Subject: ${subject}`,
                               startTime.toISOString(),
                               endTime.toISOString(),
                               [mentor.email, mentee.email]
                           );
                       }

                       // Update request with meeting link if generated
                       if (meetingDetails?.meetingLink) {
                           db.run(`UPDATE connection_requests SET meeting_link = ? WHERE id = ?`,
                                  [meetingDetails.meetingLink, requestId]);
                       }

                       // Send SMS notification to mentor
                       if (mentor.mobile_number) {
                           const mentorMessage = `New mentoring request from ${mentee.first_name} ${mentee.last_name} for ${subject}. Preferred time: ${preferredTime || 'Not specified'}. Check your dashboard to respond.`;
                           await sendSMSNotification(
                               mentor.mobile_number,
                               mentorMessage,
                               mentor.id,
                               'mentor',
                               'connection_request'
                           );
                       }

                       // Send confirmation SMS to mentee
                       if (mentee.mobile_number) {
                           const menteeMessage = `Your mentoring request to ${mentor.first_name} ${mentor.last_name} for ${subject} has been sent successfully. You'll receive a notification when they respond.`;
                           await sendSMSNotification(
                               mentee.mobile_number,
                               menteeMessage,
                               mentee.id,
                               'mentee',
                               'connection_request_sent'
                           );
                       }

                       res.json({ 
                           message: 'Request sent successfully', 
                           requestId: requestId,
                           meetingLink: meetingDetails?.meetingLink || null
                       });
                   } catch (notificationError) {
                       console.error('Error sending notifications:', notificationError);
                       // Still return success as the main request was created
                       res.json({ message: 'Request sent successfully', requestId: requestId });
                   }
               });
    } catch (error) {
        console.error('Connection request error:', error);
        res.status(500).json({ message: 'Error sending request' });
    }
});

// Get connection requests (for mentors)
app.get('/api/connection-requests', authenticateToken, (req, res) => {
    if (req.user.userType !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`SELECT cr.*, m.first_name, m.last_name, m.email, m.profile_picture, m.interests
            FROM connection_requests cr
            JOIN mentees m ON cr.mentee_id = m.id
            WHERE cr.mentor_id = ? AND cr.status = 'pending'
            ORDER BY cr.created_at DESC`,
           [req.user.userId], (err, requests) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        // Parse JSON fields
        requests.forEach(request => {
            if (request.interests) request.interests = JSON.parse(request.interests);
        });

        res.json(requests);
    });
});

// Accept/Reject connection request
app.put('/api/connection-request/:id', authenticateToken, async (req, res) => {
    const { status, meetingTime, meetingLink } = req.body;
    const requestId = req.params.id;

    if (req.user.userType !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        db.run(`UPDATE connection_requests SET status = ? WHERE id = ? AND mentor_id = ?`,
               [status, requestId, req.user.userId], async function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error updating request' });
            }

            try {
                // Get request details for notifications
                const request = await new Promise((resolve, reject) => {
                    db.get(`SELECT cr.*, m.first_name as mentor_first_name, m.last_name as mentor_last_name, m.email as mentor_email, m.mobile_number as mentor_mobile,
                                   me.first_name as mentee_first_name, me.last_name as mentee_last_name, me.email as mentee_email, me.mobile_number as mentee_mobile
                            FROM connection_requests cr
                            JOIN mentors m ON cr.mentor_id = m.id
                            JOIN mentees me ON cr.mentee_id = me.id
                            WHERE cr.id = ?`, [requestId], (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    });
                });

                if (!request) {
                    return res.status(404).json({ message: 'Request not found' });
                }

                if (status === 'accepted' && meetingTime) {
                    // Get mentor's hourly rate
                    const mentor = await new Promise((resolve, reject) => {
                        db.get(`SELECT hourly_rate FROM mentors WHERE id = ?`, [req.user.userId], (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        });
                    });

                    if (!mentor) {
                        return res.status(500).json({ message: 'Error retrieving mentor details' });
                    }

                    const amount = mentor.hourly_rate;
                    const commission = amount * (PLATFORM_CONFIG.COMMISSION_PERCENTAGE / 100);

                    // Create session
                    const sessionId = await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO sessions (mentor_id, mentee_id, subject, scheduled_time, 
                                                     meeting_link, amount, commission)
                                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                               [req.user.userId, request.mentee_id, request.subject, 
                                meetingTime, meetingLink || request.meeting_link, amount, commission], function(err) {
                            if (err) reject(err);
                            resolve(this.lastID);
                        });
                    });

                    // Send SMS notifications for accepted request
                    const meetingTimeFormatted = new Date(meetingTime).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'full',
                        timeStyle: 'short'
                    });

                    // Notify mentee about acceptance
                    if (request.mentee_mobile) {
                        const menteeMessage = `Great news! ${request.mentor_first_name} ${request.mentor_last_name} accepted your mentoring request for ${request.subject}. Meeting scheduled for ${meetingTimeFormatted}. ${request.meeting_link ? 'Meeting link: ' + request.meeting_link : 'Check your dashboard for details.'}`;
                        await sendSMSNotification(
                            request.mentee_mobile,
                            menteeMessage,
                            request.mentee_id,
                            'mentee',
                            'request_accepted'
                        );
                    }

                    // Notify mentor about session creation
                    if (request.mentor_mobile) {
                        const mentorMessage = `Session confirmed with ${request.mentee_first_name} ${request.mentee_last_name} for ${request.subject} on ${meetingTimeFormatted}. Amount: ₹${amount}. Check your dashboard for details.`;
                        await sendSMSNotification(
                            request.mentor_mobile,
                            mentorMessage,
                            request.mentor_id,
                            'mentor',
                            'session_scheduled'
                        );
                    }

                    res.json({ 
                        message: 'Request accepted and session scheduled', 
                        sessionId: sessionId,
                        meetingLink: meetingLink || request.meeting_link
                    });

                } else if (status === 'rejected') {
                    // Send SMS notification for rejected request
                    if (request.mentee_mobile) {
                        const menteeMessage = `Your mentoring request to ${request.mentor_first_name} ${request.mentor_last_name} for ${request.subject} was not accepted. Don't worry, there are many other great mentors available!`;
                        await sendSMSNotification(
                            request.mentee_mobile,
                            menteeMessage,
                            request.mentee_id,
                            'mentee',
                            'request_rejected'
                        );
                    }

                    res.json({ message: `Request ${status}` });
                } else {
                    res.json({ message: `Request ${status}` });
                }
            } catch (notificationError) {
                console.error('Error sending notifications:', notificationError);
                res.json({ message: `Request ${status}` });
            }
        });
    } catch (error) {
        console.error('Accept/reject request error:', error);
        res.status(500).json({ message: 'Error updating request' });
    }
});

// Get upcoming sessions
app.get('/api/sessions', authenticateToken, (req, res) => {
    const query = `SELECT s.*, 
                          mentor.first_name as mentor_first_name, 
                          mentor.last_name as mentor_last_name,
                          mentee.first_name as mentee_first_name,
                          mentee.last_name as mentee_last_name
                   FROM sessions s
                   JOIN mentors mentor ON s.mentor_id = mentor.id
                   JOIN mentees mentee ON s.mentee_id = mentee.id
                   WHERE (s.mentor_id = ? OR s.mentee_id = ?) 
                   AND s.status = 'scheduled'
                   ORDER BY s.scheduled_time ASC`;

    db.all(query, [req.user.userId, req.user.userId], (err, sessions) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(sessions);
    });
});

// Get mentor earnings
app.get('/api/mentor/earnings', authenticateToken, (req, res) => {
    if (req.user.userType !== 'mentor') {
        return res.status(403).json({ message: 'Access denied' });
    }

    db.get(`SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'completed' THEN (amount - commission) ELSE 0 END) as total_earnings,
                SUM(CASE WHEN status = 'scheduled' THEN (amount - commission) ELSE 0 END) as pending_earnings
            FROM sessions 
            WHERE mentor_id = ?`,
           [req.user.userId], (err, earnings) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(earnings);
    });
});

// Submit review
app.post('/api/review', authenticateToken, (req, res) => {
    const { sessionId, revieweeId, rating, comment } = req.body;

    db.run(`INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)`,
           [sessionId, req.user.userId, revieweeId, rating, comment], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error submitting review' });
        }
        res.json({ message: 'Review submitted successfully' });
    });
});

// Upload profile picture
app.post('/api/upload-profile-pic', authenticateToken, upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePicPath = `/uploads/${req.file.filename}`;
    const { userType, userId } = req.user;
    const tableName = userType === 'mentor' ? 'mentors' : 'mentees';
    
    db.run(`UPDATE ${tableName} SET profile_picture = ? WHERE id = ?`,
           [profilePicPath, userId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating profile picture' });
        }
        res.json({ message: 'Profile picture updated', profilePicture: profilePicPath });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access the application at http://localhost:${port}`);
});
