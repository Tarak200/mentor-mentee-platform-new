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
        window.location.href = '/mentee/register';
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