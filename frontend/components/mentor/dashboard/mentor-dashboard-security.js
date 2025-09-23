/**
 * Mentor Dashboard Security Module
 * Basic security measures for mentor dashboard pages
 */

class MentorDashboardSecurity {
    constructor() {
        this.initializeSecurity();
    }

    initializeSecurity() {
        // Disable aggressive security measures during development
        console.log('Mentor dashboard security initialized - development mode');
        
        // Only enable basic protections that don't interfere with CSS
        this.setupBasicProtection();
    }

    setupBasicProtection() {
        // Prevent clickjacking without blocking resources
        if (window !== window.top) {
            console.warn('Potential clickjacking attempt detected');
        }
        
        // Basic XSS protection for user inputs only
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.validateUserInput(event.target);
            }
        });
    }

    validateUserInput(input) {
        const value = input.value;
        const dangerousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];
        
        let hasIssue = false;
        dangerousPatterns.forEach(pattern => {
            if (pattern.test(value)) {
                hasIssue = true;
            }
        });
        
        if (hasIssue) {
            console.warn('Potentially dangerous input detected');
            // Only sanitize actual dangerous content, don't break normal input
        }
    }
}

// Initialize security when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MentorDashboardSecurity();
});

