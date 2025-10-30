const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

class AuthService {
    async register(userData) {
        const {
            email, password, userType, firstName, lastName, age, education,
            institution, gender, languages, currentPursuit, mobileNumber,
            upiId, availableHours, hourlyRate, qualifications, subjects,
            interests, budgetMin, budgetMax, preferredMentorGender
        } = userData;

        // Check if user already exists
        const table = userType === 'mentor' ? 'mentors' : 'mentees';
        const existingUser = await db.get(`SELECT id FROM ${table} WHERE email = ?`, [email]);
        
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'mentor') {
            const result = await db.run(`INSERT INTO mentors (
                email, password, first_name, last_name, age, education,
                institution, gender, languages, current_pursuit, mobile_number,
                upi_id, available_hours, hourlyRate, qualifications, subjects
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, age, education,
             institution, gender, JSON.stringify(languages), currentPursuit,
             mobileNumber, upiId, JSON.stringify(availableHours), hourlyRate,
             qualifications, JSON.stringify(subjects)]);

            return { id: result.lastID, userType: 'mentor', message: 'Mentor registered successfully' };
        } else {
            const result = await db.run(`INSERT INTO mentees (
                email, password, first_name, last_name, age, education,
                institution, gender, languages, current_pursuit, mobile_number,
                upi_id, available_hours, interests, budget_min, budget_max, preferred_mentor_gender
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, age, education,
             institution, gender, JSON.stringify(languages), currentPursuit,
             mobileNumber, upiId, JSON.stringify(availableHours),
             JSON.stringify(interests), budgetMin, budgetMax, preferredMentorGender]);

            return { id: result.lastID, userType: 'mentee', message: 'Mentee registered successfully' };
        }
    }

    async login(email, password, userType) {
        if (!email || !password || !userType) {
            throw new Error('Email, password and userType are required');
        }

        const table = userType === 'mentor' ? 'mentors' : 'mentees';
        const user = await db.get(`SELECT * FROM ${table} WHERE email = ?`, [email]);

        if (!user) {
            throw new Error(`No ${userType} found with this email`);
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, userType },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                userType,
                firstName: user.first_name,
                lastName: user.last_name
            }
        };
    }

    async forgotPassword(email, mobile, userType) {
        const table = userType === 'mentor' ? 'mentors' : 'mentees';
        const user = await db.get(`SELECT * FROM ${table} WHERE email = ? AND mobile_number = ?`, [email, mobile]);

        if (!user) {
            throw new Error('No user found with this email and mobile number combination');
        }

        const resetToken = uuidv4();
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        await db.run(`INSERT INTO password_reset_tokens (email, mobile_number, user_type, token, verification_code, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                     [email, mobile, userType, resetToken, verificationCode, expiresAt.toISOString()]);

        return { token: resetToken, verificationCode, user };
    }

    async resetPassword(token, code, newPassword, userType) {
        const resetRecord = await db.get(`SELECT * FROM password_reset_tokens 
                WHERE token = ? AND verification_code = ? AND user_type = ? AND used = FALSE AND expires_at > datetime('now')`,
               [token, code, userType]);

        if (!resetRecord) {
            throw new Error('Invalid or expired verification code');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const table = userType === 'mentor' ? 'mentors' : 'mentees';

        await db.run(`UPDATE ${table} SET password = ? WHERE email = ?`,
                     [hashedPassword, resetRecord.email]);

        await db.run(`UPDATE password_reset_tokens SET used = TRUE WHERE id = ?`,
                     [resetRecord.id]);

        return { message: 'Password reset successfully' };
    }

    async handleGoogleOAuth(googleUser, userType) {
        const table = userType === 'mentor' ? 'mentors' : 'mentees';
        
        // Check if user exists
        let user = await db.get(`SELECT * FROM ${table} WHERE email = ? OR google_id = ?`,
                               [googleUser.email, googleUser.google_id]);

        if (!user) {
            // Create new user
            const userData = {
                google_id: googleUser.google_id,
                email: googleUser.email,
                first_name: googleUser.first_name,
                last_name: googleUser.last_name,
                profile_picture: googleUser.profile_picture,
                languages: JSON.stringify(['English']),
                available_hours: JSON.stringify(['Morning (9-12 PM)', 'Evening (4-8 PM)']),
                is_active: 1
            };

            if (userType === 'mentor') {
                const result = await db.run(`INSERT INTO mentors (
                    google_id, email, first_name, last_name, profile_picture,
                    languages, available_hours, hourlyRate, qualifications, subjects, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userData.google_id, userData.email, userData.first_name, userData.last_name,
                 userData.profile_picture, userData.languages, userData.available_hours,
                 500, '', JSON.stringify(['General']), userData.is_active]);

                user = await db.get("SELECT * FROM mentors WHERE id = ?", [result.lastID]);
            } else {
                const result = await db.run(`INSERT INTO mentees (
                    google_id, email, first_name, last_name, profile_picture,
                    languages, available_hours, interests, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userData.google_id, userData.email, userData.first_name, userData.last_name,
                 userData.profile_picture, userData.languages, userData.available_hours,
                 JSON.stringify(['General Learning']), userData.is_active]);

                user = await db.get("SELECT * FROM mentees WHERE id = ?", [result.lastID]);
            }
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, userType },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, user };
    }
}

module.exports = new AuthService();
