const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Database Viewer Utility
 * Displays data from all tables in a formatted way
 */

class DatabaseViewer {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'platform.db');
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Connected to database for viewing.');
                resolve();
            });
        });
    }

    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('\nDatabase connection closed.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async getAllTables() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.name));
                }
            });
        });
    }

    async getTableData(tableName) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getTableInfo(tableName) {
        return new Promise((resolve, reject) => {
            this.db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    formatTableData(tableName, data, schema) {
        if (data.length === 0) {
            return `\n📋 Table: ${tableName.toUpperCase()}\n   No data found.\n`;
        }

        let output = `\n📋 Table: ${tableName.toUpperCase()} (${data.length} rows)\n`;
        output += '─'.repeat(50) + '\n';

        // Show schema
        output += 'Schema:\n';
        schema.forEach(col => {
            output += `  ${col.name} (${col.type})${col.pk ? ' [PRIMARY KEY]' : ''}${col.notnull ? ' [NOT NULL]' : ''}\n`;
        });
        output += '\n';

        // Show data
        output += 'Data:\n';
        data.forEach((row, index) => {
            output += `  Row ${index + 1}:\n`;
            Object.entries(row).forEach(([key, value]) => {
                let displayValue = value;
                
                // Format JSON strings
                if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    try {
                        displayValue = JSON.stringify(JSON.parse(value), null, 2);
                    } catch (e) {
                        displayValue = value;
                    }
                }
                
                // Truncate long values
                if (typeof displayValue === 'string' && displayValue.length > 100) {
                    displayValue = displayValue.substring(0, 100) + '...';
                }
                
                output += `    ${key}: ${displayValue}\n`;
            });
            output += '\n';
        });

        return output;
    }

    async displayAllData() {
        try {
            await this.connect();
            
            console.log('🗄️  MENTOR-MENTEE PLATFORM DATABASE VIEWER');
            console.log('=' .repeat(60));
            
            const tables = await this.getAllTables();
            
            if (tables.length === 0) {
                console.log('No tables found in the database.');
                return;
            }

            console.log(`\nFound ${tables.length} tables: ${tables.join(', ')}`);

            for (const table of tables) {
                try {
                    const data = await this.getTableData(table);
                    const schema = await this.getTableInfo(table);
                    console.log(this.formatTableData(table, data, schema));
                } catch (error) {
                    console.error(`Error reading table ${table}:`, error.message);
                }
            }

        } catch (error) {
            console.error('Error viewing database:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    async displayTableStats() {
        try {
            await this.connect();
            
            console.log('📊 DATABASE STATISTICS');
            console.log('=' .repeat(40));
            
            const tables = await this.getAllTables();
            
            for (const table of tables) {
                try {
                    const data = await this.getTableData(table);
                    console.log(`${table}: ${data.length} records`);
                } catch (error) {
                    console.log(`${table}: Error reading (${error.message})`);
                }
            }

        } catch (error) {
            console.error('Error getting statistics:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    async displaySpecificTable(tableName) {
        try {
            await this.connect();
            
            const data = await this.getTableData(tableName);
            const schema = await this.getTableInfo(tableName);
            console.log(this.formatTableData(tableName, data, schema));

        } catch (error) {
            console.error(`Error viewing table ${tableName}:`, error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// CLI interface
async function main() {
    const viewer = new DatabaseViewer();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        await viewer.displayAllData();
    } else if (args[0] === '--stats') {
        await viewer.displayTableStats();
    } else if (args[0] === '--table' && args[1]) {
        await viewer.displaySpecificTable(args[1]);
    } else {
        console.log(`
Usage:
  node db/view-data.js                 # View all data
  node db/view-data.js --stats         # View table statistics
  node db/view-data.js --table <name>  # View specific table
        `);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DatabaseViewer;
