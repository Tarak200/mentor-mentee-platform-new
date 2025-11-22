// --- Mentor Registration Functionality --- //

function initializeRegistration() {
    setupAllEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRegistration);
} else {
    initializeRegistration();
}


// UNIFIED SETUP FUNCTION - Called once on DOM ready
function setupAllEventListeners() {
    // Registration form submission
    const registerForm = document.getElementById('mentorRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Other setup functions
    setupRealTimeValidation();
    setupFormValidation();
    setupPasswordStrength();
    setupUPIValidation();
    
    // Popstate navigation
    window.addEventListener("popstate", function (e) {
        if (e.state && e.state.form) {
            if (e.state.form === "register") showRegisterForm();
            else showLoginForm();
        }
    });
}


// Show Registration Form UI
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) registerForm.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
    
    // Add animation
    if (registerForm) registerForm.classList.add('fade-in');
    
    // Update URL without refresh
    history.pushState({form: 'register'}, '', '#register');
}


// Show Login Form UI
function showLoginForm() {
    // Redirect to login page
    window.location.href = '/mentor/login'; // Change this to your actual login page URL
}



// Handle mentor registration form submission
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
        // Call backend registration API
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                email: registrationData.email,
                password: registrationData.password,
                role: "mentor",
                age: registrationData.age,
                bio: registrationData.qualifications,
                gender: registrationData.gender,
                mobile: registrationData.mobile,
                education: registrationData.education,
                institution: registrationData.institution,
                currentPursuing: registrationData.currentPursuing,
                languages: registrationData.languages,
                availability: registrationData.availability,
                hourlyRate: registrationData.hourlyRate,
                upiId: registrationData.upiId,
                skills: registrationData.skills,
                subjects: registrationData.subjects
            })
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Registration failed");
        }
        
        // Show success
        showNotification("Account created successfully! Please sign in.", "success");
        
        // Switch to login, pre-fill email
        setTimeout(() => {
            showLoginForm();
            const loginEmailField = document.getElementById("loginEmail");
            if (loginEmailField) {
                loginEmailField.value = registrationData.email;
            }
        }, 1500);
    } catch (error) {
        showNotification(error.message, "error");
    } finally {
        // Reset loading state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}


// Extract registration data from form
function extractRegistrationData(formData) {
    // Get selected languages
    const languages = Array.from(document.querySelectorAll('input[name="languages"]:checked'))
        .map(input => input.value);
    
    // Get selected availability
    const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked'))
        .map(input => input.value);
    
    return {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        age: parseInt(formData.get("age")),
        gender: formData.get("gender"),
        mobile: formData.get("mobile"),
        email: formData.get("email"),
        education: formData.get("education"),
        institution: formData.get("institution"),
        currentPursuing: formData.get("currentPursuing"),
        qualifications: formData.get("qualifications"),
        languages: languages,
        availability: availability,
        hourlyRate: parseFloat(formData.get("hourlyRate")),
        upiId: formData.get("upiId"),
        password: formData.get("password"),
        skills: formData.get("skills"),
        subjects: formData.get("subjects"),
        registrationDate: new Date().toISOString(),
        isVerified: false,
        profileComplete: true
    };
}


// Registration Form Validation and Helpers
function setupFormValidation() {
    // Add validation listeners to all required fields
    const requiredFields = document.querySelectorAll("input[required], select[required]");
    requiredFields.forEach(field => {
        field.addEventListener("blur", function () { 
            validateField(this); 
        });
        field.addEventListener("input", function () { 
            clearFieldError(this); 
        });
    });
}


// Real-time registration validation functions
function setupRealTimeValidation() {
    // Email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener("input", function () { 
            validateEmail(this); 
        });
    });
    
    // Phone
    const phoneInput = document.getElementById("mobile");
    if (phoneInput) {
        phoneInput.addEventListener("input", function () { 
            validatePhone(this); 
        });
    }
    
    // Password confirmation
    const confirmPasswordInput = document.getElementById("confirmPassword");
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", function () { 
            validatePasswordConfirmation(); 
        });
    }
    
    // Age
    const ageInput = document.getElementById("age");
    if (ageInput) {
        ageInput.addEventListener("input", function () { 
            validateAge(this); 
        });
    }
}


// Registration Form Validation Main
function validateRegistrationForm(form) {
    let isValid = true;
    
    // Validate all required fields
    const requiredFields = form.querySelectorAll("input[required], select[required]");
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Password confirmation
    if (!validatePasswordConfirmation()) {
        isValid = false;
    }
    
    // Languages
    if (!validateLanguages()) {
        isValid = false;
    }
    
    // Availability
    if (!validateAvailability()) {
        isValid = false;
    }
    
    // Terms acceptance
    if (!validateTerms()) {
        isValid = false;
    }
    
    return isValid;
}


function validateField(field) {
    const value = field.value.trim();
    clearFieldError(field);
    
    if (field.hasAttribute("required") && !value) {
        showFieldError(field, "This field is required");
        return false;
    }
    
    // Specific type validations
    switch (field.type) {
        case "email":
            return validateEmail(field);
        case "tel":
            return validatePhone(field);
        case "number":
            return validateNumber(field);
        default:
            if (field.name === "upiId") {
                return validateUPI(field);
            }
            return true;
    }
}


function validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        showFieldError(field, "Please enter a valid email address");
        return false;
    }
    clearFieldError(field);
    return true;
}


function validatePhone(field) {
    const phone = field.value.trim().replace(/\D/g, '');
    if (phone && phone.length !== 10) {
        showFieldError(field, "Please enter a valid 10-digit phone number");
        return false;
    }
    clearFieldError(field);
    return true;
}


function validateNumber(field) {
    const value = parseFloat(field.value);
    const min = parseFloat(field.getAttribute("min"));
    const max = parseFloat(field.getAttribute("max"));
    
    if (isNaN(value)) {
        showFieldError(field, "Please enter a valid number");
        return false;
    }
    
    if (min && value < min) {
        showFieldError(field, "Value must be at least " + min);
        return false;
    }
    
    if (max && value > max) {
        showFieldError(field, "Value must be at most " + max);
        return false;
    }
    
    clearFieldError(field);
    return true;
}


function validateAge(field) {
    const age = parseInt(field.value);
    if (isNaN(age)) {
        showFieldError(field, "Please enter a valid age");
        return false;
    }
    if (age < 18) {
        showFieldError(field, "You must be at least 18 years old to become a mentor");
        return false;
    }
    if (age > 100) {
        showFieldError(field, "Please enter a valid age");
        return false;
    }
    clearFieldError(field);
    return true;
}


function validatePasswordConfirmation() {
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    
    if (!password || !confirmPassword) {
        return true;
    }
    
    if (password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, "Passwords do not match");
        return false;
    }
    
    clearFieldError(confirmPassword);
    return true;
}


function validateLanguages() {
    const languageCheckboxes = document.querySelectorAll('input[name="languages"]:checked');
    if (languageCheckboxes.length === 0) {
        showNotification("Please select at least one language you can communicate in", "error");
        return false;
    }
    return true;
}


function validateAvailability() {
    const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]:checked');
    if (availabilityCheckboxes.length === 0) {
        showNotification("Please select at least one time slot for your availability", "error");
        return false;
    }
    return true;
}


function validateTerms() {
    const termsCheckbox = document.querySelector('input[name="terms"]');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showNotification("Please accept the Terms of Service and Privacy Policy to continue", "error");
        return false;
    }
    return true;
}


// UPI Validation
function setupUPIValidation() {
    const upiInput = document.getElementById("upiId");
    if (upiInput) {
        upiInput.addEventListener("input", function () { 
            validateUPI(this); 
        });
    }
}


function validateUPI(field) {
    const upiId = field.value.trim();
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (upiId && !upiRegex.test(upiId)) {
        showFieldError(field, "Please enter a valid UPI ID (e.g., username@bank)");
        return false;
    }
    clearFieldError(field);
    return true;
}


// Password strength
function setupPasswordStrength() {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("input", function () { 
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


// Show field error message
function showFieldError(field, message) {
    field.classList.add("error");
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector(".field-error");
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement("small");
    errorElement.className = "field-error";
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
}


// Clear field error message
function clearFieldError(field) {
    field.classList.remove("error");
    const errorElement = field.parentElement.querySelector(".field-error");
    if (errorElement) {
        errorElement.remove();
    }
}


// Show notification
function showNotification(message, type = 'info') {
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
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        ">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                margin-left: auto;
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}


// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.parentElement.querySelector('.password-toggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
