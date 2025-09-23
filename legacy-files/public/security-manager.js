// ===== ADVANCED SECURITY MANAGER =====
// Comprehensive security measures for database protection and payment safety

class SecurityManager {
    constructor(options = {}) {
        this.options = {
            enableCSRF: true,
            enableRateLimit: true,
            enableInputValidation: true,
            enablePaymentEncryption: true,
            enableSessionSecurity: true,
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 60 * 60 * 1000, // 1 hour
            ...options
        };
        
        this.csrfToken = null;
        this.sessionId = null;
        this.loginAttempts = new Map();
        this.rateLimiters = new Map();
        this.encryptionKey = null;
        
        this.init();
    }
    
    init() {
        console.log('Security Manager initializing...');
        
        // Initialize CSRF protection
        if (this.options.enableCSRF) {
            this.initCSRFProtection();
        }
        
        // Initialize rate limiting
        if (this.options.enableRateLimit) {
            this.initRateLimit();
        }
        
        // Initialize input validation
        if (this.options.enableInputValidation) {
            this.initInputValidation();
        }
        
        // Initialize payment security
        if (this.options.enablePaymentEncryption) {
            this.initPaymentSecurity();
        }
        
        // Initialize session security
        if (this.options.enableSessionSecurity) {
            this.initSessionSecurity();
        }
        
        // Setup security event listeners
        this.setupSecurityListeners();
        
        console.log('Security Manager initialized successfully');
    }
    
    // ===== CSRF PROTECTION =====
    initCSRFProtection() {
        this.generateCSRFToken();
        this.injectCSRFTokens();
        this.setupCSRFValidation();
    }
    
    generateCSRFToken() {
        // Generate cryptographically secure random token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        // Store in secure httpOnly cookie (simulated)
        this.setSecureCookie('csrf_token', this.csrfToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
    }
    
    injectCSRFTokens() {
        // Add CSRF tokens to all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Check if CSRF token already exists
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                form.appendChild(csrfInput);
            }
            
            csrfInput.value = this.csrfToken;
        });
        
        // Add to AJAX headers
        this.setupAjaxCSRF();
    }
    
    setupAjaxCSRF() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = (url, options = {}) => {
            if (options.method && options.method.toUpperCase() !== 'GET') {
                options.headers = {
                    ...options.headers,
                    'X-CSRF-Token': this.csrfToken
                };
            }
            return originalFetch(url, options);
        };
        
        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            return originalOpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._method && this._method.toUpperCase() !== 'GET') {
                this.setRequestHeader('X-CSRF-Token', window.securityManager.csrfToken);
            }
            return originalSend.call(this, data);
        };
    }
    
    setupCSRFValidation() {
        // Validate CSRF token on form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const csrfInput = form.querySelector('input[name="csrf_token"]');
            
            if (!csrfInput || csrfInput.value !== this.csrfToken) {
                e.preventDefault();
                this.handleSecurityViolation('CSRF token validation failed', 'csrf');
                return false;
            }
        });
    }
    
    // ===== RATE LIMITING =====
    initRateLimit() {
        this.setupRateLimiters();
    }
    
    setupRateLimiters() {
        // Login rate limiter
        this.createRateLimiter('login', {
            maxRequests: 5,
            windowMs: 15 * 60 * 1000, // 15 minutes
            message: 'Too many login attempts. Please try again later.'
        });
        
        // Payment rate limiter
        this.createRateLimiter('payment', {
            maxRequests: 3,
            windowMs: 60 * 1000, // 1 minute
            message: 'Payment requests are being processed. Please wait.'
        });
        
        // API rate limiter
        this.createRateLimiter('api', {
            maxRequests: 100,
            windowMs: 15 * 60 * 1000, // 15 minutes
            message: 'API rate limit exceeded. Please slow down.'
        });
    }
    
    createRateLimiter(name, options) {
        this.rateLimiters.set(name, {
            requests: [],
            maxRequests: options.maxRequests,
            windowMs: options.windowMs,
            message: options.message
        });
    }
    
    checkRateLimit(limiterName, identifier = 'default') {
        const limiter = this.rateLimiters.get(limiterName);
        if (!limiter) return true;
        
        const now = Date.now();
        const key = `${limiterName}_${identifier}`;
        
        // Get or create request history for this identifier
        if (!limiter.requests[key]) {
            limiter.requests[key] = [];
        }
        
        const requests = limiter.requests[key];
        
        // Remove old requests outside the window
        while (requests.length > 0 && requests[0] < now - limiter.windowMs) {
            requests.shift();
        }
        
        // Check if limit exceeded
        if (requests.length >= limiter.maxRequests) {
            this.handleSecurityViolation(limiter.message, 'rate_limit');
            return false;
        }
        
        // Add current request
        requests.push(now);
        return true;
    }
    
    // ===== INPUT VALIDATION =====
    initInputValidation() {
        this.setupInputSanitization();
        this.setupXSSPrevention();
        this.setupSQLInjectionPrevention();
    }
    
    setupInputSanitization() {
        // Sanitize all form inputs
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.value = this.sanitizeInput(input.value, input.type || 'text');
            }
        });
        
        // Sanitize on form submission
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                if (input.type !== 'hidden' && input.name !== 'csrf_token') {
                    input.value = this.sanitizeInput(input.value, input.type || 'text');
                }\n            });\n        });\n    }\n    \n    sanitizeInput(value, type) {\n        if (typeof value !== 'string') return value;\n        \n        // Basic XSS prevention\n        value = value.replace(/<script[^>]*>.*?<\\/script>/gi, '');\n        value = value.replace(/<[^>]+>/g, ''); // Remove HTML tags\n        value = value.replace(/javascript:/gi, '');\n        value = value.replace(/on\\w+\\s*=/gi, ''); // Remove event handlers\n        \n        // Type-specific sanitization\n        switch (type) {\n            case 'email':\n                value = this.sanitizeEmail(value);\n                break;\n            case 'tel':\n                value = this.sanitizePhone(value);\n                break;\n            case 'url':\n                value = this.sanitizeURL(value);\n                break;\n            case 'number':\n                value = this.sanitizeNumber(value);\n                break;\n            default:\n                value = this.sanitizeText(value);\n        }\n        \n        return value;\n    }\n    \n    sanitizeEmail(email) {\n        // Remove potentially dangerous characters\n        return email.replace(/[<>\"'&]/g, '').trim();\n    }\n    \n    sanitizePhone(phone) {\n        // Keep only digits, spaces, hyphens, parentheses, and plus\n        return phone.replace(/[^0-9\\s\\-\\(\\)\\+]/g, '').trim();\n    }\n    \n    sanitizeURL(url) {\n        try {\n            const parsed = new URL(url);\n            // Only allow http and https protocols\n            if (!['http:', 'https:'].includes(parsed.protocol)) {\n                return '';\n            }\n            return parsed.toString();\n        } catch {\n            return '';\n        }\n    }\n    \n    sanitizeNumber(number) {\n        return number.replace(/[^0-9\\.\\-]/g, '');\n    }\n    \n    sanitizeText(text) {\n        // Encode special characters\n        return text\n            .replace(/&/g, '&amp;')\n            .replace(/</g, '&lt;')\n            .replace(/>/g, '&gt;')\n            .replace(/\"/g, '&quot;')\n            .replace(/'/g, '&#x27;')\n            .replace(/\\//g, '&#x2F;');\n    }\n    \n    setupXSSPrevention() {\n        // Content Security Policy (simulated)\n        this.setCSP();\n        \n        // DOM-based XSS prevention\n        this.preventDOMXSS();\n    }\n    \n    setCSP() {\n        // In a real application, this would be set via HTTP headers\n        const meta = document.createElement('meta');\n        meta.httpEquiv = 'Content-Security-Policy';\n        meta.content = \"default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com;\";\n        document.head.appendChild(meta);\n    }\n    \n    preventDOMXSS() {\n        // Override potentially dangerous DOM methods\n        const originalInnerHTML = Element.prototype.innerHTML;\n        \n        Object.defineProperty(Element.prototype, 'innerHTML', {\n            set: function(value) {\n                if (typeof value === 'string') {\n                    value = window.securityManager.sanitizeInput(value, 'text');\n                }\n                return originalInnerHTML.call(this, value);\n            },\n            get: function() {\n                return originalInnerHTML.call(this);\n            }\n        });\n    }\n    \n    setupSQLInjectionPrevention() {\n        // Monitor for potential SQL injection patterns in form data\n        document.addEventListener('submit', (e) => {\n            const form = e.target;\n            const formData = new FormData(form);\n            \n            for (let [key, value] of formData.entries()) {\n                if (typeof value === 'string' && this.detectSQLInjection(value)) {\n                    e.preventDefault();\n                    this.handleSecurityViolation('Potential SQL injection detected', 'sql_injection');\n                    return false;\n                }\n            }\n        });\n    }\n    \n    detectSQLInjection(input) {\n        const sqlPatterns = [\n            /('|(\\-\\-)|(;)|(\\|)|(\\*)|(%))/i,\n            /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,\n            /(script|javascript|vbscript)/i,\n            /(onload|onerror|onclick)/i\n        ];\n        \n        return sqlPatterns.some(pattern => pattern.test(input));\n    }\n    \n    // ===== PAYMENT SECURITY =====\n    initPaymentSecurity() {\n        this.setupPaymentEncryption();\n        this.setupPaymentValidation();\n        this.setupPCICompliance();\n    }\n    \n    setupPaymentEncryption() {\n        // Initialize client-side encryption for sensitive payment data\n        this.generateEncryptionKey();\n        this.setupPaymentFormSecurity();\n    }\n    \n    generateEncryptionKey() {\n        // Generate a key for client-side encryption (in production, use server-provided key)\n        const array = new Uint8Array(32);\n        crypto.getRandomValues(array);\n        this.encryptionKey = array;\n    }\n    \n    setupPaymentFormSecurity() {\n        // Secure payment forms\n        const paymentForms = document.querySelectorAll('form[data-payment=\"true\"]');\n        \n        paymentForms.forEach(form => {\n            // Add security attributes\n            form.setAttribute('autocomplete', 'off');\n            form.setAttribute('novalidate', true);\n            \n            // Secure payment inputs\n            const paymentInputs = form.querySelectorAll('input[data-payment-field]');\n            paymentInputs.forEach(input => {\n                this.securePaymentInput(input);\n            });\n            \n            // Handle form submission\n            form.addEventListener('submit', (e) => {\n                e.preventDefault();\n                this.handleSecurePayment(form);\n            });\n        });\n    }\n    \n    securePaymentInput(input) {\n        // Prevent autocomplete and disable copy/paste for sensitive fields\n        input.setAttribute('autocomplete', 'off');\n        input.setAttribute('data-secure', 'true');\n        \n        // Disable right-click context menu\n        input.addEventListener('contextmenu', (e) => {\n            e.preventDefault();\n        });\n        \n        // Mask input for card numbers\n        if (input.dataset.paymentField === 'card-number') {\n            input.addEventListener('input', (e) => {\n                this.formatCardNumber(e.target);\n            });\n        }\n        \n        // Auto-clear sensitive fields on page unload\n        window.addEventListener('beforeunload', () => {\n            if (input.dataset.paymentField) {\n                input.value = '';\n            }\n        });\n    }\n    \n    formatCardNumber(input) {\n        let value = input.value.replace(/\\D/g, '');\n        \n        // Detect card type and format accordingly\n        const cardType = this.detectCardType(value);\n        \n        // Format with spaces\n        if (cardType === 'amex') {\n            value = value.replace(/(\\d{4})(\\d{6})(\\d{5})/, '$1 $2 $3');\n        } else {\n            value = value.replace(/(\\d{4})(?=\\d)/g, '$1 ');\n        }\n        \n        input.value = value.substring(0, cardType === 'amex' ? 17 : 19);\n    }\n    \n    detectCardType(number) {\n        const patterns = {\n            visa: /^4/,\n            mastercard: /^5[1-5]/,\n            amex: /^3[47]/,\n            discover: /^6(?:011|5)/\n        };\n        \n        for (let [type, pattern] of Object.entries(patterns)) {\n            if (pattern.test(number)) return type;\n        }\n        \n        return 'unknown';\n    }\n    \n    async handleSecurePayment(form) {\n        try {\n            // Rate limiting check\n            if (!this.checkRateLimit('payment', this.getUserIdentifier())) {\n                return;\n            }\n            \n            // Validate payment form\n            if (!this.validatePaymentForm(form)) {\n                this.showSecurityAlert('Payment validation failed. Please check your information.');\n                return;\n            }\n            \n            // Encrypt sensitive payment data\n            const encryptedData = await this.encryptPaymentData(form);\n            \n            // Submit payment (simulated)\n            await this.submitSecurePayment(encryptedData);\n            \n            // Clear sensitive fields\n            this.clearPaymentForm(form);\n            \n            this.showSecurityAlert('Payment processed securely!', 'success');\n            \n        } catch (error) {\n            console.error('Payment processing error:', error);\n            this.handleSecurityViolation('Payment processing failed', 'payment_error');\n        }\n    }\n    \n    validatePaymentForm(form) {\n        const cardNumber = form.querySelector('[data-payment-field=\"card-number\"]')?.value || '';\n        const expiryDate = form.querySelector('[data-payment-field=\"expiry\"]')?.value || '';\n        const cvv = form.querySelector('[data-payment-field=\"cvv\"]')?.value || '';\n        \n        // Validate card number using Luhn algorithm\n        if (!this.validateCardNumber(cardNumber.replace(/\\D/g, ''))) {\n            this.showSecurityAlert('Invalid card number.');\n            return false;\n        }\n        \n        // Validate expiry date\n        if (!this.validateExpiryDate(expiryDate)) {\n            this.showSecurityAlert('Invalid or expired card.');\n            return false;\n        }\n        \n        // Validate CVV\n        if (!this.validateCVV(cvv, this.detectCardType(cardNumber))) {\n            this.showSecurityAlert('Invalid CVV.');\n            return false;\n        }\n        \n        return true;\n    }\n    \n    validateCardNumber(cardNumber) {\n        // Luhn algorithm implementation\n        let sum = 0;\n        let isEven = false;\n        \n        for (let i = cardNumber.length - 1; i >= 0; i--) {\n            let digit = parseInt(cardNumber[i]);\n            \n            if (isEven) {\n                digit *= 2;\n                if (digit > 9) digit -= 9;\n            }\n            \n            sum += digit;\n            isEven = !isEven;\n        }\n        \n        return sum % 10 === 0;\n    }\n    \n    validateExpiryDate(expiry) {\n        const match = expiry.match(/^(0[1-9]|1[0-2])\\/?([0-9]{2})$/);\n        if (!match) return false;\n        \n        const month = parseInt(match[1]);\n        const year = parseInt('20' + match[2]);\n        const now = new Date();\n        const currentYear = now.getFullYear();\n        const currentMonth = now.getMonth() + 1;\n        \n        return year > currentYear || (year === currentYear && month >= currentMonth);\n    }\n    \n    validateCVV(cvv, cardType) {\n        const cvvLength = cardType === 'amex' ? 4 : 3;\n        return cvv.length === cvvLength && /^\\d+$/.test(cvv);\n    }\n    \n    async encryptPaymentData(form) {\n        const sensitiveFields = form.querySelectorAll('[data-payment-field]');\n        const encryptedData = {};\n        \n        for (let field of sensitiveFields) {\n            if (field.value) {\n                // In a real implementation, use proper encryption libraries\n                encryptedData[field.dataset.paymentField] = await this.encryptValue(field.value);\n            }\n        }\n        \n        return encryptedData;\n    }\n    \n    async encryptValue(value) {\n        // Simplified encryption (use proper encryption in production)\n        const encoder = new TextEncoder();\n        const data = encoder.encode(value);\n        \n        try {\n            const key = await crypto.subtle.importKey(\n                'raw',\n                this.encryptionKey,\n                { name: 'AES-GCM' },\n                false,\n                ['encrypt']\n            );\n            \n            const iv = crypto.getRandomValues(new Uint8Array(12));\n            const encrypted = await crypto.subtle.encrypt(\n                { name: 'AES-GCM', iv: iv },\n                key,\n                data\n            );\n            \n            // Return base64 encoded encrypted data\n            const combined = new Uint8Array(iv.length + encrypted.byteLength);\n            combined.set(iv);\n            combined.set(new Uint8Array(encrypted), iv.length);\n            \n            return btoa(String.fromCharCode(...combined));\n        } catch (error) {\n            console.error('Encryption error:', error);\n            throw new Error('Encryption failed');\n        }\n    }\n    \n    async submitSecurePayment(encryptedData) {\n        // Simulate secure payment submission\n        return new Promise((resolve, reject) => {\n            setTimeout(() => {\n                // Simulate payment processing\n                if (Math.random() > 0.1) { // 90% success rate\n                    resolve({ success: true, transactionId: this.generateTransactionId() });\n                } else {\n                    reject(new Error('Payment processing failed'));\n                }\n            }, 2000);\n        });\n    }\n    \n    generateTransactionId() {\n        const array = new Uint8Array(16);\n        crypto.getRandomValues(array);\n        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();\n    }\n    \n    clearPaymentForm(form) {\n        const paymentFields = form.querySelectorAll('[data-payment-field]');\n        paymentFields.forEach(field => {\n            field.value = '';\n        });\n    }\n    \n    setupPCICompliance() {\n        // Implement PCI DSS compliance measures\n        this.disableCardDataStorage();\n        this.setupSecureTransmission();\n    }\n    \n    disableCardDataStorage() {\n        // Prevent card data from being stored in browser\n        const paymentInputs = document.querySelectorAll('[data-payment-field]');\n        \n        paymentInputs.forEach(input => {\n            // Disable browser autocomplete and autofill\n            input.setAttribute('autocomplete', 'off');\n            input.setAttribute('data-form-type', 'other');\n            \n            // Clear on focus loss\n            input.addEventListener('blur', () => {\n                if (input.dataset.paymentField === 'cvv') {\n                    setTimeout(() => input.value = '', 100);\n                }\n            });\n        });\n    }\n    \n    setupSecureTransmission() {\n        // Ensure all payment-related communications use HTTPS\n        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {\n            this.handleSecurityViolation('Payment forms must be served over HTTPS', 'insecure_transmission');\n        }\n    }\n    \n    // ===== SESSION SECURITY =====\n    initSessionSecurity() {\n        this.generateSessionId();\n        this.setupSessionMonitoring();\n        this.setupSessionTimeout();\n    }\n    \n    generateSessionId() {\n        const array = new Uint8Array(32);\n        crypto.getRandomValues(array);\n        this.sessionId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');\n        \n        this.setSecureCookie('session_id', this.sessionId, {\n            httpOnly: true,\n            secure: true,\n            sameSite: 'strict'\n        });\n    }\n    \n    setupSessionMonitoring() {\n        // Monitor for session hijacking attempts\n        this.monitorUserAgent();\n        this.monitorIPAddress();\n        this.monitorSessionActivity();\n    }\n    \n    monitorUserAgent() {\n        const userAgent = navigator.userAgent;\n        const storedUserAgent = localStorage.getItem('user_agent');\n        \n        if (storedUserAgent && storedUserAgent !== userAgent) {\n            this.handleSecurityViolation('User agent changed - possible session hijacking', 'session_hijack');\n        } else {\n            localStorage.setItem('user_agent', userAgent);\n        }\n    }\n    \n    monitorIPAddress() {\n        // In a real application, this would be handled server-side\n        fetch('/api/get-client-ip')\n            .then(response => response.json())\n            .then(data => {\n                const currentIP = data.ip;\n                const storedIP = sessionStorage.getItem('client_ip');\n                \n                if (storedIP && storedIP !== currentIP) {\n                    this.handleSecurityViolation('IP address changed - possible session hijacking', 'ip_change');\n                } else {\n                    sessionStorage.setItem('client_ip', currentIP);\n                }\n            })\n            .catch(() => {\n                // IP monitoring failed - continue with other security measures\n            });\n    }\n    \n    monitorSessionActivity() {\n        let lastActivity = Date.now();\n        \n        // Update activity timestamp on user interaction\n        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {\n            document.addEventListener(event, () => {\n                lastActivity = Date.now();\n            });\n        });\n        \n        // Check for session timeout\n        setInterval(() => {\n            if (Date.now() - lastActivity > this.options.sessionTimeout) {\n                this.handleSessionTimeout();\n            }\n        }, 60000); // Check every minute\n    }\n    \n    setupSessionTimeout() {\n        // Implement automatic logout on inactivity\n        let timeoutId;\n        \n        const resetTimeout = () => {\n            clearTimeout(timeoutId);\n            timeoutId = setTimeout(() => {\n                this.handleSessionTimeout();\n            }, this.options.sessionTimeout);\n        };\n        \n        // Reset timeout on user activity\n        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {\n            document.addEventListener(event, resetTimeout);\n        });\n        \n        // Initial timeout setup\n        resetTimeout();\n    }\n    \n    handleSessionTimeout() {\n        this.clearSession();\n        this.showSecurityAlert('Session expired due to inactivity. Please log in again.', 'warning');\n        \n        // Redirect to login page\n        setTimeout(() => {\n            window.location.href = '/login';\n        }, 3000);\n    }\n    \n    clearSession() {\n        // Clear all session data\n        sessionStorage.clear();\n        \n        // Clear security-related localStorage items\n        ['user_agent'].forEach(key => {\n            localStorage.removeItem(key);\n        });\n        \n        // Clear session cookies\n        this.clearSecureCookie('session_id');\n        this.clearSecureCookie('csrf_token');\n    }\n    \n    // ===== SECURITY EVENT HANDLING =====\n    setupSecurityListeners() {\n        // Listen for security-related events\n        document.addEventListener('securityViolation', (e) => {\n            this.logSecurityEvent(e.detail);\n        });\n        \n        // Monitor for suspicious activity\n        this.setupSuspiciousActivityDetection();\n        \n        // Setup security reporting\n        this.setupSecurityReporting();\n    }\n    \n    setupSuspiciousActivityDetection() {\n        // Monitor for rapid form submissions\n        let formSubmissions = [];\n        \n        document.addEventListener('submit', () => {\n            const now = Date.now();\n            formSubmissions.push(now);\n            \n            // Remove old submissions\n            formSubmissions = formSubmissions.filter(time => now - time < 60000);\n            \n            // Check for suspicious activity\n            if (formSubmissions.length > 10) {\n                this.handleSecurityViolation('Suspicious form submission activity detected', 'suspicious_activity');\n            }\n        });\n        \n        // Monitor for console usage (potential XSS)\n        let consoleWarned = false;\n        const originalLog = console.log;\n        console.log = function(...args) {\n            if (!consoleWarned && args.some(arg => \n                typeof arg === 'string' && \n                (arg.includes('password') || arg.includes('token') || arg.includes('secret'))\n            )) {\n                window.securityManager.handleSecurityViolation('Potential credential exposure in console', 'console_security');\n                consoleWarned = true;\n            }\n            return originalLog.apply(console, args);\n        };\n    }\n    \n    setupSecurityReporting() {\n        // Report security violations to server (simulated)\n        this.securityReports = [];\n        \n        // Periodic reporting\n        setInterval(() => {\n            if (this.securityReports.length > 0) {\n                this.sendSecurityReport(this.securityReports);\n                this.securityReports = [];\n            }\n        }, 5 * 60 * 1000); // Report every 5 minutes\n    }\n    \n    handleSecurityViolation(message, type) {\n        console.warn('Security violation:', message, type);\n        \n        // Create security event\n        const event = new CustomEvent('securityViolation', {\n            detail: {\n                message,\n                type,\n                timestamp: new Date().toISOString(),\n                userAgent: navigator.userAgent,\n                url: window.location.href\n            }\n        });\n        \n        document.dispatchEvent(event);\n        \n        // Show user notification\n        this.showSecurityAlert(message, 'error');\n        \n        // Take appropriate action based on violation type\n        this.handleViolationResponse(type);\n    }\n    \n    handleViolationResponse(type) {\n        switch (type) {\n            case 'csrf':\n            case 'session_hijack':\n                // Immediate logout and session clear\n                this.clearSession();\n                setTimeout(() => window.location.href = '/login', 2000);\n                break;\n                \n            case 'rate_limit':\n                // Temporary lockout\n                this.temporaryLockout();\n                break;\n                \n            case 'sql_injection':\n            case 'xss':\n                // Block further requests temporarily\n                this.blockUserTemporarily();\n                break;\n                \n            case 'payment_error':\n                // Clear payment forms and redirect\n                this.clearAllPaymentForms();\n                break;\n        }\n    }\n    \n    temporaryLockout() {\n        const lockoutEnd = Date.now() + this.options.lockoutDuration;\n        sessionStorage.setItem('lockout_end', lockoutEnd.toString());\n        \n        this.showSecurityAlert(`Account temporarily locked. Try again in ${Math.ceil(this.options.lockoutDuration / 60000)} minutes.`, 'warning');\n        \n        // Disable all forms during lockout\n        const forms = document.querySelectorAll('form');\n        forms.forEach(form => {\n            form.style.pointerEvents = 'none';\n            form.style.opacity = '0.5';\n        });\n    }\n    \n    blockUserTemporarily() {\n        // Implement temporary blocking measures\n        document.body.style.pointerEvents = 'none';\n        \n        setTimeout(() => {\n            document.body.style.pointerEvents = 'auto';\n        }, 30000); // 30 second block\n    }\n    \n    clearAllPaymentForms() {\n        const paymentForms = document.querySelectorAll('form[data-payment=\"true\"]');\n        paymentForms.forEach(form => {\n            this.clearPaymentForm(form);\n        });\n    }\n    \n    logSecurityEvent(event) {\n        this.securityReports.push({\n            ...event,\n            sessionId: this.sessionId,\n            clientId: this.getClientId()\n        });\n    }\n    \n    sendSecurityReport(reports) {\n        // Send security reports to server (simulated)\n        fetch('/api/security/report', {\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json',\n                'X-CSRF-Token': this.csrfToken\n            },\n            body: JSON.stringify({\n                reports,\n                timestamp: new Date().toISOString()\n            })\n        }).catch(error => {\n            console.warn('Failed to send security report:', error);\n        });\n    }\n    \n    // ===== UTILITY FUNCTIONS =====\n    setSecureCookie(name, value, options = {}) {\n        // Simulate setting secure cookie (in production, this would be server-side)\n        const cookieOptions = {\n            secure: true,\n            httpOnly: false, // Can't set httpOnly from client-side\n            sameSite: 'strict',\n            path: '/',\n            ...options\n        };\n        \n        let cookieString = `${name}=${value}`;\n        \n        if (cookieOptions.path) cookieString += `; Path=${cookieOptions.path}`;\n        if (cookieOptions.secure) cookieString += `; Secure`;\n        if (cookieOptions.sameSite) cookieString += `; SameSite=${cookieOptions.sameSite}`;\n        \n        document.cookie = cookieString;\n    }\n    \n    clearSecureCookie(name) {\n        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;\n    }\n    \n    getUserIdentifier() {\n        return sessionStorage.getItem('user_id') || 'anonymous';\n    }\n    \n    getClientId() {\n        let clientId = localStorage.getItem('client_id');\n        \n        if (!clientId) {\n            const array = new Uint8Array(16);\n            crypto.getRandomValues(array);\n            clientId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');\n            localStorage.setItem('client_id', clientId);\n        }\n        \n        return clientId;\n    }\n    \n    showSecurityAlert(message, type = 'error') {\n        // Create security alert notification\n        const alert = document.createElement('div');\n        alert.className = `security-alert security-alert-${type}`;\n        \n        const icon = {\n            error: 'fas fa-exclamation-triangle',\n            warning: 'fas fa-exclamation-circle',\n            success: 'fas fa-check-circle',\n            info: 'fas fa-info-circle'\n        }[type] || 'fas fa-info-circle';\n        \n        const bgColor = {\n            error: '#dc2626',\n            warning: '#d97706',\n            success: '#059669',\n            info: '#2563eb'\n        }[type] || '#2563eb';\n        \n        alert.innerHTML = `\n            <div style=\"\n                position: fixed;\n                top: 20px;\n                right: 20px;\n                background: ${bgColor};\n                color: white;\n                padding: 1rem 1.5rem;\n                border-radius: 8px;\n                z-index: 50000;\n                box-shadow: 0 8px 25px rgba(0,0,0,0.3);\n                display: flex;\n                align-items: center;\n                gap: 0.75rem;\n                max-width: 400px;\n                animation: slideInFromRight 0.3s ease;\n            \">\n                <i class=\"${icon}\"></i>\n                <span>${message}</span>\n                <button onclick=\"this.parentElement.parentElement.remove()\" style=\"\n                    background: rgba(255,255,255,0.2);\n                    border: none;\n                    color: white;\n                    width: 24px;\n                    height: 24px;\n                    border-radius: 50%;\n                    cursor: pointer;\n                    margin-left: auto;\n                \">&times;</button>\n            </div>\n            <style>\n                @keyframes slideInFromRight {\n                    from { transform: translateX(100%); opacity: 0; }\n                    to { transform: translateX(0); opacity: 1; }\n                }\n            </style>\n        `;\n        \n        document.body.appendChild(alert);\n        \n        // Auto-remove after 8 seconds\n        setTimeout(() => {\n            if (alert.parentNode) {\n                alert.remove();\n            }\n        }, 8000);\n    }\n    \n    // ===== PUBLIC API =====\n    validateInput(input, type = 'text') {\n        return this.sanitizeInput(input, type);\n    }\n    \n    checkSecureConnection() {\n        return location.protocol === 'https:' || location.hostname === 'localhost';\n    }\n    \n    generateSecureToken() {\n        const array = new Uint8Array(32);\n        crypto.getRandomValues(array);\n        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');\n    }\n    \n    isRateLimited(type, identifier = 'default') {\n        return !this.checkRateLimit(type, identifier);\n    }\n    \n    getSecurityStatus() {\n        return {\n            csrfToken: !!this.csrfToken,\n            sessionId: !!this.sessionId,\n            secureConnection: this.checkSecureConnection(),\n            rateLimitersActive: this.rateLimiters.size,\n            encryptionAvailable: !!this.encryptionKey\n        };\n    }\n}\n\n// Initialize Security Manager when DOM is ready\ndocument.addEventListener('DOMContentLoaded', function() {\n    // Initialize with production-ready settings\n    window.securityManager = new SecurityManager({\n        enableCSRF: true,\n        enableRateLimit: true,\n        enableInputValidation: true,\n        enablePaymentEncryption: true,\n        enableSessionSecurity: true,\n        maxLoginAttempts: 5,\n        lockoutDuration: 15 * 60 * 1000, // 15 minutes\n        sessionTimeout: 60 * 60 * 1000   // 1 hour\n    });\n    \n    console.log('Security Manager initialized with comprehensive protection');\n});\n\n// Export for module systems\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = SecurityManager;\n}"}}]
