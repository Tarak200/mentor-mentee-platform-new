#!/usr/bin/env node
/**
 * Merge redundants DBs into backend/data/mentorship.db
 * Sources (if exist):
 *  - db/platform.db
 *  - legacy-files/database/platform.db
 * Target: backend/data/mentorship.db (users table)
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const targetDbService = require('../backend/services/database');

console.log("merge-databases.js file is called")
const SOURCES = [
  path.join(__dirname, '..', 'db', 'platform.db'),
  path.join(__dirname, '..', 'legacy-files', 'database', 'platform.db'),
];

function openDb(dbPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dbPath)) return resolve(null);
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

async function tableExists(db, name) {
  if (!db) return false;
  const rows = await all(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [name]);
  return rows.length > 0;
}

async function upsertUser(target, user) {
  const existing = await target.get('SELECT id FROM users WHERE email = ?', [user.email.toLowerCase()]);
  if (existing) return; // skip
  const now = new Date().toISOString();
  await target.run(
    `INSERT INTO users (
      id, firstName, lastName, email, password, role, phone, isActive, emailVerified, settings, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
    [
      user.id,
      user.firstName || '',
      user.lastName || '',
      user.email.toLowerCase(),
      user.password,
      user.role,
      user.phone || null,
      JSON.stringify({ emailNotifications: true, pushNotifications: true, theme: 'light' }),
      now,
      now,
    ]
  );
}

function toUuid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function migrateFromSource(db, roleTable, role) {
  if (!(await tableExists(db, roleTable))) return [];
  const rows = await all(db, `SELECT * FROM ${roleTable}`);
  return rows.map((r) => ({
    id: toUuid(role),
    firstName: r.first_name || '',
    lastName: r.last_name || '',
    email: r.email,
    // If password looks bcrypt-like, keep; else hash
    password: typeof r.password === 'string' && r.password.startsWith('$2') ? r.password : (r.password ? bcrypt.hashSync(r.password, 10) : bcrypt.hashSync('password123', 10)),
    role: role,
    phone: r.mobile_number || null,
  }));
}

async function run() {
  console.log('▶ Initializing target DB...');
  await targetDbService.initialize();

  for (const srcPath of SOURCES) {
    const db = await openDb(srcPath);
    if (!db) continue;
    try {
      console.log('🔗 Reading from source:', srcPath);
      const outMentors = await migrateFromSource(db, 'mentors', 'mentor');
      const outMentees = await migrateFromSource(db, 'mentees', 'mentee');
      for (const u of [...outMentors, ...outMentees]) {
        try {
          await upsertUser(targetDbService, u);
        } catch (e) {
          console.warn('Skip record due to error:', u.email, e.message);
        }
      }
      console.log(`✔ Imported mentors: ${outMentors.length}, mentees: ${outMentees.length}`);
    } finally {
      db.close();
    }
  }

  console.log('✅ Merge completed into backend/data/mentorship.db');
}

run().catch((err) => {
  console.error('❌ Merge failed:', err);
  process.exit(1);
});