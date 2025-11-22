// Simple HTML sanitization without external dependencies

class ValidationUtils {
    // Email validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password validation
    validatePassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        // Allows letters, numbers, and common special characters
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#^()_+=\-[\]{}|;:'",.<>\/\\`~]{8,}$/;
        return passwordRegex.test(password);
    }

    // Phone number validation
    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Name validation
    validateName(name) {
        const nameRegex = /^[a-zA-Z\s\-'\.]{1,50}$/;
        return nameRegex.test(name);
    }

    // URL validation
    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove HTML tags and sanitize
        let sanitized = input.replace(/<[^>]*>/g, '');
        
        // Escape special characters
        sanitized = sanitized.replace(/[&<>"']/g, (match) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escapeMap[match];
        });
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        // Remove multiple spaces
        sanitized = sanitized.replace(/\s+/g, ' ');
        
        return sanitized;
    }

    // HTML content sanitization (allows some safe tags)
    sanitizeHTML(html) {
        if (typeof html !== 'string') return html;
        
        // Allow only safe tags and remove all attributes
        const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
        let sanitized = html;
        
        // Remove all tags except allowed ones
        sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
            if (allowedTags.includes(tagName.toLowerCase())) {
                return `<${tagName.toLowerCase()}>`;
            }
            return '';
        });
        
        return sanitized;
    }

    // SQL injection prevention
    escapeSQLString(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/'/g, "''");
    }

    // XSS prevention for output
    escapeHTML(str) {
        if (typeof str !== 'string') return str;
        
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return str.replace(/[&<>"'\/]/g, (match) => escapeMap[match]);
    }

    // File validation
    validateFile(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
            allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
        } = options;

        const errors = [];

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size too large. Maximum ${maxSize / (1024 * 1024)}MB allowed.`);
        }

        // Check MIME type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
            errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Check file extension
        if (allowedExtensions.length > 0) {
            const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
            if (!allowedExtensions.includes(ext)) {
                errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Rate limiting validation
    validateRateLimit(attempts, maxAttempts, timeWindow) {
        return attempts < maxAttempts;
    }

    // Date validation
    validateDate(date) {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
    }

    // Age validation
    validateAge(birthDate, minAge = 13, maxAge = 120) {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= minAge && age <= maxAge;
    }

    // Skills validation
    validateSkills(skills) {
        if (!Array.isArray(skills)) return false;
        
        return skills.every(skill => {
            return typeof skill === 'string' && 
                   skill.length > 0 && 
                   skill.length <= 50 &&
                   /^[a-zA-Z0-9\s\-\+\#\.]{1,50}$/.test(skill);
        });
    }

    // Hourly rate validation
    validateHourlyRate(rate) {
        const numRate = parseFloat(rate);
        return !isNaN(numRate) && numRate >= 0 && numRate <= 1000;
    }

    // Session duration validation
    validateSessionDuration(duration) {
        const numDuration = parseInt(duration);
        return !isNaN(numDuration) && numDuration >= 15 && numDuration <= 480; // 15 min to 8 hours
    }

    // Rating validation
    validateRating(rating) {
        const numRating = parseInt(rating);
        return !isNaN(numRating) && numRating >= 1 && numRating <= 5;
    }

    // Timezone validation
    validateTimezone(timezone) {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return true;
        } catch {
            return false;
        }
    }

    // Generic object validation
    validateObject(obj, schema) {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = obj[field];

            // Required field check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip validation if field is not required and empty
            if (!rules.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Type validation
            if (rules.type && typeof value !== rules.type) {
                errors.push(`${field} must be of type ${rules.type}`);
                continue;
            }

            // String length validation
            if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters long`);
            }

            if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
            }

            // Number range validation
            if (rules.min && typeof value === 'number' && value < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            }

            if (rules.max && typeof value === 'number' && value > rules.max) {
                errors.push(`${field} must be no more than ${rules.max}`);
            }

            // Custom validation function
            if (rules.validator && !rules.validator(value)) {
                errors.push(`${field} is invalid`);
            }

            // Enum validation
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

const validationUtils = new ValidationUtils();

module.exports = {
    validateEmail: validationUtils.validateEmail.bind(validationUtils),
    validatePassword: validationUtils.validatePassword.bind(validationUtils),
    validatePhone: validationUtils.validatePhone.bind(validationUtils),
    validateName: validationUtils.validateName.bind(validationUtils),
    validateURL: validationUtils.validateURL.bind(validationUtils),
    sanitizeInput: validationUtils.sanitizeInput.bind(validationUtils),
    sanitizeHTML: validationUtils.sanitizeHTML.bind(validationUtils),
    escapeSQLString: validationUtils.escapeSQLString.bind(validationUtils),
    escapeHTML: validationUtils.escapeHTML.bind(validationUtils),
    validateFile: validationUtils.validateFile.bind(validationUtils),
    validateRateLimit: validationUtils.validateRateLimit.bind(validationUtils),
    validateDate: validationUtils.validateDate.bind(validationUtils),
    validateAge: validationUtils.validateAge.bind(validationUtils),
    validateSkills: validationUtils.validateSkills.bind(validationUtils),
    validateHourlyRate: validationUtils.validateHourlyRate.bind(validationUtils),
    validateSessionDuration: validationUtils.validateSessionDuration.bind(validationUtils),
    validateRating: validationUtils.validateRating.bind(validationUtils),
    validateTimezone: validationUtils.validateTimezone.bind(validationUtils),
    validateObject: validationUtils.validateObject.bind(validationUtils)
};
