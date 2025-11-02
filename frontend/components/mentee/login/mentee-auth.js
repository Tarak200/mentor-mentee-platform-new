/**
 * Mentee Authentication System - Merged and Optimized
 * Handles authentication, form validation, and navigation with proper token validation
 */

class MenteeLogin {
    constructor() {
        this.apiBaseUrl = '/api';
        this.initializeEventListeners();
        this.checkExistingSession();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('menteeLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form submission
        const registerForm = document.getElementById('menteeRegisterForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password visibility toggle - setup initial state
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.setAttribute('title', 'Show password');
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // Form field validation
        this.setupFieldValidation();
        
        // Setup password strength checker
        this.setupPasswordStrength();
        
        // Setup UPI validation
        this.setupUPIValidation();
        
        // Setup real-time validation
        this.setupRealTimeValidation();
        
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
    }

    // Check if user already logged in with token validation
    async checkExistingSession() {
        const token = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        
        if (token && userType === 'mentee') {
            // Validate token before redirecting
            try {
                const response = await fetch(`${this.apiBaseUrl}/auth/validate-token`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.valid && data.userType === 'mentee') {
                        window.location.href = '/mentee-dashboard';
                    } else {
                        // Invalid token, clear storage
                        this.clearAuthData();
                    }
                } else {
                    // Token validation failed, clear storage
                    this.clearAuthData();
                }
            } catch (error) {
                console.error('Token validation error:', error);
                this.clearAuthData();
            }
        }
    }

    // Handle login form submission with proper error handling
    async handleLogin(event) {
        event.preventDefault();

        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;
        const remember = form.remember?.checked || false;

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success) {
                // Check if user is actually a mentee
                if (data.data.user.role !== 'mentee') {
                    throw new Error('This account is not registered as a mentee. Please use the mentor login.');
                }

                const token = data.data.token;
                const userId = data.data.user.id;
                const userName = data.data.user.name || 'User';

                // Store authentication data
                localStorage.setItem('authToken', token);
                localStorage.setItem('userType', 'mentee');
                localStorage.setItem('userId', userId);
                localStorage.setItem('userName', userName);

                if (remember) {
                    localStorage.setItem('rememberEmail', email);
                } else {
                    localStorage.removeItem('rememberEmail');
                }

                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => window.location.href = '/mentee-dashboard', 1500);

            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Cannot connect to server. Please try again later.');
            this.setLoadingState(false);
        }
    }
    // Handle registration form submission
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Extract registration data
        const registrationData = this.extractRegistrationData(formData);

        // Validate registration data
        const validation = this.validateRegistration(registrationData);
        if (!validation.isValid) {
            this.showError(validation.error);
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...registrationData,
                    role: 'mentee'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess('Registration successful! Please login.');
                
                // Switch to login form
                setTimeout(() => {
                    this.showLoginForm();
                    // Pre-fill email
                    const loginEmail = document.getElementById('loginEmail');
                    if (loginEmail) {
                        loginEmail.value = registrationData.email;
                    }
                }, 2000);
            } else {
                // Handle specific registration errors
                if (response.status === 409) {
                    this.showError('An account with this email already exists.');
                } else {
                    this.showError(data.message || 'Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred during registration. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Extract registration data from form
    extractRegistrationData(formData) {
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
            phone: formData.get('phone'),
            email: formData.get('email'),
            subjects: formData.get('subjects'),
            
            // Education & Learning Goals
            education: formData.get('education'),
            institution: formData.get('institution'),
            currentPursuing: formData.get('currentPursuing'),
            learningGoals: formData.get('learningGoals'),
            availableHours: formData.get('available_hours'),
            bio: formData.get('bio'),
            
            // Language & Availability
            languages: languages,
            availability: availability,
            
            // Payment Information
            upiId: formData.get('upiId'),
            
            // Account Security
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            
            // Metadata
            registrationDate: new Date().toISOString(),
            isVerified: false,
            profileComplete: true
        };
    }

    // Validate registration data
    validateRegistration(data) {
        // Required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'age', 'gender', 'mobile'];
        
        for (let field of requiredFields) {
            if (!data[field]) {
                return { isValid: false, error: `${this.formatFieldName(field)} is required` };
            }
        }

        // Email validation
        if (!this.validateEmail(data.email)) {
            return { isValid: false, error: 'Please enter a valid email address' };
        }

        // Password validation
        if (!this.validatePassword(data.password)) {
            return { isValid: false, error: 'Password must be at least 6 characters' };
        }

        // Confirm password
        if (data.password !== data.confirmPassword) {
            return { isValid: false, error: 'Passwords do not match' };
        }

        // Age validation
        const age = parseInt(data.age);
        if (isNaN(age) || age < 13 || age > 100) {
            return { isValid: false, error: 'Please enter a valid age (13-100)' };
        }

        // Mobile validation
        if (!this.validateMobile(data.mobile)) {
            return { isValid: false, error: 'Please enter a valid mobile number' };
        }

        return { isValid: true };
    }

    // Setup field validation
    setupFieldValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !this.validateEmail(input.value)) {
                    this.showFieldError(input, 'Invalid email format');
                } else {
                    this.clearFieldError(input);
                }
            });
        });

        // Mobile number formatting
        const mobileInputs = document.querySelectorAll('input[type="tel"]');
        mobileInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = this.formatMobileNumber(e.target.value);
            });
        });
    }

    // Setup real-time validation
    setupRealTimeValidation() {
        // Password confirmation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordConfirmation();
            });
        }
        
        // Age validation
        const ageInput = document.getElementById('age');
        if (ageInput) {
            ageInput.addEventListener('input', () => {
                this.validateAge(ageInput);
            });
        }
    }

    // Setup password strength checker
    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updatePasswordStrength(passwordInput);
            });
        }
    }

    // Setup UPI validation
    setupUPIValidation() {
        const upiInput = document.getElementById('upiId');
        if (upiInput) {
            upiInput.addEventListener('input', () => {
                this.validateUPI(upiInput);
            });
        }
    }

    // Validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    validateMobile(mobile) {
        const mobileRegex = /^[0-9]{10}$/;
        return mobileRegex.test(mobile.replace(/\D/g, ''));
    }

    validateUPI(field) {
        const upiId = field.value.trim();
        const upiRegex = /^[\w\.-]+@[\w\.-]+$/;
        
        if (upiId && !upiRegex.test(upiId)) {
            this.showFieldError(field, 'Please enter a valid UPI ID (e.g., username@bank)');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    validateAge(field) {
        const age = parseInt(field.value);
        
        if (age < 13) {
            this.showFieldError(field, 'You must be at least 13 years old to create an account');
            return false;
        }
        
        if (age > 100) {
            this.showFieldError(field, 'Please enter a valid age');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    validatePasswordConfirmation() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (!password || !confirmPassword) return true;
        
        if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            return false;
        }
        
        this.clearFieldError(confirmPassword);
        return true;
    }

    formatMobileNumber(value) {
        const cleaned = value.replace(/\D/g, '');
        const limited = cleaned.substring(0, 10);
        
        if (limited.length >= 6) {
            return `${limited.substring(0, 3)}-${limited.substring(3, 6)}-${limited.substring(6)}`;
        } else if (limited.length >= 3) {
            return `${limited.substring(0, 3)}-${limited.substring(3)}`;
        }
        return limited;
    }

    // Update password strength indicator
    updatePasswordStrength(input) {
        const password = input.value;
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        const strengthIndicator = input.parentElement.querySelector('.password-strength');
        if (!strengthIndicator && password.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'password-strength';
            input.parentElement.appendChild(indicator);
        }

        const indicator = input.parentElement.querySelector('.password-strength');
        if (indicator) {
            const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong'];
            const strengthColors = ['#ff4444', '#ff9944', '#ffdd44', '#44ff44'];
            
            indicator.textContent = strengthLevels[strength] || 'Very Weak';
            indicator.style.color = strengthColors[strength] || '#ff4444';
        }
    }

    // Toggle password visibility
    togglePasswordVisibility(event) {
        const button = event.currentTarget;
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('i');

        if (!input || !icon) {
            console.error('Password toggle elements not found');
            return;
        }

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            button.setAttribute('title', 'Hide password');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            button.setAttribute('title', 'Show password');
        }
    }

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('tokenTimestamp');
    }

    // Check if token is expired
    isTokenExpired() {
        const timestamp = localStorage.getItem('tokenTimestamp');
        if (!timestamp) return true;
        
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        return tokenAge > maxAge;
    }

    // UI Helper functions
    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            let errorElement = formGroup.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'field-error';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    clearFieldError(input) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            const errorElement = formGroup.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    setLoadingState(isLoading) {
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                button.classList.add('loading');
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
            } else {
                button.disabled = false;
                button.classList.remove('loading');
                // Restore original text
                if (button.closest('#menteeLoginForm')) {
                    button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                } else if (button.closest('#menteeRegisterForm')) {
                    button.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                }
            }
        });
    }

    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    // Form switching
    showLoginForm() {
        const registerForm = document.getElementById('registerForm');
        const loginForm = document.getElementById('loginForm');
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        history.pushState({form: 'login'}, '', '#login');
    }

    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        history.pushState({form: 'register'}, '', '#register');
    }
}

// ===== GOOGLE LOGIN HANDLER =====
function handleGoogleLogin(response) {
    // Handle Google OAuth response
    if (response.credential) {
        fetch('/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credential: response.credential,
                userType: 'mentee'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userType', 'mentee');
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('tokenTimestamp', Date.now().toString());
                window.location.href = '/mentee-dashboard';
            }
        })
        .catch(error => {
            console.error('Google login error:', error);
        });
    }
}

// ===== GLOBAL FUNCTIONS FOR HTML ONCLICK HANDLERS =====
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error('Password input not found:', inputId);
        return;
    }
    
    const button = input.parentElement.querySelector('.password-toggle');
    if (!button) {
        console.error('Password toggle button not found for:', inputId);
        return;
    }
    
    const icon = button.querySelector('i');
    if (!icon) {
        console.error('Password toggle icon not found for:', inputId);
        return;
    }

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.setAttribute('title', 'Hide password');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.setAttribute('title', 'Show password');
    }
};

window.showRegisterForm = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    history.pushState({form: 'register'}, '', '#register');
};

window.showLoginForm = function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    if (registerForm) registerForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
    history.pushState({form: 'login'}, '', '#login');
};

// ===== INITIALIZE WHEN DOM IS LOADED =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mentee Authentication System Initialized');
    
    const menteeLogin = new MenteeLogin();
    
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        if (emailInput) {
            emailInput.value = rememberedEmail;
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenteeLogin;
}