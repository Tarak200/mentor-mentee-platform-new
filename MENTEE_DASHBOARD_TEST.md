# 🧪 Mentee Dashboard Testing Guide

## Quick Test Steps

### 1. Start the Server
```bash
npm start
```
(If port 3000 is busy, kill the existing process or use a different port)

### 2. Access the Platform
1. Open browser to: `http://localhost:3000`
2. Click **"I'm a Mentee"** button
3. You should be redirected to the login page

### 3. Test the Login Flow
**Option A: Create a new mentee account**
1. On login page, click "Sign up here"
2. Fill in the registration form with mentee details
3. Submit the form
4. Login with your new credentials

**Option B: Use Google OAuth**
1. Click "Continue with Google"
2. Select mentee as user type
3. Complete Google OAuth flow

### 4. Verify Mentee Dashboard
Once logged in, you should see the **MENTEE DASHBOARD** with:

#### ✅ **Top Navigation**
- "MenteePlatform" logo (with graduation cap icon)
- Welcome message: "Welcome back, [Name]! 👋"
- "Ready to learn something new today?"
- Profile dropdown with customer care and logout options

#### ✅ **Stats Bar** 
- Upcoming Sessions: 0
- Connected Mentors: 0  
- Completed Sessions: 0
- Total Spent: ₹0

#### ✅ **Navigation Tabs**
- **Find Mentors** (active by default) - Red gradient theme
- **My Sessions**
- **My Profile**

#### ✅ **Find Mentors Section** (Default View)
- Search bar: "What subject do you want to learn?"
- Filter options:
  - Price Range (min/max)
  - Mentor Gender dropdown
  - Communication Language
  - Clear filters button
- "Available Mentors" section (will show loading initially)

## 🚨 If You See Mentor Dashboard Instead

If you see the **MENTOR DASHBOARD** (blue theme) instead of the **MENTEE DASHBOARD** (red theme), the issue might be:

### Troubleshooting:

1. **Check URL**: Make sure you're at `http://localhost:3000/mentee-dashboard`
2. **Clear Browser Data**: Clear localStorage and cookies
3. **Check User Type**: 
   ```javascript
   // In browser console:
   localStorage.getItem('selectedUserType')
   // Should show 'mentee'
   ```
4. **Force Mentee Dashboard**: Go directly to `http://localhost:3000/mentee-dashboard`

### Manual Fix:
```javascript
// In browser console, run:
localStorage.setItem('selectedUserType', 'mentee');
window.location.href = '/mentee-dashboard';
```

## 🎯 Expected Behavior

### **MENTEE Dashboard Features:**
1. **Red color theme** (not blue)
2. **Search functionality** for finding mentors
3. **Filter options** for price, gender, language
4. **Connection request system** to send requests to mentors
5. **Session tracking** for scheduled learning sessions
6. **Payment instructions** with platform UPI details

### **NOT Mentor Features:**
- Should NOT show "Connection Requests" from mentees
- Should NOT show "Accept/Reject" functionality  
- Should NOT show earning tracking
- Should NOT have blue color theme

## 🔄 Reset Everything (If Needed)

If you're still seeing the wrong dashboard:

1. **Stop the server** (Ctrl+C)
2. **Clear browser completely** (close all tabs)
3. **Restart server**: `npm start`
4. **Go to homepage**: `http://localhost:3000`
5. **Click "I'm a Mentee"** again
6. **Login as mentee**

The mentee dashboard should now display correctly with the red theme and mentee-specific functionality!

## 📧 Support

If you still see mentor dashboard features instead of mentee features, there might be a routing issue or browser caching problem. Try the manual fixes above or clear all browser data.
