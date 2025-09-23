/**
 * Mentee Login Security Module
 * Implements security measures for authentication pages
 */

class LoginSecurity {
    constructor() {
        this.maxLoginAttempts = 5;
        this.loginAttempts = new Map();
        this.initializeSecurity();
    }

    initializeSecurity() {
        this.setupCSP();
        this.preventClickjacking();
        this.sanitizeInputs();
        this.setupBruteForceProtection();
        this.preventFormTampering();
        this.setupSessionSecurity();
        this.monitorSuspiciousActivity();
    }

    // Content Security Policy - Relaxed for development
    setupCSP() {
        // CSP disabled during development to prevent CSS and resource blocking
        // Enable in production with proper configuration
        console.log('CSP disabled for development to ensure proper CSS loading');
        
        // Only add basic security headers without blocking resources
        const securityHeaders = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
        ];
        
        securityHeaders.forEach(header => {
            if (!document.querySelector(`meta[http-equiv="${header.name}"]`)) {
                const meta = document.createElement('meta');
                meta.httpEquiv = header.name;
                meta.content = header.content;
                document.head.appendChild(meta);
            }
        });
    }

    // Prevent clickjacking
    preventClickjacking() {
        if (window.top !== window.self) {
            console.warn('Possible clickjacking attempt detected');
            window.top.location = window.self.location;
        }

        // Add X-Frame-Options
        const frameOptions = document.createElement('meta');
        frameOptions.httpEquiv = 'X-Frame-Options';
        frameOptions.content = 'DENY';
        document.head.appendChild(frameOptions);
    }

    // Sanitize all inputs
    sanitizeInputs() {
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.sanitizeInput(e.target);
            }
        });

        // Sanitize on paste
        document.addEventListener('paste', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(() => this.sanitizeInput(e.target), 0);
            }
        });
    }

    sanitizeInput(input) {
        const value = input.value;
        
        // Check for XSS patterns
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi
        ];

        let sanitized = value;
        xssPatterns.forEach(pattern => {
            if (pattern.test(sanitized)) {
                console.warn('Potential XSS attempt detected and blocked');
                sanitized = sanitized.replace(pattern, '');
                this.logSecurityEvent('XSS_ATTEMPT', { 
                    field: input.name || input.id,
                    pattern: pattern.source 
                });
            }
        });

        // Check for SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi,
            /(--|#|\/\*|\*\/)/g,
            /('|")\s*(OR|AND)\s*('|")?(\s*=\s*)?('|")?/gi
        ];

        sqlPatterns.forEach(pattern => {
            if (pattern.test(sanitized)) {
                console.warn('Potential SQL injection attempt detected');
                sanitized = sanitized.replace(pattern, '');
                this.logSecurityEvent('SQL_INJECTION_ATTEMPT', { 
                    field: input.name || input.id,
                    pattern: pattern.source 
                });
            }
        });

        if (sanitized !== value) {
            input.value = sanitized;
            this.showSecurityWarning('Invalid characters detected and removed');
        }
    }

    // Brute force protection
    setupBruteForceProtection() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.checkRateLimit(form.id)) {
                    e.preventDefault();
                    this.showSecurityWarning('Too many attempts. Please wait before trying again.');
                    this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { form: form.id });
                }
            });
        });
    }

    checkRateLimit(formId) {
        const now = Date.now();
        const attempts = this.loginAttempts.get(formId) || [];
        
        // Remove attempts older than 15 minutes
        const validAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
        
        if (validAttempts.length >= this.maxLoginAttempts) {
            const timeSinceLastAttempt = now - validAttempts[validAttempts.length - 1];
            const waitTime = 15 * 60 * 1000; // 15 minutes
            
            if (timeSinceLastAttempt < waitTime) {
                const remainingTime = Math.ceil((waitTime - timeSinceLastAttempt) / 1000 / 60);
                this.showSecurityWarning(`Too many attempts. Please wait ${remainingTime} minutes.`);
                return false;
            }
        }
        
        validAttempts.push(now);
        this.loginAttempts.set(formId, validAttempts);
        return true;
    }

    // Prevent form tampering
    preventFormTampering() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Store original form structure
            const originalFields = Array.from(form.elements).map(el => ({
                name: el.name,
                type: el.type,
                id: el.id
            }));

            // Check for tampering before submission (excluding password visibility toggles)
            form.addEventListener('submit', (e) => {
                const currentFields = Array.from(form.elements).map(el => {
                    // Ignore type changes for password fields (allow visibility toggle)
                    const originalType = originalFields.find(orig => orig.name === el.name && orig.id === el.id)?.type;
                    const allowedTypeChange = (originalType === 'password' && el.type === 'text') || 
                                            (originalType === 'text' && el.type === 'password') ||
                                            originalType === el.type;
                    
                    return {
                        name: el.name,
                        type: allowedTypeChange ? originalType : el.type, // Use original type for comparison if it's an allowed change
                        id: el.id
                    };
                });

                if (JSON.stringify(originalFields) !== JSON.stringify(currentFields)) {
                    e.preventDefault();
                    console.error('Form tampering detected');
                    this.logSecurityEvent('FORM_TAMPERING', { form: form.id });
                    this.showSecurityWarning('Security violation detected. Please refresh the page.');
                }
            });
        });

        // Prevent new fields from being added (but allow attribute changes)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT') {
                                // Only remove if it's not a password field modification
                                const isPasswordToggle = node.type === 'text' && 
                                    form.querySelector(`input[name="${node.name}"][type="password"], input[id="${node.id}"][type="password"]`);
                                
                                if (!isPasswordToggle) {
                                    console.warn('Unauthorized form field detected and removed');
                                    node.remove();
                                    this.logSecurityEvent('UNAUTHORIZED_FIELD', { element: node.tagName });
                                }
                            }
                        }
                    });
                }
                // Allow attribute modifications for password visibility toggles
                if (mutation.type === 'attributes' && mutation.attributeName === 'type') {
                    const target = mutation.target;
                    if (target.tagName === 'INPUT' && (target.type === 'password' || target.type === 'text')) {
                        // This is likely a password visibility toggle, allow it
                        return;
                    }
                }
            });
        });

        forms.forEach(form => {
            observer.observe(form, { 
                childList: true, 
                subtree: true, 
                attributes: true, 
                attributeFilter: ['type'] 
            });
        });
    }

    // Session security
    setupSessionSecurity() {
        // Clear sensitive data on page unload
        window.addEventListener('beforeunload', () => {
            // Clear any temporary sensitive data
            sessionStorage.clear();
        });

        // Session timeout (30 minutes of inactivity)
        let lastActivity = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes

        const checkSession = () => {
            if (Date.now() - lastActivity > sessionTimeout) {
                this.handleSessionTimeout();
            }
        };

        // Update last activity on user interaction
        ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            });
        });

        // Check session every minute
        setInterval(checkSession, 60000);

        // Detect multiple tabs
        this.detectMultipleTabs();
    }

    detectMultipleTabs() {
        const tabId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('currentTab', tabId);

        window.addEventListener('storage', (e) => {
            if (e.key === 'currentTab' && e.newValue !== tabId) {
                console.warn('Multiple tabs detected');
                this.showSecurityWarning('Multiple login tabs detected. Please use only one tab.');
            }
        });
    }

    handleSessionTimeout() {
        this.showSecurityWarning('Your session has expired. Please login again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        setTimeout(() => {
            window.location.href = '/login';
        }, 3000);
    }

    // Monitor suspicious activity
    monitorSuspiciousActivity() {
        let suspiciousScore = 0;
        const threshold = 5;

        // Monitor rapid form field changes
        let fieldChangeCount = 0;
        let fieldChangeTimer;

        document.addEventListener('input', () => {
            fieldChangeCount++;
            clearTimeout(fieldChangeTimer);
            
            fieldChangeTimer = setTimeout(() => {
                if (fieldChangeCount > 20) {
                    suspiciousScore++;
                    this.logSecurityEvent('RAPID_FIELD_CHANGES', { count: fieldChangeCount });
                }
                fieldChangeCount = 0;
            }, 1000);
        });

        // Monitor copy/paste in password fields
        document.addEventListener('paste', (e) => {
            if (e.target.type === 'password') {
                suspiciousScore++;
                this.logSecurityEvent('PASSWORD_PASTE', { field: e.target.name });
            }
        });

        // Monitor dev tools
        this.detectDevTools();

        // Take action if suspicious score exceeds threshold
        setInterval(() => {
            if (suspiciousScore >= threshold) {
                this.handleSuspiciousActivity();
                suspiciousScore = 0;
            }
        }, 5000);
    }

    detectDevTools() {
        let devtools = { open: false, orientation: null };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_OPENED', {});
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    handleSuspiciousActivity() {
        console.warn('Suspicious activity detected');
        this.showSecurityWarning('Unusual activity detected. Your actions are being monitored.');
        
        // Add additional verification
        const captchaContainer = document.createElement('div');
        captchaContainer.id = 'security-verification';
        captchaContainer.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 20px; border-radius: 10px; 
                        box-shadow: 0 0 20px rgba(0,0,0,0.3); z-index: 10000;">
                <h3>Security Verification Required</h3>
                <p>Please complete this verification to continue:</p>
                <p>What is ${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)}?</p>
                <input type="number" id="security-answer" />
                <button onclick="this.parentElement.parentElement.remove()">Submit</button>
            </div>
        `;
        document.body.appendChild(captchaContainer);
    }

    // Security logging
    logSecurityEvent(eventType, details) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.warn('Security Event:', event);

        // Send to server
        fetch('/api/security/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }).catch(err => {
            console.error('Failed to log security event:', err);
        });

        // Store locally for analysis
        const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        securityLogs.push(event);
        
        // Keep only last 50 events
        if (securityLogs.length > 50) {
            securityLogs.shift();
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(securityLogs));
    }

    // Show security warning
    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6b6b;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
        }, 5000);
    }

    // Password strength validation
    validatePasswordStrength(password) {
        const requirements = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const strength = Object.values(requirements).filter(Boolean).length;
        
        return {
            strength: strength,
            requirements: requirements,
            isStrong: strength >= 4
        };
    }

    // Secure password handling
    securePasswordField(passwordField) {
        // Disable autocomplete
        passwordField.setAttribute('autocomplete', 'off');
        
        // Prevent copy
        passwordField.addEventListener('copy', (e) => {
            e.preventDefault();
            this.showSecurityWarning('Copying password is not allowed');
        });
        
        // Clear clipboard after paste
        passwordField.addEventListener('paste', () => {
            setTimeout(() => {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText('');
                }
            }, 100);
        });
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginSecurity = new LoginSecurity();
    
    // Secure all password fields
    document.querySelectorAll('input[type="password"]').forEach(field => {
        loginSecurity.securePasswordField(field);
    });
    
    console.log('Login security measures initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginSecurity;
}
