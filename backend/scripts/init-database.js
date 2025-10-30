#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🗄️  MENTOR-MENTEE PLATFORM - DATABASE INITIALIZATION\n');

async function initializeDatabase() {
    try {
        // Import and run the seeder
        console.log('📦 Loading database seeder...');
        const SeedData = require('./seedData');
        const seeder = new SeedData();
        
        console.log('🔄 Starting database initialization and seeding...\n');
        const result = await seeder.seedDatabase();
        
        if (result.success) {
            console.log('\n✅ DATABASE INITIALIZATION COMPLETE!');
            console.log('📊 Database Statistics:');
            console.log(`   👥 Users: ${result.stats.users}`);
            console.log(`   📚 Sessions: ${result.stats.sessions}`);
            console.log(`   🤝 Relationships: ${result.stats.relationships}`);
            console.log(`   📝 Requests: ${result.stats.requests}`);
            console.log(`   ⭐ Reviews: ${result.stats.reviews}`);
            console.log(`   🔔 Notifications: ${result.stats.notifications}`);
            console.log(`   📋 Activities: ${result.stats.activities}`);
            
            console.log('\n🎯 SAMPLE LOGIN CREDENTIALS:');
            console.log('📧 Admin: admin@mentorlink.com / password123');
            console.log('👨‍🏫 Mentor: sarah.johnson@email.com / password123');
            console.log('👨‍🎓 Mentee: alex.thompson@email.com / password123');
            
            console.log('\n📍 Database Location:');
            const dbPath = path.join(__dirname, '..', 'data', 'mentorship.db');
            console.log(`   ${dbPath}`);
            
            console.log('\n🚀 Next Steps:');
            console.log('1. Install SQLite VS Code extension (if not installed)');
            console.log('2. Open VS Code in this project directory');
            console.log('3. Use Ctrl+Shift+P → "SQLite: Open Database"');
            console.log('4. Navigate to: backend/data/mentorship.db');
            console.log('5. Start your server: npm start');
            
        } else {
            console.log('❌ Database initialization failed');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure you\'re in the backend/scripts directory');
        console.log('2. Run: npm install (to ensure dependencies are installed)');
        console.log('3. Check if backend/services/database.js exists');
        console.log('4. Check if backend/scripts/seedData.js exists');
        process.exit(1);
    }
}

initializeDatabase();