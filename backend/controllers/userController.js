const userService = require('../services/userService');
const { sanitizeInput, validateEmail } = require('../utils/validation');

class UserController {
    // Get user profile
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const profile = await userService.getUserProfile(userId);
            
            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const updates = req.body;

            // Sanitize input
            Object.keys(updates).forEach(key => {
                if (typeof updates[key] === 'string') {
                    updates[key] = sanitizeInput(updates[key]);
                }
            });

            // Validate email if being updated
            if (updates.email && !validateEmail(updates.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            const updatedProfile = await userService.updateUserProfile(userId, updates);
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            console.error('Update profile error:', error);
            if (error.message.includes('Email already exists')) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }

    // Upload avatar
    async uploadAvatar(req, res) {
        try {
            const userId = req.user.userId;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const avatarPath = await userService.updateAvatar(userId, req.file);
            
            res.json({
                success: true,
                message: 'Avatar uploaded successfully',
                data: { avatar: avatarPath }
            });
        } catch (error) {
            console.error('Upload avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload avatar'
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current and new passwords are required'
                });
            }

            await userService.changePassword(userId, currentPassword, newPassword);
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            if (error.message.includes('Current password is incorrect')) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }

    // Get user settings
    async getSettings(req, res) {
        try {
            const userId = req.user.userId;
            const settings = await userService.getUserSettings(userId);
            
            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch settings'
            });
        }
    }

    // Update user settings
    async updateSettings(req, res) {
        try {
            const userId = req.user.userId;
            const settings = req.body;

            const updatedSettings = await userService.updateUserSettings(userId, settings);
            
            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: updatedSettings
            });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings'
            });
        }
    }

    // Get user activity
    async getActivity(req, res) {
        try {
            const userId = req.user.userId;
            const { limit = 20, offset = 0 } = req.query;

            const activities = await userService.getUserActivity(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('Get activity error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch activity'
            });
        }
    }

    // Get user statistics
    async getStats(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await userService.getUserStats(userId);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }

    // Search users
    async searchUsers(req, res) {
        try {
            const { query, role, skills, page = 1, limit = 10 } = req.query;
            
            const searchParams = {
                query: query ? sanitizeInput(query) : '',
                role,
                skills: skills ? skills.split(',').map(s => sanitizeInput(s.trim())) : [],
                page: parseInt(page),
                limit: parseInt(limit)
            };

            const results = await userService.searchUsers(searchParams);
            
            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed'
            });
        }
    }

    // Delete user account
    async deleteAccount(req, res) {
        try {
            const userId = req.user.userId;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required to delete account'
                });
            }

            await userService.deleteUserAccount(userId, password);
            
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            if (error.message.includes('Incorrect password')) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect password'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to delete account'
            });
        }
    }
}

module.exports = new UserController();
