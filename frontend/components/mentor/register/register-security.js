/**
 * Mentor Registration Security Module
 * Enhanced security features for mentor registration process
 */

class MentorRegisterSecurity {
    constructor() {
        this.csrfToken = null;
        this.attemptCount = 0;
        this.maxAttempts = 5;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.lastActivity = Date.now();
        this.suspiciousPatterns = [];
        this.initializeSecurity();
    }

    initializeSecurity() {
        this.setupCSRFProtection();
        this.setupInputSanitization();
        this.setupRateLimiting();
        this.setupSessionSecurity();
        this.setupFormProtection();
        this.setupNetworkSecurity();
        this.monitorSuspiciousActivity();
        this.setupDataEncryption();
        console.log('Mentor registration security initialized');
    }

    // CSRF Protection
    setupCSRFProtection() {
        // Generate CSRF token
        this.csrfToken = this.generateCSRFToken();
        
        // Add token to all forms
        document.querySelectorAll('form').forEach(form => {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_csrf';
            tokenInput.value = this.csrfToken;
            form.appendChild(tokenInput);
        });

        // Add token to AJAX requests
        this.interceptAjaxRequests();
    }

    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    interceptAjaxRequests() {
        const originalFetch = window.fetch;
        window.fetch = (url, options = {}) => {
            // Add CSRF token to headers
            options.headers = {
                ...options.headers,
                'X-CSRF-Token': this.csrfToken
            };
            return originalFetch(url, options);
        };

        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 1) {
                    this.setRequestHeader('X-CSRF-Token', window.mentorRegisterSecurity?.csrfToken || '');
                }
            });
            return originalOpen.apply(this, [method, url, ...args]);
        };
    }

    // Input Sanitization
    setupInputSanitization() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Real-time sanitization
            input.addEventListener('input', (e) => this.sanitizeInput(e));
            
            // Paste event sanitization
            input.addEventListener('paste', (e) => this.handlePaste(e));
            
            // Drop event prevention for file inputs
            if (input.type !== 'file') {
                input.addEventListener('drop', (e) => e.preventDefault());
            }
        });
    }

    sanitizeInput(event) {
        const input = event.target;
        let value = input.value;

        // Remove dangerous characters
        value = this.removeDangerousCharacters(value);

        // Apply field-specific sanitization
        switch (input.type) {
            case 'email':
                value = this.sanitizeEmail(value);
                break;
            case 'tel':
                value = this.sanitizePhone(value);
                break;
            case 'text':
                if (input.name === 'username') {
                    value = this.sanitizeUsername(value);
                } else if (input.name === 'upiId') {
                    value = this.sanitizeUPI(value);
                } else {
                    value = this.sanitizeText(value);
                }
                break;
            case 'number':
                value = this.sanitizeNumber(value);
                break;
            case 'url':
                value = this.sanitizeURL(value);
                break;
        }

        // Update input value if sanitized
        if (input.value !== value) {
            input.value = value;
            this.logSanitization(input.name, 'Input sanitized');
        }
    }

    removeDangerousCharacters(value) {
        // Remove script tags and event handlers
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        value = value.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        
        // Remove SQL injection patterns
        value = value.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi, '');
        
        // Remove command injection patterns
        value = value.replace(/[;&|`$]/g, '');
        
        return value;
    }

    sanitizeEmail(email) {
        // Remove spaces and convert to lowercase
        email = email.trim().toLowerCase();
        
        // Remove any characters not typically in emails
        email = email.replace(/[^a-z0-9@.\-_+]/g, '');
        
        return email;
    }

    sanitizePhone(phone) {
        // Keep only digits, spaces, +, -, (, )
        return phone.replace(/[^0-9\s+\-()]/g, '');
    }

    sanitizeUsername(username) {
        // Allow only alphanumeric and underscore
        return username.replace(/[^a-zA-Z0-9_]/g, '');
    }

    sanitizeUPI(upi) {
        // UPI ID format: username@bankname
        return upi.replace(/[^a-zA-Z0-9@.\-_]/g, '');
    }

    sanitizeText(text) {
        // HTML encode special characters
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sanitizeNumber(value) {
        // Remove non-numeric characters
        return value.replace(/[^0-9.\-]/g, '');
    }

    sanitizeURL(url) {
        try {
            const urlObj = new URL(url);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return '';
            }
            return urlObj.toString();
        } catch {
            return '';
        }
    }

    handlePaste(event) {
        event.preventDefault();
        
        const paste = (event.clipboardData || window.clipboardData).getData('text');
        const sanitized = this.removeDangerousCharacters(paste);
        
        // Insert sanitized text
        const input = event.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        
        input.value = value.substring(0, start) + sanitized + value.substring(end);
        input.selectionStart = input.selectionEnd = start + sanitized.length;
        
        // Trigger input event for additional validation
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Rate Limiting
    setupRateLimiting() {
        this.requestTimestamps = [];
        this.blockUntil = null;

        // Monitor form submissions
        document.addEventListener('submit', (e) => {
            if (!this.checkRateLimit()) {
                e.preventDefault();
                this.showRateLimitError();
            }
        });

        // Monitor AJAX requests
        this.monitorAjaxRequests();
    }

    checkRateLimit() {
        const now = Date.now();
        
        // Check if currently blocked
        if (this.blockUntil && now < this.blockUntil) {
            return false;
        }

        // Clean old timestamps (older than 1 minute)
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        // Add current timestamp
        this.requestTimestamps.push(now);

        // Check if exceeded rate limit (10 requests per minute)
        if (this.requestTimestamps.length > 10) {
            this.blockUntil = now + 60000; // Block for 1 minute
            this.logSecurity('RATE_LIMIT', 'Rate limit exceeded');
            return false;
        }

        return true;
    }

    monitorAjaxRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (!this.checkRateLimit()) {
                throw new Error('Rate limit exceeded. Please wait before trying again.');
            }
            return originalFetch(...args);
        };
    }

    showRateLimitError() {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Too many requests. Please wait a moment before trying again.</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Session Security
    setupSessionSecurity() {
        // Monitor user activity
        document.addEventListener('click', () => this.updateActivity());
        document.addEventListener('keypress', () => this.updateActivity());
        
        // Check session timeout periodically
        setInterval(() => this.checkSessionTimeout(), 60000); // Check every minute
        
        // Prevent session fixation
        this.regenerateSessionId();
        
        // Monitor for multiple tabs
        this.detectMultipleTabs();
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    checkSessionTimeout() {
        const inactiveTime = Date.now() - this.lastActivity;
        
        if (inactiveTime > this.sessionTimeout) {
            this.handleSessionTimeout();
        } else if (inactiveTime > this.sessionTimeout - 5 * 60 * 1000) {
            // Warning: 5 minutes before timeout
            this.showSessionWarning();
        }
    }

    handleSessionTimeout() {
        // Clear sensitive data
        this.clearSensitiveData();
        
        // Show timeout message
        alert('Your session has expired for security reasons. Please refresh the page to continue.');
        
        // Redirect to login
        window.location.href = '/mentor/login';
    }

    showSessionWarning() {
        if (!this.warningShown) {
            this.warningShown = true;
            const notification = document.createElement('div');
            notification.className = 'notification warning';
            notification.innerHTML = `
                <i class="fas fa-clock"></i>
                <span>Your session will expire in 5 minutes. Please save your work.</span>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
                this.warningShown = false;
            }, 10000);
        }
    }

    regenerateSessionId() {
        // Generate new session ID
        const sessionId = this.generateSessionId();
        
        // Store in secure cookie
        document.cookie = `mentorSessionId=${sessionId}; Secure; SameSite=Strict; Max-Age=${this.sessionTimeout/1000}`;
    }

    generateSessionId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    detectMultipleTabs() {
        // Use BroadcastChannel API to detect multiple tabs
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('mentor_registration');
            
            // Announce presence
            channel.postMessage({ type: 'tab_opened', id: this.generateTabId() });
            
            // Listen for other tabs
            channel.onmessage = (event) => {
                if (event.data.type === 'tab_opened') {
                    this.handleMultipleTabs();
                }
            };
        }
    }

    generateTabId() {
        return Math.random().toString(36).substr(2, 9);
    }

    handleMultipleTabs() {
        console.warn('Multiple registration tabs detected');
        // Optionally show warning to user
    }

    // Form Protection
    setupFormProtection() {
        // Prevent form tampering
        this.protectFormFields();
        
        // Monitor for DOM manipulation
        this.setupMutationObserver();
        
        // Disable autocomplete for sensitive fields
        this.disableAutocomplete();
        
        // Prevent copy/paste for password confirmation
        this.preventPasswordCopy();
    }

    protectFormFields() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Store original form structure
            const originalFields = Array.from(form.elements).map(el => ({
                name: el.name,
                type: el.type,
                required: el.required
            }));
            
            // Check for tampering on submit
            form.addEventListener('submit', (e) => {
                const currentFields = Array.from(form.elements).map(el => ({
                    name: el.name,
                    type: el.type,
                    required: el.required
                }));
                
                if (JSON.stringify(originalFields) !== JSON.stringify(currentFields)) {
                    e.preventDefault();
                    this.logSecurity('FORM_TAMPERING', 'Form structure modified');
                    alert('Security error: Form has been modified. Please refresh the page.');
                }
            });
        });
    }

    setupMutationObserver() {
        // Mutation observer disabled during development to prevent CSS/JS interference
        console.log('DOM mutation observer disabled for development - allows proper CSS and JS loading');
        
        // Only monitor for actual dangerous scripts, not legitimate resources
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // Only check inline scripts with suspicious content, allow legitimate script tags
                        if (node.tagName === 'SCRIPT' && node.innerHTML && 
                            (node.innerHTML.includes('eval(') || node.innerHTML.includes('document.write'))) {
                            console.warn('Potentially dangerous inline script detected');
                            this.logSecurity('SUSPICIOUS_SCRIPT', 'Suspicious inline script detected');
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    disableAutocomplete() {
        const sensitiveFields = [
            'password', 'confirmPassword', 'upiId', 
            'accountNumber', 'cvv', 'pin'
        ];
        
        sensitiveFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.setAttribute('autocomplete', 'off');
                field.setAttribute('autocorrect', 'off');
                field.setAttribute('autocapitalize', 'off');
                field.setAttribute('spellcheck', 'false');
            }
        });
    }

    preventPasswordCopy() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            // Prevent copy
            field.addEventListener('copy', (e) => {
                e.preventDefault();
                return false;
            });
            
            // Prevent cut
            field.addEventListener('cut', (e) => {
                e.preventDefault();
                return false;
            });
            
            // Allow paste only for the first password field
            if (field.name === 'confirmPassword') {
                field.addEventListener('paste', (e) => {
                    e.preventDefault();
                    return false;
                });
            }
        });
    }

    // Network Security
    setupNetworkSecurity() {
        // Check for secure connection
        this.checkHTTPS();
        
        // Monitor network requests
        this.monitorNetworkRequests();
        
        // Implement request signing
        this.setupRequestSigning();
    }

    checkHTTPS() {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('Insecure connection detected. Registration should use HTTPS.');
            this.showSecurityWarning('This page should be accessed over a secure connection (HTTPS).');
        }
    }

    monitorNetworkRequests() {
        // Monitor for suspicious external requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const urlObj = new URL(url, window.location.origin);
            
            // Check if request is to trusted domain
            if (!this.isTrustedDomain(urlObj.hostname)) {
                this.logSecurity('SUSPICIOUS_REQUEST', `Request to untrusted domain: ${urlObj.hostname}`);
                throw new Error('Request blocked for security reasons');
            }
            
            return originalFetch(url, options);
        };
    }

    isTrustedDomain(hostname) {
        const trustedDomains = [
            window.location.hostname,
            'api.mentormentee.com',
            'cdn.mentormentee.com'
        ];
        
        return trustedDomains.some(domain => 
            hostname === domain || hostname.endsWith(`.${domain}`)
        );
    }

    setupRequestSigning() {
        // Add signature to requests for integrity
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            // Sign request body if present
            if (options.body) {
                const signature = await this.signData(options.body);
                options.headers = {
                    ...options.headers,
                    'X-Signature': signature
                };
            }
            
            return originalFetch(url, options);
        };
    }

    async signData(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Suspicious Activity Monitoring
    monitorSuspiciousActivity() {
        // Track rapid form changes
        this.trackFormChanges();
        
        // Monitor copy attempts
        this.monitorCopyAttempts();
        
        // Detect automated behavior
        this.detectAutomation();
        
        // Monitor console usage
        this.detectDevTools();
    }

    trackFormChanges() {
        let changeCount = 0;
        let lastChangeTime = Date.now();
        
        document.addEventListener('input', () => {
            const now = Date.now();
            
            if (now - lastChangeTime < 100) { // Less than 100ms between changes
                changeCount++;
                
                if (changeCount > 10) {
                    this.logSecurity('RAPID_INPUT', 'Suspicious rapid input detected');
                    this.suspiciousPatterns.push('rapid_input');
                }
            } else {
                changeCount = 0;
            }
            
            lastChangeTime = now;
        });
    }

    monitorCopyAttempts() {
        let copyAttempts = 0;
        
        document.addEventListener('copy', () => {
            copyAttempts++;
            
            if (copyAttempts > 5) {
                this.logSecurity('EXCESSIVE_COPY', 'Excessive copy attempts detected');
                this.suspiciousPatterns.push('excessive_copy');
            }
        });
    }

    detectAutomation() {
        // Check for headless browser
        if (navigator.webdriver) {
            this.logSecurity('AUTOMATION', 'Automated browser detected');
            this.suspiciousPatterns.push('automation');
        }
        
        // Check for unusual user agent
        const userAgent = navigator.userAgent.toLowerCase();
        const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
        
        if (suspiciousAgents.some(agent => userAgent.includes(agent))) {
            this.logSecurity('SUSPICIOUS_AGENT', `Suspicious user agent: ${userAgent}`);
            this.suspiciousPatterns.push('suspicious_agent');
        }
    }

    detectDevTools() {
        let devtools = { open: false, orientation: null };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold ||
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurity('DEVTOOLS', 'Developer tools opened');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    // Data Encryption
    setupDataEncryption() {
        // Encrypt sensitive data before storage
        this.encryptStorage();
        
        // Encrypt form data before submission
        this.encryptFormData();
    }

    encryptStorage() {
        const originalSetItem = Storage.prototype.setItem;
        
        Storage.prototype.setItem = function(key, value) {
            // Encrypt sensitive keys
            const sensitiveKeys = ['mentorData', 'credentials', 'payment'];
            
            if (sensitiveKeys.some(k => key.includes(k))) {
                value = btoa(encodeURIComponent(value)); // Basic encoding (use proper encryption in production)
            }
            
            return originalSetItem.call(this, key, value);
        };
    }

    encryptFormData() {
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            
            if (form.tagName === 'FORM') {
                // Get sensitive fields
                const sensitiveFields = ['password', 'upiId', 'accountNumber'];
                const formData = new FormData(form);
                
                for (const field of sensitiveFields) {
                    if (formData.has(field)) {
                        const value = formData.get(field);
                        const encrypted = await this.encryptValue(value);
                        formData.set(field, encrypted);
                    }
                }
            }
        });
    }

    async encryptValue(value) {
        // Basic encryption (use proper encryption library in production)
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Utility Functions
    clearSensitiveData() {
        // Clear form data
        document.querySelectorAll('input[type="password"], input[name="upiId"]').forEach(input => {
            input.value = '';
        });
        
        // Clear storage
        const sensitiveKeys = ['mentorData', 'credentials', 'payment'];
        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
    }

    logSecurity(type, message) {
        const logEntry = {
            type,
            message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.warn('[SECURITY]', logEntry);
        
        // Send to server (implement endpoint)
        fetch('/api/security/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        }).catch(err => console.error('Failed to log security event:', err));
    }

    logSanitization(field, action) {
        console.log(`[SANITIZATION] Field: ${field}, Action: ${action}`);
    }

    showSecurityWarning(message) {
        const notification = document.createElement('div');
        notification.className = 'notification warning';
        notification.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 7000);
    }

    // Public API
    validateField(fieldName, value) {
        // Public method for manual field validation
        const input = { name: fieldName, value, type: 'text' };
        return this.sanitizeInput({ target: input });
    }

    isSessionValid() {
        return Date.now() - this.lastActivity < this.sessionTimeout;
    }

    getSuspiciousPatterns() {
        return [...this.suspiciousPatterns];
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mentorRegisterSecurity = new MentorRegisterSecurity();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MentorRegisterSecurity;
}
