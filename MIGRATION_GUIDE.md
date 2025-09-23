# Database Migration Guide: Separate Mentor and Mentee Tables

## 🔄 What Changed?

The database structure has been updated to have **completely separate tables** for mentors and mentees instead of a unified users table with separate details tables.

## 📋 **Old Structure vs New Structure**

### **Before (Combined):**
```
users (all users)
├── mentor_details (mentor-specific data)
└── mentee_details (mentee-specific data)
```

### **After (Separate):**
```
mentors (complete mentor information)
mentees (complete mentee information)
```

## 🗂️ **New Table Structure**

### **📚 Mentors Table**
Contains all mentor information in one place:
- Basic info: name, email, age, education, etc.
- Mentor-specific: hourly_rate, qualifications, subjects
- Stats: rating, total_sessions, total_earnings
- Settings: is_active, profile_picture

### **🎓 Mentees Table**
Contains all mentee information in one place:
- Basic info: name, email, age, education, etc.
- Mentee-specific: interests, budget_min, budget_max
- Stats: total_sessions
- Settings: is_active, profile_picture

## 🚀 **Migration Steps**

### **Step 1: Initialize New Database Structure**
```bash
cd "C:\Users\suren\mentor-mentee-platform"
npm run init-db-separate
```

This will:
- ✅ Drop old tables (users, mentor_details, mentee_details)
- ✅ Create new separate tables (mentors, mentees)
- ✅ Update all related tables (sessions, reviews, etc.)

### **Step 2: Verify Migration**
```bash
npm run view-db
```

You should see the new table structure with separate mentors and mentees tables.

### **Step 3: Test the Application**
```bash
npm start
```

Go to `http://localhost:3000` and test:
- ✅ Mentor registration
- ✅ Mentee registration  
- ✅ Login for both types
- ✅ Dashboard functionality

## 🔧 **Updated Commands**

### **Database Commands:**
```bash
npm run init-db-separate    # Initialize with separate tables (NEW)
npm run init-db            # Initialize with old structure (deprecated)
npm run view-db            # View database content
npm start                  # Start the application
```

## 📊 **Benefits of Separation**

### **✅ Advantages:**
1. **Cleaner Structure**: All mentor data in one table, all mentee data in another
2. **Better Performance**: No complex JOINs for basic user operations
3. **Easier Queries**: Simpler SQL queries for user-specific data
4. **Type Safety**: Clear separation of user types at database level
5. **Scalability**: Can add type-specific fields without affecting other type

### **📈 Performance Improvements:**
- ⚡ Faster login queries (search in specific table only)
- ⚡ Faster profile loading (single table query)
- ⚡ More efficient mentor searches (direct table access)
- ⚡ Simpler foreign key relationships

## 🔍 **Code Changes Made**

### **Backend Updates:**
1. **Registration**: Now inserts directly into mentors/mentees tables
2. **Login**: Searches in both tables sequentially
3. **Profile**: Queries the appropriate table based on user type
4. **Search**: Direct query on mentors table
5. **Sessions**: Updated JOINs to use separate tables

### **Database Schema:**
- ✅ Separate `mentors` table with all mentor fields
- ✅ Separate `mentees` table with all mentee fields
- ✅ Updated foreign keys in related tables
- ✅ Added `is_active` flags for both user types
- ✅ Enhanced reviews table with user type tracking

## 🧪 **Testing After Migration**

### **Test Checklist:**
- [ ] Register new mentor
- [ ] Register new mentee  
- [ ] Login as mentor
- [ ] Login as mentee
- [ ] View mentor profile
- [ ] View mentee profile
- [ ] Search mentors (as mentee)
- [ ] Send connection request
- [ ] Accept connection request
- [ ] Upload profile pictures
- [ ] View sessions

## 📱 **Frontend Compatibility**

The frontend code remains **100% compatible** - no changes needed to HTML/CSS/JavaScript files. All API endpoints work the same way from the frontend perspective.

## 🗄️ **Database File Location**

The database file remains at:
```
C:\Users\suren\mentor-mentee-platform\database\platform.db
```

## 🔄 **Rolling Back (If Needed)**

If you need to go back to the old structure:
```bash
npm run init-db  # This will recreate the old structure
```

## 📋 **Summary**

This migration provides:
- ✅ **Cleaner database design**
- ✅ **Better performance**  
- ✅ **Easier maintenance**
- ✅ **Type-specific optimizations**
- ✅ **Preserved functionality**

Your mentor-mentee platform now has a more professional and scalable database structure! 🎉
