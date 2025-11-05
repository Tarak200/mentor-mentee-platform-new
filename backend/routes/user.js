const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// ====================================================
// 🔹 GET: Fetch user profile
// ====================================================
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await userService.getUserProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // console.log("✅ Fetched user profile:", user);
        // Remove sensitive data (e.g., password, tokens)
        const { password, ...userProfile } = user;

        // Normalize and format data to match frontend usage
        const normalizedUser = {
            id: userProfile.id,
            first_name: userProfile.first_name || userProfile.firstName || '',
            last_name: userProfile.last_name || userProfile.lastName || '',
            email: userProfile.email || '',
            age: userProfile.age || null,
            gender: userProfile.gender || null,
            education: userProfile.education || null,
            institution: userProfile.institution || null,
            current_pursuit: userProfile.current_pursuit || null,
            qualifications: userProfile.qualifications || null,
            hourlyRate: userProfile.hourlyRate || userProfile.hourly_rate || 0,
            languages: userProfile.languages
                ? (typeof userProfile.languages === 'string'
                    ? userProfile.languages.split(',').map(s => s.trim())
                    : userProfile.languages)
                : [],
            subjects: userProfile.subjects
                ? (typeof userProfile.subjects === 'string'
                    ? userProfile.subjects.split(',').map(s => s.trim())
                    : userProfile.subjects)
                : [],
            available_hours: userProfile.available_hours
                ? (typeof userProfile.available_hours === 'string'
                    ? userProfile.available_hours.split(',').map(s => s.trim())
                    : userProfile.available_hours)
                : [],
            phone: userProfile.phone || null,
            upi_id: userProfile.upi_id || null,
            profile_picture: userProfile.profile_picture
                ? `/uploads/${userProfile.profile_picture}`
                : '/uploads/default.jpg',
            rating: userProfile.rating || null,
            bio: userProfile.bio || null
        };

        // ✅ Return the normalized profile JSON for the frontend
        res.json(normalizedUser);

    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ====================================================
// 🔹 PUT: Update user profile
// ====================================================
router.put('/update-profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const updated_data = req.body;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email'];
        const missingFields = requiredFields.filter(field => !updated_data[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Update user profile
        const updatedUser = await userService.updateUserProfile(userId, updated_data);

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive fields
        const { password, ...userProfile } = updatedUser;

        // Normalize data for frontend
        const normalizedUser = {
            id: userProfile.id,
            first_name: userProfile.first_name || userProfile.firstName,
            last_name: userProfile.last_name || userProfile.lastName,
            email: userProfile.email,
            age: userProfile.age || null,
            education: userProfile.education || null,
            institution: userProfile.institution || null,
            current_pursuit: userProfile.current_pursuit || null,
            qualifications: userProfile.qualifications || null,
            hourlyRate: userProfile.hourlyRate || userProfile.hourly_rate || 0,
            languages: userProfile.languages
                ? (typeof userProfile.languages === 'string'
                    ? userProfile.languages.split(',').map(s => s.trim())
                    : userProfile.languages)
                : [],
            subjects: userProfile.subjects
                ? (typeof userProfile.subjects === 'string'
                    ? userProfile.subjects.split(',').map(s => s.trim())
                    : userProfile.subjects)
                : [],
            available_hours: userProfile.available_hours
                ? (typeof userProfile.available_hours === 'string'
                    ? userProfile.available_hours.split(',').map(s => s.trim())
                    : userProfile.available_hours)
                : [],
            mobile_number: userProfile.mobile_number || null,
            upi_id: userProfile.upi_id || null,
            profile_picture: userProfile.profile_picture
                ? `/backend/uploads/${userProfile.profile_picture}`
                : 'backend/uploads/default.jpg',
            rating: userProfile.rating || null,
            bio: userProfile.bio || null,
        };

        res.json(normalizedUser);
    } catch (error) {
        console.error('❌ Error updating user profile:', error);
        if (error.message && error.message.includes('email already exists')) {
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
