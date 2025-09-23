// ===== MENTEE AUTHENTICATION SYSTEM =====
// Comprehensive authentication handling for mentees

document.addEventListener('DOMContentLoaded', function() {
    initializeMenteeAuth();
});

function initializeMenteeAuth() {
    console.log('Mentee Authentication System Initialized');
    
    // Setup form event listeners
    setupFormListeners();
    
    // Setup form validation
    setupFormValidation();
    
    // Setup Google Sign-In
    setupGoogleSignIn();
    
    // Setup password strength checker
    setupPasswordStrength();
    
    // Setup UPI validation
    setupUPIValidation();
}

// ===== FORM MANAGEMENT =====
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    
    // Add animation
    registerForm.classList.add('fade-in');
    
    // Update URL without refresh
    history.pushState({form: 'register'}, '', '#register');
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    registerForm.style.display = 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
    loginForm.style.display = 'block';
    
    // Add animation
    loginForm.classList.add('fade-in');
    
    // Update URL without refresh
    history.pushState({form: 'login'}, '', '#login');
}

function showForgotPasswordForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
    forgotPasswordForm.style.display = 'block';
    
    // Add animation
    forgotPasswordForm.classList.add('fade-in');
    
    // Update URL without refresh
    history.pushState({form: 'forgot-password'}, '', '#forgot-password');
}

function showResetPasswordForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    resetPasswordForm.style.display = 'block';
    
    // Add animation
    resetPasswordForm.classList.add('fade-in');
    
    // Update URL without refresh
    history.pushState({form: 'reset-password'}, '', '#reset-password');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===== FORM LISTENERS =====
function setupFormListeners() {
    // Login form submission
    const loginForm = document.getElementById('menteeLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Registration form submission
    const registerForm = document.getElementById('menteeRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Forgot password form submission
    const forgotPasswordForm = document.getElementById('forgotPasswordFormEl');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Reset password form submission
    const resetPasswordForm = document.getElementById('resetPasswordFormEl');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.form) {
            if (e.state.form === 'register') {
                showRegisterForm();
            } else {
                showLoginForm();
            }
        }
    });
    
    // Real-time form validation
    setupRealTimeValidation();
}

// ===== LOGIN HANDLING =====
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
    };
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await simulateLogin(loginData);
        
        // Show success message
        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        // Store user session
        storeUserSession({
            type: 'mentee',
            email: loginData.email,
            loginTime: new Date().toISOString()
        });
        
        // Redirect to mentee dashboard
        setTimeout(() => {
            window.location.href = 'mentee-dashboard.html';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
        
        // Reset form
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function simulateLogin(loginData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate login validation
            const existingMentees = JSON.parse(localStorage.getItem('mentees') || '[]');
            const mentee = existingMentees.find(m => 
                m.email === loginData.email && m.password === loginData.password
            );
            
            if (mentee) {
                resolve(mentee);
            } else {
                reject(new Error('Invalid email or password. Please try again.'));
            }
        }, 1500);
    });
}

// ===== REGISTRATION HANDLING =====
async function handleRegistration(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateRegistrationForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const registrationData = extractRegistrationData(formData);
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await simulateRegistration(registrationData);
        
        // Show success message with payment info
        showPaymentInfoNotification();
        
        // Switch to login form
        setTimeout(() => {
            showLoginForm();
            // Pre-fill email
            document.getElementById('loginEmail').value = registrationData.email;
        }, 3000);
        
    } catch (error) {
        showNotification(error.message, 'error');
        
        // Reset form
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function extractRegistrationData(formData) {
    // Get selected languages
    const languages = Array.from(document.querySelectorAll('input[name="languages"]:checked'))
        .map(input => input.value);
    
    // Get selected availability
    const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked'))
        .map(input => input.value);
    
    return {
        // Personal Information
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        mobile: formData.get('mobile'),
        email: formData.get('email'),
        
        // Education & Learning Goals
        education: formData.get('education'),
        institution: formData.get('institution'),
        currentPursuing: formData.get('currentPursuing'),
        learningGoals: formData.get('learningGoals'),
        
        // Language & Availability
        languages: languages,
        availability: availability,
        
        // Payment Information
        upiId: formData.get('upiId'),
        
        // Account Security
        password: formData.get('password'),
        
        // Metadata
        registrationDate: new Date().toISOString(),
        isVerified: false,
        profileComplete: true
    };
}

async function simulateRegistration(registrationData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check if email already exists
            const existingMentees = JSON.parse(localStorage.getItem('mentees') || '[]');
            const emailExists = existingMentees.some(m => m.email === registrationData.email);
            
            if (emailExists) {
                reject(new Error('An account with this email already exists. Please sign in instead.'));
                return;
            }
            
            // Generate mentee ID
            registrationData.id = 'mentee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Store mentee data
            existingMentees.push(registrationData);
            localStorage.setItem('mentees', JSON.stringify(existingMentees));
            
            resolve(registrationData);
        }, 2000);
    });
}

function showPaymentInfoNotification() {
    showNotification(`
        🎉 Account created successfully! 
        
        📝 IMPORTANT PAYMENT INFO:
        • Pay to UPI ID: mentorconnect@upi
        • Include 10% service fee
        • We'll transfer mentor payments after sessions
        • Always get payment confirmation
        
        Please sign in to continue!
    `, 'success', 8000);
}

// ===== FORM VALIDATION =====
function setupFormValidation() {
    // Add validation listeners to all required fields
    const requiredFields = document.querySelectorAll('input[required], select[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        field.addEventListener('input', function() {
            // Clear error state on input
            clearFieldError(this);
        });
    });
}

function setupRealTimeValidation() {
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            validateEmail(this);
        });
    });
    
    // Phone validation
    const phoneInput = document.getElementById('mobile');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            validatePhone(this);
        });
    }
    
    // Password confirmation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordConfirmation();
        });
    }
    
    // Age validation
    const ageInput = document.getElementById('age');
    if (ageInput) {
        ageInput.addEventListener('input', function() {
            validateAge(this);
        });
    }
}

function validateRegistrationForm(form) {
    let isValid = true;
    
    // Validate all required fields
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validate password confirmation
    if (!validatePasswordConfirmation()) {
        isValid = false;
    }
    
    // Validate languages selection
    if (!validateLanguages()) {
        isValid = false;
    }
    
    // Validate availability selection
    if (!validateAvailability()) {
        isValid = false;
    }
    
    // Validate terms acceptance
    if (!validateTerms()) {
        isValid = false;
    }
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError(field);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Field-specific validation
    switch (field.type) {
        case 'email':
            return validateEmail(field);
        case 'tel':
            return validatePhone(field);
        case 'number':
            return validateNumber(field);
        default:
            if (field.name === 'upiId') {
                return validateUPI(field);
            }
            return true;
    }
}

function validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

function validatePhone(field) {
    const phone = field.value.trim();
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    
    if (phone && !phoneRegex.test(phone)) {
        showFieldError(field, 'Please enter a valid phone number');
        return false;
    }
    
    return true;
}

function validateNumber(field) {
    const value = parseFloat(field.value);
    const min = parseFloat(field.getAttribute('min'));
    const max = parseFloat(field.getAttribute('max'));
    
    if (isNaN(value)) {
        showFieldError(field, 'Please enter a valid number');
        return false;
    }
    
    if (min && value < min) {
        showFieldError(field, `Value must be at least ${min}`);
        return false;
    }
    
    if (max && value > max) {
        showFieldError(field, `Value must be at most ${max}`);
        return false;
    }
    
    return true;
}

function validateAge(field) {
    const age = parseInt(field.value);
    
    if (age < 13) {
        showFieldError(field, 'You must be at least 13 years old to create an account');
        return false;
    }
    
    if (age > 100) {
        showFieldError(field, 'Please enter a valid age');
        return false;
    }
    
    return true;
}

function validatePasswordConfirmation() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!password || !confirmPassword) return true;
    
    if (password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        return false;
    }
    
    clearFieldError(confirmPassword);
    return true;
}

function validateLanguages() {
    const languageCheckboxes = document.querySelectorAll('input[name="languages"]:checked');
    
    if (languageCheckboxes.length === 0) {
        showNotification('Please select at least one language you can communicate in', 'error');
        return false;
    }
    
    return true;
}

function validateAvailability() {
    const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]:checked');
    
    if (availabilityCheckboxes.length === 0) {
        showNotification('Please select at least one preferred time slot for learning', 'error');
        return false;
    }
    
    return true;
}

function validateTerms() {
    const termsCheckbox = document.querySelector('input[name="terms"]');
    
    if (!termsCheckbox.checked) {
        showNotification('Please accept the Terms of Service and Privacy Policy to continue', 'error');
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('small');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// ===== UPI VALIDATION =====
function setupUPIValidation() {
    const upiInput = document.getElementById('upiId');
    if (upiInput) {
        upiInput.addEventListener('input', function() {
            validateUPI(this);
        });
    }
}

function validateUPI(field) {
    const upiId = field.value.trim();
    const upiRegex = /^[\w\.-]+@[\w\.-]+$/;
    
    if (upiId && !upiRegex.test(upiId)) {
        showFieldError(field, 'Please enter a valid UPI ID (e.g., username@bank)');
        return false;
    }
    
    return true;
}

// ===== PASSWORD STRENGTH =====
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this);
        });
    }
}

function checkPasswordStrength(input) {
    const password = input.value;
    const strength = calculatePasswordStrength(password);
    
    // Remove existing strength indicator
    const existingIndicator = input.parentElement.parentElement.querySelector('.password-strength');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add strength indicator
    if (password.length > 0) {
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = `password-strength strength-${strength.level}`;
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${strength.percentage}%"></div>
            </div>
            <span class="strength-text">${strength.text}</span>
        `;
        
        input.parentElement.parentElement.appendChild(strengthIndicator);
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    let text = 'Weak';
    
    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Determine strength
    if (score >= 5) {
        level = 'strong';
        text = 'Strong';
    } else if (score >= 3) {
        level = 'medium';
        text = 'Medium';
    }
    
    return {
        score,
        level,
        text,
        percentage: (score / 6) * 100
    };
}

// ===== GOOGLE SIGN-IN =====
function setupGoogleSignIn() {
    // This would be implemented with actual Google Sign-In API
    window.handleGoogleLogin = function(response) {
        console.log('Google Sign-In Response:', response);
        
        // Decode the JWT token to get user info
        try {
            const userInfo = parseJwt(response.credential);
            
            // Handle Google sign-in for mentee
            handleGoogleSignInFlow(userInfo);
            
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            showNotification('Google Sign-In failed. Please try again.', 'error');
        }
    };
}

function handleGoogleSignInFlow(userInfo) {
    showNotification('Google Sign-In successful! Setting up your account...', 'success');
    
    // Store user session
    storeUserSession({
        type: 'mentee',
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.sub,
        loginTime: new Date().toISOString()
    });
    
    // Check if user exists in our system
    const existingMentees = JSON.parse(localStorage.getItem('mentees') || '[]');
    const existingMentee = existingMentees.find(m => m.email === userInfo.email);
    
    if (existingMentee) {
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'mentee-dashboard.html';
        }, 1500);
    } else {
        // Pre-fill registration form
        fillGoogleUserInfo(userInfo);
        showRegisterForm();
        showNotification('Please complete your student profile to continue', 'info');
    }
}

function fillGoogleUserInfo(userInfo) {
    // Pre-fill form with Google data
    if (userInfo.given_name) {
        document.getElementById('firstName').value = userInfo.given_name;
    }
    if (userInfo.family_name) {
        document.getElementById('lastName').value = userInfo.family_name;
    }
    if (userInfo.email) {
        document.getElementById('email').value = userInfo.email;
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

// ===== SESSION MANAGEMENT =====
function storeUserSession(userData) {
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('lastLogin', new Date().toISOString());
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-notification notification-${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    }[type];
    
    const bgColor = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    }[type];
    
    // Format message for multi-line display
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
            white-space: pre-line;
            line-height: 1.4;
        ">
            <i class="fas ${icon}" style="margin-top: 2px;"></i>
            <span style="flex: 1;">${formattedMessage}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                margin-left: auto;
                flex-shrink: 0;
            ">&times;</button>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// ===== UTILITY FUNCTIONS =====
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 10) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    input.value = value;
}

// Auto-format phone number
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('mobile');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
});

// ===== FORGOT PASSWORD HANDLING =====
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const mobile = formData.get('mobile');
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Code...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                mobile: mobile,
                userType: 'mentee'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Verification code sent to your mobile number!', 'success');
            sessionStorage.setItem('resetToken', result.token);
            showResetPasswordForm();
        } else {
            showNotification(result.message || 'Failed to send reset code', 'error');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        // Reset form
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const code = formData.get('code');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    const token = sessionStorage.getItem('resetToken');
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (!token) {
        showNotification('Invalid reset session. Please try again.', 'error');
        showForgotPasswordForm();
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                code: code,
                newPassword: newPassword,
                userType: 'mentee'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Password reset successfully! You can now login with your new password.', 'success');
            sessionStorage.removeItem('resetToken');
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            showNotification(result.message || 'Failed to reset password', 'error');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        // Reset form
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        handleRegistration,
        handleForgotPassword,
        handleResetPassword,
        validateEmail,
        validatePhone,
        calculatePasswordStrength
    };
}
