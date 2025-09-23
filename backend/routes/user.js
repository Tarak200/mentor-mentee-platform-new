const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get user profile
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
const userId = req.user.userId || req.user.id;
        const user = await userService.getUserProfile(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive information
        const { password, ...userProfile } = user;
        res.json(userProfile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email'];
        const missingFields = requiredFields.filter(field => !updateData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Update user profile
        const updatedUser = await userService.updateUserProfile(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive information
        const { password, ...userProfile } = updatedUser;
        res.json(userProfile);
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.message.includes('email already exists')) {
            res.status(409).json({ error: 'Email address is already in use' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Upload user avatar
router.post('/avatar', 
    authMiddleware.authenticateToken, 
    upload.single('avatar'), 
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

const userId = req.user.userId || req.user.id;
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;

            // Update user avatar in database
            await userService.updateUserAvatar(userId, avatarUrl);

            res.json({ 
                message: 'Avatar uploaded successfully',
                avatarUrl: avatarUrl 
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Change password
router.post('/change-password', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ 
                error: 'New password must be at least 8 characters long' 
            });
        }

        // Change password
        const result = await userService.changePassword(userId, currentPassword, newPassword);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user settings
router.get('/settings', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = await userService.getUserSettings(userId);
        
        res.json(settings || {});
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user settings
router.put('/settings', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = req.body;

        const updatedSettings = await userService.updateUserSettings(userId, settings);
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user account
router.delete('/account', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }

        const result = await userService.deleteUserAccount(userId, password);
        
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user activity log
router.get('/activity', authMiddleware.authenticateToken, async (req, res) => {
    try {
const userId = req.user.userId || req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const activities = await userService.getUserActivity(userId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json(activities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
