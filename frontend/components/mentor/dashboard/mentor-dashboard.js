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

async function loadProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            document.getElementById('userName').textContent = user.first_name;
            document.getElementById('userNameShort').textContent = user.first_name;
            document.getElementById('mentorUpiId').textContent = user.upi_id || 'Not set';
            
            if (user.profile_picture) {
                document.getElementById('profilePic').src = user.profile_picture;
                document.getElementById('profilePicLarge').src = user.profile_picture;
            }
            
            // Display enhanced profile details
            const profileDetails = `
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>Full Name</label>
                        <span>${user.first_name} ${user.last_name}</span>
                    </div>
                    <div class="profile-item">
                        <label>Email</label>
                        <span>${user.email}</span>
                    </div>
                    <div class="profile-item">
                        <label>Age</label>
                        <span>${user.age || 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Education</label>
                        <span>${user.education || 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Institution</label>
                        <span>${user.institution || 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Current Pursuit</label>
                        <span>${user.current_pursuit || 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Hourly Rate</label>
                        <span class="price-highlight">₹${user.hourly_rate}/hour</span>
                    </div>
                    <div class="profile-item">
                        <label>Languages</label>
                        <span>${user.languages ? user.languages.join(', ') : 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Teaching Subjects</label>
                        <span>${user.subjects ? user.subjects.join(', ') : 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Available Hours</label>
                        <span>${user.available_hours ? user.available_hours.join(', ') : 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>Mobile Number</label>
                        <span>${user.mobile_number || 'Not specified'}</span>
                    </div>
                    <div class="profile-item">
                        <label>UPI ID</label>
                        <span>${user.upi_id || 'Not set'}</span>
                    </div>
                    ${user.qualifications ? `
                        <div class="profile-item full-width">
                            <label>Qualifications & Experience</label>
                            <span>${user.qualifications}</span>
                        </div>
                    ` : ''}
                </div>
            `;
            document.getElementById('profileDetails').innerHTML = profileDetails;
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
        const requests = result.data || [];

        console.log('Fetched requests:', requests);

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
                    <img src="${request.profile_picture || '/uploads/default-avatar.png'}" 
                         alt="${request.first_name}">
                    <div class="mentee-basic">
                        <h3>${request.first_name} ${request.last_name}</h3>
                        <div class="mentee-info">
                            <span><i class="fas fa-envelope"></i> ${request.email}</span>
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
                    <div class="detail-section">
                        <h4><i class="fas fa-book"></i> Wants to Learn:</h4>
                        <p class="subject-highlight">${request.subject}</p>
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
                            <span>${request.preferred_time || 'Flexible'}</span>
                        </div>
                        <div class="preference-item">
                            <i class="fas fa-star"></i>
                            <label>Interests:</label>
                            <span>${
                                request.interests
                                    ? request.interests.join(', ')
                                    : 'General learning'
                            }</span>
                        </div>
                    </div>
                </div>

                <div class="request-actions">
                    <button class="btn btn-accept" 
                            onclick="acceptRequest(${request.id}, '${request.first_name} ${request.last_name}', '${request.subject}')">
                        <i class="fas fa-check-circle"></i> Accept Request
                    </button>
                    <button class="btn btn-reject" onclick="rejectRequest(${request.id})">
                        <i class="fas fa-times-circle"></i> Decline
                    </button>
                </div>
            </div>
        `
            )
            .join('');

        // Render all requests
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

// Optional: Automatically load requests on page load
document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
});


async function loadSessions() {
    try {
        const response = await fetch('/api/mentor/sessions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const sessions = await response.json();
            document.getElementById('upcomingSessions').textContent = sessions.length;
            
            const sessionsHtml = sessions.length > 0 ?
                sessions.map(session => `
                    <div class="session-card">
                        <div class="session-info">
                            <div>
                                <strong>Mentee:</strong> ${session.mentee_first_name} ${session.mentee_last_name}
                            </div>
                            <div>
                                <strong>Subject:</strong> ${session.subject}
                            </div>
                            <div>
                                <strong>Date & Time:</strong> ${new Date(session.scheduled_time).toLocaleString()}
                            </div>
                            <div>
                                <strong>Amount:</strong> ₹${session.amount}
                            </div>
                        </div>
                        ${session.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${session.meeting_link}" target="_blank">${session.meeting_link}</a></p>` : ''}
                    </div>
                `).join('') :
                '<p>No scheduled sessions</p>';
            
            document.getElementById('sessionsList').innerHTML = sessionsHtml;
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function loadEarnings() {
    try {
        const response = await fetch('/api/mentor/earnings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const earnings = await response.json();
            document.getElementById('totalEarnings').textContent = `₹${earnings.total_earnings || 0}`;
            document.getElementById('totalEarningsDetailed').textContent = `₹${earnings.total_earnings || 0}`;
            document.getElementById('pendingEarnings').textContent = `₹${earnings.pending_earnings || 0}`;
            document.getElementById('completedSessions').textContent = earnings.total_sessions || 0;
            document.getElementById('sessionsCount').textContent = earnings.total_sessions || 0;
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
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

function acceptRequest(requestId, menteeName, subject) {
    currentRequestId = requestId;
    
    // Show mentee preview in modal
    document.getElementById('selectedMenteePreview').innerHTML = `
        <div class="mentee-preview-card">
            <div class="preview-header">
                <i class="fas fa-user-graduate"></i>
                <div>
                    <h4>${menteeName}</h4>
                    <p>Wants to learn: <span class="subject">${subject}</span></p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('acceptModal').style.display = 'flex';
    
    // Set minimum datetime to current time
    const now = new Date();
    const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('meetingTime').min = minDateTime;
}

function closeModal() {
    document.getElementById('acceptModal').style.display = 'none';
    currentRequestId = null;
}

document.getElementById('acceptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const meetingTime = document.getElementById('meetingTime').value;
    const meetingLink = document.getElementById('meetingLink').value;
    
    try {
        const response = await fetch(`/api/mentor/requests/${currentRequestId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meetingTime: meetingTime,
                meetingLink: meetingLink
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Request accepted and session scheduled!', 'success');
            closeModal();
            await loadRequests();
            await loadSessions();
        } else {
            showMessage(result.message || 'Error accepting request', 'error');
        }
    } catch (error) {
        showMessage('An error occurred', 'error');
    }
});

async function rejectRequest(requestId) {
    if (!confirm('Are you sure you want to reject this request?')) return;
    
    try {
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
        
        if (response.ok) {
            showMessage('Request rejected', 'success');
            await loadRequests();
        } else {
            showMessage(result.message || 'Error rejecting request', 'error');
        }
    } catch (error) {
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
    window.location.href = '/';
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


function showIncomingRequestModal(payload) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> New Connection Request</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="mentee-preview">
                <div class="mentee-preview-card">
                    <img src="${payload.mentee?.avatar || '/uploads/default-avatar.png'}" alt="${payload.mentee?.firstName || ''}">
                    <div>
                        <h4>${(payload.mentee?.firstName || '') + ' ' + (payload.mentee?.lastName || '')}</h4>
                        ${payload.subject ? `<p><strong>Subject:</strong> ${payload.subject}</p>` : ''}
                        ${payload.message ? `<p><strong>Message:</strong> ${payload.message}</p>` : ''}
                        ${payload.preferredTime ? `<p><strong>Preferred Time:</strong> ${payload.preferredTime}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Meeting Date & Time</label>
                <input type="datetime-local" class="meeting-time-input" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-video"></i> Meeting Link (optional)</label>
                <input type="url" class="meeting-link-input" placeholder="https://meet.google.com/...">
            </div>
            <div class="modal-actions">
                <button class="btn btn-accept"><i class="fas fa-check"></i> Accept</button>
                <button class="btn btn-reject"><i class="fas fa-times"></i> Deny</button>
            </div>
        </div>`;

    function close() { document.body.removeChild(modal); }

    modal.querySelector('.modal-overlay').addEventListener('click', close);
    modal.querySelector('.close-btn').addEventListener('click', close);
    modal.querySelector('.btn-accept').addEventListener('click', async () => {
        try {
            const meetingTimeInput = modal.querySelector('.meeting-time-input');
            const meetingLinkInput = modal.querySelector('.meeting-link-input');
            const meetingTime = meetingTimeInput && meetingTimeInput.value ? meetingTimeInput.value : null;
            const body = meetingTime ? { meetingTime, meetingLink: meetingLinkInput && meetingLinkInput.value ? meetingLinkInput.value : undefined } : {};
            const resp = await fetch(`/api/mentor/requests/${payload.requestId}/accept`, {
                method: 'POST',
headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
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
    modal.querySelector('.btn-reject').addEventListener('click', async () => {
        try {
            const resp = await fetch(`/api/mentor/requests/${payload.requestId}/decline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Not available' })
            });
            if (resp.ok) {
                showMessage('Declined connection request', 'success');
                close();
                await loadRequests();
            } else {
                const r = await resp.json().catch(() => ({}));
                showMessage(r.error || 'Failed to decline', 'error');
            }
        } catch (e) {
            showMessage('Network error', 'error');
        }
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
