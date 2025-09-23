/**
 * Mentee Registration Functionality
 * Handles the complete registration flow for mentees
 */

class MenteeRegister {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.initializeRegistration();
    }

    initializeRegistration() {
        this.setupFormSteps();
        this.setupEventListeners();
        this.setupValidation();
        this.loadCountries();
        this.setupProgressIndicator();
    }

    // Multi-step form management
    setupFormSteps() {
        this.steps = {
            1: {
                title: 'Personal Information',
                fields: ['firstName', 'lastName', 'email', 'mobile', 'dateOfBirth', 'gender'],
                validator: this.validatePersonalInfo.bind(this)
            },
            2: {
                title: 'Educational Background',
                fields: ['education', 'institution', 'currentPursuit', 'interests', 'learningGoals'],
                validator: this.validateEducation.bind(this)
            },
            3: {
                title: 'Account Setup',
                fields: ['username', 'password', 'confirmPassword', 'timezone', 'preferredLanguage'],
                validator: this.validateAccount.bind(this)
            }
        };

        // Show first step
        this.showStep(1);
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('menteeRegisterForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Step navigation
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.previousStep());
        });

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

        // Profile picture upload
        const pictureInput = document.getElementById('profilePicture');
        if (pictureInput) {
            pictureInput.addEventListener('change', (e) => this.handleProfilePicture(e));
        }

        // Username availability check
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', () => this.checkUsernameAvailability());
        }

        // Email verification
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.verifyEmail());
        }
    }

    // Step Navigation
    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.style.display = 'none';
        });

        // Show current step
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }

        // Update progress
        this.updateProgress(stepNumber);

        // Update navigation buttons
        this.updateNavigationButtons(stepNumber);

        // Focus first input in step
        setTimeout(() => {
            const firstInput = currentStepElement.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    nextStep() {
        // Validate current step
        const currentStepData = this.steps[this.currentStep];
        if (!currentStepData.validator()) {
            return;
        }

        // Save current step data
        this.saveStepData();

        // Move to next step
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    updateProgress(step) {
        const progress = (step / this.totalSteps) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            if (index < step) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else if (index === step - 1) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else {
                indicator.classList.remove('active', 'completed');
            }
        });
    }

    updateNavigationButtons(step) {
        const prevBtn = document.querySelector('.prev-step');
        const nextBtn = document.querySelector('.next-step');
        const submitBtn = document.querySelector('.submit-btn');

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = step === this.totalSteps ? 'none' : 'inline-block';
        if (submitBtn) submitBtn.style.display = step === this.totalSteps ? 'inline-block' : 'none';
    }

    // Validation Methods
    validatePersonalInfo() {
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

        // Email
        const email = document.getElementById('email');
        if (!this.isValidEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        // Mobile
        const mobile = document.getElementById('mobile');
        if (!this.isValidMobile(mobile.value)) {
            this.showFieldError(mobile, 'Please enter a valid mobile number');
            isValid = false;
        }

        // Date of Birth
        const dob = document.getElementById('dateOfBirth');
        if (!dob.value || !this.isValidAge(dob.value)) {
            this.showFieldError(dob, 'You must be at least 13 years old');
            isValid = false;
        }

        // Gender
        const gender = document.getElementById('gender');
        if (!gender.value) {
            this.showFieldError(gender, 'Please select your gender');
            isValid = false;
        }

        return isValid;
    }

    validateEducation() {
        let isValid = true;

        // Education Level
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
        const pursuit = document.getElementById('currentPursuit');
        if (!pursuit.value.trim()) {
            this.showFieldError(pursuit, 'Please enter your current pursuit');
            isValid = false;
        }

        // Interests (at least one)
        const interests = document.querySelectorAll('input[name="interests"]:checked');
        if (interests.length === 0) {
            this.showError('Please select at least one area of interest');
            isValid = false;
        }

        return isValid;
    }

    validateAccount() {
        let isValid = true;

        // Username
        const username = document.getElementById('username');
        if (!username.value || username.value.length < 3) {
            this.showFieldError(username, 'Username must be at least 3 characters');
            isValid = false;
        }

        // Password
        const password = document.getElementById('password');
        if (!this.isValidPassword(password.value)) {
            this.showFieldError(password, 'Password must be at least 8 characters with uppercase, lowercase, and numbers');
            isValid = false;
        }

        // Confirm Password
        const confirmPassword = document.getElementById('confirmPassword');
        if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }

        // Terms and Conditions
        const terms = document.getElementById('termsAccepted');
        if (!terms.checked) {
            this.showError('You must accept the terms and conditions');
            isValid = false;
        }

        return isValid;
    }

    // Validation Helpers
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidMobile(mobile) {
        const mobileRegex = /^[\d\s\-\+\(\)]+$/;
        const cleanedMobile = mobile.replace(/\D/g, '');
        return mobileRegex.test(mobile) && cleanedMobile.length >= 10;
    }

    isValidAge(dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 13;
    }

    isValidPassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }

    validateField(field) {
        this.clearFieldError(field);
        
        switch (field.type) {
            case 'email':
                if (!this.isValidEmail(field.value)) {
                    this.showFieldError(field, 'Invalid email format');
                }
                break;
            case 'tel':
                if (!this.isValidMobile(field.value)) {
                    this.showFieldError(field, 'Invalid mobile number');
                }
                break;
            case 'password':
                if (!this.isValidPassword(field.value)) {
                    this.showFieldError(field, 'Password does not meet requirements');
                }
                break;
        }
    }

    // Username Availability Check
    async checkUsernameAvailability() {
        const username = document.getElementById('username').value;
        if (!username || username.length < 3) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            const usernameField = document.getElementById('username');
            
            if (data.available) {
                this.showFieldSuccess(usernameField, 'Username is available');
            } else {
                this.showFieldError(usernameField, 'Username is already taken');
            }
        } catch (error) {
            console.error('Error checking username:', error);
        }
    }

    // Email Verification
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
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const meter = document.querySelector('.password-strength-meter');
        const indicator = document.querySelector('.password-strength-indicator');
        
        if (meter && indicator) {
            const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
            const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            
            meter.style.width = `${(strength / 5) * 100}%`;
            meter.style.backgroundColor = colors[strength - 1] || colors[0];
            indicator.textContent = labels[strength - 1] || labels[0];
        }
    }

    // Profile Picture Handling
    handleProfilePicture(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('Image size must be less than 5MB');
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('profilePicturePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);

        // Store file for upload
        this.formData.profilePicture = file;
    }

    // Save Step Data
    saveStepData() {
        const currentStepFields = this.steps[this.currentStep].fields;
        
        currentStepFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                if (field.type === 'checkbox') {
                    this.formData[fieldName] = field.checked;
                } else if (field.type === 'radio') {
                    const checked = document.querySelector(`input[name="${fieldName}"]:checked`);
                    if (checked) this.formData[fieldName] = checked.value;
                } else {
                    this.formData[fieldName] = field.value;
                }
            }
        });

        // Handle multiple checkboxes (interests)
        const interests = document.querySelectorAll('input[name="interests"]:checked');
        if (interests.length > 0) {
            this.formData.interests = Array.from(interests).map(i => i.value);
        }
    }

    // Form Submission
    async handleFormSubmit(event) {
        event.preventDefault();

        // Validate final step
        if (!this.validateAccount()) {
            return;
        }

        // Save final step data
        this.saveStepData();

        // Show loading state
        this.setLoadingState(true);

        try {
            // Prepare form data
            const submitData = new FormData();
            Object.keys(this.formData).forEach(key => {
                if (key === 'interests') {
                    submitData.append(key, JSON.stringify(this.formData[key]));
                } else if (key === 'profilePicture') {
                    submitData.append(key, this.formData[key]);
                } else {
                    submitData.append(key, this.formData[key]);
                }
            });
            submitData.append('userType', 'mentee');

            // Submit registration
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                body: submitData
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Registration successful! Redirecting to login...');
                
                // Store email for login page
                localStorage.setItem('registeredEmail', this.formData.email);
                
                setTimeout(() => {
                    window.location.href = '/mentee/login';
                }, 2000);
            } else {
                this.showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred during registration. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Load Countries for dropdown
    async loadCountries() {
        try {
            const countries = [
                'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
                'Germany', 'France', 'Japan', 'Brazil', 'Mexico', 'China', 'Russia'
            ].sort();

            const countrySelect = document.getElementById('country');
            if (countrySelect) {
                countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    countrySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }

    // Progress Indicator
    setupProgressIndicator() {
        const indicatorContainer = document.querySelector('.progress-indicators');
        if (!indicatorContainer) return;

        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'step-indicator';
            indicator.setAttribute('data-step', i);
            indicator.innerHTML = `
                <span class="step-number">${i}</span>
                <span class="step-title">${this.steps[i].title}</span>
            `;
            indicatorContainer.appendChild(indicator);
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
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    setLoadingState(isLoading) {
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.innerHTML = isLoading
                ? '<i class="fas fa-spinner fa-spin"></i> Registering...'
                : '<i class="fas fa-user-plus"></i> Complete Registration';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const menteeRegister = new MenteeRegister();
    console.log('Mentee registration initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenteeRegister;
}
