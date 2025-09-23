/**
 * Mentee Dashboard Functionality
 * Complete dashboard management for mentees
 */

class MenteeDashboard {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentTab = 'overview';
        this.mentors = [];
        this.sessions = [];
        this.notifications = [];
        this.initializeDashboard();
    }

    async initializeDashboard() {
        await this.checkAuthentication();
        await this.loadUserData();
        this.setupEventListeners();
        this.initializeComponents();
        await this.loadDashboardData();
        this.startRealTimeUpdates();
    }

    // Authentication Check
    async checkAuthentication() {
        const token = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        
        if (!token || userType !== 'mentee') {
            window.location.href = '/mentee/login';
            return;
        }

        // Verify token validity
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                localStorage.clear();
                window.location.href = '/mentee/login';
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            window.location.href = '/mentee/login';
        }
    }

    // Load User Data
    async loadUserData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                this.userData = await response.json();
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserInterface() {
        // Update header
        const nameElement = document.getElementById('header-name');
        const avatarElement = document.getElementById('header-avatar');
        
        if (nameElement) nameElement.textContent = this.userData.firstName + ' ' + this.userData.lastName;
        if (avatarElement && this.userData.profilePicture) {
            avatarElement.src = this.userData.profilePicture;
        }
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Notification toggle
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }

        // Profile menu
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.toggleProfileMenu());
        }

        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.performGlobalSearch(searchInput.value);
            }, 300));
        }

        // Session filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                this.filterSessions(filter);
            });
        });

        // Mentor search and filters
        this.setupMentorSearchFilters();

        // Forms
        this.setupForms();
    }

    // Initialize Components
    initializeComponents() {
        this.initializeCharts();
        this.initializeCalendar();
        this.initializeNotifications();
    }

    // Load Dashboard Data
    async loadDashboardData() {
        this.showLoadingState(true);
        
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadMentors(),
                this.loadSessions(),
                this.loadNotifications(),
                this.loadProgress()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.showLoadingState(false);
        }
    }

    // Dashboard Statistics
    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/mentee/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateDashboardStats(stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-mentors').textContent = stats.totalMentors || 0;
        document.getElementById('upcoming-sessions').textContent = stats.upcomingSessions || 0;
        document.getElementById('monthly-sessions').textContent = stats.monthlySessions || 0;
        document.getElementById('total-hours').textContent = stats.totalHours || 0;
    }

    // Mentors Management
    async loadMentors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/mentee/mentors`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                this.mentors = await response.json();
                this.renderMentors();
                this.renderAvailableMentors();
            }
        } catch (error) {
            console.error('Error loading mentors:', error);
        }
    }

    renderMentors() {
        const container = document.getElementById('mentors-grid');
        if (!container) return;

        if (this.mentors.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No mentors yet</h3>
                    <p>Find and connect with mentors to start your learning journey</p>
                    <button class="btn btn-primary" onclick="showTab('find-mentors')">Find Mentors</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.mentors.map(mentor => `
            <div class="mentor-card" data-mentor-id="${mentor.id}">
                <div class="mentor-header">
                    <img src="${mentor.profilePicture || '/assets/default-avatar.png'}" alt="${mentor.name}" class="mentor-avatar">
                    <div class="mentor-info">
                        <h3>${mentor.name}</h3>
                        <p class="mentor-expertise">${mentor.expertise}</p>
                        <div class="mentor-rating">
                            ${this.renderStars(mentor.rating)}
                            <span>(${mentor.totalSessions} sessions)</span>
                        </div>
                    </div>
                </div>
                <div class="mentor-actions">
                    <button class="btn btn-sm btn-primary" onclick="menteeDashboard.bookSession('${mentor.id}')">Book Session</button>
                    <button class="btn btn-sm btn-secondary" onclick="menteeDashboard.viewMentorProfile('${mentor.id}')">View Profile</button>
                    <button class="btn btn-sm btn-danger" onclick="menteeDashboard.removeMentor('${mentor.id}')">Remove</button>
                </div>
            </div>
        `).join('');
    }

    renderAvailableMentors() {
        const container = document.getElementById('available-mentors-grid');
        if (!container) return;

        // Fetch and render available mentors for discovery
        this.searchMentors();
    }

    async searchMentors(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.apiBaseUrl}/mentors/search?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const mentors = await response.json();
                this.renderSearchResults(mentors);
            }
        } catch (error) {
            console.error('Error searching mentors:', error);
        }
    }

    renderSearchResults(mentors) {
        const container = document.getElementById('available-mentors-grid');
        if (!container) return;

        if (mentors.length === 0) {
            container.innerHTML = '<p class="no-results">No mentors found matching your criteria</p>';
            return;
        }

        container.innerHTML = mentors.map(mentor => `
            <div class="mentor-search-card">
                <img src="${mentor.profilePicture || '/assets/default-avatar.png'}" alt="${mentor.name}">
                <h4>${mentor.name}</h4>
                <p>${mentor.expertise}</p>
                <div class="mentor-tags">
                    ${mentor.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                <div class="mentor-rate">$${mentor.hourlyRate}/hr</div>
                <button class="btn btn-primary" onclick="menteeDashboard.requestMentor('${mentor.id}')">Connect</button>
            </div>
        `).join('');
    }

    // Sessions Management
    async loadSessions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/mentee/sessions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                this.sessions = await response.json();
                this.renderSessions();
                this.renderTodaySchedule();
                this.renderUpcomingSessions();
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    renderSessions(filter = 'all') {
        const container = document.getElementById('sessions-list');
        if (!container) return;

        let filteredSessions = this.sessions;
        if (filter !== 'all') {
            filteredSessions = this.sessions.filter(session => session.status === filter);
        }

        if (filteredSessions.length === 0) {
            container.innerHTML = `<p class="no-sessions">No ${filter} sessions</p>`;
            return;
        }

        container.innerHTML = filteredSessions.map(session => `
            <div class="session-card ${session.status}">
                <div class="session-header">
                    <h4>${session.title}</h4>
                    <span class="session-status">${session.status}</span>
                </div>
                <div class="session-details">
                    <p><i class="fas fa-user-tie"></i> ${session.mentorName}</p>
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(session.date)}</p>
                    <p><i class="fas fa-clock"></i> ${session.time}</p>
                    <p><i class="fas fa-hourglass"></i> ${session.duration} minutes</p>
                </div>
                <div class="session-actions">
                    ${this.renderSessionActions(session)}
                </div>
            </div>
        `).join('');
    }

    renderSessionActions(session) {
        switch(session.status) {
            case 'upcoming':
                return `
                    <button class="btn btn-primary" onclick="menteeDashboard.joinSession('${session.id}')">Join</button>
                    <button class="btn btn-secondary" onclick="menteeDashboard.rescheduleSession('${session.id}')">Reschedule</button>
                    <button class="btn btn-danger" onclick="menteeDashboard.cancelSession('${session.id}')">Cancel</button>
                `;
            case 'completed':
                return `
                    <button class="btn btn-primary" onclick="menteeDashboard.rateSession('${session.id}')">Rate</button>
                    <button class="btn btn-secondary" onclick="menteeDashboard.viewSessionDetails('${session.id}')">View Details</button>
                `;
            default:
                return '';
        }
    }

    renderTodaySchedule() {
        const container = document.getElementById('today-schedule-list');
        if (!container) return;

        const today = new Date().toDateString();
        const todaySessions = this.sessions.filter(session => 
            new Date(session.date).toDateString() === today
        );

        if (todaySessions.length === 0) {
            container.innerHTML = '<p class="no-schedule">No sessions scheduled for today</p>';
            return;
        }

        container.innerHTML = todaySessions.map(session => `
            <div class="schedule-item">
                <div class="schedule-time">${session.time}</div>
                <div class="schedule-info">
                    <h5>${session.title}</h5>
                    <p>with ${session.mentorName}</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="menteeDashboard.joinSession('${session.id}')">Join</button>
            </div>
        `).join('');
    }

    renderUpcomingSessions() {
        const container = document.getElementById('upcoming-sessions-list');
        if (!container) return;

        const upcomingSessions = this.sessions
            .filter(session => session.status === 'upcoming')
            .slice(0, 5);

        if (upcomingSessions.length === 0) {
            container.innerHTML = '<p>No upcoming sessions</p>';
            return;
        }

        container.innerHTML = upcomingSessions.map(session => `
            <div class="upcoming-session-item">
                <div class="session-date-time">
                    <div class="date">${this.formatDate(session.date)}</div>
                    <div class="time">${session.time}</div>
                </div>
                <div class="session-info">
                    <h5>${session.title}</h5>
                    <p>${session.mentorName}</p>
                </div>
            </div>
        `).join('');
    }

    // Progress Tracking
    async loadProgress() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/mentee/progress`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const progress = await response.json();
                this.updateProgressCharts(progress);
                this.renderGoals(progress.goals);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    updateProgressCharts(progress) {
        // Monthly Progress Chart
        const monthlyCtx = document.getElementById('monthly-progress-chart');
        if (monthlyCtx && window.Chart) {
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: progress.monthly.labels,
                    datasets: [{
                        label: 'Sessions Completed',
                        data: progress.monthly.data,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Skills Progress Chart
        const skillsCtx = document.getElementById('skills-progress-chart');
        if (skillsCtx && window.Chart) {
            new Chart(skillsCtx, {
                type: 'radar',
                data: {
                    labels: progress.skills.labels,
                    datasets: [{
                        label: 'Current Level',
                        data: progress.skills.current,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    }, {
                        label: 'Target Level',
                        data: progress.skills.target,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    renderGoals(goals) {
        const container = document.getElementById('goals-list');
        if (!container) return;

        if (!goals || goals.length === 0) {
            container.innerHTML = '<p>No goals set yet</p>';
            return;
        }

        container.innerHTML = goals.map(goal => `
            <div class="goal-item">
                <div class="goal-header">
                    <h5>${goal.title}</h5>
                    <span class="goal-progress">${goal.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
                <p class="goal-description">${goal.description}</p>
                <div class="goal-actions">
                    <button class="btn btn-sm" onclick="menteeDashboard.editGoal('${goal.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="menteeDashboard.deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Notifications
    async loadNotifications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/mentee/notifications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                this.notifications = await response.json();
                this.updateNotificationBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-count');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    }

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = '<p class="no-notifications">No notifications</p>';
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <span class="notification-time">${this.formatTimeAgo(notification.timestamp)}</span>
                </div>
                ${!notification.read ? `
                    <button class="btn btn-sm" onclick="menteeDashboard.markNotificationRead('${notification.id}')">Mark Read</button>
                ` : ''}
            </div>
        `).join('');
    }

    // Calendar
    initializeCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        const currentDate = new Date();
        this.renderCalendar(currentDate);
    }

    renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const calendarTitle = document.getElementById('calendar-title');
        if (calendarTitle) {
            calendarTitle.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
        }

        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        let html = '<div class="calendar-weekdays">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div><div class="calendar-days">';

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasSession = this.sessions.some(s => s.date === dateStr);
            html += `<div class="calendar-day ${hasSession ? 'has-session' : ''}" data-date="${dateStr}">${day}</div>`;
        }

        html += '</div>';
        calendarGrid.innerHTML = html;
    }

    // Action Methods
    async bookSession(mentorId) {
        const modal = document.getElementById('book-session-modal');
        if (modal) {
            // Populate mentor dropdown
            const mentorSelect = document.getElementById('session-mentor');
            if (mentorSelect) {
                mentorSelect.value = mentorId;
            }
            modal.style.display = 'flex';
        }
    }

    async requestMentor(mentorId) {
        const modal = document.getElementById('request-mentor-modal');
        if (modal) {
            // Load mentor info
            try {
                const response = await fetch(`${this.apiBaseUrl}/mentors/${mentorId}`);
                if (response.ok) {
                    const mentor = await response.json();
                    document.getElementById('request-mentor-info').innerHTML = `
                        <img src="${mentor.profilePicture || '/assets/default-avatar.png'}" alt="${mentor.name}">
                        <div>
                            <h4>${mentor.name}</h4>
                            <p>${mentor.expertise}</p>
                            <p>$${mentor.hourlyRate}/hr</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading mentor info:', error);
            }
            modal.style.display = 'flex';
        }
    }

    async joinSession(sessionId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.meetingUrl) {
                    window.open(data.meetingUrl, '_blank');
                }
            } else {
                this.showError('Unable to join session');
            }
        } catch (error) {
            console.error('Error joining session:', error);
            this.showError('Failed to join session');
        }
    }

    async cancelSession(sessionId) {
        if (!confirm('Are you sure you want to cancel this session?')) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Session cancelled successfully');
                await this.loadSessions();
            } else {
                this.showError('Failed to cancel session');
            }
        } catch (error) {
            console.error('Error cancelling session:', error);
            this.showError('Failed to cancel session');
        }
    }

    async markNotificationRead(notificationId) {
        try {
            await fetch(`${this.apiBaseUrl}/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification:', error);
        }
    }

    // UI Methods
    switchTab(tabName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabName;

        // Load tab-specific data if needed
        switch(tabName) {
            case 'mentors':
                this.loadMentors();
                break;
            case 'sessions':
                this.loadSessions();
                break;
            case 'progress':
                this.loadProgress();
                break;
        }
    }

    filterSessions(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });

        this.renderSessions(filter);
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    toggleProfileMenu() {
        const menu = document.getElementById('profile-menu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    showLoadingState(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Utility Methods
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];

        for (let interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    getNotificationIcon(type) {
        const icons = {
            'session': 'fa-calendar-check',
            'message': 'fa-envelope',
            'reminder': 'fa-bell',
            'achievement': 'fa-trophy',
            'system': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Setup forms
    setupForms() {
        // Book session form
        const bookSessionForm = document.getElementById('book-session-form');
        if (bookSessionForm) {
            bookSessionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleBookSession(e.target);
            });
        }

        // Request mentor form
        const requestForm = document.getElementById('request-mentor-form');
        if (requestForm) {
            requestForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleMentorRequest(e.target);
            });
        }

        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProfileUpdate(e.target);
            });
        }
    }

    async handleBookSession(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch(`${this.apiBaseUrl}/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Session booked successfully!');
                this.closeModal('book-session-modal');
                await this.loadSessions();
                form.reset();
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to book session');
            }
        } catch (error) {
            console.error('Error booking session:', error);
            this.showError('Failed to book session');
        }
    }

    async handleMentorRequest(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch(`${this.apiBaseUrl}/mentor-requests`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Request sent successfully!');
                this.closeModal('request-mentor-modal');
                form.reset();
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to send request');
            }
        } catch (error) {
            console.error('Error sending request:', error);
            this.showError('Failed to send request');
        }
    }

    async handleProfileUpdate(form) {
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: formData
            });

            if (response.ok) {
                this.showSuccess('Profile updated successfully!');
                await this.loadUserData();
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Real-time updates
    startRealTimeUpdates() {
        // Poll for new notifications every 30 seconds
        setInterval(() => {
            this.loadNotifications();
        }, 30000);

        // Update session status every minute
        setInterval(() => {
            if (this.currentTab === 'sessions' || this.currentTab === 'overview') {
                this.loadSessions();
            }
        }, 60000);
    }

    // Setup mentor search filters
    setupMentorSearchFilters() {
        const searchBtn = document.querySelector('.search-btn-large');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performMentorSearch());
        }

        const rateSlider = document.getElementById('rate-filter');
        if (rateSlider) {
            rateSlider.addEventListener('input', (e) => {
                document.getElementById('rate-value').textContent = e.target.value;
            });
        }
    }

    async performMentorSearch() {
        const searchInput = document.getElementById('mentor-search');
        const ratingFilter = document.getElementById('rating-filter');
        const rateFilter = document.getElementById('rate-filter');
        
        const filters = {
            query: searchInput?.value,
            minRating: ratingFilter?.value,
            maxRate: rateFilter?.value
        };

        // Get selected skills
        const skillCheckboxes = document.querySelectorAll('#skills-filter input:checked');
        if (skillCheckboxes.length > 0) {
            filters.skills = Array.from(skillCheckboxes).map(cb => cb.value).join(',');
        }

        await this.searchMentors(filters);
    }

    async performGlobalSearch(query) {
        if (!query) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const results = await response.json();
                // Handle search results
                console.log('Search results:', results);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }
}

// Initialize dashboard when DOM is loaded
let menteeDashboard;

document.addEventListener('DOMContentLoaded', () => {
    menteeDashboard = new MenteeDashboard();
    console.log('Mentee Dashboard initialized');
});

// Global functions for onclick handlers in HTML
window.showTab = function(tabName) {
    if (menteeDashboard) {
        menteeDashboard.switchTab(tabName);
    }
};

window.closeModal = function(modalId) {
    if (menteeDashboard) {
        menteeDashboard.closeModal(modalId);
    }
};

window.performGlobalSearch = function() {
    const input = document.getElementById('global-search');
    if (input && menteeDashboard) {
        menteeDashboard.performGlobalSearch(input.value);
    }
};

window.markAllNotificationsRead = async function() {
    if (menteeDashboard) {
        try {
            await fetch(`${menteeDashboard.apiBaseUrl}/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            await menteeDashboard.loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
};

window.logout = function() {
    localStorage.clear();
    window.location.href = '/mentee/login';
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenteeDashboard;
}
