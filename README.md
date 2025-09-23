# MentorLink — Mentor–Mentee Platform

A full‑stack mentoring platform that connects mentors and mentees for structured learning, session booking, progress tracking, and secure communication.

This repository contains:
- A modular Node.js/Express backend (with SQLite)
- A component‑based frontend (vanilla HTML/CSS/JS)
- Security‑focused middleware and client‑side protections
- Seed data and a verification script to validate your installation

---

## Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Seeding and sample logins](#seeding-and-sample-logins)
- [Running and testing](#running-and-testing)
- [Frontend routes](#frontend-routes)
- [API overview](#api-overview)
- [Security highlights](#security-highlights)
- [Troubleshooting (Windows)](#troubleshooting-windows)
- [Development notes](#development-notes)
- [License](#license)

---

## Features
- Role‑based dashboards
  - Mentor dashboard: mentees, sessions, schedule, earnings, requests
  - Mentee dashboard: mentor discovery, sessions, schedule, progress, requests, profile
- Session management: book, list, update lifecycle (start/end/cancel), upcoming
- Mentor discovery: search with skills/rating/rate filters
- Notifications: list, mark read, preferences, simple email templates (SMTP optional)
- User management: profile, avatar upload, settings, password change
- Security: JWT auth, headers, input sanitation, basic client‑side protections, event logging
- Seed data and a verification script for a working demo

---

## Architecture
```
mentor-mentee-platform/
├─ backend/
│  ├─ controllers/
│  │  ├─ authController.js
│  │  └─ userController.js
│  ├─ middleware/
│  │  ├─ auth.js
│  │  ├─ cors.js
│  │  ├─ session.js
│  │  └─ upload.js
│  ├─ routes/
│  │  ├─ auth.js
│  │  ├─ mentor.js
│  │  ├─ mentee.js
│  │  ├─ sessions.js
│  │  ├─ reviews.js
│  │  ├─ notifications.js
│  │  ├─ security.js
│  │  ├─ files.js
│  │  └─ user.js
│  ├─ services/
│  │  ├─ database.js (SQLite + schema + helpers)
│  │  ├─ userService.js
│  │  ├─ mentorService.js
│  │  ├─ menteeService.js
│  │  ├─ sessionService.js
│  │  ├─ emailService.js
│  │  ├─ notificationService.js
│  │  └─ securityService.js
│  ├─ scripts/
│  │  ├─ seedData.js
│  │  └─ testServer.js
│  └─ server.js
├─ frontend/
│  ├─ components/
│  │  ├─ auth/
│  │  │  ├─ register.html
│  │  ├─ mentor-dashboard/
│  │  │  ├─ mentor-dashboard.html/css/js (+ security)
│  │  └─ mentee-dashboard/
│  │     ├─ mentee-dashboard.html/css/js (+ security)
│  └─ shared/
│     ├─ js/ (api.js, auth.js, utils.js, security.js)
│     └─ css/ (common.css)
└─ package.json
```

Backend persistence: SQLite database (created at runtime) in `backend/data/mentorship.db`.

---

## Prerequisites
- Node.js ≥ 18 (tested with Node 22)
- npm ≥ 8
- Windows PowerShell (you can use any shell; examples show PowerShell commands)

Optional (for email):
- SMTP credentials (e.g., Gmail app password) if you want to enable email notifications

---

## Quick start
1) Install dependencies
```powershell
npm install
```

2) Seed the database (creates/initializes SQLite and inserts sample data)
```powershell
npm run seed
```

3) Start the server
```powershell
npm start
```

4) Open the app
- http://localhost:3000/
- Mentee dashboard: http://localhost:3000/mentee-dashboard
- Mentor dashboard: http://localhost:3000/mentor-dashboard
- Register: http://localhost:3000/register

---

## Environment variables
Create a `.env` file in the repository root. Minimal example:
```ini
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
- Email is optional. If you skip SMTP settings you’ll see: “Email configuration incomplete. Email notifications disabled.” — this is expected.
- On Windows, you can set environment variables in PowerShell temporarily: `$env:JWT_SECRET = 'secret'` (for the current session).

---

## Seeding and sample logins
The seed inserts users, relationships, sessions, requests, reviews, notifications, and activity.

Default password for all seeded users: `password123`

Mentors:
- sarah.johnson@email.com
- michael.chen@email.com
- emma.williams@email.com
- david.rodriguez@email.com

Mentees:
- alex.thompson@email.com
- jessica.davis@email.com
- ryan.kim@email.com
- sophia.martinez@email.com
- james.wilson@email.com

Admin:
- admin@mentorlink.com (not exposed in UI by default; useful for future extensions)

---

## Running and testing
Start the server:
```powershell
npm start
```
Run the verification suite (optional but recommended):
```powershell
npm test
```
What it checks:
- Server health and static page responses
- Expected error codes for unauthenticated protected endpoints
- Basic structure sanity

If everything is green, you’re ready to explore the app.

---

## Frontend routes
- `/` — Home (static welcome)
- `/login` — Login page (if present)
- `/register` — Registration page (present)
- `/mentee-dashboard` — Mentee dashboard
- `/mentor-dashboard` — Mentor dashboard

The dashboards consume the backend API using the stored JWT (localStorage key: `auth_token`).

---

## API overview
All API routes are under `/api`.

Auth
- `POST /api/auth/register` — Register (body: firstName, lastName, email, password, role: mentor|mentee)
- `POST /api/auth/login` — Login (body: email, password)
- `POST /api/auth/logout` — Logout (stateless; client clears token)
- `POST /api/auth/forgot-password` — Start reset
- `POST /api/auth/reset-password` — Complete reset
- `GET  /api/auth/verify` — Verify token

User
- `GET  /api/user/profile`
- `PUT  /api/user/profile`
- `POST /api/user/avatar` (multipart/form‑data; field: avatar)
- `POST /api/user/change-password`
- `GET  /api/user/settings`
- `PUT  /api/user/settings`
- `GET  /api/user/activity`

Mentee
- `GET  /api/mentee/stats`
- `GET  /api/mentee/mentors`
- `GET  /api/mentee/find-mentors` (filters: skills, minRating, maxRate, search)
- `GET  /api/mentee/sessions` (filters: status, mentorId, dateFrom, dateTo)
- `POST /api/mentee/sessions` (book session)
- `GET  /api/mentee/requests`
- `POST /api/mentee/request`
- `GET  /api/mentee/today-schedule`
- `GET  /api/mentee/progress`

Mentor
- `GET  /api/mentor/stats`
- `GET  /api/mentor/mentees`
- `GET  /api/mentor/sessions`
- `POST /api/mentor/sessions` (create)
- `GET  /api/mentor/schedule` and `/schedule/today`
- `GET  /api/mentor/earnings`
- `GET  /api/mentor/activity`
- `GET  /api/mentor/requests/pending`
- `POST /api/mentor/requests/:requestId/accept`

Sessions
- `GET  /api/sessions/upcoming` (current user)
- `GET  /api/sessions/history` (filters: status[], dateFrom, dateTo, otherPartyId)
- `GET  /api/sessions/:id`
- `PUT  /api/sessions/:id`
- `POST /api/sessions/:id/start`
- `POST /api/sessions/:id/end`
- `PUT  /api/sessions/:id/cancel`

Notifications
- `GET  /api/notifications`
- `GET  /api/notifications/count`
- `PUT  /api/notifications/:id/read`
- `PUT  /api/notifications/mark-all-read`
- `GET  /api/notifications/preferences`
- `PUT  /api/notifications/preferences`

Security
- `POST /api/security/log`
- `GET  /api/security/events`
- `GET  /api/security/summary`
- `POST /api/security/incident`

Notes:
- Protected endpoints require `Authorization: Bearer <JWT>`
- Request/response objects are normalized as `{ success, data, message }` in most new endpoints

---

## Security highlights
- JWT authentication for API access
- HTTP security headers (CSP, X‑Content‑Type‑Options, X‑Frame‑Options)
- Input sanitization on backend and client
- Rate‑limit shims and basic suspicious‑behavior detection on client
- File uploads filtered by type and size (see `middleware/upload.js`)
- Security event logging endpoints for audit trails

---

## Troubleshooting (Windows)
Port already in use (EADDRINUSE)
```powershell
# Kill all Node processes using PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Server not starting or blank page
- Check logs:
```powershell
Get-Content -Tail 100 server.err.log
```
- Ensure `.env` is created and `npm run seed` has been executed

Auth login returns 401
- This is expected with wrong credentials. Use seeded accounts or register first

“Email configuration incomplete…”
- SMTP is optional; this is informational only

---

## Development notes
Coding patterns
- Keep logic in services; routes/controllers should stay thin
- Prefer parameterized queries via the DB service
- Use existing utils for sanitization and validation

Database
- SQLite DB is at `backend/data/mentorship.db`
- Re‑seeding is safe for development and will reset all data

Extending the app
- Add service functions → expose via routes → wire up UI components
- See `menteeService.js`, `sessionService.js`, and `notificationService.js` as templates

Testing ideas (next steps)
- Unit tests for services/controllers (e.g., Jest)
- Integration tests for critical flows (register → login → book session)

---

## License
MIT — see `LICENSE` if included; otherwise, you may treat this repository as MIT-licensed for internal development.

## 🏗️ Project Structure

The project has been reorganized into a clean, modular structure:

```
mentor-mentee-platform/
├── backend/                    # Backend API and server logic
│   ├── controllers/           # Request handlers and business logic
│   ├── middleware/            # Authentication, CORS, session management
│   │   ├── auth.js           # JWT authentication middleware
│   │   ├── cors.js           # CORS configuration
│   │   └── session.js        # Session and passport configuration
│   ├── routes/               # API route definitions
│   │   ├── auth.js           # Authentication routes
│   │   ├── mentors.js        # Mentor-specific routes
│   │   ├── mentees.js        # Mentee-specific routes
│   │   └── sessions.js       # Session management routes
│   ├── services/             # Business logic and external integrations
│   │   ├── auth.js           # Authentication service
│   │   ├── database.js       # Database service wrapper
│   │   └── notification.js   # SMS and email notifications
│   ├── utils/                # Helper functions and utilities
│   └── server.js             # Main server entry point
├── frontend/                  # Frontend components and assets
│   ├── components/           # Modular UI components
│   │   ├── home/             # Home page component
│   │   │   ├── home.html     # HTML structure
│   │   │   ├── home.css      # Component styles
│   │   │   ├── home.js       # Functionality
│   │   │   └── home-security.js # Security measures
│   │   ├── auth/             # Authentication components
│   │   ├── mentor-dashboard/ # Mentor dashboard component
│   │   ├── mentee-dashboard/ # Mentee dashboard component
│   │   └── shared/           # Shared CSS, JS, and utilities
│   │       ├── shared.css    # Global styles
│   │       └── shared.js     # Common utilities
│   └── config/               # Frontend configuration and routing
│       └── app-config.js     # Application configuration
├── db/                       # Database files and management
│   ├── migrations/           # Database schema migrations
│   │   └── 001_initial_setup.js # Initial database setup
│   ├── seeds/               # Sample data and test fixtures
│   ├── models/              # Database model definitions
│   ├── view-data.js         # Database inspection utility
│   └── platform.db          # SQLite database file
├── legacy-files/            # Original files (backup)
│   ├── server.js            # Original monolithic server
│   ├── public/             # Original frontend files
│   └── database/           # Original database files
├── .env                     # Environment variables
├── .env.example            # Environment template
└── package.json            # Dependencies and scripts
```

## 🚀 Key Improvements

### ✅ **Better Code Organization**
- **Modular Backend**: Separated routes, middleware, services, and utilities
- **Component-based Frontend**: Each component has its own HTML, CSS, JS, and security files
- **Clean Database Structure**: Migrations, seeds, and models in separate directories

### ✅ **Enhanced Security**
- **XSS Protection**: Input sanitization and CSP headers in each component
- **Rate Limiting**: Component-level protection against spam
- **SQL Injection Prevention**: Parameterized queries and input validation
- **Security Logging**: Comprehensive security event tracking

### ✅ **Improved Debugging**
- **Component Isolation**: Easy to identify and fix issues in specific components
- **Structured Logging**: Clear error tracking and performance monitoring
- **Separation of Concerns**: Each file has a single responsibility

### ✅ **Better Maintainability**
- **Modular Services**: Authentication, notifications, and database operations separated
- **Configuration Management**: Centralized frontend configuration system
- **Legacy Support**: Original files preserved for reference

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- SQLite3

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mentor-mentee-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📝 Available Scripts

### Development
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

### Database Management
- `npm run migrate` - Run database migrations
- `npm run db:view` - View database contents
- `npm run db:setup` - Setup database with sample data

### Legacy Support
- `npm run legacy:init-db` - Run original database setup
- `npm run legacy:view-db` - View database with original method

## 🏗️ Architecture Overview

### Backend Architecture (Layered Pattern)

1. **Routes Layer** (`/backend/routes/`): Handle HTTP requests and routing
2. **Middleware Layer** (`/backend/middleware/`): Authentication, CORS, sessions
3. **Service Layer** (`/backend/services/`): Business logic and external integrations
4. **Data Layer** (`/backend/services/database.js`): Database operations

### Frontend Architecture (Component-Based)

Each component follows this structure:
- **HTML**: Component structure and layout
- **CSS**: Component-specific styling
- **JavaScript**: Component functionality and interactions
- **Security**: XSS protection and input validation

### Database Design (Improved Schema)

Enhanced tables with better relationships and constraints:
- **mentors** / **mentees**: User profiles with comprehensive fields
- **connection_requests**: Mentor-mentee connection system
- **sessions**: Scheduled mentoring sessions with detailed tracking
- **reviews**: Rating and review system
- **payments**: Payment tracking with commission handling
- **notifications**: Comprehensive notification logging

## 🔐 Security Features

### Frontend Security
- **XSS Prevention**: Input sanitization in each component
- **CSP Headers**: Content Security Policy implementation
- **Rate Limiting**: Component-level action throttling
- **Input Validation**: Real-time validation and sanitization

### Backend Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Prevention**: Parameterized queries
- **Security Headers**: Comprehensive security header setup

## 🚀 Getting Started

1. **Run the migration to set up your database:**
   ```bash
   npm run migrate
   ```

2. **View your database structure:**
   ```bash
   npm run db:view
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser to:**
   ```
   http://localhost:3000
   ```

## 📊 Monitoring and Debugging

### Component-Level Debugging
- Each component has isolated error handling
- Security events are logged per component
- Performance monitoring built into each component

### Database Inspection
```bash
# View all data
npm run db:view

# View specific table
node db/view-data.js --table mentors

# View statistics
node db/view-data.js --stats
```

### Server Monitoring
- Request/response logging
- Authentication event tracking
- Performance metrics collection

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./db/platform.db

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Notifications
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SMS_NOTIFICATIONS_ENABLED=true

# Platform Settings
PLATFORM_UPI_ID=yourplatform@upi
PLATFORM_COMMISSION_PERCENTAGE=10
```

## 🆚 Comparison: Before vs After

| Aspect | Before (Monolithic) | After (Restructured) |
|--------|-------------------|---------------------|
| **Structure** | Single server.js file (1000+ lines) | Modular architecture with separated concerns |
| **Frontend** | All files in /public directory | Component-based structure with security |
| **Database** | Basic SQLite setup | Migrations, seeds, and models |
| **Security** | Basic authentication | Comprehensive security per component |
| **Debugging** | Hard to isolate issues | Component-level error isolation |
| **Maintainability** | Difficult to modify | Easy to extend and maintain |
| **Testing** | Monolithic testing | Component-level testing possible |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the established architecture patterns:
   - Add new frontend components in `/frontend/components/`
   - Add backend services in `/backend/services/`
   - Include security measures for each component
4. Test your changes
5. Submit a pull request

## 📄 Migration from Old Structure

If you have the old version:

1. **Backup your database**: The old database files are preserved in `/legacy-files/`
2. **Environment variables**: Copy settings from old `.env` to new structure
3. **Custom modifications**: Check `/legacy-files/` for any custom code to migrate
4. **Run migrations**: Use `npm run migrate` to set up the new database structure

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Reset database
   npm run migrate
   ```

2. **Frontend Components Not Loading**
   - Check browser console for errors
   - Verify paths in `/frontend/config/app-config.js`

3. **Authentication Issues**
   - Verify JWT_SECRET is set in `.env`
   - Check Google OAuth credentials

### Performance Issues

1. **Slow Database Queries**
   - Check query execution with `npm run db:view`
   - Consider adding indexes for frequently used fields

2. **Frontend Loading Issues**
   - Components are loaded dynamically
   - Check network tab for failed requests

## 📞 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create an issue in the repository
- **Legacy Code**: Check `/legacy-files/` for reference

---

## 🎉 Summary of Improvements

✅ **Modular Architecture**: Clean separation of concerns  
✅ **Enhanced Security**: Component-level XSS and input protection  
✅ **Better Debugging**: Isolated components for easier troubleshooting  
✅ **Improved Maintainability**: Easy to extend and modify  
✅ **Database Migrations**: Version-controlled database schema  
✅ **Comprehensive Logging**: Better error tracking and monitoring  
✅ **Legacy Compatibility**: Original files preserved for reference  

**The restructured codebase maintains all original functionality while providing a much cleaner, more secure, and maintainable architecture. Perfect for debugging, extending, and long-term maintenance! 🚀**
