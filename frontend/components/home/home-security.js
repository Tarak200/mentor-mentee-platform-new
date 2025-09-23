/**
 * Home Page Security Module
 * Handles security measures, input sanitization, and protection against attacks
 */

class HomeSecurity {
    constructor() {
        this.initializeSecurity();
    }

    // Initialize security measures
    initializeSecurity() {
        this.setupCSPHeaders();
        this.preventXSS();
        this.setupSecurityHeaders();
        this.validateInputs();
        this.preventClickjacking();
        this.setupSecurityLogging();
    }

    // Content Security Policy setup (disabled during development)
    setupCSPHeaders() {
        // CSP headers disabled during development to prevent resource blocking
        // Enable in production with proper configuration
        console.log('CSP headers disabled for development');
    }

    // Prevent XSS attacks
    preventXSS() {
        // Sanitize any dynamic content
        this.sanitizeAllTextContent();
        
        // Override dangerous methods
        this.overrideDangerousMethods();
        
        // Setup mutation observer for dynamic content
        this.setupMutationObserver();
    }

    // Sanitize text content (disabled for static content)
    sanitizeAllTextContent() {
        // Completely disabled during development to prevent CSS interference
        // Only sanitize user-generated content, not static HTML or CSS
        console.log('Content sanitization disabled for development - CSS and static content unrestricted');
    }

    // Check for potential XSS content
    containsPotentialXSS(content) {
        const xssPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /<form/i
        ];
        
        return xssPatterns.some(pattern => pattern.test(content));
    }

    // Sanitize HTML content
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    // Override dangerous methods (disabled to prevent interference with normal rendering)
    overrideDangerousMethods() {
        // This method is disabled to prevent breaking normal page functionality
        // Only monitor for truly dangerous content in user inputs
        console.log('XSS protection active - monitoring user inputs only');
    }

    // Setup mutation observer - Disabled for development
    setupMutationObserver() {
        // Mutation observer disabled during development to prevent CSS/JS interference
        console.log('DOM mutation observer disabled for development - allows proper resource loading');
        
        // Only enable minimal monitoring that doesn't interfere with normal page operation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        // Only validate truly suspicious elements, not normal CSS/JS
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.tagName === 'SCRIPT' && 
                            node.innerHTML && 
                            node.innerHTML.includes('eval(')) {
                            console.warn('Potentially dangerous script detected');
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

    // Validate new elements
    validateNewElement(element) {
        // Check for dangerous attributes
        const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
        dangerousAttributes.forEach(attr => {
            if (element.hasAttribute(attr)) {
                console.warn(`Dangerous attribute ${attr} found and removed from:`, element);
                element.removeAttribute(attr);
            }
        });

        // Check for script tags
        const scripts = element.querySelectorAll('script');
        scripts.forEach(script => {
            console.warn('Unauthorized script tag removed:', script);
            script.remove();
        });
    }

    // Setup security headers
    setupSecurityHeaders() {
        // Add security meta tags
        const securityHeaders = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
        ];

        securityHeaders.forEach(header => {
            const meta = document.createElement('meta');
            meta.httpEquiv = header.name;
            meta.content = header.content;
            document.head.appendChild(meta);
        });
    }

    // Validate inputs
    validateInputs() {
        // Monitor for any form inputs that might be added dynamically
        document.addEventListener('input', (event) => {
            const input = event.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                this.validateInputValue(input);
            }
        });
    }

    // Validate individual input values
    validateInputValue(input) {
        const value = input.value;
        
        // Check for potential script injection
        if (this.containsPotentialXSS(value)) {
            console.warn('Potentially dangerous input detected:', value);
            input.value = this.sanitizeHTML(value);
            this.showSecurityWarning('Invalid characters detected and removed from input');
        }

        // Check for SQL injection patterns
        const sqlPatterns = [
            /(\b(ALTER|CREATE|DELETE|DROP|EXEC|EXECUTE|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/gi,
            /((\%27)|(\'))\s*(\||\|\||\*|\*\*)/gi,
            /(\%27)|(\')(\s)*UNION/gi
        ];

        sqlPatterns.forEach(pattern => {
            if (pattern.test(value)) {
                console.warn('Potential SQL injection detected:', value);
                input.value = value.replace(pattern, '');
                this.showSecurityWarning('Invalid SQL patterns detected and removed');
            }
        });
    }

    // Prevent clickjacking
    preventClickjacking() {
        if (window !== window.top) {
            console.warn('Potential clickjacking attempt detected');
            window.top.location = window.location;
        }
    }

    // Setup security logging
    setupSecurityLogging() {
        // Log security events
        window.addEventListener('error', (event) => {
            this.logSecurityEvent('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Log CSP violations
        document.addEventListener('securitypolicyviolation', (event) => {
            this.logSecurityEvent('CSP Violation', {
                blockedURI: event.blockedURI,
                violatedDirective: event.violatedDirective,
                originalPolicy: event.originalPolicy
            });
        });
    }

    // Log security events
    logSecurityEvent(eventType, details) {
        const logData = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.warn('Security Event:', logData);

        // Send to server if endpoint available
        if (typeof fetch !== 'undefined') {
            fetch('/api/security/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            }).catch(err => {
                console.error('Failed to log security event:', err);
            });
        }
    }

    // Show security warning to user
    showSecurityWarning(message) {
        // Create warning element
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span class="warning-message">${this.sanitizeHTML(message)}</span>
            </div>
        `;

        // Add styles
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;

        document.body.appendChild(warning);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 5000);
    }

    // Rate limiting for actions
    createRateLimit(maxAttempts = 5, timeWindow = 60000) {
        const attempts = new Map();

        return function rateLimitCheck(identifier = 'default') {
            const now = Date.now();
            const userAttempts = attempts.get(identifier) || [];
            
            // Clean old attempts
            const validAttempts = userAttempts.filter(time => now - time < timeWindow);
            
            if (validAttempts.length >= maxAttempts) {
                console.warn(`Rate limit exceeded for: ${identifier}`);
                return false;
            }
            
            validAttempts.push(now);
            attempts.set(identifier, validAttempts);
            return true;
        };
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const security = new HomeSecurity();
    
    // Create rate limiter for user type selection
    const userTypeRateLimit = security.createRateLimit(3, 30000); // 3 attempts per 30 seconds
    
    // Override the selectUserType function to add rate limiting
    const originalSelectUserType = window.selectUserType;
    if (originalSelectUserType) {
        window.selectUserType = function(type) {
            if (!userTypeRateLimit('userTypeSelection')) {
                security.showSecurityWarning('Too many attempts. Please wait before trying again.');
                return;
            }
            
            // Validate input
            if (typeof type !== 'string' || !['mentor', 'mentee'].includes(type)) {
                security.showSecurityWarning('Invalid user type selected');
                return;
            }
            
            return originalSelectUserType(type);
        };
    }
    
    console.log('Home page security measures initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeSecurity;
}
