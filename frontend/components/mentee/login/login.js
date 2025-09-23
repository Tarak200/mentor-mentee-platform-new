/**
 * Mentee Login Functionality
 * Handles authentication, form validation, and navigation
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
    }

    // Check if user already logged in
    checkExistingSession() {
        const token = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        
        if (token && userType === 'mentee') {
            window.location.href = '/mentee-dashboard';
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;
        const remember = form.remember?.checked;

        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    userType: 'mentee'
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userType', 'mentee');
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);

                if (remember) {
                    localStorage.setItem('rememberEmail', email);
                } else {
                    localStorage.removeItem('rememberEmail');
                }

                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/mentee-dashboard';
                }, 1500);
            } else {
                this.showError(data.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Handle registration form submission
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const registrationData = {};

        // Collect form data
        for (let [key, value] of formData.entries()) {
            registrationData[key] = value.trim();
        }

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
                    userType: 'mentee'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Registration successful! Please login.');
                
                // Switch to login form
                setTimeout(() => {
                    this.showLoginForm();
                    // Pre-fill email
                    document.getElementById('loginEmail').value = registrationData.email;
                }, 2000);
            } else {
                this.showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred during registration.');
        } finally {
            this.setLoadingState(false);
        }
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

        // Password strength indicator
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.id !== 'loginPassword') {
                input.addEventListener('input', () => {
                    this.updatePasswordStrength(input);
                });
            }
        });

        // Mobile number formatting
        const mobileInputs = document.querySelectorAll('input[type="tel"]');
        mobileInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = this.formatMobileNumber(e.target.value);
            });
        });
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
        if (!strengthIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'password-strength';
            input.parentElement.appendChild(indicator);
        }

        const indicator = input.parentElement.querySelector('.password-strength');
        const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4444', '#ff9944', '#ffdd44', '#44ff44'];
        
        indicator.textContent = strengthLevels[strength] || 'Very Weak';
        indicator.style.color = strengthColors[strength] || '#ff4444';
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
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

// Google Login Handler
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
                window.location.href = '/mentee-dashboard';
            }
        })
        .catch(error => {
            console.error('Google login error:', error);
        });
    }
}

// Global functions for HTML onclick handlers
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
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
};

window.showLoginForm = function() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const menteeLogin = new MenteeLogin();
    
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.value = rememberedEmail;
            document.querySelector('input[name="remember"]').checked = true;
        }
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenteeLogin;
}
