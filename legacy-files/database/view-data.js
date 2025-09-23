const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './database/platform.db';

// Connect to database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('🔍 Connected to SQLite database for viewing data\n');
});

// Function to display table data
function displayTable(tableName, callback) {
    console.log(`\n📋 === ${tableName.toUpperCase()} TABLE ===`);
    
    // First, get table info
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
            console.error(`Error getting ${tableName} info:`, err.message);
            return callback();
        }
        
        // Display column structure
        console.log('📊 Columns:', columns.map(col => `${col.name} (${col.type})`).join(', '));
        
        // Get row count
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, countResult) => {
            if (err) {
                console.error(`Error counting ${tableName}:`, err.message);
                return callback();
            }
            
            console.log(`📈 Total records: ${countResult.count}`);
            
            if (countResult.count > 0) {
                // Display data
                db.all(`SELECT * FROM ${tableName} LIMIT 10`, (err, rows) => {
                    if (err) {
                        console.error(`Error fetching ${tableName}:`, err.message);
                        return callback();
                    }
                    
                    if (rows.length > 0) {
                        console.log('📄 Sample data:');
                        rows.forEach((row, index) => {
                            console.log(`  Record ${index + 1}:`);
                            Object.keys(row).forEach(key => {
                                let value = row[key];
                                // Format JSON fields
                                if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                                    try {
                                        value = JSON.parse(value);
                                        value = JSON.stringify(value, null, 2);
                                    } catch (e) {
                                        // Not JSON, keep as string
                                    }
                                }
                                console.log(`    ${key}: ${value}`);
                            });
                            console.log('');
                        });
                        
                        if (countResult.count > 10) {
                            console.log(`    ... and ${countResult.count - 10} more records`);
                        }
                    } else {
                        console.log('📭 No data in this table');
                    }
                    
                    callback();
                });
            } else {
                console.log('📭 No data in this table');
                callback();
            }
        });
    });
}

// List of tables to check
const tables = [
    'mentors',
    'mentees',
    'connection_requests',
    'sessions',
    'reviews',
    'payments'
];

let currentTable = 0;

function viewNextTable() {
    if (currentTable < tables.length) {
        displayTable(tables[currentTable], () => {
            currentTable++;
            viewNextTable();
        });
    } else {
        console.log('\n✅ Database viewing complete!');
        console.log('\n💡 Tips:');
        console.log('   - Register some users to see data');
        console.log('   - Use the web interface to create mentors/mentees');
        console.log('   - Run this script again to see updated data');
        
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('\n🔒 Database connection closed.');
            }
        });
    }
}

// Start viewing
console.log('🗄️  MENTOR-MENTEE PLATFORM DATABASE VIEWER');
console.log('===========================================');

// First show database info
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err.message);
        return;
    }
    
    console.log(`📁 Database location: ${path.resolve(dbPath)}`);
    console.log(`🏗️  Tables found: ${tables.map(t => t.name).join(', ')}`);
    
    // Start viewing tables
    viewNextTable();
});
