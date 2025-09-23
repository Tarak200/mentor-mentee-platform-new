/**
 * Mentee Registration Security Module
 * Implements comprehensive security measures for registration
 */

class RegisterSecurity {
    constructor() {
        this.initializeSecurity();
        this.setupValidationRules();
    }

    initializeSecurity() {
        this.preventInjections();
        this.setupInputSanitization();
        this.implementRateLimiting();
        this.setupFormProtection();
        this.monitorSuspiciousBehavior();
        this.setupDataEncryption();
    }

    // Setup validation rules
    setupValidationRules() {
        this.validationRules = {
            name: /^[a-zA-Z\s\-']{2,50}$/,
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            username: /^[a-zA-Z0-9_]{3,20}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            mobile: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
        };

        this.blacklistedPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /eval\(/gi,
            /document\./gi,
            /window\./gi,
            /\.innerHTML/gi
        ];
    }

    // Prevent injections - Relaxed for development
    preventInjections() {
        // Disabled during development to prevent CSS/JS loading issues
        console.log('Injection prevention relaxed for development - CSS and JS unrestricted');
        
        // Only prevent actual eval usage, don't override document.write
        const originalEval = window.eval;
        window.eval = function(code) {
            console.warn('eval() usage detected:', code);
            // Allow eval during development but log usage
            return originalEval.call(window, code);
        };

        // Monitor innerHTML changes - Disabled for development
        // Mutation observer disabled to prevent CSS/JS interference during development
        console.log('DOM mutation observer disabled for development - allows unrestricted CSS/JS loading');
    }

    validateNode(node) {
        // Check for dangerous elements
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'applet'];
        if (dangerousTags.includes(node.tagName?.toLowerCase())) {
            console.warn(`Dangerous element ${node.tagName} detected and removed`);
            node.remove();
            this.logSecurityEvent('DANGEROUS_ELEMENT', { tag: node.tagName });
        }

        // Check for dangerous attributes
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
        dangerousAttrs.forEach(attr => {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                console.warn(`Dangerous attribute ${attr} removed`);
                node.removeAttribute(attr);
                this.logSecurityEvent('DANGEROUS_ATTRIBUTE', { attribute: attr });
            }
        });
    }

    // Setup input sanitization
    setupInputSanitization() {
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.sanitizeInput(event.target);
            }
        });

        document.addEventListener('paste', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    this.sanitizeInput(event.target);
                    this.checkPastedContent(event);
                }, 0);
            }
        });
    }

    sanitizeInput(input) {
        let value = input.value;
        const originalValue = value;

        // Remove any HTML tags
        value = value.replace(/<[^>]*>/g, '');

        // Check for blacklisted patterns
        this.blacklistedPatterns.forEach(pattern => {
            if (pattern.test(value)) {
                value = value.replace(pattern, '');
                this.logSecurityEvent('MALICIOUS_INPUT', {
                    field: input.name || input.id,
                    pattern: pattern.source
                });
            }
        });

        // Check for SQL injection attempts
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC)\b)/gi,
            /(--|#|\/\*|\*\/)/g,
            /(\bOR\b|\bAND\b)\s*[\'\"]?\s*=\s*[\'\"]?/gi
        ];

        sqlPatterns.forEach(pattern => {
            if (pattern.test(value)) {
                value = value.replace(pattern, '');
                this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
                    field: input.name || input.id
                });
            }
        });

        // Apply field-specific validation
        this.validateFieldContent(input, value);

        if (value !== originalValue) {
            input.value = value;
            this.showSecurityWarning('Invalid characters have been removed');
        }
    }

    validateFieldContent(input, value) {
        const fieldName = input.name || input.id;
        
        // Name fields
        if (fieldName?.includes('name') || fieldName?.includes('Name')) {
            if (!this.validationRules.name.test(value) && value.length > 0) {
                this.showFieldWarning(input, 'Only letters, spaces, and hyphens allowed');
            }
        }

        // Email field
        if (input.type === 'email' && value.length > 0) {
            if (!this.validationRules.email.test(value)) {
                this.showFieldWarning(input, 'Invalid email format');
            }
        }

        // Username field
        if (fieldName === 'username' && value.length > 0) {
            if (!this.validationRules.username.test(value)) {
                this.showFieldWarning(input, 'Username can only contain letters, numbers, and underscores');
            }
        }
    }

    checkPastedContent(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedData = clipboardData?.getData('text');
        
        if (pastedData && pastedData.length > 1000) {
            this.logSecurityEvent('LARGE_PASTE', { 
                field: event.target.name || event.target.id,
                length: pastedData.length 
            });
        }

        // Check for suspicious patterns in pasted content
        if (pastedData) {
            const suspiciousPatterns = [
                /data:text\/html/i,
                /javascript:/i,
                /<script/i,
                /base64/i
            ];

            suspiciousPatterns.forEach(pattern => {
                if (pattern.test(pastedData)) {
                    this.logSecurityEvent('SUSPICIOUS_PASTE', {
                        field: event.target.name || event.target.id,
                        pattern: pattern.source
                    });
                }
            });
        }
    }

    // Implement rate limiting
    implementRateLimiting() {
        this.actionCounts = new Map();
        this.rateLimits = {
            formSubmit: { max: 3, window: 60000 }, // 3 attempts per minute
            fieldChange: { max: 100, window: 60000 }, // 100 changes per minute
            apiCall: { max: 10, window: 60000 } // 10 API calls per minute
        };

        // Track form submissions
        document.addEventListener('submit', (event) => {
            if (!this.checkRateLimit('formSubmit')) {
                event.preventDefault();
                this.showSecurityWarning('Too many submission attempts. Please wait.');
                this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { action: 'formSubmit' });
            }
        });

        // Track field changes
        document.addEventListener('input', () => {
            if (!this.checkRateLimit('fieldChange')) {
                this.showSecurityWarning('Too many changes detected. Please slow down.');
            }
        });
    }

    checkRateLimit(action) {
        const now = Date.now();
        const limit = this.rateLimits[action];
        if (!limit) return true;

        const key = `${action}_${Math.floor(now / limit.window)}`;
        const count = this.actionCounts.get(key) || 0;

        if (count >= limit.max) {
            return false;
        }

        this.actionCounts.set(key, count + 1);

        // Clean up old entries
        for (const [k, ] of this.actionCounts) {
            if (!k.startsWith(action) || parseInt(k.split('_')[1]) < Math.floor(now / limit.window) - 1) {
                this.actionCounts.delete(k);
            }
        }

        return true;
    }

    // Setup form protection
    setupFormProtection() {
        // Prevent form tampering
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Create a hash of the original form structure
            const originalFormHash = this.hashFormStructure(form);
            
            form.addEventListener('submit', (event) => {
                const currentFormHash = this.hashFormStructure(form);
                if (currentFormHash !== originalFormHash) {
                    event.preventDefault();
                    this.logSecurityEvent('FORM_TAMPERING', { form: form.id });
                    this.showSecurityWarning('Form structure has been modified. Please refresh the page.');
                }
            });
        });

        // Add CSRF token to forms
        this.addCSRFToken();
    }

    hashFormStructure(form) {
        const elements = Array.from(form.elements);
        const structure = elements.map(el => ({
            name: el.name,
            type: el.type,
            id: el.id,
            tagName: el.tagName
        }));
        return JSON.stringify(structure);
    }

    addCSRFToken() {
        const token = this.generateCSRFToken();
        sessionStorage.setItem('csrfToken', token);

        document.querySelectorAll('form').forEach(form => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrfToken';
            input.value = token;
            form.appendChild(input);
        });
    }

    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Monitor suspicious behavior
    monitorSuspiciousBehavior() {
        let suspiciousScore = 0;
        const threshold = 10;

        // Monitor rapid typing (bot detection)
        let lastKeyTime = Date.now();
        let rapidKeyCount = 0;

        document.addEventListener('keydown', () => {
            const currentTime = Date.now();
            if (currentTime - lastKeyTime < 50) { // Less than 50ms between keys
                rapidKeyCount++;
                if (rapidKeyCount > 10) {
                    suspiciousScore += 2;
                    this.logSecurityEvent('RAPID_TYPING', { count: rapidKeyCount });
                }
            } else {
                rapidKeyCount = 0;
            }
            lastKeyTime = currentTime;
        });

        // Monitor copy attempts on sensitive fields
        document.addEventListener('copy', (event) => {
            const target = event.target;
            if (target.type === 'password' || target.name === 'ssn' || target.name === 'creditCard') {
                event.preventDefault();
                suspiciousScore++;
                this.logSecurityEvent('SENSITIVE_COPY_ATTEMPT', { field: target.name });
                this.showSecurityWarning('Copying sensitive information is not allowed');
            }
        });

        // Monitor developer tools
        this.detectDevTools();

        // Check suspicious score periodically
        setInterval(() => {
            if (suspiciousScore >= threshold) {
                this.handleSuspiciousActivity(suspiciousScore);
                suspiciousScore = Math.floor(suspiciousScore / 2); // Reduce but don't reset
            }
        }, 5000);
    }

    detectDevTools() {
        const devtools = { open: false };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_OPENED', {});
                    console.warn('Developer tools detected');
                }
            } else {
                devtools.open = false;
            }
        }, 500);

        // Detect console.log override
        const original = console.log;
        console.log = function() {
            original.apply(console, arguments);
            if (arguments[0]?.includes?.('%c')) {
                this.logSecurityEvent('CONSOLE_STYLING', {});
            }
        }.bind(this);
    }

    handleSuspiciousActivity(score) {
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', { score });
        
        // Add captcha or additional verification
        if (!document.getElementById('captcha-container')) {
            const captcha = document.createElement('div');
            captcha.id = 'captcha-container';
            captcha.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                          background: white; padding: 20px; border-radius: 10px;
                          box-shadow: 0 0 30px rgba(0,0,0,0.3); z-index: 10000;">
                    <h3>Security Verification Required</h3>
                    <p>Please complete this verification:</p>
                    <p>What is ${Math.floor(Math.random() * 10) + 1} + ${Math.floor(Math.random() * 10) + 1}?</p>
                    <input type="number" id="captcha-answer" />
                    <button onclick="this.parentElement.parentElement.remove()">Submit</button>
                </div>
            `;
            document.body.appendChild(captcha);
        }
    }

    // Setup data encryption for sensitive fields
    setupDataEncryption() {
        // Encrypt sensitive data before sending
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            if (options?.body && typeof options.body === 'string') {
                try {
                    const data = JSON.parse(options.body);
                    
                    // Encrypt sensitive fields
                    const sensitiveFields = ['password', 'ssn', 'creditCard', 'cvv'];
                    sensitiveFields.forEach(field => {
                        if (data[field]) {
                            data[field] = this.encryptData(data[field]);
                        }
                    });

                    options.body = JSON.stringify(data);
                } catch (e) {
                    // Not JSON, leave as is
                }
            }

            return originalFetch.call(window, url, options);
        };
    }

    encryptData(data) {
        // Simple obfuscation (in production, use proper encryption)
        return btoa(encodeURIComponent(data));
    }

    // Security event logging
    logSecurityEvent(eventType, details) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        };

        console.warn('Security Event:', event);

        // Send to server
        fetch('/api/security/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        }).catch(err => {
            console.error('Failed to log security event:', err);
        });

        // Store locally
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(event);
        if (logs.length > 100) logs.shift();
        localStorage.setItem('securityLogs', JSON.stringify(logs));
    }

    // UI notifications
    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f59e0b;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
        `;
        warning.textContent = message;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transition = 'opacity 0.3s';
            setTimeout(() => warning.remove(), 300);
        }, 4000);
    }

    showFieldWarning(field, message) {
        const formGroup = field.closest('.form-group');
        if (formGroup && !formGroup.querySelector('.security-warning')) {
            const warning = document.createElement('span');
            warning.className = 'security-warning field-warning';
            warning.style.cssText = 'color: #f59e0b; font-size: 0.85rem; margin-top: 5px; display: block;';
            warning.textContent = message;
            formGroup.appendChild(warning);
            
            setTimeout(() => warning.remove(), 3000);
        }
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const registerSecurity = new RegisterSecurity();
    console.log('Registration security measures initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegisterSecurity;
}
