/**
 * Mentor Registration Functionality
 * Complete registration system for mentors with validation and multi-step forms
 */

class MentorRegister {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.initializeRegistration();
    }

    initializeRegistration() {
        this.setupFormSteps();
        this.setupEventListeners();
        this.setupValidation();
        this.loadDynamicData();
        this.setupProgressIndicator();
    }

    // Multi-step form configuration
    setupFormSteps() {
        this.steps = {
            1: {
                title: 'Personal Information',
                fields: ['firstName', 'lastName', 'email', 'mobile', 'dateOfBirth', 'gender'],
                validator: this.validatePersonalInfo.bind(this)
            },
            2: {
                title: 'Professional Details',
                fields: ['education', 'institution', 'currentPursuit', 'expertise', 'experience', 'qualifications'],
                validator: this.validateProfessionalDetails.bind(this)
            },
            3: {
                title: 'Mentoring Preferences',
                fields: ['subjects', 'hourlyRate', 'availability', 'languages', 'teachingMethod'],
                validator: this.validateMentoringPreferences.bind(this)
            },
            4: {
                title: 'Account Setup',
                fields: ['username', 'password', 'confirmPassword', 'upiId', 'timezone'],
                validator: this.validateAccountSetup.bind(this)
            }
        };

        this.showStep(1);
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('mentorRegisterForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Step navigation buttons
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.previousStep());
        });

        // Real-time field validation
        this.setupFieldValidation();

        // File uploads
        this.setupFileUploads();

        // Dynamic field interactions
        this.setupDynamicFields();
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
            currentStepElement.classList.add('fade-in');
        }

        // Update progress
        this.updateProgress(stepNumber);

        // Update navigation buttons
        this.updateNavigationButtons(stepNumber);

        // Focus first input
        setTimeout(() => {
            const firstInput = currentStepElement?.querySelector('input, select, textarea');
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
            if (index < step - 1) {
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

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
        if (nextBtn) nextBtn.style.display = step === this.totalSteps ? 'none' : 'inline-flex';
        if (submitBtn) submitBtn.style.display = step === this.totalSteps ? 'inline-flex' : 'none';
    }

    // Validation Methods
    validatePersonalInfo() {
        let isValid = true;

        // First Name
        const firstName = document.getElementById('firstName');
        if (!this.validateRequired(firstName, 'First name is required')) {
            isValid = false;
        } else if (!this.validateName(firstName.value)) {
            this.showFieldError(firstName, 'Please enter a valid first name');
            isValid = false;
        }

        // Last Name
        const lastName = document.getElementById('lastName');
        if (!this.validateRequired(lastName, 'Last name is required')) {
            isValid = false;
        } else if (!this.validateName(lastName.value)) {
            this.showFieldError(lastName, 'Please enter a valid last name');
            isValid = false;
        }

        // Email
        const email = document.getElementById('email');
        if (!this.validateRequired(email, 'Email is required')) {
            isValid = false;
        } else if (!this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        // Mobile
        const mobile = document.getElementById('mobile');
        if (!this.validateRequired(mobile, 'Mobile number is required')) {
            isValid = false;
        } else if (!this.validateMobile(mobile.value)) {
            this.showFieldError(mobile, 'Please enter a valid mobile number');
            isValid = false;
        }

        // Date of Birth
        const dob = document.getElementById('dateOfBirth');
        if (!this.validateRequired(dob, 'Date of birth is required')) {
            isValid = false;
        } else if (!this.validateAge(dob.value, 18)) {
            this.showFieldError(dob, 'You must be at least 18 years old to register as a mentor');
            isValid = false;
        }

        // Gender
        const gender = document.getElementById('gender');
        if (!this.validateRequired(gender, 'Please select your gender')) {
            isValid = false;
        }

        return isValid;
    }

    validateProfessionalDetails() {
        let isValid = true;

        // Education Level
        const education = document.getElementById('education');
        if (!this.validateRequired(education, 'Education level is required')) {
            isValid = false;
        }

        // Institution
        const institution = document.getElementById('institution');
        if (!this.validateRequired(institution, 'Institution name is required')) {
            isValid = false;
        }

        // Current Pursuit
        const pursuit = document.getElementById('currentPursuit');
        if (!this.validateRequired(pursuit, 'Current pursuit is required')) {
            isValid = false;
        }

        // Expertise
        const expertise = document.getElementById('expertise');
        if (!this.validateRequired(expertise, 'Area of expertise is required')) {
            isValid = false;
        }

        // Experience
        const experience = document.getElementById('experience');
        if (!this.validateRequired(experience, 'Years of experience is required')) {
            isValid = false;
        } else if (parseInt(experience.value) < 0) {
            this.showFieldError(experience, 'Experience cannot be negative');
            isValid = false;
        }

        // Qualifications (optional but validate if provided)
        const qualifications = document.getElementById('qualifications');
        if (qualifications.value && qualifications.value.length > 500) {
            this.showFieldError(qualifications, 'Qualifications description is too long (max 500 characters)');
            isValid = false;
        }

        return isValid;
    }

    validateMentoringPreferences() {
        let isValid = true;

        // Subjects (at least one required)
        const subjects = document.querySelectorAll('input[name="subjects"]:checked');
        if (subjects.length === 0) {
            this.showError('Please select at least one subject to teach');
            isValid = false;
        }

        // Hourly Rate
        const hourlyRate = document.getElementById('hourlyRate');
        if (!this.validateRequired(hourlyRate, 'Hourly rate is required')) {
            isValid = false;
        } else if (parseFloat(hourlyRate.value) < 0) {
            this.showFieldError(hourlyRate, 'Hourly rate cannot be negative');
            isValid = false;
        }

        // Availability (at least one required)
        const availability = document.querySelectorAll('input[name="availability"]:checked');
        if (availability.length === 0) {
            this.showError('Please select at least one availability slot');
            isValid = false;
        }

        // Languages (at least one required)
        const languages = document.querySelectorAll('input[name="languages"]:checked');
        if (languages.length === 0) {
            this.showError('Please select at least one language');
            isValid = false;
        }

        // Teaching Method
        const teachingMethod = document.getElementById('teachingMethod');
        if (!this.validateRequired(teachingMethod, 'Teaching method is required')) {
            isValid = false;
        }

        return isValid;
    }

    validateAccountSetup() {
        let isValid = true;

        // Username
        const username = document.getElementById('username');
        if (!this.validateRequired(username, 'Username is required')) {
            isValid = false;
        } else if (!this.validateUsername(username.value)) {
            this.showFieldError(username, 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
            isValid = false;
        }

        // Password
        const password = document.getElementById('password');
        if (!this.validateRequired(password, 'Password is required')) {
            isValid = false;
        } else if (!this.validatePasswordStrength(password.value)) {
            this.showFieldError(password, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            isValid = false;
        }

        // Confirm Password
        const confirmPassword = document.getElementById('confirmPassword');
        if (!this.validateRequired(confirmPassword, 'Please confirm your password')) {
            isValid = false;
        } else if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }

        // UPI ID
        const upiId = document.getElementById('upiId');
        if (!this.validateRequired(upiId, 'UPI ID is required for payment')) {
            isValid = false;
        } else if (!this.validateUPI(upiId.value)) {
            this.showFieldError(upiId, 'Please enter a valid UPI ID');
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
    validateRequired(field, message) {
        if (!field.value || field.value.trim() === '') {
            this.showFieldError(field, message);
            return false;
        }
        this.clearFieldError(field);
        return true;
    }

    validateName(name) {
        const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
        return nameRegex.test(name);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateMobile(mobile) {
        const cleanedMobile = mobile.replace(/\D/g, '');
        return cleanedMobile.length >= 10 && cleanedMobile.length <= 15;
    }

    validateAge(dateOfBirth, minAge) {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= minAge;
    }

    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    validatePasswordStrength(password) {
        // At least 8 chars, one uppercase, one lowercase, one number, one special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    validateUPI(upi) {
        const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/;
        return upiRegex.test(upi);
    }

    // Setup field validation
    setupFieldValidation() {
        // Email validation with availability check
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', async () => {
                if (this.validateEmail(emailInput.value)) {
                    await this.checkEmailAvailability(emailInput.value);
                }
            });
        }

        // Username availability check
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', async () => {
                if (this.validateUsername(usernameInput.value)) {
                    await this.checkUsernameAvailability(usernameInput.value);
                }
            });
        }

        // Password strength meter
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updatePasswordStrength(passwordInput.value);
            });
        }

        // UPI validation
        const upiInput = document.getElementById('upiId');
        if (upiInput) {
            upiInput.addEventListener('input', () => {
                this.formatUPI(upiInput);
            });
        }

        // Mobile number formatting
        const mobileInput = document.getElementById('mobile');
        if (mobileInput) {
            mobileInput.addEventListener('input', () => {
                this.formatMobileNumber(mobileInput);
            });
        }
    }

    // Async validation checks
    async checkEmailAvailability(email) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, userType: 'mentor' })
            });

            const data = await response.json();
            const emailField = document.getElementById('email');

            if (data.exists) {
                this.showFieldError(emailField, 'This email is already registered');
            } else {
                this.showFieldSuccess(emailField, 'Email is available');
            }
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }

    async checkUsernameAvailability(username) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            const usernameField = document.getElementById('username');

            if (!data.available) {
                this.showFieldError(usernameField, 'Username is already taken');
            } else {
                this.showFieldSuccess(usernameField, 'Username is available');
            }
        } catch (error) {
            console.error('Error checking username:', error);
        }
    }

    // Password strength meter
    updatePasswordStrength(password) {
        let strength = 0;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        strength = Object.values(requirements).filter(Boolean).length;

        const meter = document.querySelector('.password-strength-meter');
        const indicator = document.querySelector('.password-strength-text');

        if (meter && indicator) {
            const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
            const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

            meter.style.width = `${(strength / 5) * 100}%`;
            meter.style.backgroundColor = colors[strength - 1] || colors[0];
            indicator.textContent = labels[strength - 1] || labels[0];

            // Update requirements checklist
            Object.keys(requirements).forEach(req => {
                const reqElement = document.getElementById(`req-${req}`);
                if (reqElement) {
                    reqElement.classList.toggle('met', requirements[req]);
                }
            });
        }
    }

    // Format helpers
    formatUPI(input) {
        let value = input.value;
        // Basic UPI format validation
        value = value.replace(/[^a-zA-Z0-9@.\-_]/g, '');
        input.value = value;
    }

    formatMobileNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        // Format as XXX-XXX-XXXX
        if (value.length >= 6) {
            value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
        } else if (value.length >= 3) {
            value = value.substring(0, 3) + '-' + value.substring(3);
        }
        input.value = value;
    }

    // File upload handling
    setupFileUploads() {
        // Profile picture upload
        const pictureInput = document.getElementById('profilePicture');
        if (pictureInput) {
            pictureInput.addEventListener('change', (e) => this.handleProfilePicture(e));
        }

        // Certificate uploads
        const certificateInput = document.getElementById('certificates');
        if (certificateInput) {
            certificateInput.addEventListener('change', (e) => this.handleCertificates(e));
        }
    }

    handleProfilePicture(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('Image size must be less than 5MB');
            event.target.value = '';
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

    handleCertificates(event) {
        const files = Array.from(event.target.files);
        const validFiles = [];

        files.forEach(file => {
            // Validate file type (PDF, images)
            if (!file.type.match(/^(image\/.*|application\/pdf)$/)) {
                this.showError(`${file.name} is not a valid file type. Only images and PDFs are allowed.`);
                return;
            }

            // Validate file size (max 10MB per file)
            if (file.size > 10 * 1024 * 1024) {
                this.showError(`${file.name} is too large. Maximum size is 10MB.`);
                return;
            }

            validFiles.push(file);
        });

        // Update file list display
        const fileList = document.getElementById('certificatesList');
        if (fileList && validFiles.length > 0) {
            fileList.innerHTML = validFiles.map(file => `
                <div class="file-item">
                    <span>${file.name}</span>
                    <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
                </div>
            `).join('');
        }

        // Store files for upload
        this.formData.certificates = validFiles;
    }

    // Dynamic fields
    setupDynamicFields() {
        // Add more subjects dynamically
        const addSubjectBtn = document.getElementById('addSubject');
        if (addSubjectBtn) {
            addSubjectBtn.addEventListener('click', () => this.addSubjectField());
        }

        // Hourly rate calculator
        const hourlyRateInput = document.getElementById('hourlyRate');
        if (hourlyRateInput) {
            hourlyRateInput.addEventListener('input', () => this.calculateEarnings());
        }
    }

    addSubjectField() {
        const container = document.getElementById('additionalSubjects');
        if (!container) return;

        const subjectField = document.createElement('div');
        subjectField.className = 'form-group';
        subjectField.innerHTML = `
            <input type="text" class="additional-subject" placeholder="Enter subject name">
            <button type="button" class="remove-subject" onclick="this.parentElement.remove()">Remove</button>
        `;

        container.appendChild(subjectField);
    }

    calculateEarnings() {
        const rate = parseFloat(document.getElementById('hourlyRate')?.value || 0);
        const estimatedHours = 20; // Assuming 20 hours per month
        const platformCommission = 0.10; // 10% commission

        const monthlyEarnings = rate * estimatedHours * (1 - platformCommission);
        const yearlyEarnings = monthlyEarnings * 12;

        const earningsDisplay = document.getElementById('estimatedEarnings');
        if (earningsDisplay) {
            earningsDisplay.innerHTML = `
                <p>Estimated Monthly Earnings: ₹${monthlyEarnings.toFixed(2)}</p>
                <p>Estimated Yearly Earnings: ₹${yearlyEarnings.toFixed(2)}</p>
                <small>*Based on 20 hours/month after 10% platform fee</small>
            `;
        }
    }

    // Save step data
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

        // Handle checkbox groups
        ['subjects', 'availability', 'languages'].forEach(group => {
            const checkboxes = document.querySelectorAll(`input[name="${group}"]:checked`);
            if (checkboxes.length > 0) {
                this.formData[group] = Array.from(checkboxes).map(cb => cb.value);
            }
        });

        // Handle additional subjects
        const additionalSubjects = document.querySelectorAll('.additional-subject');
        if (additionalSubjects.length > 0) {
            const subjects = Array.from(additionalSubjects)
                .map(input => input.value)
                .filter(value => value.trim() !== '');
            if (subjects.length > 0) {
                this.formData.additionalSubjects = subjects;
            }
        }
    }

    // Form submission
    async handleFormSubmit(event) {
        event.preventDefault();

        // Validate final step
        if (!this.validateAccountSetup()) {
            return;
        }

        // Save final step data
        this.saveStepData();

        // Show loading state
        this.setLoadingState(true);

        try {
            // Prepare form data for submission
            const submitData = new FormData();

            // Add all form fields
            Object.keys(this.formData).forEach(key => {
                if (key === 'profilePicture' || key === 'certificates') {
                    // Handle file uploads
                    if (key === 'profilePicture' && this.formData[key]) {
                        submitData.append(key, this.formData[key]);
                    } else if (key === 'certificates' && this.formData[key]) {
                        this.formData[key].forEach(file => {
                            submitData.append('certificates', file);
                        });
                    }
                } else if (Array.isArray(this.formData[key])) {
                    submitData.append(key, JSON.stringify(this.formData[key]));
                } else {
                    submitData.append(key, this.formData[key]);
                }
            });

            submitData.append('userType', 'mentor');

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
                    window.location.href = '/mentor/login';
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

    // Load dynamic data
    async loadDynamicData() {
        // Load subjects list
        this.loadSubjects();
        // Load timezones
        this.loadTimezones();
        // Load languages
        this.loadLanguages();
    }

    loadSubjects() {
        const subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
            'Programming', 'Web Development', 'Data Science', 'Machine Learning',
            'Business', 'Marketing', 'Finance', 'English', 'History', 'Psychology'
        ];

        const container = document.getElementById('subjectsCheckboxes');
        if (container) {
            container.innerHTML = subjects.map(subject => `
                <div class="checkbox-item">
                    <input type="checkbox" id="subject-${subject.toLowerCase().replace(/\s/g, '-')}" 
                           name="subjects" value="${subject}">
                    <label for="subject-${subject.toLowerCase().replace(/\s/g, '-')}">${subject}</label>
                </div>
            `).join('');
        }
    }

    loadTimezones() {
        const timezones = [
            'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
            'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
            'Asia/Kolkata', 'Australia/Sydney'
        ];

        const select = document.getElementById('timezone');
        if (select) {
            select.innerHTML = '<option value="">Select timezone</option>' +
                timezones.map(tz => `<option value="${tz}">${tz}</option>`).join('');
        }
    }

    loadLanguages() {
        const languages = [
            'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
            'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Korean', 'Italian'
        ];

        const container = document.getElementById('languagesCheckboxes');
        if (container) {
            container.innerHTML = languages.map(lang => `
                <div class="checkbox-item">
                    <input type="checkbox" id="lang-${lang.toLowerCase()}" 
                           name="languages" value="${lang}">
                    <label for="lang-${lang.toLowerCase()}">${lang}</label>
                </div>
            `).join('');
        }
    }

    // Progress indicator
    setupProgressIndicator() {
        const container = document.querySelector('.progress-indicators');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'step-indicator';
            indicator.setAttribute('data-step', i);
            indicator.innerHTML = `
                <span class="step-number">${i}</span>
                <span class="step-title">${this.steps[i].title}</span>
            `;
            container.appendChild(indicator);
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
                ? '<i class="fas fa-spinner fa-spin"></i> Creating Account...'
                : '<i class="fas fa-check"></i> Complete Registration';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mentorRegister = new MentorRegister();
    console.log('Mentor registration initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MentorRegister;
}
