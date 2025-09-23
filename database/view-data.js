#!/usr/bin/env node

/**
 * Database Data Viewer - View all tables with complete details
 * Usage: node database/view-data.js
 */

const path = require('path');

// Import database service from the backend
const db = require('../backend/services/database');

console.log('🔍 MENTOR-MENTEE PLATFORM - COMPLETE DATABASE VIEWER\n');

async function viewAllData() {
    try {
        await db.initialize();
        console.log('✅ Database connection established\n');

        // Get total counts for all tables
        await showTableCounts();
        console.log('═'.repeat(80));
        
        // Show detailed data for each table
        await showUsersTable();
        console.log('═'.repeat(80));
        
        await showSessionsTable();
        console.log('═'.repeat(80));
        
        await showRelationshipsTable();
        console.log('═'.repeat(80));
        
        await showRequestsTable();
        console.log('═'.repeat(80));
        
        await showReviewsTable();
        console.log('═'.repeat(80));
        
        await showNotificationsTable();
        console.log('═'.repeat(80));
        
        await showActivityLogsTable();
        console.log('═'.repeat(80));
        
        await showSecurityEventsTable();

        console.log('\n🎯 QUICK ACCESS COMMANDS:');
        console.log('node database/view-data.js          - View all data (this command)');
        console.log('node view-database.js               - Quick overview');  
        console.log('node init-database.js               - Re-initialize database');
        
    } catch (error) {
        console.error('❌ Database viewing error:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the database is initialized: node init-database.js');
        console.log('2. Check if backend/data/mentorship.db exists');
        console.log('3. Ensure you\'re in the project root directory');
    }
}

// Show record counts for all tables
async function showTableCounts() {
    console.log('📊 DATABASE TABLE OVERVIEW\n');
    
    const tables = [
        'users',
        'mentoring_sessions', 
        'mentor_mentee_relationships',
        'mentoring_requests',
        'reviews',
        'notifications',
        'activity_logs',
        'security_events',
        'password_reset_tokens'
    ];
    
    for (const table of tables) {
        try {
            const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
            const icon = getTableIcon(table);
            console.log(`${icon} ${table.padEnd(30)} ${result.count.toString().padStart(5)} records`);
        } catch (err) {
            console.log(`❌ ${table.padEnd(30)} Error reading table`);
        }
    }
    console.log();
}

// Show complete users table with passwords
async function showUsersTable() {
    console.log('👥 USERS TABLE - COMPLETE DETAILS\n');
    
    try {
        const users = await db.all(`
            SELECT 
                id,
                firstName,
                lastName, 
                email,
                password,
                role,
                bio,
                skills,
                hourlyRate,
                phone,
                isActive,
                emailVerified,
                timezone,
                createdAt
            FROM users 
            ORDER BY role, firstName
        `);

        if (users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }

        users.forEach((user, index) => {
            console.log(`━━━ USER ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 ID: ${user.id}`);
            console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔐 Password Hash: ${user.password}`);
            console.log(`👑 Role: ${user.role.toUpperCase()}`);
            console.log(`💰 Hourly Rate: $${user.hourlyRate || 0}`);
            console.log(`📱 Phone: ${user.phone || 'Not provided'}`);
            console.log(`🌍 Timezone: ${user.timezone}`);
            console.log(`✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
            console.log(`📮 Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
            if (user.bio) {
                console.log(`📝 Bio: ${user.bio}`);
            }
            if (user.skills) {
                console.log(`🛠️  Skills: ${user.skills}`);
            }
            console.log(`📅 Created: ${new Date(user.createdAt).toLocaleDateString()}`);
            console.log();
        });

        // Show role distribution
        const roleStats = await db.all(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        console.log('📈 ROLE DISTRIBUTION:');
        roleStats.forEach(stat => {
            const icon = stat.role === 'mentor' ? '👨‍🏫' : stat.role === 'mentee' ? '👨‍🎓' : '👑';
            console.log(`${icon} ${stat.role.toUpperCase()}: ${stat.count} users`);
        });
        
    } catch (error) {
        console.error('❌ Error viewing users table:', error);
    }
}

// Show mentoring sessions with detailed information
async function showSessionsTable() {
    console.log('\n📚 MENTORING SESSIONS - COMPLETE DETAILS\n');
    
    try {
        const sessions = await db.all(`
            SELECT 
                s.*,
                m.firstName as mentorName,
                m.lastName as mentorLastName,
                n.firstName as menteeName,
                n.lastName as menteeLastName
            FROM mentoring_sessions s
            JOIN users m ON s.mentorId = m.id
            JOIN users n ON s.menteeId = n.id
            ORDER BY s.scheduledAt DESC
        `);

        if (sessions.length === 0) {
            console.log('❌ No sessions found in database');
            return;
        }

        sessions.forEach((session, index) => {
            console.log(`━━━ SESSION ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Session ID: ${session.id}`);
            console.log(`📖 Title: ${session.title}`);
            console.log(`📝 Description: ${session.description || 'No description'}`);
            console.log(`👨‍🏫 Mentor: ${session.mentorName} ${session.mentorLastName}`);
            console.log(`👨‍🎓 Mentee: ${session.menteeName} ${session.menteeLastName}`);
            console.log(`📅 Scheduled: ${new Date(session.scheduledAt).toLocaleString()}`);
            console.log(`⏱️  Duration: ${session.duration} minutes`);
            console.log(`💰 Amount: $${session.amount}`);
            console.log(`📊 Status: ${session.status.toUpperCase()}`);
            console.log(`💳 Payment: ${session.paymentStatus}`);
            
            if (session.actualStartTime) {
                console.log(`▶️  Started: ${new Date(session.actualStartTime).toLocaleString()}`);
            }
            if (session.actualEndTime) {
                console.log(`⏹️  Ended: ${new Date(session.actualEndTime).toLocaleString()}`);
            }
            if (session.notes) {
                console.log(`📌 Notes: ${session.notes}`);
            }
            if (session.summary) {
                console.log(`📋 Summary: ${session.summary}`);
            }
            if (session.cancellationReason) {
                console.log(`❌ Cancelled: ${session.cancellationReason}`);
            }
            console.log();
        });

        // Show session statistics
        const stats = await db.all(`
            SELECT 
                status,
                COUNT(*) as count,
                AVG(amount) as avgAmount
            FROM mentoring_sessions 
            GROUP BY status
        `);
        
        console.log('📈 SESSION STATISTICS:');
        stats.forEach(stat => {
            const icon = getStatusIcon(stat.status);
            console.log(`${icon} ${stat.status.toUpperCase()}: ${stat.count} sessions (Avg: $${Math.round(stat.avgAmount || 0)})`);
        });

    } catch (error) {
        console.error('❌ Error viewing sessions table:', error);
    }
}

// Show mentor-mentee relationships
async function showRelationshipsTable() {
    console.log('\n🤝 MENTOR-MENTEE RELATIONSHIPS\n');
    
    try {
        const relationships = await db.all(`
            SELECT 
                r.*,
                m.firstName as mentorName,
                m.lastName as mentorLastName,
                m.email as mentorEmail,
                n.firstName as menteeName,
                n.lastName as menteeLastName,
                n.email as menteeEmail
            FROM mentor_mentee_relationships r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            ORDER BY r.createdAt DESC
        `);

        if (relationships.length === 0) {
            console.log('❌ No relationships found in database');
            return;
        }

        relationships.forEach((rel, index) => {
            console.log(`━━━ RELATIONSHIP ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Relationship ID: ${rel.id}`);
            console.log(`👨‍🏫 Mentor: ${rel.mentorName} ${rel.mentorLastName}`);
            console.log(`📧 Mentor Email: ${rel.mentorEmail}`);
            console.log(`👨‍🎓 Mentee: ${rel.menteeName} ${rel.menteeLastName}`);
            console.log(`📧 Mentee Email: ${rel.menteeEmail}`);
            console.log(`📊 Status: ${rel.status.toUpperCase()}`);
            console.log(`📅 Started: ${new Date(rel.createdAt).toLocaleDateString()}`);
            console.log();
        });

    } catch (error) {
        console.error('❌ Error viewing relationships table:', error);
    }
}

// Show mentoring requests
async function showRequestsTable() {
    console.log('\n📝 MENTORING REQUESTS\n');
    
    try {
        const requests = await db.all(`
            SELECT 
                r.*,
                m.firstName as mentorName,
                m.lastName as mentorLastName,
                n.firstName as menteeName,
                n.lastName as menteeLastName
            FROM mentoring_requests r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            ORDER BY r.createdAt DESC
        `);

        if (requests.length === 0) {
            console.log('❌ No requests found in database');
            return;
        }

        requests.forEach((request, index) => {
            console.log(`━━━ REQUEST ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Request ID: ${request.id}`);
            console.log(`👨‍🏫 To Mentor: ${request.mentorName} ${request.mentorLastName}`);
            console.log(`👨‍🎓 From Mentee: ${request.menteeName} ${request.menteeLastName}`);
            console.log(`💬 Message: ${request.message}`);
            console.log(`🎯 Goals: ${request.goals || 'Not specified'}`);
            console.log(`⏰ Preferred Schedule: ${request.preferredSchedule || 'Not specified'}`);
            console.log(`📊 Status: ${request.status.toUpperCase()}`);
            console.log(`📅 Requested: ${new Date(request.createdAt).toLocaleDateString()}`);
            console.log();
        });

    } catch (error) {
        console.error('❌ Error viewing requests table:', error);
    }
}

// Show reviews and ratings
async function showReviewsTable() {
    console.log('\n⭐ REVIEWS AND RATINGS\n');
    
    try {
        const reviews = await db.all(`
            SELECT 
                r.*,
                m.firstName as mentorName,
                m.lastName as mentorLastName,
                n.firstName as menteeName,
                n.lastName as menteeLastName,
                s.title as sessionTitle
            FROM reviews r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            LEFT JOIN mentoring_sessions s ON r.sessionId = s.id
            ORDER BY r.createdAt DESC
        `);

        if (reviews.length === 0) {
            console.log('❌ No reviews found in database');
            return;
        }

        reviews.forEach((review, index) => {
            console.log(`━━━ REVIEW ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Review ID: ${review.id}`);
            console.log(`👨‍🏫 Mentor: ${review.mentorName} ${review.mentorLastName}`);
            console.log(`👨‍🎓 Reviewer: ${review.menteeName} ${review.menteeLastName}`);
            console.log(`📚 Session: ${review.sessionTitle || 'General Review'}`);
            console.log(`⭐ Rating: ${review.rating}/5 ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}`);
            console.log(`💬 Comment: ${review.comment || 'No comment provided'}`);
            console.log(`📅 Posted: ${new Date(review.createdAt).toLocaleDateString()}`);
            console.log();
        });

        // Show rating statistics
        const avgRating = await db.get(`SELECT AVG(rating) as avgRating FROM reviews`);
        if (avgRating.avgRating) {
            console.log(`📈 AVERAGE RATING: ${Number(avgRating.avgRating).toFixed(2)}/5.0`);
        }

    } catch (error) {
        console.error('❌ Error viewing reviews table:', error);
    }
}

// Show user notifications
async function showNotificationsTable() {
    console.log('\n🔔 USER NOTIFICATIONS\n');
    
    try {
        const notifications = await db.all(`
            SELECT 
                n.*,
                u.firstName,
                u.lastName,
                u.email
            FROM notifications n
            JOIN users u ON n.userId = u.id
            ORDER BY n.createdAt DESC
        `);

        if (notifications.length === 0) {
            console.log('❌ No notifications found in database');
            return;
        }

        notifications.forEach((notif, index) => {
            console.log(`━━━ NOTIFICATION ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Notification ID: ${notif.id}`);
            console.log(`👤 User: ${notif.firstName} ${notif.lastName} (${notif.email})`);
            console.log(`📂 Type: ${notif.type}`);
            console.log(`📌 Title: ${notif.title}`);
            console.log(`💬 Message: ${notif.message}`);
            console.log(`📊 Status: ${notif.isRead ? '✅ Read' : '📬 Unread'}`);
            console.log(`📅 Created: ${new Date(notif.createdAt).toLocaleString()}`);
            if (notif.data && notif.data !== '{}') {
                console.log(`📋 Data: ${notif.data}`);
            }
            console.log();
        });

    } catch (error) {
        console.error('❌ Error viewing notifications table:', error);
    }
}

// Show activity logs
async function showActivityLogsTable() {
    console.log('\n📋 ACTIVITY LOGS\n');
    
    try {
        const activities = await db.all(`
            SELECT 
                a.*,
                u.firstName,
                u.lastName,
                u.email
            FROM activity_logs a
            JOIN users u ON a.userId = u.id
            ORDER BY a.createdAt DESC
        `);

        if (activities.length === 0) {
            console.log('❌ No activity logs found in database');
            return;
        }

        activities.forEach((activity, index) => {
            console.log(`━━━ ACTIVITY ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Activity ID: ${activity.id}`);
            console.log(`👤 User: ${activity.firstName} ${activity.lastName} (${activity.email})`);
            console.log(`📂 Type: ${activity.type}`);
            console.log(`📝 Description: ${activity.description}`);
            console.log(`📅 Date: ${new Date(activity.createdAt).toLocaleString()}`);
            if (activity.data && activity.data !== '{}') {
                console.log(`📋 Data: ${activity.data}`);
            }
            console.log();
        });

    } catch (error) {
        console.error('❌ Error viewing activity logs table:', error);
    }
}

// Show security events
async function showSecurityEventsTable() {
    console.log('\n🛡️  SECURITY EVENTS\n');
    
    try {
        const events = await db.all(`
            SELECT 
                s.*,
                u.firstName,
                u.lastName,
                u.email
            FROM security_events s
            LEFT JOIN users u ON s.userId = u.id
            ORDER BY s.createdAt DESC
        `);

        if (events.length === 0) {
            console.log('✅ No security events found - System is secure!');
            return;
        }

        events.forEach((event, index) => {
            console.log(`━━━ SECURITY EVENT ${index + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🆔 Event ID: ${event.id}`);
            if (event.firstName) {
                console.log(`👤 User: ${event.firstName} ${event.lastName} (${event.email})`);
            }
            console.log(`⚠️  Type: ${event.type}`);
            console.log(`📝 Description: ${event.description}`);
            console.log(`🚨 Severity: ${event.severity.toUpperCase()}`);
            console.log(`🌐 IP Address: ${event.ipAddress || 'Unknown'}`);
            console.log(`💻 User Agent: ${event.userAgent || 'Unknown'}`);
            console.log(`📅 Date: ${new Date(event.createdAt).toLocaleString()}`);
            if (event.data && event.data !== '{}') {
                console.log(`📋 Data: ${event.data}`);
            }
            console.log();
        });

    } catch (error) {
        console.error('❌ Error viewing security events table:', error);
    }
}

// Helper functions
function getTableIcon(tableName) {
    const icons = {
        'users': '👥',
        'mentoring_sessions': '📚',
        'mentor_mentee_relationships': '🤝',
        'mentoring_requests': '📝',
        'reviews': '⭐',
        'notifications': '🔔',
        'activity_logs': '📋',
        'security_events': '🛡️',
        'password_reset_tokens': '🔐'
    };
    return icons[tableName] || '📄';
}

function getStatusIcon(status) {
    const icons = {
        'upcoming': '📅',
        'completed': '✅',
        'cancelled': '❌',
        'in_progress': '▶️'
    };
    return icons[status] || '📊';
}

// Show sample credentials at the end
function showCredentials() {
    console.log('\n🎯 SAMPLE LOGIN CREDENTIALS FOR TESTING:');
    console.log('─'.repeat(50));
    console.log('👑 Admin: admin@mentorlink.com / password123');
    console.log('👨‍🏫 Mentor: sarah.johnson@email.com / password123');
    console.log('👨‍🎓 Mentee: alex.thompson@email.com / password123');
    console.log('\n🚀 Start your server: npm start');
    console.log('🌐 Visit: http://localhost:3000');
}

// Run the viewer
viewAllData().then(() => {
    showCredentials();
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
