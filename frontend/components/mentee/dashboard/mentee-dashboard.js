/**
 * Mentee Dashboard Functionality
 * Complete dashboard management for mentees
 */

// ========================================
// GLOBAL VARIABLES
// ========================================
const token = localStorage.getItem('authToken');
let allMentors = [];
let currentMentorId = null;
let meetingWindow = null;
let meetingPeerId = null;
let meetingSocket = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!token) {
        window.location.href = '/login';
        return;
    }

// document.addEventListener('DOMContentLoaded', () => {
//     const connectForm = document.getElementById('connectForm');
//     if (connectForm) {
//         connectForm.addEventListener('submit', handleConnectFormSubmit);
//     }
// });


// // ---------------- Initialize ----------------
// document.addEventListener('DOMContentLoaded', () => {
//     attachConnectFormHandler();
// });

    // Initialize all components
    await loadProfile();
    await searchMentors();
    await loadSessions();
    await loadPlatformConfig();
    setupRealtime();
    setupEventListeners();
});

// ========================================
// EVENT LISTENERS SETUP
// ========================================
function setupEventListeners() {
    // Enter key support for search inputs
    const searchInputs = ['subjectSearch', 'minPrice', 'maxPrice', 'languageSearch'];
    searchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchMentors();
                }
            });
        }
    });

    // Profile picture upload
    const profilePicUpload = document.getElementById('profilePicUpload');
    if (profilePicUpload) {
        profilePicUpload.addEventListener('change', handleProfilePictureUpload);
    }

    // Connect form submission
    const connectForm = document.getElementById('connectForm');
    if (connectForm) {
        connectForm.addEventListener('submit', handleConnectFormSubmit);
    }

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-dropdown')) {
            const profileMenu = document.getElementById('profileMenu');
            if (profileMenu) profileMenu.style.display = 'none';
        }
    });
}

// ========================================
// AUTHENTICATION & USER DATA
// ========================================
async function loadProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            updateProfileUI(user);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileUI(user) {
    // Update header
    const userName = document.getElementById('userName');
    const userNameShort = document.getElementById('userNameShort');
    if (userName) userName.textContent = user.first_name;
    if (userNameShort) userNameShort.textContent = user.first_name;
    
    // Update profile pictures
    if (user.profile_picture) {
        const profilePic = document.getElementById('profilePic');
        const profilePicLarge = document.getElementById('profilePicLarge');
        if (profilePic) profilePic.src = user.profile_picture;
        if (profilePicLarge) profilePicLarge.src = user.profile_picture;
    }
    
    // Display profile details
    const profileDetails = document.getElementById('profileDetails');
    if (profileDetails) {
        profileDetails.innerHTML = `
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
                    <label>Languages</label>
                    <span>${user.languages ? user.languages.join(', ') : 'Not specified'}</span>
                </div>
                <div class="profile-item">
                    <label>Learning Interests</label>
                    <span>${user.interests ? user.interests.join(', ') : 'Not specified'}</span>
                </div>
                <div class="profile-item">
                    <label>Budget Range</label>
                    <span>${user.budget_min ? `₹${user.budget_min}` : 'No min'} - ${user.budget_max ? `₹${user.budget_max}` : 'No max'}</span>
                </div>
                <div class="profile-item">
                    <label>Available Hours</label>
                    <span>${user.available_hours ? user.available_hours.join(', ') : 'Not specified'}</span>
                </div>
                <div class="profile-item">
                    <label>UPI ID</label>
                    <span>${user.upi_id || 'Not set'}</span>
                </div>
            </div>
        `;
    }
}

async function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch('/api/upload-profile-pic', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Profile picture updated! 📸', 'success');
            document.getElementById('profilePic').src = result.profilePicture;
            document.getElementById('profilePicLarge').src = result.profilePicture;
        } else {
            showMessage(result.message || 'Error uploading file', 'error');
        }
    } catch (error) {
        showMessage('An error occurred', 'error');
    }
}

// ========================================
// PLATFORM CONFIGURATION
// ========================================
async function loadPlatformConfig() {
    try {
        const response = await fetch('/api/platform-config');
        if (response.ok) {
            const config = await response.json();
            const platformUpiId = document.getElementById('platformUpiId');
            if (platformUpiId) platformUpiId.textContent = config.upiId;
            
            // Update all UPI ID references
            document.querySelectorAll('.platform-upi').forEach(el => {
                el.textContent = config.upiId;
            });
            
            // Update commission percentage displays
            document.querySelectorAll('.commission-percentage').forEach(el => {
                el.textContent = `${config.commissionPercentage}%`;
            });
        }
    } catch (error) {
        console.error('Error loading platform config:', error);
    }
}

// ========================================
// MENTOR SEARCH & DISPLAY
// ========================================
async function searchMentors() {
    const subject = document.getElementById('subjectSearch')?.value.trim() || '';
    const minPrice = document.getElementById('minPrice')?.value.trim() || '';
    const maxPrice = document.getElementById('maxPrice')?.value.trim() || '';
    const gender = document.getElementById('genderFilter')?.value.trim() || '';
    const language = document.getElementById('languageSearch')?.value.trim() || '';
    
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (gender) params.append('gender', gender);
    if (language) params.append('language', language);
    
    try {
        const response = await fetch(`/api/mentee/find-mentors?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            allMentors = result.data || result || [];
            displayMentors(allMentors);
        } else {
            showMessage('Error loading mentors', 'error');
        }
    } catch (error) {
        console.error('Error searching mentors:', error);
        showMessage('Error searching mentors', 'error');
    }
}

function clearFilters() {
    const subjectInput = document.getElementById('subjectSearch');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const genderSelect = document.getElementById('genderFilter');
    const languageInput = document.getElementById('languageSearch');
    
    if (subjectInput) subjectInput.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (genderSelect) genderSelect.value = '';
    if (languageInput) languageInput.value = '';
    
    searchMentors();
}

// Global variable to track if handler is already attached
let isFormHandlerAttached = false;

// Global variable to track current mentor

function displayMentors(mentors) {
    const mentorsGrid = document.getElementById('mentorsGrid');
    const mentorCount = document.getElementById('mentorCount');

    if (!mentorsGrid) return;

    // Update mentor count
    if (mentorCount) {
        mentorCount.textContent = `${mentors.length} mentor${mentors.length !== 1 ? 's' : ''} found`;
    }

    // Handle empty mentors list
    if (mentors.length === 0) {
        mentorsGrid.innerHTML = `
            <div class="no-mentors">
                <i class="fas fa-search"></i>
                <h3>No mentors found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    // Generate mentor cards
    mentorsGrid.innerHTML = mentors.map(mentor => {
        const mentorName = `${mentor.first_name || ''} ${mentor.last_name || ''}`;
        const safeMentorName = mentorName.replace(/'/g, "\\'");

        return `
        <div class="mentor-card enhanced" data-mentor-id="${mentor.id}" data-mentor-name="${safeMentorName}">
            <div class="mentor-header">
                <img src="${mentor.profile_picture || '/uploads/avatars/default-avatar.png'}" alt="${mentor.first_name}">
                <div class="mentor-basic">
                    <h3>${mentorName}</h3>
                    <div class="mentor-rating">
                        <span class="rating-stars">${'★'.repeat(Math.floor(mentor.rating || 4))}${'☆'.repeat(5 - Math.floor(mentor.rating || 4))}</span>
                        <span class="rating-text">${mentor.rating || '4.0'} (${mentor.total_sessions || 0} sessions)</span>
                    </div>
                </div>
                <div class="mentor-price">
                    <span class="price">₹${mentor.hourly_rate || 0}</span>
                    <span class="price-unit">/hour</span>
                </div>
            </div>

            <div class="mentor-details">
                <div class="detail-row">
                    <i class="fas fa-graduation-cap"></i>
                    <span>${mentor.education || 'N/A'} from ${mentor.institution || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-briefcase"></i>
                    <span>${mentor.current_pursuit || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-language"></i>
                    <span>${mentor.languages ? mentor.languages.join(', ') : 'Not specified'}</span>
                </div>
            </div>

            <div class="mentor-subjects">
                <h4><i class="fas fa-book"></i> Subjects:</h4>
                <div class="subject-tags">
                    ${mentor.subjects ? mentor.subjects.map(sub => `<span class="subject-tag">${sub}</span>`).join('') : '<span class="no-subjects">Not specified</span>'}
                </div>
            </div>

            <div class="mentor-availability">
                <h4><i class="fas fa-clock"></i> Available:</h4>
                <div class="availability-tags">
                    ${mentor.available_hours ? mentor.available_hours.map(hour => `<span class="availability-tag">${hour}</span>`).join('') : '<span class="no-availability">Not specified</span>'}
                </div>
            </div>

            ${mentor.qualifications ? `
                <div class="mentor-qualifications">
                    <h4><i class="fas fa-certificate"></i> Qualifications:</h4>
                    <p>${mentor.qualifications}</p>
                </div>
            ` : ''}

            <div class="mentor-actions">
                <button class="btn btn-connect">
                    <i class="fas fa-handshake"></i> Connect Now
                </button>
                <button class="btn btn-view">
                    <i class="fas fa-eye"></i> View Profile
                </button>
            </div>
        </div>
        `;
    }).join('');

    // Attach event listeners to buttons
    mentorsGrid.querySelectorAll('.mentor-card .btn-connect').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('🟢 "Connect Now" button clicked');
            const card = e.target.closest('.mentor-card');
            const mentorId = card.getAttribute('data-mentor-id');
            const mentorName = card.getAttribute('data-mentor-name');
            connectWithMentor(mentorId, mentorName);
        });
    });

    mentorsGrid.querySelectorAll('.mentor-card .btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.mentor-card');
            const mentorId = card.getAttribute('data-mentor-id');
            viewMentorProfile(mentorId);
        });
    });
}


// ========================================
// CONNECT WITH MENTOR FUNCTION - FIXED
// ========================================
function connectWithMentor(mentorId, mentorName) {
    console.log('═══════════════════════════════════════');
    console.log('🔵 connectWithMentor() called');
    console.log('  Mentor ID:', mentorId);
    console.log('  Mentor Name:', mentorName);
    console.log('═══════════════════════════════════════');
    
    currentMentorId = mentorId;

    const mentor = allMentors.find(m => m.id == mentorId);
    if (!mentor) {
        console.error('❌ Mentor not found in allMentors array');
        console.log('Available mentors:', allMentors.length);
        return;
    }
    
    console.log('✅ Mentor data found:', mentor);

    // Update mentor preview
    const preview = document.getElementById('selectedMentorPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="mentor-preview-card">
                <img src="${mentor.profile_picture || '/uploads/avatars/default-avatar.png'}" alt="${mentorName}">
                <div>
                    <h4>${mentorName}</h4>
                    <p>₹${mentor.hourly_rate || 0}/hour</p>
                    <span class="rating">${'★'.repeat(Math.floor(mentor.rating || 4))} ${mentor.rating || '4.0'}</span>
                </div>
            </div>
        `;
        console.log('✅ Mentor preview updated');
    } else {
        console.warn('⚠️ selectedMentorPreview element not found');
    }

    // Get modal element
    const modal = document.getElementById('connectModal');
    if (!modal) {
        console.error('❌ CRITICAL: Modal element #connectModal not found in DOM!');
        console.log('Searching for modal-like elements...');
        const modals = document.querySelectorAll('[class*="modal"]');
        console.log('Found elements with "modal" in class:', modals.length);
        modals.forEach(m => console.log('  -', m.id, m.className));
        return;
    }
    
    console.log('✅ Modal element found');
    console.log('Current display style:', window.getComputedStyle(modal).display);
    console.log('Current visibility:', window.getComputedStyle(modal).visibility);
    console.log('Current opacity:', window.getComputedStyle(modal).opacity);
    console.log('Current z-index:', window.getComputedStyle(modal).zIndex);
    
    // Force display with multiple methods
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    modal.classList.add('show'); // In case CSS uses .show class
    
    console.log('After setting display:');
    console.log('  display:', modal.style.display);
    console.log('  visibility:', modal.style.visibility);
    console.log('  opacity:', modal.style.opacity);
    
    // Check if modal is actually visible
    setTimeout(() => {
        const computed = window.getComputedStyle(modal);
        console.log('Computed styles after 100ms:');
        console.log('  display:', computed.display);
        console.log('  visibility:', computed.visibility);
        console.log('  opacity:', computed.opacity);
        console.log('  position:', computed.position);
        
        if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
            console.error('❌ Modal is still not visible! Check your CSS!');
            console.log('Modal HTML:', modal.outerHTML.substring(0, 300));
        } else {
            console.log('✅ Modal should be visible now!');
        }
    }, 100);

    // Set modal title dynamically
    const title = document.getElementById('connectModalTitle');
    if (title) {
        title.innerHTML = `<i class="fas fa-handshake"></i> Connect with ${mentorName}`;
        console.log('✅ Modal title updated');
    } else {
        console.warn('⚠️ connectModalTitle element not found');
    }

    // Attach form handler
    console.log('Attaching form handler in 200ms...');
    setTimeout(() => {
        attachConnectFormHandler();
    }, 200);
}


// ========================================
// ATTACH FORM HANDLER
// ========================================
function attachConnectFormHandler() {
    console.log('═══════════════════════════════════════');
    console.log('🔵 attachConnectFormHandler() called');
    console.log('═══════════════════════════════════════');
    
    const connectForm = document.getElementById('connectForm');
    
    if (!connectForm) {
        console.error('❌ Form #connectForm not found!');
        return;
    }
    
    console.log('✅ Form found');
    
    // Find all buttons
    const allButtons = connectForm.querySelectorAll('button');
    console.log(`Found ${allButtons.length} button(s) in form:`);
    
    allButtons.forEach((btn, index) => {
        console.log(`  Button ${index + 1}: "${btn.textContent.trim()}" (type: ${btn.type})`);
    });
    
    // Find submit button
    let submitBtn = connectForm.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.warn('No type="submit" button found, looking by text...');
        allButtons.forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            if (text.includes('send') && !submitBtn) {
                submitBtn = btn;
            }
        });
    }
    
    if (!submitBtn) {
        console.error('❌ No submit button found!');
        return;
    }
    
    console.log('✅ Submit button identified:', submitBtn.textContent.trim());
    
    // Remove any existing listeners by cloning
    const newForm = connectForm.cloneNode(true);
    connectForm.parentNode.replaceChild(newForm, connectForm);
    const form = document.getElementById('connectForm');
    
    // Get fresh button reference
    const freshSubmitBtn = form.querySelector('button[type="submit"]') || 
                          Array.from(form.querySelectorAll('button')).find(b => 
                              b.textContent.toLowerCase().includes('send'));
    
    // Attach event listeners
    form.addEventListener('submit', function(e) {
        console.log('🎯 FORM SUBMIT EVENT FIRED!');
        e.preventDefault();
        e.stopPropagation();
        showConfirmationDialog(form);
        return false;
    }, true);
    
    if (freshSubmitBtn) {
        freshSubmitBtn.addEventListener('click', function(e) {
            console.log('🎯 BUTTON CLICK EVENT FIRED!');
            e.preventDefault();
            e.stopPropagation();
            showConfirmationDialog(form);
            return false;
        }, true);
        
        // Ensure button doesn't have onclick attribute
        freshSubmitBtn.removeAttribute('onclick');
    }
    
    console.log('✅ Event listeners attached!');
    console.log('═══════════════════════════════════════');
}


// ========================================
// SHOW CONFIRMATION DIALOG
// ========================================
function showConfirmationDialog(form) {
    console.log('═══════════════════════════════════════');
    console.log('🎯 showConfirmationDialog() called!');
    console.log('═══════════════════════════════════════');
    
    // Extract form data
    const formData = new FormData(form);
    
    console.log('Form data:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: "${value}"`);
    }
    
    const subject = formData.get('subject') || form.querySelector('#subject')?.value || 'Not specified';
    const preferredTime = formData.get('preferredTime') || form.querySelector('#preferredTime')?.value || 'Not specified';
    const message = formData.get('message') || form.querySelector('#message')?.value || 'No message';
    
    // Get mentor name from current context
    const mentorName = document.getElementById('connectModalTitle')?.textContent.replace('Connect with', '').trim() || 'Mentor';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'confirmationOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;
    
    // Dialog content
    dialog.innerHTML = `
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .confirm-title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }
            .confirm-icon {
                width: 40px;
                height: 40px;
                background-color: #4CAF50;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 20px;
                color: white;
            }
            .confirm-details {
                background-color: #f5f5f5;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .confirm-row {
                margin-bottom: 15px;
                display: flex;
                flex-direction: column;
            }
            .confirm-row:last-child {
                margin-bottom: 0;
            }
            .confirm-label {
                font-weight: 600;
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            .confirm-value {
                color: #333;
                font-size: 16px;
                word-wrap: break-word;
            }
            .confirm-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .confirm-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .confirm-btn-cancel {
                background-color: #f0f0f0;
                color: #333;
            }
            .confirm-btn-cancel:hover {
                background-color: #e0e0e0;
            }
            .confirm-btn-send {
                background-color: #4CAF50;
                color: white;
            }
            .confirm-btn-send:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            }
        </style>
        
        <div class="confirm-title">
            <div class="confirm-icon">✓</div>
            Confirm Connection Request
        </div>
        
        <div class="confirm-details">
            <div class="confirm-row">
                <div class="confirm-label">Mentor</div>
                <div class="confirm-value">${escapeHtml(mentorName)}</div>
            </div>
            <div class="confirm-row">
                <div class="confirm-label">Subject</div>
                <div class="confirm-value">${escapeHtml(subject)}</div>
            </div>
            <div class="confirm-row">
                <div class="confirm-label">Preferred Time</div>
                <div class="confirm-value">${escapeHtml(preferredTime)}</div>
            </div>
            <div class="confirm-row">
                <div class="confirm-label">Message</div>
                <div class="confirm-value">${escapeHtml(message)}</div>
            </div>
        </div>
        
        <div class="confirm-buttons">
            <button class="confirm-btn confirm-btn-cancel" id="cancelBtn">Cancel</button>
            <button class="confirm-btn confirm-btn-send" id="sendRequestBtn">Send Request</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    console.log('✅ Confirmation dialog added to DOM');
    
    // Add event listeners
    document.getElementById('cancelBtn').addEventListener('click', function() {
        console.log('❌ Request cancelled');
        document.body.removeChild(overlay);
    });
    
    document.getElementById('sendRequestBtn').addEventListener('click', function() {
        console.log('✅ Request confirmed, sending...');
        document.body.removeChild(overlay);
        handleConnectFormSubmit(form);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            console.log('❌ Request cancelled (clicked outside)');
            document.body.removeChild(overlay);
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            console.log('❌ Request cancelled (Escape key)');
            if (document.getElementById('confirmationOverlay')) {
                document.body.removeChild(overlay);
            }
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}


// ========================================
// HELPER: ESCAPE HTML
// ========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// CLOSE MODAL FUNCTION
// ========================================
function closeConnectModal() {
    console.log('═══════════════════════════════════════');
    console.log('🔒 closeConnectModal() called');
    
    const modal = document.getElementById('connectModal');
    if (!modal) {
        console.error('❌ Modal element not found!');
        return;
    }
    
    console.log('Current modal display:', modal.style.display);
    
    // Hide modal with multiple methods to ensure it works
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.classList.remove('show');
    
    console.log('After setting display to none:', modal.style.display);
    
    // Reset form
    const connectForm = document.getElementById('connectForm');
    if (connectForm) {
        connectForm.reset();
        console.log('✅ Form reset');
    }
    
    // Clear current mentor
    currentMentorId = null;
    
    console.log('✅ Modal closed successfully');
    console.log('═══════════════════════════════════════');
}


// ========================================
// HANDLE FORM SUBMIT
// ========================================
async function handleConnectFormSubmit(formElement) {
    console.log('═══════════════════════════════════════');
    console.log('🚀 handleConnectFormSubmit() called!');
    console.log('═══════════════════════════════════════');
    
    // Extract values from form fields
    const subject = formElement.querySelector('#subject')?.value || '';
    const message = formElement.querySelector('#message')?.value || '';
    const preferredTime = formElement.querySelector('#preferredTime')?.value || '';
    
    console.log('Form data:', { subject, message, preferredTime, currentMentorId });

    // Validation
    if (!currentMentorId || !token) {
        showMessage('Authentication error. Please log in again.', 'error');
        return;
    }

    if (!subject || !message) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    try {
        console.log('Sending request to API...');
        const response = await fetch('/api/mentee/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mentorId: currentMentorId,
                subject: subject,
                message: message,
                preferredTime: preferredTime
            })
        });

        const result = await response.json();
        console.log('API Response:', result);
        if (result.success) {
            showSuccessPopup('Connection request sent successfully! 🎉');
            console.log("closing modal after successful request...");
        } else {
            showMessage(result.message || 'Error sending request', 'error');
            console.log("closing modal after unsuccessful request...");
        }
    } catch (error) {
        console.error('Connection request error:', error);
        showMessage('An error occurred while sending the request', 'error');
    }
    closeConnectModal();
}


async function viewMentorProfile(mentorId) {
    try {
        const token = localStorage.getItem('token'); // or sessionStorage.getItem('token')
        const response = await fetch(`/api/mentor/${mentorId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Fetched mentor profile data:', data);
        if (!data.success) {
            showMessage('Unable to fetch mentor details.', 'error');
            return;
        }

        const mentor = data.mentor;
        console.log('Mentor data:', mentor);
        const modal = document.getElementById('mentorProfileModal');
        const content = document.getElementById('mentorProfileContent');

        if (content) {
            content.innerHTML = `
                <div class="mentor-profile">
                    <img src="${mentor.profile_picture || '/uploads/default-avatar.png'}" alt="${mentor.first_name}">
                    <h2>${mentor.first_name} ${mentor.last_name}</h2>
                    <p><i class="fas fa-graduation-cap"></i> ${mentor.education} from ${mentor.institution}</p>
                    <p><i class="fas fa-briefcase"></i> ${mentor.current_pursuit}</p>
                    <p><i class="fas fa-language"></i> ${mentor.languages.join(', ')}</p>
                    <p><i class="fas fa-book"></i> Subjects: ${mentor.subjects.join(', ')}</p>
                    <p><i class="fas fa-certificate"></i> ${mentor.qualifications}</p>
                    <p><i class="fas fa-info-circle"></i> Bio: ${mentor.bio || 'No bio available'}</p>
                </div>
            `;
        }

        if (modal) modal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching mentor profile:', error);
        showMessage('Something went wrong while loading the profile.', 'error');
    }
}

// ========================================
// SESSIONS MANAGEMENT
// ========================================
async function loadSessions() {
    try {
        const response = await fetch('/api/mentee/sessions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const sessions = await response.json();
            const upcomingSessionsEl = document.getElementById('upcomingSessions');
            if (upcomingSessionsEl) upcomingSessionsEl.textContent = sessions.length;
            
            renderSessions(sessions);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function renderSessions(sessions) {
    const sessionsList = document.getElementById('sessionsList');
    if (!sessionsList) return;
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-calendar-times"></i>
                <h3>No sessions scheduled</h3>
                <p>Connect with mentors to start learning!</p>
            </div>
        `;
        return;
    }
    
    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-card mentee-session">
            <div class="session-header">
                <div class="session-mentor">
                    <h4><i class="fas fa-chalkboard-teacher"></i> ${session.mentor_first_name} ${session.mentor_last_name}</h4>
                    <span class="session-subject">${session.subject}</span>
                </div>
                <div class="session-status ${session.payment_status}">
                    ${session.payment_status === 'paid' ? '✅ Paid' : '⚠️ Payment Pending'}
                </div>
            </div>
            
            <div class="session-details">
                <div class="session-info">
                    <i class="fas fa-calendar"></i>
                    <span>${new Date(session.scheduled_time).toLocaleDateString()}</span>
                </div>
                <div class="session-info">
                    <i class="fas fa-clock"></i>
                    <span>${new Date(session.scheduled_time).toLocaleTimeString()}</span>
                </div>
                <div class="session-info">
                    <i class="fas fa-rupee-sign"></i>
                    <span>₹${session.amount}</span>
                </div>
            </div>
            
            ${session.meeting_link ? `
                <div class="session-link">
                    <a href="${session.meeting_link}" target="_blank" class="btn btn-join">
                        <i class="fas fa-video"></i> Join Meeting
                    </a>
                </div>
            ` : ''}
            
            ${session.payment_status === 'pending' ? `
                <div class="payment-required">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Payment Required:</strong> Pay ₹${session.amount} to <code class="platform-upi">platform@upi</code> to confirm this session.
                    <button onclick="copyUpiId()" class="btn btn-copy-upi">
                        <i class="fas fa-copy"></i> Copy UPI ID
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function showSessionType(type) {
    // Update tabs
    document.querySelectorAll('.session-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // This would filter sessions by type - implement as needed
    console.log('Show sessions of type:', type);
}

// ========================================
// UI NAVIGATION & MODALS
// ========================================
function showSection(sectionName) {
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) targetSection.style.display = 'block';
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// function closeConnectModal() {
//     const modal = document.getElementById('connectModal');
//     if (modal) modal.style.display = 'none';
    
//     // currentMentorId = null;
//     const connectForm = document.getElementById('connectForm');
//     if (connectForm) connectForm.reset();
// }

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function showCustomerCare() {
    const modal = document.getElementById('customerCareModal');
    if (modal) modal.style.display = 'flex';
}

function closeCustomerCare() {
    const modal = document.getElementById('customerCareModal');
    if (modal) modal.style.display = 'none';
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function copyUpiId() {
    const upiId = document.getElementById('platformUpiId')?.textContent;
    if (upiId) {
        navigator.clipboard.writeText(upiId).then(() => {
            showMessage('UPI ID copied to clipboard! 📋', 'success');
        });
    }
}

function showMessage(message, type) {
    const messageEl = document.getElementById(type === 'error' ? 'errorMessage' : 'successMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

function showSuccessPopup(message) {
    const popup = document.getElementById('successPopup');
    const messageEl = document.getElementById('successPopupMessage');
    
    if (popup && messageEl) {
        messageEl.innerHTML = message.replace(/\n/g, '<br>');
        popup.style.display = 'flex';
        
        setTimeout(() => {
            closeSuccessPopup();
        }, 5000);
    }
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (popup) popup.style.display = 'none';
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ========================================
// REALTIME FUNCTIONALITY
// ========================================
function setupRealtime() {
    try {
        const socket = io({ auth: { token } });
        
        socket.on('connect', () => {
            console.log('Realtime connected');
        });
        
        socket.on('request:decision', (payload) => {
            if (payload.status === 'accepted') {
                showMessage('Your connection request was accepted! 🎉', 'success');
            } else if (payload.status === 'declined') {
                showMessage('Your connection request was declined.', 'error');
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

function showMeetingMiniWindow(payload) {
    const userId = localStorage.getItem('userId');
    meetingPeerId = (userId == payload.mentorId) ? payload.menteeId : payload.mentorId;
    meetingSocket = io({ auth: { token } });

    if (meetingWindow) {
        document.body.removeChild(meetingWindow);
    }
    
    meetingWindow = document.createElement('div');
    meetingWindow.style.cssText = 'position:fixed; bottom:20px; right:20px; width:360px; background:#fff; box-shadow:0 8px 25px rgba(0,0,0,0.15); border-radius:10px; z-index:2000; display:flex; flex-direction:column;';
    meetingWindow.innerHTML = `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>Meeting Started</strong>
                <div style="font-size:12px;color:#666;">${new Date(payload.scheduledAt).toLocaleString()}</div>
            </div>
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
        </div>
    `;

    meetingWindow.querySelector('.close-mini').addEventListener('click', () => {
        document.body.removeChild(meetingWindow);
        meetingWindow = null;
    });
    
    meetingWindow.querySelector('.send-link').addEventListener('click', () => {
        if (!meetingSocket) return;
        meetingSocket.emit('meeting:message', { 
            toUserId: meetingPeerId, 
            text: 'Join via this link', 
            link: payload.meetLink 
        });
        appendMeetingMessage({ 
            text: 'Link sent', 
            link: payload.meetLink, 
            fromUserId: userId 
        }, 'outgoing');
    });
    
    meetingWindow.querySelector('.chat-send').addEventListener('click', () => {
        const input = meetingWindow.querySelector('.chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        if (!meetingSocket) return;
        meetingSocket.emit('meeting:message', { toUserId: meetingPeerId, text });
        appendMeetingMessage({ text, fromUserId: userId }, 'outgoing');
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
    div.innerHTML = `${msg.text ? msg.text : ''} ${msg.link ? `<a href="${msg.link}" target="_blank">${msg.link}</a>` : ''}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}