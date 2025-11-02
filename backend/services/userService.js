const db = require('./database');
const bcrypt = require('bcrypt');

class UserService {
    // Get user profile by ID
    async getUserProfile(userId) {
        try {
            const user = await db.get(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            
            if (user) {
                // Parse JSON fields
                if (user.expertise) user.expertise = JSON.parse(user.expertise);
                if (user.availability) user.availability = JSON.parse(user.availability);
                if (user.interests) user.interests = JSON.parse(user.interests);
                if (user.paymentMethods) user.paymentMethods = JSON.parse(user.paymentMethods);
            }
            
            return user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw new Error('Failed to fetch user profile');
        }
    }

    // Update user profile
    async updateUserProfile(userId, updated_ata) {
        try {
            // Check if email is being changed and if it's already in use
            if (updated_ata.email) {
                const existingUser = await db.get(
                    'SELECT id FROM users WHERE email = ? AND id != ?',
                    [updated_ata.email, userId]
                );
                
                if (existingUser) {
                    throw new Error('Email address is already in use');
                }
            }

            // Prepare update fields
            const updateFields = [];
            const updateValues = [];
            
            // Handle regular fields
            const regularFields = [
                'firstName', 'lastName', 'email', 'phone', 'bio', 
                'location', 'experience', 'education', 'certifications', 
                'hourlyRate', 'startTime', 'endTime', 'timezone'
            ];

            regularFields.forEach(field => {
                if (updated_ata.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updated_ata[field]);
                }
            });

            // Handle JSON fields
            const jsonFields = ['expertise', 'availability', 'interests', 'paymentMethods'];
            jsonFields.forEach(field => {
                if (updated_ata.hasOwnProperty(field)) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(JSON.stringify(updated_ata[field]));
                }
            });

            if (updateFields.length === 0) {
                return this.getUserProfile(userId);
            }

            updateFields.push('updated_at = ?');
            updateValues.push(new Date().toISOString());
            updateValues.push(userId);

            await db.run(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            return this.getUserProfile(userId);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update user avatar
    async updateUserAvatar(userId, avatarUrl) {
        try {
            await db.run(
                'UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?',
                [avatarUrl, new Date().toISOString(), userId]
            );
            
            return { success: true };
        } catch (error) {
            console.error('Error updating user avatar:', error);
            throw new Error('Failed to update avatar');
        }
    }

    // Change user password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get current user
            const user = await db.get(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return { success: false, message: 'Current password is incorrect' };
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await db.run(
                'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
                [hashedNewPassword, new Date().toISOString(), userId]
            );

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            console.error('Error changing password:', error);
            throw new Error('Failed to change password');
        }
    }

    // Get user settings
    async getUserSettings(userId) {
        try {
            const settings = await db.get(
                'SELECT settings FROM user_settings WHERE userId = ?',
                [userId]
            );
            
            return settings ? JSON.parse(settings.settings) : {};
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return {};
        }
    }

    // Update user settings
    async updateUserSettings(userId, settings) {
        try {
            const settingsJson = JSON.stringify(settings);
            
            // Try to update first
            const result = await db.run(
                'UPDATE user_settings SET settings = ?, updated_at = ? WHERE userId = ?',
                [settingsJson, new Date().toISOString(), userId]
            );

            // If no rows affected, insert new record
            if (result.changes === 0) {
                await db.run(
                    'INSERT INTO user_settings (userId, settings, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    [userId, settingsJson, new Date().toISOString(), new Date().toISOString()]
                );
            }

            return settings;
        } catch (error) {
            console.error('Error updating user settings:', error);
            throw new Error('Failed to update settings');
        }
    }

    // Delete user account
    async deleteUserAccount(userId, password) {
        try {
            // Get user and verify password
            const user = await db.get(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { success: false, message: 'Password is incorrect' };
            }

            // Begin transaction for account deletion
            await db.run('BEGIN TRANSACTION');

            try {
                // Delete related records first
                await db.run('DELETE FROM user_settings WHERE userId = ?', [userId]);
                await db.run('DELETE FROM sessions WHERE userId = ?', [userId]);
                await db.run('DELETE FROM notifications WHERE userId = ?', [userId]);
                await db.run('DELETE FROM mentor_mentee_relationships WHERE mentorId = ? OR menteeId = ?', [userId, userId]);
                await db.run('DELETE FROM mentoring_requests WHERE mentorId = ? OR menteeId = ?', [userId, userId]);
                await db.run('DELETE FROM mentoring_sessions WHERE mentorId = ? OR menteeId = ?', [userId, userId]);
                await db.run('DELETE FROM reviews WHERE mentorId = ? OR menteeId = ?', [userId, userId]);
                
                // Finally delete the user
                await db.run('DELETE FROM users WHERE id = ?', [userId]);

                await db.run('COMMIT');
                return { success: true, message: 'Account deleted successfully' };
            } catch (error) {
                await db.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error deleting user account:', error);
            throw new Error('Failed to delete account');
        }
    }

    // Get user activity log
    async getUserActivity(userId, options = {}) {
        try {
            const { page = 1, limit = 20 } = options;
            const offset = (page - 1) * limit;

            const activities = await db.all(
                `SELECT type, description, created_at, data 
                 FROM activity_logs 
                 WHERE userId = ? 
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // Parse JSON data field
            activities.forEach(activity => {
                if (activity.data) {
                    try {
                        activity.data = JSON.parse(activity.data);
                    } catch (e) {
                        activity.data = {};
                    }
                }
            });

            // Get total count
            const totalResult = await db.get(
                'SELECT COUNT(*) as total FROM activity_logs WHERE userId = ?',
                [userId]
            );
            const total = totalResult.total;

            return {
                activities,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching user activity:', error);
            throw new Error('Failed to fetch user activity');
        }
    }

    // Log user activity
    async logActivity(userId, type, description, data = {}) {
        try {
            await db.run(
                'INSERT INTO activity_logs (userId, type, description, data, created_at) VALUES (?, ?, ?, ?, ?)',
                [userId, type, description, JSON.stringify(data), new Date().toISOString()]
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Get user statistics
    async getUserStats(userId) {
        try {
            const user = await this.getUserProfile(userId);
            if (!user) return null;

            const stats = {
                profileCompletion: 0,
                accountAge: 0,
                totalSessions: 0,
                totalEarnings: 0,
                averageRating: 0
            };

            // Calculate profile completion
            const requiredFields = ['firstName', 'lastName', 'email', 'bio'];
            const completedFields = requiredFields.filter(field => user[field]);
            stats.profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);

            // Account age
            if (user.created_at) {
                const createdDate = new Date(user.created_at);
                const now = new Date();
                stats.accountAge = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            }

            // Get session and earning stats
            if (user.userType === 'mentor') {
                const sessionStats = await db.get(
                    'SELECT COUNT(*) as totalSessions, SUM(amount) as totalEarnings FROM mentoring_sessions WHERE mentorId = ? AND status = "completed"',
                    [userId]
                );
                stats.totalSessions = sessionStats.totalSessions || 0;
                stats.totalEarnings = sessionStats.totalEarnings || 0;

                // Average rating
                const ratingResult = await db.get(
                    'SELECT AVG(rating) as averageRating FROM reviews WHERE mentorId = ?',
                    [userId]
                );
                stats.averageRating = ratingResult.averageRating || 0;
            } else {
                const sessionStats = await db.get(
                    'SELECT COUNT(*) as totalSessions FROM mentoring_sessions WHERE menteeId = ? AND status = "completed"',
                    [userId]
                );
                stats.totalSessions = sessionStats.totalSessions || 0;
            }

            return stats;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw new Error('Failed to fetch user statistics');
        }
    }

    // Search users
    async searchUsers(query, userType = null, filters = {}) {
        try {
            const { page = 1, limit = 20, expertise = [], location = '', minRating = 0 } = filters;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT u.id, u.firstName, u.lastName, u.avatar, u.bio, u.location, 
                       u.expertise, u.hourlyRate, u.userType,
                       AVG(r.rating) as averageRating,
                       COUNT(r.id) as reviewCount
                FROM users u
                LEFT JOIN reviews r ON u.id = r.mentorId
                WHERE (u.firstName LIKE ? OR u.lastName LIKE ? OR u.bio LIKE ?)
            `;
            
            const params = [`%${query}%`, `%${query}%`, `%${query}%`];

            if (userType) {
                sql += ' AND u.userType = ?';
                params.push(userType);
            }

            if (location) {
                sql += ' AND u.location LIKE ?';
                params.push(`%${location}%`);
            }

            sql += ' GROUP BY u.id';

            if (minRating > 0) {
                sql += ' HAVING averageRating >= ?';
                params.push(minRating);
            }

            sql += ' ORDER BY u.firstName, u.lastName LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const users = await db.all(sql, params);

            // Parse JSON fields and format response
            users.forEach(user => {
                if (user.expertise) {
                    try {
                        user.expertise = JSON.parse(user.expertise);
                    } catch (e) {
                        user.expertise = [];
                    }
                }
                user.averageRating = parseFloat(user.averageRating) || 0;
                user.reviewCount = parseInt(user.reviewCount) || 0;
            });

            return users;
        } catch (error) {
            console.error('Error searching users:', error);
            throw new Error('Failed to search users');
        }
    }

    // Get user by email
    async getUserByEmail(email) {
        try {
            return await db.get(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw new Error('Failed to fetch user');
        }
    }

    // Update user last login
    async updateLastLogin(userId) {
        try {
            await db.run(
                'UPDATE users SET lastLoginAt = ? WHERE id = ?',
                [new Date().toISOString(), userId]
            );
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }
}

module.exports = new UserService();
