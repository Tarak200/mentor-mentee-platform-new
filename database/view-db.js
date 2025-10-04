#!/usr/bin/env node

/**
 * Database viewer: prints two tables (Mentors and Mentees)
 * Columns: Email | Plain Password (if available) | First Name | Phone
 * Usage: node database/view-db.js
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const TARGET_DB = path.join(__dirname, '..', 'backend', 'data', 'mentorship.db');

function openDb(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function tableExists(db, tableName) {
  const rows = await all(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
  return rows.length > 0;
}

function printTable(title, rows) {
  console.log(`\n${title.toUpperCase()}`);
  console.log('='.repeat(80));
  console.log('Email'.padEnd(30), 'Plain Password'.padEnd(20), 'First Name'.padEnd(20), 'Phone');
  console.log('-'.repeat(80));
  if (rows.length === 0) {
    console.log('(no rows)');
    return;
  }
  for (const r of rows) {
    const email = String(r.email || '').padEnd(30);
    const plain = String(r.plainPassword || r.plain_password || 'N/A').padEnd(20);
    const first = String(r.firstName || r.first_name || '').padEnd(20);
    const phone = String(r.phone || r.mobile_number || '');
    console.log(email, plain, first, phone);
  }
}

async function run() {
  console.log('🔍 Viewing database:', TARGET_DB);
  const db = await openDb(TARGET_DB);
  try {
    const hasUsers = await tableExists(db, 'users');

    if (hasUsers) {
      const mentors = await all(db, `SELECT email, firstName, phone, NULL as plainPassword FROM users WHERE role='mentor' ORDER BY createdAt DESC`);
      const mentees = await all(db, `SELECT email, firstName, phone, NULL as plainPassword FROM users WHERE role='mentee' ORDER BY createdAt DESC`);
      printTable('Mentors', mentors);
      printTable('Mentees', mentees);
    } else {
      // Fallback (older schema with mentors/mentees tables)
      const hasMentors = await tableExists(db, 'mentors');
      const hasMentees = await tableExists(db, 'mentees');
      if (!hasMentors && !hasMentees) {
        console.log('No users/mentors/mentees tables found.');
        return;
      }
      if (hasMentors) {
        const mentors = await all(db, `SELECT email, first_name, mobile_number, password as plainPassword FROM mentors ORDER BY created_at DESC`);
        printTable('Mentors', mentors);
      }
      if (hasMentees) {
        const mentees = await all(db, `SELECT email, first_name, mobile_number, password as plainPassword FROM mentees ORDER BY created_at DESC`);
        printTable('Mentees', mentees);
      }
    }
  } finally {
    db.close();
  }
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});