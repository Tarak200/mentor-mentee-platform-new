// Authentication Component Security Module

class AuthSecurity {
    constructor() {
        this.initializeSecurityMeasures();
        this.setupContentSecurityPolicy();
        this.initializeRateLimiting();
        this.setupSecurityHeaders();
        this.initializeSecurityValidation();
        this.setupSecurityEventListeners();
        this.initializeSessionSecurity();
    }

    initializeSecurityMeasures() {
        // Prevent common XSS attacks
        this.sanitizeInputs();
        
        // Prevent CSRF attacks
        this.initializeCSRFProtection();
        
        // Prevent clickjacking
        this.preventClickjacking();
        
        // Initialize secure communication
        this.initializeSecureComm();
        
        // Setup input validation
        this.initializeInputValidation();
        
        // Initialize brute force protection
        this.initializeBruteForceProtection();
    }

    setupContentSecurityPolicy() {
        // CSP disabled during development to prevent resource blocking
        // Enable in production with proper configuration
        console.log('CSP setup disabled for development');
    }

    initializeRateLimiting() {
        this.rateLimitData = {
            login: { attempts: 0, lastAttempt: null, blocked: false },
            register: { attempts: 0, lastAttempt: null, blocked: false },
            passwordReset: { attempts: 0, lastAttempt: null, blocked: false }
        };

        this.rateLimits = {
            login: { maxAttempts: 5, timeWindow: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
            register: { maxAttempts: 3, timeWindow: 30 * 60 * 1000 }, // 3 attempts per 30 minutes
            passwordReset: { maxAttempts: 3, timeWindow: 60 * 60 * 1000 } // 3 attempts per hour
        };

        // Load existing rate limit data from storage
        this.loadRateLimitData();
    }

    setupSecurityHeaders() {
        // Simulate security headers (normally done server-side)
        this.securityHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }

    initializeSecurityValidation() {
        // Set up validation patterns
        this.validationPatterns = {
            email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            name: /^[a-zA-Z\s'-]{2,50}$/,
            phone: /^\+?[1-9]\d{1,14}$/
        };

        // Dangerous patterns to block
        this.dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload/gi,
            /onerror/gi,
            /onclick/gi,
            /onmouseover/gi,
            /onfocus/gi,
            /onblur/gi,
            /onchange/gi,
            /onsubmit/gi
        ];
    }

    setupSecurityEventListeners() {
        // Monitor for suspicious activities
        document.addEventListener('input', (e) => {
            this.validateInputSecurity(e.target);
        });

        // Monitor for paste events (potential XSS)
        document.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.validateInputSecurity(e.target);
            }, 0);
        });

        // Monitor for developer tools
        this.setupDevToolsDetection();

        // Monitor for automated scripts
        this.setupBotDetection();

        // Monitor for suspicious navigation
        this.setupNavigationMonitoring();
    }

    initializeSessionSecurity() {
        // Generate session identifier
        this.sessionId = this.generateSecureId();
        
        // Initialize session timeout
        this.setupSessionTimeout();
        
        // Setup secure storage
        this.setupSecureStorage();
        
        // Initialize concurrent session detection
        this.setupConcurrentSessionDetection();
    }

    sanitizeInputs() {
        // Input sanitization completely disabled during development
        // Prevents CSS and resource loading interference
        console.log('Input sanitization disabled for development - CSS and resources unrestricted');
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        
        // Remove dangerous patterns
        let sanitized = str;
        this.dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // HTML encode dangerous characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        return sanitized;
    }

    initializeCSRFProtection() {
        // Generate CSRF token
        this.csrfToken = this.generateSecureToken();
        
        // Add CSRF token to forms
        this.addCSRFTokenToForms();
        
        // Validate CSRF token on submissions
        this.setupCSRFValidation();
    }

    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    generateSecureId() {
        return this.generateSecureToken();
    }

    addCSRFTokenToForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfToken';
            csrfInput.value = this.csrfToken;
            form.appendChild(csrfInput);
        });
    }

    setupCSRFValidation() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const csrfInput = form.querySelector('input[name="csrfToken"]');
            
            if (!csrfInput || csrfInput.value !== this.csrfToken) {
                e.preventDefault();
                this.logSecurityEvent('CSRF_TOKEN_INVALID', {
                    form: form.id,
                    providedToken: csrfInput ? csrfInput.value : 'none'
                });
                this.showSecurityWarning('Security validation failed. Please refresh the page.');
                return false;
            }
        });
    }

    preventClickjacking() {
        // Check if page is being framed
        if (window.top !== window.self) {
            this.logSecurityEvent('CLICKJACKING_ATTEMPT', {
                referrer: document.referrer,
                location: window.location.href
            });
            
            // Break out of frame
            window.top.location = window.location;
            return;
        }

        // Ensure content is always visible for legitimate requests
        document.documentElement.style.display = 'block';
        document.body.style.display = 'block';
    }

    initializeSecureComm() {
        // Ensure HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            this.logSecurityEvent('INSECURE_PROTOCOL', {
                protocol: location.protocol,
                href: location.href
            });
            location.href = location.href.replace('http:', 'https:');
        }

        // Setup secure fetch wrapper
        this.setupSecureFetch();
    }

    setupSecureFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            // Add security headers
            options.headers = {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'X-Session-ID': this.sessionId,
                'X-CSRF-Token': this.csrfToken
            };

            // Validate URL
            if (!this.isValidRequestUrl(url)) {
                this.logSecurityEvent('INVALID_REQUEST_URL', { url });
                throw new Error('Invalid request URL');
            }

            try {
                const response = await originalFetch(url, options);
                
                // Log failed requests
                if (!response.ok) {
                    this.logSecurityEvent('HTTP_ERROR', {
                        url,
                        status: response.status,
                        statusText: response.statusText
                    });
                }

                return response;
            } catch (error) {
                this.logSecurityEvent('NETWORK_ERROR', {
                    url,
                    error: error.message
                });
                throw error;
            }
        };
    }

    isValidRequestUrl(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            
            // Only allow same origin or whitelisted domains
            const allowedDomains = [
                window.location.hostname,
                'accounts.google.com',
                'api.example.com'
            ];
            
            return allowedDomains.includes(urlObj.hostname);
        } catch {
            return false;
        }
    }

    initializeInputValidation() {
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.matches('input[type="email"], input[type="password"], input[type="text"]')) {
                this.validateInputSecurity(input);
            }
        });
    }

    validateInputSecurity(input) {
        const value = input.value;
        
        // Check for XSS patterns
        if (this.containsXSSPattern(value)) {
            this.logSecurityEvent('XSS_PATTERN_DETECTED', {
                field: input.name,
                value: value.substring(0, 100) + '...'
            });
            
            input.value = this.sanitizeString(value);
            this.showSecurityWarning('Potentially malicious input detected and blocked.');
            return false;
        }

        // Check for SQL injection patterns
        if (this.containsSQLInjection(value)) {
            this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
                field: input.name,
                value: value.substring(0, 100) + '...'
            });
            
            input.value = this.sanitizeString(value);
            this.showSecurityWarning('Potentially malicious input detected and blocked.');
            return false;
        }

        return true;
    }

    containsXSSPattern(value) {
        return this.dangerousPatterns.some(pattern => pattern.test(value));
    }

    containsSQLInjection(value) {
        const sqlPatterns = [
            /('|(\\')|(;)|(\-\-)|(\/\*)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter))/gi,
            /(exec)|(execute)|(script)|(declare)|(cast)|(convert)/gi
        ];
        
        return sqlPatterns.some(pattern => pattern.test(value));
    }

    initializeBruteForceProtection() {
        // Load existing attempt data
        this.loadBruteForceData();
        
        // Monitor form submissions
        document.addEventListener('submit', (e) => {
            const formType = this.getFormType(e.target);
            if (formType && this.isRateLimited(formType)) {
                e.preventDefault();
                this.showRateLimitWarning(formType);
                return false;
            }
        });
    }

    checkRateLimit(action) {
        const limit = this.rateLimits[action];
        const data = this.rateLimitData[action];
        
        if (!limit || !data) return true;

        const now = Date.now();
        
        // Reset if time window has passed
        if (data.lastAttempt && (now - data.lastAttempt) > limit.timeWindow) {
            data.attempts = 0;
            data.blocked = false;
        }

        // Check if blocked
        if (data.attempts >= limit.maxAttempts) {
            data.blocked = true;
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                action,
                attempts: data.attempts,
                timeWindow: limit.timeWindow
            });
            return false;
        }

        // Record attempt
        data.attempts++;
        data.lastAttempt = now;
        this.saveRateLimitData();

        return true;
    }

    isRateLimited(action) {
        return !this.checkRateLimit(action);
    }

    getFormType(form) {
        if (form.id === 'loginForm') return 'login';
        if (form.id === 'registerForm') return 'register';
        if (form.id === 'resetPasswordForm') return 'passwordReset';
        return null;
    }

    setupDevToolsDetection() {
        let devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_OPENED', {
                        userAgent: navigator.userAgent,
                        timestamp: Date.now()
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    setupBotDetection() {
        // Check for common bot patterns
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless'];
        
        if (botPatterns.some(pattern => userAgent.includes(pattern))) {
            this.logSecurityEvent('BOT_DETECTED', {
                userAgent: navigator.userAgent
            });
        }

        // Mouse movement tracking
        let mouseMovements = 0;
        document.addEventListener('mousemove', () => {
            mouseMovements++;
        });

        // Check for human-like behavior after 10 seconds
        setTimeout(() => {
            if (mouseMovements === 0) {
                this.logSecurityEvent('SUSPICIOUS_BEHAVIOR', {
                    reason: 'No mouse movements detected',
                    userAgent: navigator.userAgent
                });
            }
        }, 10000);
    }

    setupNavigationMonitoring() {
        // Monitor for suspicious navigation patterns
        window.addEventListener('beforeunload', () => {
            this.logSecurityEvent('PAGE_UNLOAD', {
                duration: Date.now() - this.sessionStartTime,
                interactions: this.userInteractions
            });
        });

        // Track user interactions
        this.userInteractions = 0;
        ['click', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                this.userInteractions++;
            });
        });

        this.sessionStartTime = Date.now();
    }

    setupSessionTimeout() {
        const timeoutDuration = 30 * 60 * 1000; // 30 minutes
        let timeoutId;

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.handleSessionTimeout();
            }, timeoutDuration);
        };

        // Reset timeout on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimeout, { passive: true });
        });

        // Initial timeout
        resetTimeout();
    }

    handleSessionTimeout() {
        this.logSecurityEvent('SESSION_TIMEOUT', {
            sessionId: this.sessionId,
            duration: Date.now() - this.sessionStartTime
        });

        // Clear sensitive data
        this.clearSecureStorage();
        
        // Redirect to login
        window.location.href = '/login';
    }

    setupSecureStorage() {
        // Override localStorage/sessionStorage for sensitive data
        this.secureStorage = {
            setItem: (key, value) => {
                const encrypted = this.encryptData(JSON.stringify(value));
                localStorage.setItem(key, encrypted);
            },
            getItem: (key) => {
                const encrypted = localStorage.getItem(key);
                if (!encrypted) return null;
                
                try {
                    const decrypted = this.decryptData(encrypted);
                    return JSON.parse(decrypted);
                } catch {
                    localStorage.removeItem(key);
                    return null;
                }
            },
            removeItem: (key) => {
                localStorage.removeItem(key);
            }
        };
    }

    encryptData(data) {
        // Simple encryption (in production, use proper crypto)
        return btoa(encodeURIComponent(data));
    }

    decryptData(encryptedData) {
        // Simple decryption (in production, use proper crypto)
        return decodeURIComponent(atob(encryptedData));
    }

    setupConcurrentSessionDetection() {
        // Detect multiple sessions for same user
        const sessionKey = 'active_sessions';
        const currentSessions = this.secureStorage.getItem(sessionKey) || [];
        
        currentSessions.push({
            sessionId: this.sessionId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });

        // Keep only last 5 sessions
        if (currentSessions.length > 5) {
            currentSessions.splice(0, currentSessions.length - 5);
        }

        this.secureStorage.setItem(sessionKey, currentSessions);

        // Check for suspicious concurrent sessions
        if (currentSessions.length > 3) {
            this.logSecurityEvent('MULTIPLE_SESSIONS_DETECTED', {
                sessionCount: currentSessions.length,
                sessions: currentSessions
            });
        }
    }

    loadRateLimitData() {
        const stored = localStorage.getItem('auth_rate_limits');
        if (stored) {
            try {
                this.rateLimitData = JSON.parse(stored);
            } catch {
                localStorage.removeItem('auth_rate_limits');
            }
        }
    }

    saveRateLimitData() {
        localStorage.setItem('auth_rate_limits', JSON.stringify(this.rateLimitData));
    }

    loadBruteForceData() {
        const stored = localStorage.getItem('auth_brute_force');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.bruteForceAttempts = data.attempts || 0;
                this.lastBruteForceAttempt = data.lastAttempt;
            } catch {
                localStorage.removeItem('auth_brute_force');
            }
        }
    }

    clearSecureStorage() {
        ['token', 'user', 'userType', 'active_sessions'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    logSecurityEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            ...data
        };

        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.warn('Security Event:', event);
        }

        // Send to server (rate limited)
        this.sendSecurityLog(event);

        // Store locally for investigation
        this.storeSecurityEvent(event);
    }

    sendSecurityLog(event) {
        // Rate limit security logs
        if (!this.securityLogRateLimit) {
            this.securityLogRateLimit = { count: 0, lastReset: Date.now() };
        }

        const now = Date.now();
        if (now - this.securityLogRateLimit.lastReset > 60000) { // Reset every minute
            this.securityLogRateLimit.count = 0;
            this.securityLogRateLimit.lastReset = now;
        }

        if (this.securityLogRateLimit.count < 10) { // Max 10 logs per minute
            this.securityLogRateLimit.count++;
            
            // Send to security endpoint
            fetch('/api/security/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            }).catch(() => {
                // Silently fail - don't interfere with user experience
            });
        }
    }

    storeSecurityEvent(event) {
        const stored = JSON.parse(localStorage.getItem('security_events') || '[]');
        stored.push(event);
        
        // Keep only last 100 events
        if (stored.length > 100) {
            stored.splice(0, stored.length - 100);
        }
        
        localStorage.setItem('security_events', JSON.stringify(stored));
    }

    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            z-index: 10000;
            font-weight: 600;
            max-width: 350px;
        `;
        warning.textContent = message;

        document.body.appendChild(warning);

        setTimeout(() => {
            warning.style.opacity = '0';
            warning.style.transform = 'translateX(100%)';
            setTimeout(() => warning.remove(), 300);
        }, 5000);
    }

    showRateLimitWarning(action) {
        const limit = this.rateLimits[action];
        const minutes = Math.ceil(limit.timeWindow / 60000);
        
        this.showSecurityWarning(
            `Too many ${action} attempts. Please wait ${minutes} minutes before trying again.`
        );
    }

    // Public methods for integration
    validateForm(form) {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
        let valid = true;

        inputs.forEach(input => {
            if (!this.validateInputSecurity(input)) {
                valid = false;
            }
        });

        return valid;
    }

    isSecureEnvironment() {
        return location.protocol === 'https:' || location.hostname === 'localhost';
    }

    getSecurityHeaders() {
        return this.securityHeaders;
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authSecurity = new AuthSecurity();
});

// Global security check function
window.performSecurityCheck = () => {
    if (window.authSecurity) {
        const events = JSON.parse(localStorage.getItem('security_events') || '[]');
        console.log('Security Events:', events);
        return {
            secure: window.authSecurity.isSecureEnvironment(),
            events: events.length,
            session: window.authSecurity.sessionId
        };
    }
    return null;
};
