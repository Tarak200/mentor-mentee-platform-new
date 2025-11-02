#!/usr/bin/env node

/**
 * Mentor-Mentee Viewer with Hashed & Plain Passwords
 * Usage: node database/view-db.js
 */

const dbService = require("../backend/services/database");

console.log("🔍 MENTOR-MENTEE PLATFORM - USER OVERVIEW\n");

async function viewUsers() {
  try {
    // Ensure DB is initialized
    await dbService.initialize();

    // Fetch mentors
    const mentors = await dbService.all(`
      SELECT id, firstName, lastName, email, password as plainPassword, created_at
      FROM users
      WHERE role = 'mentor'
      ORDER BY created_at DESC
    `);

    // Fetch mentees
    const mentees = await dbService.all(`
      SELECT id, firstName, lastName, email, password as plainPassword, created_at
      FROM users
      WHERE role = 'mentee'
      ORDER BY created_at DESC
    `);

    // Show mentors
    console.log("👨‍🏫 MENTORS");
    console.log("=".repeat(90));
    if (mentors.length === 0) {
      console.log("❌ No mentors found.\n");
    } else {
      mentors.forEach((u, i) => {
        console.log(
          `${i + 1}. ${u.firstName} ${u.lastName} | 📧 ${u.email}\n   🔐 Hashed: ${
            u.password
          }\n   🔑 Plain : ${u.plainPassword || "N/A"}\n   📅 ${u.created_at}\n`
        );
      });
    }

    // Show mentees
    console.log("👨‍🎓 MENTEES");
    console.log("=".repeat(90));
    if (mentees.length === 0) {
      console.log("❌ No mentees found.\n");
    } else {
      mentees.forEach((u, i) => {
        console.log(
          `${i + 1}. ${u.firstName} ${u.lastName} | 📧 ${u.email}\n   🔐 Hashed: ${
            u.password
          }\n   🔑 Plain : ${u.plainPassword || "N/A"}\n   📅 ${u.created_at}\n`
        );
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    process.exit(1);
  }
}

viewUsers();
