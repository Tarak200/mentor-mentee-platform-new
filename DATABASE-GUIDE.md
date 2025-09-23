# 🗄️ Database Initialization & VS Code Viewing Guide

## ✅ **DATABASE SUCCESSFULLY INITIALIZED!**

Your mentor-mentee platform database has been set up with sample data.

### 📊 **Database Statistics**
- 👥 **Users**: 10 (4 mentors, 5 mentees, 1 admin)
- 📚 **Sessions**: 5 (2 completed, 3 upcoming)
- 🤝 **Relationships**: 5 mentor-mentee pairs
- 📝 **Requests**: 2 pending mentoring requests
- ⭐ **Reviews**: 2 completed reviews
- 🔔 **Notifications**: 3 user notifications
- 📋 **Activities**: 4 activity logs

### 📍 **Database Location**
```
C:\Users\suren\mentor-mentee-platform\backend\data\mentorship.db
```

---

## 🎯 **Sample Login Credentials**

### Admin Account
- **Email**: `admin@mentorlink.com`
- **Password**: `password123`

### Mentor Accounts
- **Sarah Johnson**: `sarah.johnson@email.com` / `password123`
- **Michael Chen**: `michael.chen@email.com` / `password123`
- **Emma Williams**: `emma.williams@email.com` / `password123`
- **David Rodriguez**: `david.rodriguez@email.com` / `password123`

### Mentee Accounts
- **Alex Thompson**: `alex.thompson@email.com` / `password123`
- **Jessica Davis**: `jessica.davis@email.com` / `password123`
- **Ryan Kim**: `ryan.kim@email.com` / `password123`
- **Sophia Martinez**: `sophia.martinez@email.com` / `password123`
- **James Wilson**: `james.wilson@email.com` / `password123`

---

## 🔍 **Viewing Database in VS Code**

### **Step 1: Install SQLite Extension**
1. Open VS Code
2. Press `Ctrl + Shift + X` to open Extensions
3. Search for "**SQLite**" by **alexcvzz**
4. Click **Install**

### **Step 2: Open Database**
1. Press `Ctrl + Shift + P` to open Command Palette
2. Type "**SQLite: Open Database**"
3. Navigate to: `backend/data/mentorship.db`
4. Click **Open**

### **Step 3: Explore Tables**
Once opened, you'll see the database in the **SQLite Explorer** panel:

#### 📋 **Available Tables**
- `users` - All platform users (mentors, mentees, admin)
- `mentoring_sessions` - Scheduled and completed sessions
- `mentor_mentee_relationships` - Active mentor-mentee pairs
- `mentoring_requests` - Pending mentoring requests
- `reviews` - Session reviews and ratings
- `notifications` - User notifications
- `activity_logs` - User activity tracking
- `security_events` - Security event logs
- `password_reset_tokens` - Password reset tokens

---

## 🛠️ **Database Management Commands**

### **Initialize Database** (Already done)
```bash
node init-database.js
```

### **View Database Overview**
```bash
node view-database.js
```

### **Re-seed Database** (Clear and reload sample data)
```bash
cd backend
node scripts/seedData.js
```

---

## 📝 **Useful SQL Queries**

### **View All Mentors**
```sql
SELECT firstName, lastName, email, skills, hourlyRate 
FROM users 
WHERE role = 'mentor';
```

### **View All Mentees**
```sql
SELECT firstName, lastName, email, skills 
FROM users 
WHERE role = 'mentee';
```

### **View Upcoming Sessions**
```sql
SELECT 
    s.title, 
    s.scheduledAt, 
    m.firstName as mentor, 
    n.firstName as mentee
FROM mentoring_sessions s
JOIN users m ON s.mentorId = m.id
JOIN users n ON s.menteeId = n.id
WHERE s.status = 'upcoming';
```

### **View Mentor-Mentee Relationships**
```sql
SELECT 
    m.firstName as mentor_name,
    m.email as mentor_email,
    n.firstName as mentee_name,
    n.email as mentee_email,
    r.status
FROM mentor_mentee_relationships r
JOIN users m ON r.mentorId = m.id
JOIN users n ON r.menteeId = n.id;
```

### **View Session History with Reviews**
```sql
SELECT 
    s.title,
    s.status,
    s.amount,
    r.rating,
    r.comment
FROM mentoring_sessions s
LEFT JOIN reviews r ON s.id = r.sessionId
WHERE s.status = 'completed';
```

---

## 🚀 **Next Steps**

### **1. Start the Server**
```bash
cd backend
npm start
```

### **2. Test Login**
- Visit: http://localhost:3000
- Click "Get Started as Mentor" or "Get Started as Mentee"
- Login with any of the sample credentials above

### **3. Explore the Application**
- Test mentor dashboard
- Test mentee dashboard
- Schedule sessions
- Leave reviews

---

## 🔧 **Troubleshooting**

### **Database Not Found**
If you get database errors:
1. Make sure you're in the project root directory
2. Run: `node init-database.js`
3. Check if `backend/data/mentorship.db` exists

### **VS Code SQLite Extension Issues**
1. Make sure the extension is installed
2. Restart VS Code after installation
3. Try opening database with: `Ctrl + Shift + P` → "SQLite: Open Database"

### **Permission Issues**
If you get permission errors on Windows:
1. Run VS Code as Administrator
2. Or change folder permissions for the project directory

---

## 📚 **Database Schema Overview**

```
users
├── id (PRIMARY KEY)
├── firstName, lastName
├── email (UNIQUE)
├── password (hashed)
├── role (mentor/mentee/admin)
├── bio, skills, avatar
├── hourlyRate
└── timestamps

mentoring_sessions
├── id (PRIMARY KEY)
├── mentorId, menteeId (FOREIGN KEYS)
├── title, description
├── scheduledAt, duration
├── status, amount
└── timestamps

mentor_mentee_relationships
├── id (PRIMARY KEY)  
├── mentorId, menteeId (FOREIGN KEYS)
├── status
└── timestamps
```

Your database is ready to use! 🎉
