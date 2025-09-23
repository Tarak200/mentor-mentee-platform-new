#!/usr/bin/env node

const db = require('./backend/services/database');
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
            'security_events'
        ];
        
        for (const table of tables) {
            try {
                const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`📋 ${table}: ${result.count} records`);
            } catch (err) {
                console.log(`❌ ${table}: Error counting records`);
            }
        }
        
        console.log('👥 USERS SAMPLE DATA (with passwords):');
        const users = await db.all('SELECT id, firstName, lastName, email, password, role, isActive FROM users LIMIT 10');
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
                   u1.firstName as mentorName, u2.firstName as menteeName
            FROM mentoring_sessions s
            JOIN users u1 ON s.mentorId = u1.id
            JOIN users u2 ON s.menteeId = u2.id
            LIMIT 5
        `);
        console.table(sessions);
        
        console.log('\n📍 Database file location:');
        console.log(`   ${path.join(__dirname, 'backend', 'data', 'mentorship.db')}`);
        
        console.log('\n🎯 SAMPLE SQL QUERIES TO TRY:');
        console.log('-- View all mentors');
        console.log('SELECT * FROM users WHERE role = "mentor";');
        console.log('\n-- View upcoming sessions');
        console.log('SELECT * FROM mentoring_sessions WHERE status = "upcoming";');
        console.log('\n-- View mentor-mentee relationships');
        console.log('SELECT m.firstName as mentor, n.firstName as mentee FROM mentor_mentee_relationships r');
        console.log('JOIN users m ON r.mentorId = m.id JOIN users n ON r.menteeId = n.id;');
        
    } catch (error) {
        console.error('❌ Database viewing error:', error);
    }
}

viewDatabase();
