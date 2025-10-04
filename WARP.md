# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: MentorLink — Mentor–Mentee Platform

Summary
- Stack: Node.js/Express backend with SQLite; static frontend (vanilla HTML/CSS/JS)
- Entry point: backend/server.js
- Database: backend/data/mentorship.db (created at runtime)
- Tests: Custom verification script (backend/scripts/testServer.js)
- Seeding: backend/scripts/seedData.js

Commands
- Install dependencies
```powershell path=null start=null
npm install
```

- Seed the database (creates/initializes SQLite and inserts sample data)
```powershell path=null start=null
npm run seed
```

- Start the server (production mode)
```powershell path=null start=null
npm start
```

- Start the server (development with reload)
```powershell path=null start=null
npm run dev
```

- Run the verification test suite (requires the server to be running in another terminal)
```powershell path=null start=null
npm test
```

- Run a single endpoint test (ad-hoc) using the exported ServerTester
  Note: This bypasses the full test runner and executes one check directly.
```powershell path=null start=null
node -e "const T=require('./backend/scripts/testServer');(async()=>{const t=new T();await t.testEndpoint('Mentor Stats','/api/mentor/stats','GET',null,401);t.generateReport&&t.generateReport();})();"
```
  Replace path, method, and expected status as needed. The server must already be running.

- Lint/format
  Not configured. The current scripts print a placeholder message.

- Build
  No build step is required for the current stack. The existing build script references react-scripts (not used here) and can be ignored.

Environment
- Required .env (root). Minimal example:
```ini path=null start=null
PORT=3000
JWT_SECRET=change-me-please
SESSION_SECRET=change-me-too
FRONTEND_URL=http://localhost:3000

# Optional Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```
Notes:
- SMTP is optional; if not set, email notifications are disabled with an informational log.
- On Windows PowerShell, you may set temporary env vars with: $env:JWT_SECRET = 'secret'

High-level architecture
- Server (Express)
  - Entry: backend/server.js
  - Middleware: backend/middleware/
    - auth.js (JWT), cors.js (CORS), session.js (session management)
  - Static assets: Serves frontend/ with explicit content-type headers
  - Routes (mounted under /api):
    - /api/auth, /api/mentor, /api/mentee, /api/sessions, /api/reviews, /api/files, /api/user, /api/notifications, /api/security
  - Frontend pages:
    - / → frontend/components/home/home.html
    - /mentor-dashboard → frontend/components/mentor/dashboard/mentor-dashboard.html
    - /mentee-dashboard → frontend/components/mentee/dashboard/mentee-dashboard.html

- Data layer (SQLite via backend/services/database.js)
  - DB file: backend/data/mentorship.db (auto-created)
  - Initialization: Enables foreign keys, creates tables and indexes on startup
  - Schema includes: users, mentoring_sessions, mentor_mentee_relationships, mentoring_requests, reviews, notifications, activity_logs, security_events, password_reset_tokens
  - Provides run/get/all helpers and simple transaction APIs

- Seeding (backend/scripts/seedData.js)
  - Populates mentors, mentees, an admin, relationships, sessions (completed/upcoming), requests, reviews, notifications, activity logs
  - Default password for all seeded users: password123

- Testing (backend/scripts/testServer.js)
  - Verifies presence of essential files
  - Checks server health and static routes
  - Exercises select API endpoints for expected status codes (e.g., 401 for protected routes when unauthenticated)
  - Produces a summary report
  - Designed to run against a live server (start server first)

Operational details and caveats
- Port handling: The server attempts to start on PORT (default 3000). If the port is in use, it increments and retries up to 10 times.
- Requirements: This is a Node.js project. The requirements.txt file is informational and not used by pip.
- Data reset: Re-running npm run seed clears and re-inserts development data.
- Authentication: Protected endpoints require Authorization: Bearer <JWT>.

Important points distilled from README.md
- Quick start: npm install → npm run seed → npm start → open http://localhost:3000
- Seeded logins exist for both mentors and mentees; email/password is documented in README (password is password123 for all seeded users)
- Frontend uses localStorage key auth_token for JWT and calls the backend under /api
- Email is optional; the app logs when email configuration is incomplete

Rules and external assistants
- No CLAUDE.md, Cursor rules, or Copilot instructions were found in this repository at the time of writing.
