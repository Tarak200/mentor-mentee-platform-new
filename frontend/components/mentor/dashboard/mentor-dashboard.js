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


let currentRequestId = null;

// Check authentication
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = '/login';
}

    
// Load dashboard data
document.addEventListener('DOMContentLoaded', async () => {
    // Event delegation for dynamically created buttons
    document.addEventListener('click', async function(e) {
        
        // Handle Accept Button Click
        if (e.target.closest('.btn-accept')) {
            console.log('✅ Accept button clicked - opening modal');
            const button = e.target.closest('.btn-accept');
            const requestId = button.getAttribute('data-request-id');
            const menteeName = button.getAttribute('data-name');
            const goals = button.getAttribute('data-goals');
            
            if (!requestId) {
                console.error('❌ No request ID found on button');
                showMessage('Error: Request ID not found', 'error');
                return;
            }
            
            // Fetch complete request details from API
            try {
                const response = await fetch(`/api/mentor/mentoring-requests/${requestId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch request details');
                }
                
                const data = await response.json();
                
                // Show the modal with complete request details
                showIncomingRequestModal({
                    requestId: data.requestId || requestId,
                    mentee: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        avatar: data.avatar
                    },
                    message: data.message,
                    subject: goals,
                    preferredTime : data.preferredSchedule
                });
            } catch (error) {
                console.error('Error fetching request details:', error);
                showMessage('Failed to load request details. Please try again.', 'error');
            }
        }
        
        // Handle Decline Button Click - FIXED
        if (e.target.closest('.btn-reject')) {
            const button = e.target.closest('.btn-reject');
            const requestId = button.getAttribute('data-request-id');
            // Show the decline confirmation modal
            showDeclineModal(requestId);
        }
    });

    await loadProfile();
    await loadRequests();
    await loadSessions();
    await loadEarnings();
    await loadPlatformConfig();
    setupRealtime();
});

// Load platform configuration
async function loadPlatformConfig() {
    try {
        const response = await fetch('/api/platform-config');
        if (response.ok) {
            const config = await response.json();
            
            // Update commission displays
            const commissionElements = document.querySelectorAll('.commission-percentage');
            commissionElements.forEach(el => {
                el.textContent = `${config.commissionPercentage}%`;
            });
            
            const mentorPercentage = 100 - config.commissionPercentage;
            const mentorElements = document.querySelectorAll('.mentor-percentage');
            mentorElements.forEach(el => {
                el.textContent = `${mentorPercentage}%`;
            });
        }
    } catch (error) {
        console.error('Error loading platform config:', error);
    }
}

// Profile menu toggle
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown')) {
        document.getElementById('profileMenu').style.display = 'none';
    }
});

// loading profile in mentor dashboard
// Fixed loadProfile function - populates the new editable profile fields
async function loadProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            console.log("profile details:", user);
            // Update header profile info
            document.getElementById('userName').textContent = user.first_name;
            document.getElementById('userNameShort').textContent = user.first_name;
            document.getElementById('mentorUpiId').textContent = user.upi_id || 'Not set';
            
            if (user.profile_picture) {
                document.getElementById('profilePic').src = user.profile_picture;
                document.getElementById('profilePicLarge').src = user.profile_picture;
            }
            
            // Populate the NEW editable profile fields
            // Name (editable)
            const fullName = `${user.first_name} ${user.last_name}`;
            if (document.getElementById('nameDisplay')) {
                document.getElementById('nameDisplay').textContent = fullName;
                // document.getElementById('nameEdit').value = fullName;
            }
            
            // Email (read-only)
            if (document.getElementById('emailDisplay')) {
                document.getElementById('emailDisplay').textContent = user.email || 'Not set';
            }
            
            // Phone (editable)
            if (document.getElementById('phoneDisplay')) {
                document.getElementById('phoneDisplay').textContent = user.phone || 'Not set';
                document.getElementById('phoneEdit').value = user.phone || '';
            }
            
            // Education (read-only)
            if (document.getElementById('educationDisplay')) {
                document.getElementById('educationDisplay').textContent = user.education || 'Not specified';
            }
            
            // Institution (read-only)
            if (document.getElementById('institutionDisplay')) {
                document.getElementById('institutionDisplay').textContent = user.institution || 'Not specified';
            }
            
            // Specialization (editable) - using subjects or current_pursuit
            if (document.getElementById('specializationDisplay')) {
                const specialization = user.subjects ? user.subjects.join(', ') : (user.current_pursuit || 'Not set');
                document.getElementById('specializationDisplay').textContent = specialization;
                document.getElementById('specializationEdit').value = specialization;
            }

            if(document.getElementById('currentPursuitDisplay')) {  
                const currentPursuit = user.current_pursuit || 'Not set';
                document.getElementById('currentPursuitDisplay').textContent = currentPursuit;
                document.getElementById('currentPursuitEdit').value = currentPursuit;
            }
            
            // Experience (editable)
            if (document.getElementById('upiIdDisplay')) {
                const upi_id = user.upi_id || 'Not set'; 
                document.getElementById('upiIdDisplay').textContent = upi_id;
                document.getElementById('upiIdEdit').value = upi_id;
            }
            
            // Bio (editable)
            if (document.getElementById('bioDisplay')) {
                const bio = user.bio || user.qualifications || 'Not set';
                document.getElementById('bioDisplay').textContent = bio;
                document.getElementById('bioEdit').value = bio;
            }

            // Hourly Rate (editable)
            if (document.getElementById('hourlyRateDisplay')) {
                const hourlyRate = user.hourlyRate || 'Not set';
                document.getElementById('hourlyRateDisplay').textContent = hourlyRate ? `₹${hourlyRate}/hour` : 'Not set';
                document.getElementById('hourlyRateEdit').value = user.hourlyRate || '';
            }

            // Languages (editable)
            if (document.getElementById('languagesDisplay')) {
                const languages = user.languages ? user.languages.join(', ') : 'Not specified';
                document.getElementById('languagesDisplay').textContent = languages;
                document.getElementById('languagesEdit').value = user.languages ? user.languages.join(', ') : '';
            }

            // Teaching Subjects (editable)
            if (document.getElementById('subjectsDisplay')) {
                const subjects = user.subjects ? user.subjects.join(', ') : 'Not specified';
                document.getElementById('subjectsDisplay').textContent = subjects;
                document.getElementById('subjectsEdit').value = user.subjects ? user.subjects.join(', ') : '';
            }

            // Available Hours (editable)
            if (document.getElementById('availableHoursDisplay')) {
                const availableHours = user.available_hours ? user.available_hours.join(', ') : 'Not specified';
                document.getElementById('availableHoursDisplay').textContent = availableHours;
                document.getElementById('availableHoursEdit').value = user.available_hours ? user.available_hours.join(', ') : '';
            }

        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ===========================
// Mentor Dashboard - Requests
// ===========================

async function loadRequests() {
    const requestsList = document.getElementById('requestsList');
    const totalRequestsEl = document.getElementById('totalRequests');

    if (!requestsList) {
        console.error("❌ Element with ID 'requestsList' not found.");
        return;
    }


    // Show loading spinner
    requestsList.innerHTML = `
        <div class="loading-requests">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading connection requests...</p>
        </div>
    `;

    try {
        // Ensure the token is available
        if (typeof token === 'undefined' || !token) {
            throw new Error("Authorization token not found. Please log in again.");
        }

        // Fetch pending connection requests
        const response = await fetch('/api/mentor/requests/pending', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // console.log('Response status:', response.status);

        // Handle non-successful responses
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Failed to load requests:", response.status, errorText);

            requestsList.innerHTML = `
                <div class="no-requests error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Requests</h3>
                    <p>${
                        response.status === 401
                            ? 'Unauthorized access. Please log in again.'
                            : 'Something went wrong while fetching requests.'
                    }</p>
                </div>
            `;
            return;
        }

        // Parse the JSON response
        const result = await response.json();
        // console.log(result)
        const requests = result.data || [];

        // console.log('Fetched requests:', requests);

        // Update total requests count if element exists
        if (totalRequestsEl) totalRequestsEl.textContent = requests.length;

        // Handle empty request list
        if (!requests.length) {
            requestsList.innerHTML = `
                <div class="no-requests">
                    <i class="fas fa-user-clock"></i>
                    <h3>No Connection Requests</h3>
                    <p>When mentees want to connect with you, they'll appear here.</p>
                </div>
            `;
            return;
        }

        // Generate HTML for each mentee request
        const requestsHtml = requests
            .map(
                (request) => `
            <div class="mentee-request-card enhanced">
                <div class="mentee-header">
                    <img src="${request.avatar || '../uploads/default.jpg'}" 
                        alt="${request.firstName}">
                    <div class="mentee-basic">
                        <h3>${request.firstName} ${request.lastName}</h3>
                        <div class="mentee-info">
                            <span><i class="fas fa-envelope"></i> ${request.email || 'undefined'}</span>
                            ${request.institution ? `<span><i class="fas fa-university"></i> ${request.institution}</span>` : ''}
                        </div>
                    </div>
                    <div class="request-time">
                        <small>
                            <i class="fas fa-clock"></i> 
                            ${new Date(request.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>

                <div class="mentee-details">
                    ${
                        request.current_pursuit
                            ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-briefcase"></i> Current Pursuit:</h4>
                            <p class="info-text">${request.current_pursuit}</p>
                        </div>
                    `
                            : ''
                    }

                    ${
                        request.education
                            ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-graduation-cap"></i> Education:</h4>
                            <p class="info-text">${request.education}</p>
                        </div>
                    `
                            : ''
                    }

                    ${
                        request.qualifications
                            ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-certificate"></i> Qualifications:</h4>
                            <p class="info-text">${request.qualifications}</p>
                        </div>
                    `
                            : ''
                    }

                    <div class="detail-section">
                        <h4><i class="fas fa-book"></i> Wants to Learn:</h4>
                        <p class="subject-highlight">${request.bio || 'Not specified'}</p>
                    </div>

                    ${
                        request.message
                            ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-comment"></i> Message:</h4>
                            <p class="mentee-message">${request.message}</p>
                        </div>
                    `
                            : ''
                    }

                    <div class="mentee-preferences">
                        <div class="preference-item">
                            <i class="fas fa-clock"></i>
                            <label>Preferred Time:</label>
                            <span>${request.preferredSchedule || 'Flexible'}</span>
                        </div>
                        <div class="preference-item">
                            <i class="fas fa-star"></i>
                            <label>Interests:</label>
                            <span>${request.subjects || 'General learning'}</span>
                        </div>
                        ${
                            request.languages
                                ? `
                            <div class="preference-item">
                                <i class="fas fa-language"></i>
                                <label>Languages:</label>
                                <span>${request.languages}</span>
                            </div>
                        `
                                : ''
                        }
                    </div>
                </div>

                <div class="request-actions">
                    <button class="btn btn-accept" data-request-id="${request.id}" data-name="${request.firstName} ${request.lastName}" data-goals="${request.goals || request.message}">
                        <i class="fas fa-check-circle"></i> Accept Request
                    </button>
                    <button class="btn btn-reject" data-request-id="${request.id}">
                        <i class="fas fa-times-circle"></i> Decline
                    </button>
                </div>
            </div>
        `
            )
            .join('');

        requestsList.innerHTML = requestsHtml;

    } catch (error) {
        console.error('🔥 Error loading requests:', error);

        requestsList.innerHTML = `
            <div class="no-requests error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Requests</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

let allSessions = [];
let currentSessionTab = 'upcoming';

async function loadSessions() {
    try {
        document.getElementById('sessionsList').innerHTML = `
            <div class="loading-sessions">
                <div class="spinner"></div>
                <p>Loading your teaching sessions...</p>
            </div>
        `;
        
        const response = await fetch('/api/mentor/sessions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        console.log('Sessions loaded:', data);
        
        allSessions = data.sessions || [];
        
        updateSessionSummary(allSessions);
        renderSessionsByTab('upcoming');
        
    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('sessionsList').innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                <p>Failed to load sessions. Please try again.</p>
            </div>
        `;
    }
}

function updateSessionSummary(sessions) {
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
    
    // FIX: Directly count completed sessions instead of subtracting
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    
    totalSessions = sessions.length;
    // console.log(totalSessions)
    // console.log(upcomingSessions.length)
    // console.log(completedSessions) // Add this to verify
    
    const today = new Date().toDateString();
    const todaySessions = upcomingSessions.filter(s => 
        new Date(s.scheduled_time).toDateString() === today
    );
    
    document.getElementById('futureCalls').textContent = upcomingSessions.length;
    document.getElementById('todaySessions').textContent = todaySessions.length;
    document.getElementById('upcomingSessions').textContent = upcomingSessions.length;
    document.getElementById('completedSessions').textContent = completedSessions;
}




function switchSessionTab(status) {
    currentSessionTab = status;
    
    document.querySelectorAll('.sessions-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetBtn = document.querySelector(`.sessions-tab-btn[data-status="${status}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    renderSessionsByTab(status);
}


function renderSessionsByTab(status) {
    const filteredSessions = allSessions.filter(session => 
        session.status === status
    );
    
    const sessionsHtml = filteredSessions.length > 0 ?
        filteredSessions.map(session => {
            // Determine ribbon status
            const ribbonStatus = session.status === 'completed' && session.payment_status === 'paid' 
                ? 'paid' 
                : session.status === 'completed' 
                ? 'completed' 
                : session.status;

            return `
                <div class="session-card">
                    ${ribbonStatus !== 'upcoming' ? `
                        <div class="ribbon-badge ${ribbonStatus}" data-status="${ribbonStatus}">
                            ${ribbonStatus === 'paid' ? 'PAID' : 'COMPLETED'}
                        </div>
                    ` : ''}

                    
                    <!-- Card Header with Mentee Info -->
                    <div class="card-header">
                        <img src="${session.profilePic || '../uploads/default.jpg'}" 
                             alt="${session.mentee_first_name}" 
                             class="mentee-avatar"
                             onerror="this.src='../uploads/default.jpg'">
                        <div class="mentee-info">
                            <h4 class="mentee-name">${session.mentee_first_name} ${session.mentee_last_name}</h4>
                            <p class="mentee-institution">${session.mentee_institution || 'Not specified'}</p>
                            <p class="mentee-pursuit">${session.mentee_current_pursuit || 'Not specified'}</p>
                        </div>
                    </div>
                    
                    <!-- Card Body -->
                    <div class="card-body">
                        <!-- Session Title -->
                        <div class="session-title">
                            <i class="fas fa-bookmark"></i>
                            <h3>${session.title || 'Mentoring Session'}</h3>
                        </div>
                        
                        <!-- Description -->
                        ${session.description ? `
                            <div class="session-description">
                                <i class="fas fa-info-circle"></i>
                                <p>${session.description}</p>
                            </div>
                        ` : ''}
                        
                        <!-- Session Details Grid -->
                        <div class="session-details">
                            <!-- Date & Time -->
                            <div class="detail-item">
                                <div class="detail-icon">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                                <div class="detail-content">
                                    <p class="detail-label">Scheduled Time</p>
                                    <p class="detail-value">${new Date(session.scheduled_time).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })} at ${new Date(session.scheduled_time).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })}</p>
                                </div>
                            </div>
                            
                            <!-- Duration -->
                            <div class="detail-item">
                                <div class="detail-icon">
                                    <i class="fas fa-hourglass-half"></i>
                                </div>
                                <div class="detail-content">
                                    <p class="detail-label">Duration</p>
                                    <p class="detail-value">${session.duration} mins</p>
                                </div>
                            </div>
                            
                            <!-- Amount -->
                            <div class="detail-item">
                                <div class="detail-icon">
                                    <i class="fas fa-rupee-sign"></i>
                                </div>
                                <div class="detail-content">
                                    <p class="detail-label">Amount</p>
                                    <p class="detail-value">₹${session.amount}</p>
                                </div>
                            </div>
                            
                            <!-- Payment Status -->
                            <div class="detail-item">
                                <div class="detail-icon">
                                    <i class="fas fa-credit-card"></i>
                                </div>
                                <div class="detail-content">
                                    <p class="detail-label">Payment</p>
                                    <p class="detail-value">
                                        <span class="payment-status-badge ${session.payment_status}">
                                            <i class="fas ${session.payment_status === 'paid' ? 'fa-check-circle' : 'fa-clock'}"></i>
                                            ${session.payment_status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mentee Additional Info -->
                        <div class="mentee-additional-info">
                            <div class="info-row">
                                <span class="info-label"><i class="fas fa-envelope"></i> Email:</span>
                                <span class="info-value">${session.mentee_email}</span>
                            </div>
                            ${session.mentee_education ? `
                                <div class="info-row">
                                    <span class="info-label"><i class="fas fa-graduation-cap"></i> Education:</span>
                                    <span class="info-value">${session.mentee_education}</span>
                                </div>
                            ` : ''}
                            ${session.mentee_languages ? `
                                <div class="info-row">
                                    <span class="info-label"><i class="fas fa-language"></i> Languages:</span>
                                    <span class="info-value">${session.mentee_languages}</span>
                                </div>
                            ` : ''}
                            ${session.mentee_subjects ? `
                                <div class="info-row">
                                    <span class="info-label"><i class="fas fa-book"></i> Subjects:</span>
                                    <span class="info-value">${session.mentee_subjects}</span>
                                </div>
                            ` : ''}
                            ${session.mentee_qualifications ? `
                                <div class="info-row">
                                    <span class="info-label"><i class="fas fa-award"></i> Qualifications:</span>
                                    <span class="info-value">${session.mentee_qualifications}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Meeting Link (if available) -->
                        ${session.meeting_link ? `
                            <a href="${session.meeting_link}" target="_blank" class="meeting-link-btn">
                                <i class="fas fa-video"></i>
                                Join Meeting
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('') :
        `<div class="no-sessions">
            <i class="fas fa-calendar-times"></i>
            <p>No ${status} sessions found</p>
        </div>`;
    
    document.getElementById('sessionsList').innerHTML = sessionsHtml;
}


document.addEventListener('DOMContentLoaded', function () {
    let currentTab = 'requests'; // Default tab

function showSection(sectionName) {
    console.log("Switching to section:", sectionName);

    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.error(`Section ${sectionName}Section not found!`);
    }

    // Update tab button states
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        if (btn.getAttribute('data-tab') === sectionName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

        // Remember the current tab
        currentTab = sectionName;
    }

    // Attach click listeners to each tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.getAttribute('data-tab');
            showSection(tab);
        });
    });

    // Show default tab on load
    showSection(currentTab);
});

// Load earnings data
async function loadEarnings() {
    try {
        const response = await fetch('/api/mentor/earnings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // console.log("earning response status:", response.ok);
        
        if (response.ok) {
            const earnings = await response.json();
            // console.log("earning response:", earnings);
            document.getElementById('totalEarnings').textContent = `₹${earnings.total || 0}`;
            document.getElementById('totalEarningsDetailed').textContent = `₹${earnings.totalBalance || 0}`;
            document.getElementById('pendingEarnings').textContent = `₹${earnings.pending || 0}`;
            // document.getElementById('completedSessions').textContent = earnings.total_sessions || 0;
            document.getElementById('currentMonthEarnings').textContent = earnings.currentMonth || 0;
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

function closeModal() {
    document.getElementById('acceptModal').style.display = 'none';
    currentRequestId = null;
}

// mentorService.js
async function declineConnectionRequest(requestId, reason) {
  console.log("declineConnectionRequest is called")
  const body = {};
  body.reason = reason;
  body.meeting_link = null;
  body.mentorTime = null;
  body.mentorMessage = null;
  body.status = 'declined';
  const res = await fetch(`/api/mentor/connection-requests/${requestId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({body}),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to decline request');
  }

  return res.json();
}


function showDeclineModal(requestId) {
    console.log('showDeclineModal called with requestId:', requestId);
    
    // Create modal HTML with UNIQUE class names
    const modal = document.createElement('div');
    modal.className = 'decline-modal-wrapper';
    modal.innerHTML = `
    <div class="decline-modal-overlay"></div>
    <div class="decline-modal-content">
        <div class="decline-modal-header">
        <h3><i class="fas fa-exclamation-triangle"></i> Decline Request</h3>
        <button class="decline-close-btn close-decline-modal"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="decline-modal-body">
        <p>Are you sure you want to decline this mentorship request?</p>
        <p class="decline-text-muted">The mentee will be notified of your decision.</p>

        <label for="decline-reason" class="decline-reason-label">
            Reason for declining (required)
        </label>
        <textarea
            id="decline-reason"
            class="decline-reason-input"
            rows="4"
            placeholder="Please tell the mentee why you are declining this request..."></textarea>
        </div>

        <div class="decline-modal-actions">
        <button
            class="decline-btn decline-btn-danger btn-confirm-decline"
            data-request-id="${requestId}">
            <i class="fas fa-times-circle"></i> Yes, Decline
        </button>
        <button class="decline-btn decline-btn-cancel close-decline-modal">
            Cancel
        </button>
        </div>
    </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelectorAll('.close-decline-modal, .decline-modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    // Confirm decline handler
    modal.querySelector('.btn-confirm-decline').addEventListener('click', async () => {

        const reason = modal.querySelector('.decline-reason-input').value.trim();
        if (!reason) {
            alert('Please enter a reason before declining.');
            return;
        }

        await declineConnectionRequest(requestId, reason);
        console.log('Request declined with reason:', reason);

        modal.remove();
        await rejectRequest(requestId);
    });
}


async function rejectRequest(requestId) {    
    try {
        console.log('Making API call to decline request...');
        const response = await fetch(`/api/mentor/requests/${requestId}/decline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: 'Not available'
            })
        });
        
        const result = await response.json();
        console.log('API Response data:', result);
        
        if (response.ok) {
            showMessage('Request rejected', 'success');
            await loadRequests();
        } else {
            showMessage(result.message || 'Error rejecting request', 'error');
        }
    } catch (error) {
        console.error('Error in rejectRequest:', error);
        showMessage('An error occurred', 'error');
    }
}



async function uploadProfilePic() {
    const fileInput = document.getElementById('profilePicUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select a file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch('/api/upload-profile-pic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Profile picture updated!', 'success');
            document.getElementById('profilePic').src = result.profilePicture;
        } else {
            showMessage(result.message || 'Error uploading file', 'error');
        }
    } catch (error) {
        showMessage('An error occurred', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/mentor/login';
}

// Show customer care modal
function showCustomerCare() {
    document.getElementById('customerCareModal').style.display = 'flex';
}

// Close customer care modal
function closeCustomerCare() {
    document.getElementById('customerCareModal').style.display = 'none';
}

// Copy mentor UPI ID
function copyMentorUpi() {
    const upiId = document.getElementById('mentorUpiId').textContent;
    navigator.clipboard.writeText(upiId).then(() => {
        showMessage('UPI ID copied to clipboard! 📋', 'success');
    });
}

// Show sections with tab management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}Section`).style.display = 'block';
    
    // Add active class to clicked tab
    if (event && event.target.classList.contains('tab-btn')) {
        event.target.classList.add('active');
    }
}

// Upload profile picture with enhanced feedback
document.getElementById('profilePicUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch('/api/upload-profile-pic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Profile picture updated successfully! 📸', 'success');
            document.getElementById('profilePic').src = result.profilePicture;
            document.getElementById('profilePicLarge').src = result.profilePicture;
        } else {
            showMessage(result.message || 'Error uploading file', 'error');
        }
    } catch (error) {
        showMessage('An error occurred while uploading', 'error');
    }
});

// Realtime setup and popup handler
function setupRealtime() {
    try {
        const socket = io({ auth: { token } });

        socket.on('connect', () => {
            console.log('Connected to realtime server');
        });

        socket.on('request:new', async (payload) => {
            showIncomingRequestModal(payload);

            // Assuming you wanted to send this payload to a server endpoint
            const body = { requestId: payload.id, status: 'received' };
            try {
                await fetch('/api/request/ack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } catch (err) {
                console.error('Failed to acknowledge request:', err);
            }
        });

        socket.on('meeting:start', (payload) => {
            showMeetingMiniWindow(payload);
        });

        socket.on('meeting:message', (msg) => {
            appendMeetingMessage(msg, 'incoming');
        });

    } catch (e) {
        console.warn('Realtime not available:', e.message);
    }
}

function toDatetimeLocalString(dateString) {
  const d = new Date(dateString);
  const pad = n => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${hours}:${minutes} hours on ${day}-${month}-${year}`;
}

async function acceptConnectionRequest(requestId, body) {
  console.log("acceptConnectionRequest is called")
  const res = await fetch(`/api/mentor/connection-requests/${requestId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({body}),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to accept request');
  }

  return res.json();
}

function showIncomingRequestModal(payload) {
    console.log("Showing incoming request modal with payload:", payload);
    const modal = document.createElement('div');
    modal.className = 'accept-modal';
    modal.style.display = 'flex';
    const preferredTimeValue = payload.preferredTime ? toDatetimeLocalString(payload.preferredTime) : '';

    modal.innerHTML = `
        <div class="accept-modal-overlay"></div>
        <div class="accept-modal-content">
            <div class="accept-modal-header">
                <h3><i class="fas fa-user-plus"></i> New Connection Request</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="accept-mentee-preview">
                <div class="accept-mentee-preview-card">
                    <img src="${payload.mentee?.avatar || '../uploads/default.jpg'}" alt="${payload.mentee?.firstName || ''}">
                    <div>
                        <h4>${(payload.mentee?.firstName || '') + ' ' + (payload.mentee?.lastName || '')}</h4>
                        ${payload.message ? `<p><strong>Message:</strong> ${payload.message}</p>` : ''}
                        ${preferredTimeValue ? `<p><strong>Preferred Time:</strong> ${preferredTimeValue}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="accept-form-group">
                <label><i class="fas fa-clock"></i> Meeting Date & Time</label>
                <input type="datetime-local" class="meeting-time-input" required value = "${payload.preferredTime || ''}">
            </div>
            <div class="accept-form-group">
                <label><i class="fas fa-video"></i> Meeting Link (optional)</label>
                <input type="url" class="meeting-link-input" placeholder="https://meet.google.com/...">
            </div>
            <div class="accept-form-group">
                <label><i class="fas fa-message"></i> Message to Mentee (optional)</label>
                <input type="text" class="meeting-message-input" placeholder="Enter your message...">
            </div>
            <div class="accept-modal-actions">
                <button class="btn btn-accept-modal"><i class="fas fa-check"></i> Accept</button>
                <button class="btn btn-reject-modal"><i class="fas fa-times"></i> Cancel</button>
            </div>
        </div>`;

    function close() { document.body.removeChild(modal); }

    modal.querySelector('.accept-modal-overlay').addEventListener('click', close);
    modal.querySelector('.close-btn').addEventListener('click', close);
    // FIND THIS SECTION IN showIncomingRequestModal():

    modal.querySelector('.btn-accept-modal').addEventListener('click', async () => {
        try {
            console.log("Accepting request with payload:", payload);
            const meetingTimeInput = modal.querySelector('.meeting-time-input');
            const meetingLinkInput = modal.querySelector('.meeting-link-input');
            const meetingMessageInput = modal.querySelector('.meeting-message-input');
            const meetingTime = meetingTimeInput?.value;
            const meetingLink = meetingLinkInput?.value;
            const meetingMessage = meetingMessageInput?.value;
            
            // BUILD THE REQUEST BODY
            const body = {};
            if (meetingTime) {
                body.meetingTime = meetingTime;
                body.meetingMessage = meetingMessage || "Looking forward to our meeting!";
                body.meetingLink = meetingLink;
            }

            body.status = 'accepted';

            acceptConnectionRequest(payload.requestId, body);

            console.log("mentor message and other details are logged");

            // SEND THE REQUEST WITH THE BODY
            // ✅ CORRECT
            const resp = await fetch(`/api/mentor/requests/${payload.requestId}/accept`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(body)
            });

            console.log("Response:", resp);
            
            if (resp.ok) {
                showMessage('Accepted connection request', 'success');
                close();
                await loadRequests();
                await loadSessions();
            } else {
                const r = await resp.json().catch(() => ({}));
                showMessage(r.error || 'Failed to accept', 'error');
            }
        } catch (e) {
            showMessage('Network error', 'error');
        }
    });


    modal.querySelector('.btn-reject-modal').addEventListener('click', async () => {
        close();
    });

    document.body.appendChild(modal);
}

// Mini meeting window + chat
let meetingWindow = null;
let meetingPeerId = null;
let meetingSocket = null;

function showMeetingMiniWindow(payload) {
    meetingPeerId = (localStorage.getItem('userId') == payload.mentorId) ? payload.menteeId : payload.mentorId;
    meetingSocket = io({ auth: { token } });

    if (meetingWindow) {
        document.body.removeChild(meetingWindow);
    }
    meetingWindow = document.createElement('div');
    meetingWindow.style.cssText = 'position:fixed; bottom:20px; right:20px; width:360px; background:#fff; box-shadow:0 8px 25px rgba(0,0,0,0.15); border-radius:10px; z-index:2000; display:flex; flex-direction:column;';
    meetingWindow.innerHTML = `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <div><strong>Meeting Started</strong><div style="font-size:12px;color:#666;">${new Date(payload.scheduledAt).toLocaleString()}</div></div>
            <button class="close-mini" style="border:none;background:transparent;font-size:18px;cursor:pointer">&times;</button>
        </div>
        <div style="padding:10px;">
            <div style="margin-bottom:8px; font-size:14px;">Meet link:</div>
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
                <a href="${payload.meetLink}" target="_blank" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${payload.meetLink}</a>
                <button class="send-link" style="padding:6px 8px;">Send</button>
            </div>
            <div class="chat" style="height:140px; overflow:auto; border:1px solid #eee; border-radius:6px; padding:6px; margin-bottom:8px;"></div>
            <div style="display:flex; gap:6px;">
                <input type="text" class="chat-input" placeholder="Type a message" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:6px;">
                <button class="chat-send" style="padding:6px 10px;">Send</button>
            </div>
        </div>`;

    meetingWindow.querySelector('.close-mini').addEventListener('click', () => {
        document.body.removeChild(meetingWindow); meetingWindow = null;
    });
    meetingWindow.querySelector('.send-link').addEventListener('click', () => {
        if (!meetingSocket) return;
        meetingSocket.emit('meeting:message', { toUserId: meetingPeerId, text: 'Join via this link', link: payload.meetLink });
        appendMeetingMessage({ text: 'Link sent', link: payload.meetLink, fromUserId: localStorage.getItem('userId') }, 'outgoing');
    });
    meetingWindow.querySelector('.chat-send').addEventListener('click', () => {
        const input = meetingWindow.querySelector('.chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value='';
        if (!meetingSocket) return;
        meetingSocket.emit('meeting:message', { toUserId: meetingPeerId, text });
        appendMeetingMessage({ text, fromUserId: localStorage.getItem('userId') }, 'outgoing');
    });

    document.body.appendChild(meetingWindow);
}

function appendMeetingMessage(msg, direction) {
    if (!meetingWindow) return;
    const chat = meetingWindow.querySelector('.chat');
    const div = document.createElement('div');
    div.style.margin = '6px 0';
    if (direction === 'outgoing') {
        div.style.textAlign = 'right';
    }
    div.innerHTML = `${msg.text ? msg.text : ''} ${msg.link ? `<a href=\"${msg.link}\" target=\"_blank\">${msg.link}</a>` : ''}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showMessage(message, type) {
    const messageEl = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}


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
    const dropdownBtn = document.querySelector('.profile-btn');
    const dropdownMenu = document.querySelector('.profile-menu');
    
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
    const dropdownMenu = document.querySelector('.profile-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
        setTimeout(() => {
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.transform = 'translateY(0)';
        }, 100);
    }
}

function hideDropdown() {
    const dropdownMenu = document.querySelector('.profile-menu');
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

// ======== PROFILE EDITABLE VERSION ====================

let originalProfileData = {};
let editMode = false;

// Toggle between edit and view modes
function toggleProfileEdit() {
    editMode = !editMode;
    
    if (editMode) {
        // Safely get all display elements
        const nameDisplay = document.getElementById('nameDisplay');
        const phoneDisplay = document.getElementById('phoneDisplay');
        const specializationDisplay = document.getElementById('specializationDisplay');
        const experienceDisplay = document.getElementById('experienceDisplay');
        const bioDisplay = document.getElementById('bioDisplay');
        const hourlyRateDisplay = document.getElementById('hourlyRateDisplay');
        const languagesDisplay = document.getElementById('languagesDisplay');
        const subjectsDisplay = document.getElementById('subjectsDisplay');
        const availableHoursDisplay = document.getElementById('availableHoursDisplay');
        const upiIdDisplay = document.getElementById('upiIdDisplay');
        const currentPursuitDisplay = document.getElementById('currentPursuitDisplay');
        
        // Store original data for cancel functionality
        originalProfileData = {
            name: nameDisplay ? nameDisplay.textContent : '',
            phone: phoneDisplay ? phoneDisplay.textContent : '',
            specialization: specializationDisplay ? specializationDisplay.textContent : '',
            experience: experienceDisplay ? experienceDisplay.textContent : '',
            bio: bioDisplay ? bioDisplay.textContent : '',
            hourlyRate: hourlyRateDisplay ? hourlyRateDisplay.textContent.replace('₹', '').replace('/hour', '').trim() : '',
            languages: languagesDisplay ? languagesDisplay.textContent : '',
            subjects: subjectsDisplay ? subjectsDisplay.textContent : '',
            availableHours: availableHoursDisplay ? availableHoursDisplay.textContent : '',
            upiId: upiIdDisplay ? upiIdDisplay.textContent.replace('Not specified', '').trim() : '',
            currentPursuit: currentPursuitDisplay ? currentPursuitDisplay.textContent : ''
        };
        
        // Populate edit fields with current values
        // const nameEdit = document.getElementById('nameEdit');
        const phoneEdit = document.getElementById('phoneEdit');
        const specializationEdit = document.getElementById('specializationEdit');
        const experienceEdit = document.getElementById('experienceEdit');
        const bioEdit = document.getElementById('bioEdit');
        const hourlyRateEdit = document.getElementById('hourlyRateEdit');
        const languagesEdit = document.getElementById('languagesEdit');
        const subjectsEdit = document.getElementById('subjectsEdit');
        const availableHoursEdit = document.getElementById('availableHoursEdit');
        const upiIdEdit = document.getElementById('upiIdEdit');
        const currentPursuitEdit = document.getElementById('currentPursuitEdit');
        
        // if (nameEdit) nameEdit.value = originalProfileData.name;
        if (phoneEdit) phoneEdit.value = originalProfileData.phone;
        if (specializationEdit) specializationEdit.value = originalProfileData.specialization;
        if (experienceEdit) experienceEdit.value = originalProfileData.experience;
        if (bioEdit) bioEdit.value = originalProfileData.bio;
        if (hourlyRateEdit) hourlyRateEdit.value = originalProfileData.hourlyRate;
        if (languagesEdit) languagesEdit.value = originalProfileData.languages;
        if (subjectsEdit) subjectsEdit.value = originalProfileData.subjects;
        if (availableHoursEdit) availableHoursEdit.value = originalProfileData.availableHours;
        if (upiIdEdit) upiIdEdit.value = originalProfileData.upiId;
        if (currentPursuitEdit) currentPursuitEdit.value = originalProfileData.currentPursuit;
        
        // Show edit fields, hide display fields
        toggleFields(true);
        
        // Toggle buttons
        const editBtn = document.getElementById('editProfileBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        const cancelBtn = document.getElementById('cancelProfileBtn');
        
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-block';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
    }
}


// Toggle between display and edit fields
function toggleFields(isEdit) {
    const editableFields = ['name', 'phone', 'specialization', 'experience', 'bio', 'hourlyRate', 'languages', 'subjects', 'availableHours', 'upiId', 'currentPursuit'];
    
    editableFields.forEach(field => {
        const displayElement = document.getElementById(`${field}Display`);
        const editElement = document.getElementById(`${field}Edit`);
        
        // Check if elements exist before trying to modify them
        if (displayElement && editElement) {
            if (isEdit) {
                displayElement.style.display = 'none';
                editElement.style.display = 'block';
            } else {
                displayElement.style.display = 'block';
                editElement.style.display = 'none';
            }
        }
    });
}


// Save profile changes
async function saveProfile() {
    // Safely get all edit elements
    // const nameEdit = document.getElementById('nameEdit');
    const phoneEdit = document.getElementById('phoneEdit');
    const specializationEdit = document.getElementById('specializationEdit');
    const institutionDisplay = document.getElementById('institutionDisplay');
    const educationDisplay = document.getElementById('educationDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    const experienceEdit = document.getElementById('experienceEdit');
    const bioEdit = document.getElementById('bioEdit');
    const hourlyRateEdit = document.getElementById('hourlyRateEdit');
    const languagesEdit = document.getElementById('languagesEdit');
    const subjectsEdit = document.getElementById('subjectsEdit');
    const availableHoursEdit = document.getElementById('availableHoursEdit');
    const upiIdEdit = document.getElementById('upiIdEdit');
    const currentPursuitEdit = document.getElementById('currentPursuitEdit');
    
    const updatedData = {
        name: nameDisplay ? nameDisplay.textContent.trim() : '',
        phone: phoneEdit ? phoneEdit.value.trim() : '',
        skills: specializationEdit ? specializationEdit.value.trim() : '',
        institution: institutionDisplay ? institutionDisplay.textContent.trim() : '',
        education: educationDisplay ? educationDisplay.textContent.trim() : '',
        email: emailDisplay ? emailDisplay.textContent.trim() : '',
        experience: experienceEdit ? experienceEdit.value.trim() : '',
        bio: bioEdit ? bioEdit.value.trim() : '',
        hourlyRate: hourlyRateEdit ? hourlyRateEdit.value.trim() : '',
        languages: languagesEdit ? languagesEdit.value.trim() : '',
        subjects: subjectsEdit ? subjectsEdit.value.trim() : '',
        availableHours: availableHoursEdit ? availableHoursEdit.value.trim() : '',
        upiId: upiIdEdit ? upiIdEdit.value.trim() : '',
        current_pursuit : currentPursuitEdit ? currentPursuitEdit.value.trim() : ''
    };
    
    // Validate fields
    if (!updatedData.name) {
        alert('Name is required');
        return;
    }
    
    try {
        const response = await fetch('/api/mentor/profile/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        
        if (response.ok) {
            // Safely update display fields with new values
            const nameDisplay = document.getElementById('nameDisplay');
            const phoneDisplay = document.getElementById('phoneDisplay');
            const specializationDisplay = document.getElementById('specializationDisplay');
            const experienceDisplay = document.getElementById('experienceDisplay');
            const bioDisplay = document.getElementById('bioDisplay');
            const hourlyRateDisplay = document.getElementById('hourlyRateDisplay');
            const languagesDisplay = document.getElementById('languagesDisplay');
            const subjectsDisplay = document.getElementById('subjectsDisplay');
            const availableHoursDisplay = document.getElementById('availableHoursDisplay');
            const upiIdDisplay = document.getElementById('upiIdDisplay');
            const currentPursuitDisplay = document.getElementById('currentPursuitDisplay');
            
            if (nameDisplay) nameDisplay.textContent = updatedData.name;
            if (phoneDisplay) phoneDisplay.textContent = updatedData.phone;
            if (specializationDisplay) specializationDisplay.textContent = updatedData.skills;
            if (experienceDisplay) experienceDisplay.textContent = updatedData.experience;
            if (bioDisplay) bioDisplay.textContent = updatedData.bio;
            if (hourlyRateDisplay) hourlyRateDisplay.textContent = updatedData.hourlyRate ? `₹${updatedData.hourlyRate}/hour` : 'Not set';
            if (languagesDisplay) languagesDisplay.textContent = updatedData.languages || 'Not specified';
            if (subjectsDisplay) subjectsDisplay.textContent = updatedData.subjects || 'Not specified';
            if (availableHoursDisplay) availableHoursDisplay.textContent = updatedData.availableHours || 'Not specified';
            if (upiIdDisplay) upiIdDisplay.textContent = updatedData.upiId || 'Not specified';
            if( currentPursuitDisplay) currentPursuitDisplay.textContent = updatedData.current_pursuit || 'Not specified';
            
            // Exit edit mode
            editMode = false;
            toggleFields(false);
            
            const editBtn = document.getElementById('editProfileBtn');
            const saveBtn = document.getElementById('saveProfileBtn');
            const cancelBtn = document.getElementById('cancelProfileBtn');
            
            if (editBtn) editBtn.style.display = 'inline-block';
            if (saveBtn) saveBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            
            showNotification('Profile updated successfully', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred while updating profile', 'error');
    }
}

// Cancel edit mode
function cancelProfileEdit() {
    editMode = false;
    toggleFields(false);
    
    // Reset buttons
    document.getElementById('editProfileBtn').style.display = 'inline-block';
    document.getElementById('saveProfileBtn').style.display = 'none';
    document.getElementById('cancelProfileBtn').style.display = 'none';
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

// =====NOTIFICATIONS PANEL =====
// Open notification modal
function openNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    loadNotifications();
}

// Close notification modal
function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Close modal when pressing ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('notificationModal');
        if (modal.classList.contains('show')) {
            closeNotificationModal();
        }
    }
});

// Load notifications from backend
async function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    
    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();
        
        const badge = document.getElementById('notificationBadge');
        
        // Update badge count
        const unreadCount = notifications.filter(n => !n.isRead).length;
        badge.textContent = unreadCount > 0 ? unreadCount : '';
        
        // Render notifications
        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notif-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notif-item ${notification.isRead ? '' : 'unread'}" 
                 data-id="${notification.id}"
                 onclick="handleNotificationClick('${notification.id}')">
                <div class="notif-icon">
                    <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notif-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notif-time">
                        <i class="far fa-clock"></i> ${formatTime(notification.created_at)}
                    </span>
                </div>
                ${!notification.isRead ? `
                    <button class="notif-mark-read-btn" onclick="event.stopPropagation(); markAsRead(this)" title="Mark as read">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationList.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load notifications</p>
            </div>
        `;
    }
}

// Handle notification click
async function handleNotificationClick(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        
        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
            const btn = item.querySelector('.notif-mark-read-btn');
            if (btn) btn.remove();
        }
        
        updateBadgeCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark single notification as read
async function markAsRead(button) {
    const notificationItem = button.closest('.notif-item');
    const notificationId = notificationItem.dataset.id;
    
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
        
        notificationItem.classList.remove('unread');
        button.remove();
        updateBadgeCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        await fetch('/api/notifications/mark-all-read', {
            method: 'PATCH'
        });
        
        document.querySelectorAll('.notif-item.unread').forEach(item => {
            item.classList.remove('unread');
            const button = item.querySelector('.notif-mark-read-btn');
            if (button) button.remove();
        });
        
        updateBadgeCount();
        
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Update badge count
function updateBadgeCount() {
    const unreadCount = document.querySelectorAll('.notif-item.unread').length;
    const badge = document.getElementById('notificationBadge');
    badge.textContent = unreadCount > 0 ? unreadCount : '';
}

// Get icon based on notification type
function getNotificationIcon(type) {
    const icons = {
        'session_booked': 'calendar-check',
        'session_cancelled': 'calendar-times',
        'payment_received': 'money-bill-wave',
        'message': 'envelope',
        'profile_update': 'user',
        'reminder': 'bell',
        'session_reminder': 'clock'
    };
    return icons[type] || 'bell';
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Load notifications when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    setInterval(loadNotifications, 30000);
});


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
