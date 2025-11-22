// ==============================================================

/**
 * Mentee Registration Functionality - DEBUGGED VERSION
 * Handles the complete registration flow for mentees
 */

class MenteeRegister {
    constructor() {
        this.apiBaseUrl = '/api';
        this.formData = {};
        this.initializeRegistration();
    }

    initializeRegistration() {
        console.log('Initializing registration...');
        this.setupEventListeners();
        this.setupValidation();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Form submission - FIXED: Using correct form ID from HTML
        const form = document.getElementById('registerForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            console.log('Form submit listener attached');
        } else {
            console.error('Form with ID "registerForm" not found!');
        }

        // Real-time validation
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Password strength meter
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.updatePasswordStrength());
        }

        // Username availability check
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.checkEmailAvailability());
        }

        // Language checkboxes validation
        const languageCheckboxes = document.querySelectorAll('input[name="languages"]');
        languageCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateLanguages());
        });

        // Availability checkboxes validation
        const availabilityCheckboxes = document.querySelectorAll('input[name="availableHours"]');
        availabilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateAvailability());
        });

        console.log('All event listeners attached');
    }

    // Validation Methods - UPDATED to match HTML fields
    validateAllFields() {
        console.log('Validating all fields...');
        let isValid = true;
        
        // First Name
        const firstName = document.getElementById('firstName');
        if (!firstName.value.trim() || firstName.value.length < 2) {
            this.showFieldError(firstName, 'First name must be at least 2 characters');
            isValid = false;
        }

        // Last Name
        const lastName = document.getElementById('lastName');
        if (!lastName.value.trim() || lastName.value.length < 2) {
            this.showFieldError(lastName, 'Last name must be at least 2 characters');
            isValid = false;
        }

        // Age
        const age = document.getElementById('age');
        if (!age.value || age.value < 18 || age.value > 100) {
            this.showFieldError(age, 'Age must be between 18 and 100');
            isValid = false;
        }

        // Email
        const email = document.getElementById('email');
        if (!this.isValidEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        // Mobile Number
        const mobile = document.getElementById('mobileNumber');
        if (!mobile.value || mobile.value.length < 10) {
            this.showFieldError(mobile, 'Please enter a valid mobile number');
            isValid = false;
        }

        // Password
        const password = document.getElementById('password');
        if (!this.isValidPassword(password.value)) {
            this.showFieldError(password, 'Password must be at least 6 characters');
            isValid = false;
        }

        // Confirm Password
        const confirmPassword = document.getElementById('confirmPassword');
        if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }

        // UPI ID
        const upiId = document.getElementById('upiId');
        if (!upiId.value.trim()) {
            this.showFieldError(upiId, 'UPI ID is required');
            isValid = false;
        }

        // Education
        const education = document.getElementById('education');
        if (!education.value) {
            this.showFieldError(education, 'Please select your education level');
            isValid = false;
        }

        // Institution
        const institution = document.getElementById('institution');
        if (!institution.value.trim()) {
            this.showFieldError(institution, 'Please enter your institution name');
            isValid = false;
        }

        // Current Pursuit
        const currentPursuit = document.getElementById('currentPursuit');
        if (!currentPursuit.value.trim()) {
            this.showFieldError(currentPursuit, 'Please enter what you are currently pursuing');
            isValid = false;
        }

        // Languages (at least one)
        const languages = document.querySelectorAll('input[name="languages"]:checked');
        if (languages.length === 0) {
            this.showError('Please select at least one language');
            isValid = false;
        }

        // Availability (at least one)
        const availability = document.querySelectorAll('input[name="availableHours"]:checked');
        if (availability.length === 0) {
            this.showError('Please select at least one availability slot');
            isValid = false;
        }

        console.log('Validation result:', isValid);
        return isValid;
    }

    // Validation Helpers
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password) {
        return password.length >= 6;
    }

    validateField(field) {
        this.clearFieldError(field);
        
        switch (field.type) {
            case 'email':
                if (field.value && !this.isValidEmail(field.value)) {
                    this.showFieldError(field, 'Invalid email format');
                }
                break;
            case 'tel':
                if (field.value && field.value.length < 10) {
                    this.showFieldError(field, 'Mobile number must be at least 10 digits');
                }
                break;
            case 'password':
                if (field.id === 'password' && field.value && !this.isValidPassword(field.value)) {
                    this.showFieldError(field, 'Password must be at least 6 characters');
                }
                if (field.id === 'confirmPassword') {
                    const password = document.getElementById('password').value;
                    if (field.value && field.value !== password) {
                        this.showFieldError(field, 'Passwords do not match');
                    }
                }
                break;
        }
    }

    validateLanguages() {
        const languages = document.querySelectorAll('input[name="languages"]:checked');
        const languagesGroup = document.getElementById('languagesGroup');
        
        if (languages.length === 0) {
            languagesGroup.style.border = '1px solid #ef4444';
        } else {
            languagesGroup.style.border = 'none';
        }
    }

    validateAvailability() {
        const availability = document.querySelectorAll('input[name="availableHours"]:checked');
        const availabilityGroup = document.getElementById('availabilityGroup');
        
        if (availability.length === 0) {
            availabilityGroup.style.border = '1px solid #ef4444';
        } else {
            availabilityGroup.style.border = 'none';
        }
    }

    // Email Availability Check
    async verifyEmail() {
        const email = document.getElementById('email').value;
        if (!this.isValidEmail(email)) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            const emailField = document.getElementById('email');
            
            if (!data.exists) {
                this.showFieldSuccess(emailField, 'Email is available');
            } else {
                this.showFieldError(emailField, 'Email is already registered');
            }
        } catch (error) {
            console.error('Error verifying email:', error);
        }
    }

    // Password Strength Meter
    updatePasswordStrength() {
        const password = document.getElementById('password').value;
        let strength = 0;
        
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        console.log('Password strength:', strength);
    }

    // Collect Form Data - UPDATED for your HTML structure
    collectFormData() {
        console.log('Collecting form data...');
        
        const formData = {
            // Personal Information
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            
            // Contact Information
            mobileNumber: document.getElementById('mobileNumber').value,
            upiId: document.getElementById('upiId').value,
            
            // Education
            education: document.getElementById('education').value,
            institution: document.getElementById('institution').value,
            currentPursuit: document.getElementById('currentPursuit').value,
            
            // Languages
            languages: Array.from(document.querySelectorAll('input[name="languages"]:checked'))
                .map(cb => cb.value),
            
            // Availability
            availableHours: Array.from(document.querySelectorAll('input[name="availableHours"]:checked'))
                .map(cb => cb.value),
            
            // User type
            role: 'mentee'
        };

        // Add mentee-specific fields if present
        const interests = document.getElementById('interests');
        if (interests && interests.value) {
            formData.interests = interests.value;
        }

        // const budgetMin = document.getElementById('budgetMin');
        // if (budgetMin && budgetMin.value) {
        //     formData.budgetMin = budgetMin.value;
        // }

        // const budgetMax = document.getElementById('budgetMax');
        // if (budgetMax && budgetMax.value) {
        //     formData.budgetMax = budgetMax.value;
        // }

        // const preferredMentorGender = document.getElementById('preferredMentorGender');
        // if (preferredMentorGender && preferredMentorGender.value) {
        //     formData.preferredMentorGender = preferredMentorGender.value;
        // }

        console.log('Collected form data:', formData);
        return formData;
    }

    // Form Submission - DEBUGGED VERSION
    async handleFormSubmit(event) {
        event.preventDefault();
        console.log('Form submission started...');

        // Validate all fields
        if (!this.validateAllFields()) {
            console.log('Validation failed');
            this.showError('Please fix all errors before submitting');
            return;
        }

        // Collect form data
        const formData = this.collectFormData();
        
        // Debug: Log FormData contents
        console.log('Form data to submit:', JSON.stringify(formData, null, 2));

        // Show loading state
        this.setLoadingState(true);

        try {
            console.log('Sending request to:', `${this.apiBaseUrl}/auth/register`);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                this.showSuccess('Registration successful! Redirecting to login...');
                
                // Store email for login page
                localStorage.setItem('registeredEmail', formData.email);
                
                setTimeout(() => {
                    window.location.href = '/mentee/login';
                }, 2000);
            } else {
                console.error('Registration failed:', data);
                this.showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred during registration. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // UI Helper Functions
    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            formGroup.classList.remove('success');
            
            let errorElement = formGroup.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'field-error';
                errorElement.style.color = '#ef4444';
                errorElement.style.fontSize = '0.875rem';
                errorElement.style.marginTop = '0.25rem';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    showFieldSuccess(field, message) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('success');
            formGroup.classList.remove('error');
            
            let successElement = formGroup.querySelector('.field-success');
            if (!successElement) {
                successElement = document.createElement('span');
                successElement.className = 'field-success';
                successElement.style.color = '#10b981';
                successElement.style.fontSize = '0.875rem';
                successElement.style.marginTop = '0.25rem';
                formGroup.appendChild(successElement);
            }
            successElement.textContent = message;
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error', 'success');
            const errorElement = formGroup.querySelector('.field-error');
            const successElement = formGroup.querySelector('.field-success');
            if (errorElement) errorElement.remove();
            if (successElement) successElement.remove();
        }
    }

    showError(message) {
        console.error('Error:', message);
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        console.log('Success:', message);
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    setLoadingState(isLoading) {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Registering...' : 'Create Account';
        }
    }

    setupValidation() {
        console.log('Validation setup complete');
    }
}

// GLOBAL FUNCTION for password toggle (called from HTML onclick)
function togglePasswordVisibility(fieldId, icon) {
    const passwordField = document.getElementById(fieldId);
    
    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.textContent = "🙈";
    } else {
        passwordField.type = "password";
        icon.textContent = "👁️";
    }
}

// Google Sign-up function
function signUpWithGoogle() {
    console.log('Google sign-up clicked');
    alert('Google OAuth integration coming soon!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing registration...');
    const menteeRegister = new MenteeRegister();
    window.menteeRegister = menteeRegister; // For debugging in console
    console.log('Mentee registration initialized successfully');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenteeRegister;
}
