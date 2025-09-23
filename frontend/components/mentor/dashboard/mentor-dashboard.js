// ===== ENHANCED MENTOR DASHBOARD JAVASCRIPT =====
// Enhanced interactive features for mentor dashboard

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize dashboard
    initializeDashboard();
    
    // Navigation functionality
    setupNavigation();
    
    // Profile dropdown functionality
    setupProfileDropdown();
    
    // Modal handlers
    setupModals();
    
    // Chart functionality
    setupCharts();
    
    // Enhanced animations
    setupAnimations();
    
    // Notification system
    setupNotifications();
    
    // Session management
    setupSessionManagement();
    
    // Request handling
    setupRequestHandling();
    
    console.log('Enhanced Mentor Dashboard initialized successfully');
});

// ===== DASHBOARD INITIALIZATION =====
function initializeDashboard() {
    // Show dashboard section by default
    showSection('dashboard-section');
    
    // Initialize stat cards with animation
    animateStatCards();
    
    // Setup greeting message
    updateGreetingMessage();
    
    // Load dashboard data
    loadDashboardData();
    
    // Start periodic updates
    startPeriodicUpdates();
}

// ===== NAVIGATION SYSTEM =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get section to show
            const sectionId = this.getAttribute('data-section');
            
            // Show corresponding section with smooth transition
            showSection(sectionId);
            
            // Update page title
            updatePageTitle(this.textContent.trim());
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    
    sections.forEach(section => {
        section.classList.remove('active');
        setTimeout(() => {
            section.style.display = 'none';
        }, 300);
    });
    
    setTimeout(() => {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 50);
        }
    }, 300);
}

function updatePageTitle(title) {
    const headerTitle = document.querySelector('.header-left h1');
    if (headerTitle) {
        headerTitle.textContent = title;
    }
}

// ===== PROFILE DROPDOWN =====
function setupProfileDropdown() {
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (dropdownMenu.style.display === 'block') {
                hideDropdown();
            } else {
                showDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            hideDropdown();
        });
        
        // Prevent dropdown from closing when clicking inside
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function showDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
        setTimeout(() => {
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.transform = 'translateY(0)';
        }, 10);
    }
}

function hideDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            dropdownMenu.style.display = 'none';
        }, 300);
    }
}

// ===== MODAL SYSTEM =====
function setupModals() {
    // Setup modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            showModal(modalId);
        });
    });
    
    // Setup modal close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modern-modal');
            hideModal(modal);
        });
    });
    
    // Setup modal overlays
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.modern-modal');
            hideModal(modal);
        });
    });
    
    // Setup form submissions
    setupModalForms();
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Animate modal appearance
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function setupModalForms() {
    // Schedule session form
    const scheduleForm = document.getElementById('scheduleSessionForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleScheduleSession(this);
        });
    }
    
    // Add more modal form handlers as needed
}

// ===== CHART FUNCTIONALITY =====
function setupCharts() {
    // Setup chart controls
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            chartButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart data
            const period = this.getAttribute('data-period');
            updateChart(period);
        });
    });
    
    // Initialize default chart
    updateChart('week');
}

function updateChart(period) {
    const chartContainer = document.querySelector('.css-chart');
    if (!chartContainer) return;
    
    let data = [];
    let labels = [];
    
    switch (period) {
        case 'week':
            data = [65, 45, 80, 55, 70, 90, 75];
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            break;
        case 'month':
            data = [280, 320, 290, 350, 300, 380];
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
            break;
        case 'year':
            data = [1200, 1350, 1100, 1400, 1300, 1500, 1250, 1600, 1450, 1700, 1550, 1800];
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            break;
    }
    
    // Clear existing chart
    chartContainer.innerHTML = '';
    
    // Create new chart bars
    data.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.setProperty('--height', `${(value / Math.max(...data)) * 100}%`);
        bar.innerHTML = `<span class="bar-value">${value}</span>`;
        chartContainer.appendChild(bar);
    });
    
    // Update chart labels
    const labelsContainer = document.querySelector('.chart-labels');
    if (labelsContainer) {
        labelsContainer.innerHTML = labels.map(label => `<span>${label}</span>`).join('');
    }
}

// ===== ANIMATIONS =====
function setupAnimations() {
    // Animate stat cards on load
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    });
    
    // Observe stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        observer.observe(card);
    });
}

function animateStatCards() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(number => {
        const finalValue = parseInt(number.textContent);
        let currentValue = 0;
        const increment = finalValue / 50;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            number.textContent = Math.floor(currentValue);
        }, 30);
    });
}

// ===== NOTIFICATION SYSTEM =====
function setupNotifications() {
    // Check for new notifications periodically
    setInterval(checkNotifications, 30000); // Check every 30 seconds
    
    // Setup notification click handler
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', function() {
            showNotificationsPanel();
        });
    }
}

function checkNotifications() {
    // Simulate checking for new notifications
    // In a real app, this would make an API call
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        // Simulate random new notifications
        if (Math.random() > 0.8) {
            badge.textContent = currentCount + 1;
            badge.style.display = 'block';
        }
    }
}

function showNotificationsPanel() {
    // Create and show notifications panel
    showNotification('Notifications panel opened', 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== SESSION MANAGEMENT =====
function setupSessionManagement() {
    // Setup join session buttons
    const joinButtons = document.querySelectorAll('.join-btn');
    joinButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sessionId = this.getAttribute('data-session-id');
            joinSession(sessionId);
        });
    });
    
    // Setup schedule session functionality
    const scheduleBtn = document.querySelector('[data-modal="scheduleModal"]');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function() {
            prepareScheduleModal();
        });
    }
}

function joinSession(sessionId) {
    showNotification('Joining session...', 'info');
    
    // Simulate joining session
    setTimeout(() => {
        showNotification('Successfully joined the session!', 'success');
        // In a real app, this would redirect to the session interface
    }, 1500);
}

function prepareScheduleModal() {
    // Pre-populate modal with current date/time
    const now = new Date();
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');
    
    if (dateInput) {
        dateInput.value = now.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
}

function handleScheduleSession(form) {
    const formData = new FormData(form);
    const sessionData = {
        student: formData.get('studentEmail'),
        subject: formData.get('subject'),
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration')
    };
    
    showNotification('Scheduling session...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Session scheduled successfully!', 'success');
        
        // Hide modal
        const modal = form.closest('.modern-modal');
        hideModal(modal);
        
        // Reset form
        form.reset();
        
        // Update sessions list
        updateSessionsList();
    }, 1500);
}

// ===== REQUEST HANDLING =====
function setupRequestHandling() {
    // Setup accept/decline buttons for requests
    const actionButtons = document.querySelectorAll('.request-actions .action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.classList.contains('accept') ? 'accept' : 'decline';
            const requestCard = this.closest('.request-card');
            const requestId = requestCard.getAttribute('data-request-id');
            
            handleRequest(requestId, action, requestCard);
        });
    });
}

function handleRequest(requestId, action, requestCard) {
    const actionText = action === 'accept' ? 'Accepting' : 'Declining';
    showNotification(`${actionText} request...`, 'info');
    
    // Simulate API call
    setTimeout(() => {
        const successText = action === 'accept' ? 'Request accepted!' : 'Request declined.';
        showNotification(successText, action === 'accept' ? 'success' : 'warning');
        
        // Remove request card with animation
        requestCard.style.transform = 'translateX(100%)';
        requestCard.style.opacity = '0';
        
        setTimeout(() => {
            requestCard.remove();
            
            // Check if no more requests
            const remainingRequests = document.querySelectorAll('.request-card');
            if (remainingRequests.length === 0) {
                showEmptyRequestsState();
            }
        }, 300);
        
        // Update stats
        updateDashboardStats();
    }, 1000);
}

function showEmptyRequestsState() {
    const container = document.querySelector('.requests-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No pending requests</h3>
                <p>You're all caught up! New mentoring requests will appear here.</p>
            </div>
        `;
    }
}

// ===== DATA MANAGEMENT =====
function loadDashboardData() {
    // Simulate loading dashboard data
    showNotification('Loading dashboard data...', 'info');
    
    setTimeout(() => {
        updateDashboardStats();
        updateRecentActivity();
        updateUpcomingSessions();
        showNotification('Dashboard updated!', 'success');
    }, 2000);
}

function updateDashboardStats() {
    // Simulate updating stats
    const stats = {
        totalSessions: Math.floor(Math.random() * 50) + 100,
        activeStudents: Math.floor(Math.random() * 20) + 30,
        monthlyEarnings: Math.floor(Math.random() * 1000) + 2000,
        avgRating: (Math.random() * 1 + 4).toFixed(1)
    };
    
    // Update stat cards
    updateStatCard('totalSessions', stats.totalSessions);
    updateStatCard('activeStudents', stats.activeStudents);
    updateStatCard('monthlyEarnings', `$${stats.monthlyEarnings}`);
    updateStatCard('avgRating', stats.avgRating);
}

function updateStatCard(id, value) {
    const statCard = document.querySelector(`[data-stat="${id}"] .stat-number`);
    if (statCard) {
        statCard.textContent = value;
    }
}

function updateRecentActivity() {
    // Simulate updating recent activity
    const activities = [
        { type: 'success', icon: 'check', title: 'Session completed with Sarah Johnson', time: '5 minutes ago' },
        { type: 'info', icon: 'calendar', title: 'New session scheduled for tomorrow', time: '15 minutes ago' },
        { type: 'warning', icon: 'clock', title: 'Session reminder: Math tutoring in 30 min', time: '30 minutes ago' }
    ];
    
    const timeline = document.querySelector('.activity-timeline');
    if (timeline) {
        timeline.innerHTML = activities.map(activity => `
            <div class="timeline-item">
                <div class="timeline-icon ${activity.type}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${activity.title}</div>
                    <div class="timeline-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }
}

function updateUpcomingSessions() {
    // Simulate updating upcoming sessions
    const sessions = [
        { time: '10:00 AM', duration: '60 min', student: 'Alex Chen', subject: 'Mathematics' },
        { time: '2:00 PM', duration: '45 min', student: 'Maria Garcia', subject: 'Physics' },
        { time: '4:30 PM', duration: '60 min', student: 'James Wilson', subject: 'Chemistry' }
    ];
    
    const sessionItems = document.querySelector('.session-items');
    if (sessionItems) {
        sessionItems.innerHTML = sessions.map((session, index) => `
            <div class="session-item">
                <div class="session-time">
                    <div class="time">${session.time}</div>
                    <div class="duration">${session.duration}</div>
                </div>
                <div class="session-details">
                    <div class="student-name">${session.student}</div>
                    <div class="subject">${session.subject}</div>
                </div>
                <div class="session-actions">
                    <button class="join-btn" data-session-id="${index}">
                        <i class="fas fa-video"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Re-setup join buttons
        const joinButtons = sessionItems.querySelectorAll('.join-btn');
        joinButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const sessionId = this.getAttribute('data-session-id');
                joinSession(sessionId);
            });
        });
    }
}

function updateSessionsList() {
    updateUpcomingSessions();
    showNotification('Sessions list updated', 'info');
}

function startPeriodicUpdates() {
    // Update dashboard data every 5 minutes
    setInterval(() => {
        loadDashboardData();
    }, 300000);
}

function updateGreetingMessage() {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    
    if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon';
    } else if (hour >= 17) {
        greeting = 'Good evening';
    }
    
    const greetingText = document.querySelector('.greeting-text h3');
    if (greetingText) {
        greetingText.textContent = `${greeting}, Mentor!`;
    }
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

function formatTime(time) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(time));
}

// ===== ENHANCED FEATURES =====

// Sidebar toggle for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.mentor-sidebar');
    const main = document.querySelector('.mentor-main');
    
    sidebar.classList.toggle('show');
    main.classList.toggle('sidebar-open');
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterDashboardContent(query);
        });
    }
}

function filterDashboardContent(query) {
    // Filter sessions, requests, etc. based on search query
    const sessions = document.querySelectorAll('.session-item');
    const requests = document.querySelectorAll('.request-card');
    
    [...sessions, ...requests].forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Export functionality for reports
function exportData(type) {
    showNotification(`Exporting ${type} data...`, 'info');
    
    setTimeout(() => {
        showNotification(`${type} data exported successfully!`, 'success');
        // In a real app, this would trigger a download
    }, 2000);
}

// Real-time chat simulation
function initializeChat() {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        // Simulate receiving messages
        setInterval(() => {
            if (Math.random() > 0.95) {
                addChatMessage('New message from student', 'received');
            }
        }, 5000);
    }
}

function addChatMessage(message, type) {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Performance monitoring
function logPerformance(action) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${action}`);
    
    // In a real app, this would send metrics to analytics
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Dashboard error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});

// Initialize additional features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    setupSearch();
    initializeChat();
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification,
        updateChart,
        handleRequest,
        joinSession
    };
}
