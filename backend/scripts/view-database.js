#!/usr/bin/env node

const db = require('../services/database');
const path = require('path');

console.log('🔍 MENTOR-MENTEE PLATFORM - DATABASE VIEWER\n');

async function viewDatabase() {
    try {
        await db.initialize();
        
        console.log('📊 DATABASE OVERVIEW\n');
        
        // Count records in each table
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
                console.log(`📋 ${table}: ${result.count} records`);
            } catch (err) {
                console.log(`❌ ${table}: Error counting records - ${err.message}`);
            }
        }
        
        console.log('\n👥 USERS SAMPLE DATA:');
        const users = await db.all('SELECT id, firstName, lastName, email, role, education, institution, isActive FROM users LIMIT 10');
        console.table(users);
        
        console.log('\n🔐 LOGIN CREDENTIALS:');
        const loginData = await db.all('SELECT email, role FROM users WHERE role IN ("mentor", "mentee", "admin") ORDER BY role');
        loginData.forEach(user => {
            const icon = user.role === 'admin' ? '👑' : user.role === 'mentor' ? '👨‍🏫' : '👨‍🎓';
            console.log(`${icon} ${user.email} / password123`);
        });
        
        console.log('\n📚 SESSIONS SAMPLE DATA:');
        const sessions = await db.all(`
            SELECT s.id, s.title, s.status, s.scheduledAt, 
                   u1.firstName || ' ' || u1.lastName as mentorName, 
                   u2.firstName || ' ' || u2.lastName as menteeName
            FROM mentoring_sessions s
            JOIN users u1 ON s.mentorId = u1.id
            JOIN users u2 ON s.menteeId = u2.id
            LIMIT 5
        `);
        console.table(sessions);
        
        console.log('\n🤝 MENTOR-MENTEE RELATIONSHIPS:');
        const relationships = await db.all(`
            SELECT 
                m.firstName || ' ' || m.lastName as mentor,
                n.firstName || ' ' || n.lastName as mentee,
                r.status
            FROM mentor_mentee_relationships r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            LIMIT 5
        `);
        console.table(relationships);
        
        console.log('\n📝 MENTORING REQUESTS:');
        const requests = await db.all(`
            SELECT 
                m.firstName || ' ' || m.lastName as mentor,
                n.firstName || ' ' || n.lastName as mentee,
                r.status,
                substr(r.message, 1, 50) || '...' as message_preview
            FROM mentoring_requests r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            LIMIT 5
        `);
        if (requests.length > 0) {
            console.table(requests);
        } else {
            console.log('   No requests found');
        }
        
        console.log('\n⭐ REVIEWS:');
        const reviews = await db.all(`
            SELECT 
                m.firstName || ' ' || m.lastName as mentor,
                n.firstName || ' ' || n.lastName as mentee,
                r.rating,
                substr(r.comment, 1, 50) || '...' as comment_preview
            FROM reviews r
            JOIN users m ON r.mentorId = m.id
            JOIN users n ON r.menteeId = n.id
            LIMIT 5
        `);
        if (reviews.length > 0) {
            console.table(reviews);
        } else {
            console.log('   No reviews found');
        }
        
        console.log('\n📍 Database file location:');
        console.log(`   ${path.join(__dirname, '..', 'data', 'mentorship.db')}`);
        
        console.log('\n🎯 SAMPLE SQL QUERIES TO TRY:');
        console.log('-- View all mentors with their details');
        console.log('SELECT firstName, lastName, email, education, institution, subjects FROM users WHERE role = "mentor";\n');
        
        console.log('-- View upcoming sessions');
        console.log('SELECT * FROM mentoring_sessions WHERE status = "upcoming";\n');
        
        console.log('-- View mentor-mentee relationships with names');
        console.log('SELECT m.firstName as mentor, n.firstName as mentee, r.status FROM mentor_mentee_relationships r');
        console.log('JOIN users m ON r.mentorId = m.id JOIN users n ON r.menteeId = n.id;\n');
        
        console.log('-- View mentors with their qualifications');
        console.log('SELECT firstName, lastName, qualifications, subjects, hourlyRate FROM users WHERE role = "mentor";\n');
        
        await db.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database viewing error:', error);
        process.exit(1);
    }
}

viewDatabase();