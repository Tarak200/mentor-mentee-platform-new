// Shared Frontend Utilities

/**
 * Utility class for common frontend functionality
 */
class SharedUtils {
    constructor() {
        this.apiBase = this.getApiBase();
        this.authToken = localStorage.getItem('token');
        this.initializeGlobalFeatures();
    }

    initializeGlobalFeatures() {
        // Set up global error handling
        this.setupErrorHandling();
        
        // Initialize service worker if available
        this.initializeServiceWorker();
        
        // Setup performance monitoring
        this.initializePerformanceMonitoring();
        
        // Initialize accessibility features
        this.initializeAccessibility();
    }

    // ==================== API UTILITIES ====================

    getApiBase() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        return `${protocol}//${hostname}${port}/api`;
    }

    /**
     * Enhanced fetch wrapper with error handling, authentication, and retry logic
     * @param {string} url - API endpoint
     * @param {Object} options - Fetch options
     * @param {number} retries - Number of retries on failure
     * @returns {Promise} - Response data
     */
    async apiCall(url, options = {}, retries = 3) {
        const fullUrl = url.startsWith('http') ? url : `${this.apiBase}${url}`;
        
        // Add authentication headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }

        const fetchOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(fullUrl, fetchOptions);
            
            // Handle different response types
            if (!response.ok) {
                await this.handleApiError(response);
            }

            // Parse response based on content type
            return await this.parseResponse(response);

        } catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                await this.delay(1000); // Wait 1 second before retry
                return this.apiCall(url, options, retries - 1);
            }
            throw error;
        }
    }

    async handleApiError(response) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            }
        } catch (parseError) {
            // If we can't parse the error, use the default message
        }

        // Handle specific status codes
        switch (response.status) {
            case 401:
                this.handleUnauthorized();
                break;
            case 403:
                this.showToast('Access denied', 'error');
                break;
            case 429:
                this.showToast('Too many requests. Please wait before trying again.', 'warning');
                break;
            case 500:
                this.showToast('Server error. Please try again later.', 'error');
                break;
        }

        throw new Error(errorMessage);
    }

    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else {
            return await response.blob();
        }
    }

    isRetryableError(error) {
        // Retry on network errors or 5xx status codes
        return (
            error.message.includes('NetworkError') ||
            error.message.includes('fetch') ||
            (error.status && error.status >= 500)
        );
    }

    handleUnauthorized() {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        
        // Show notification
        this.showToast('Session expired. Please log in again.', 'warning');
        
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} - Debounced function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Milliseconds limit
     * @returns {Function} - Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} - Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = this.deepClone(obj[key]);
            });
            return clonedObj;
        }
    }

    /**
     * Generate a random ID
     * @param {number} length - Length of ID
     * @returns {string} - Random ID
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} - Formatted currency
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date
     * @param {Date|string} date - Date to format
     * @param {Object} options - Formatting options
     * @returns {string} - Formatted date
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        return new Date(date).toLocaleDateString('en-US', formatOptions);
    }

    /**
     * Format time
     * @param {Date|string} date - Date to format
     * @param {boolean} includeSeconds - Include seconds
     * @returns {string} - Formatted time
     */
    formatTime(date, includeSeconds = false) {
        const options = {
            hour: '2-digit',
            minute: '2-digit'
        };
        
        if (includeSeconds) {
            options.second = '2-digit';
        }
        
        return new Date(date).toLocaleTimeString('en-US', options);
    }

    /**
     * Get relative time (e.g., "2 minutes ago")
     * @param {Date|string} date - Date to compare
     * @returns {string} - Relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffInSeconds = Math.floor((now - targetDate) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== VALIDATION UTILITIES ====================

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} - Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {boolean} - Is valid phone
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean} - Is valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {Object} - Strength score and feedback
     */
    checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        
        const strength = {
            0: 'Very Weak',
            1: 'Very Weak',
            2: 'Weak',
            3: 'Fair',
            4: 'Good',
            5: 'Strong'
        }[score];

        return {
            score,
            strength,
            checks,
            isValid: score >= 3
        };
    }

    // ==================== DOM UTILITIES ====================

    /**
     * Create element with attributes
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string} content - Element content
     * @returns {HTMLElement} - Created element
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }

    /**
     * Add event listener with cleanup
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} - Cleanup function
     */
    addEventListenerWithCleanup(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }

    /**
     * Animate element
     * @param {HTMLElement} element - Element to animate
     * @param {Object} keyframes - Animation keyframes
     * @param {Object} options - Animation options
     * @returns {Animation} - Animation instance
     */
    animate(element, keyframes, options = {}) {
        const defaultOptions = {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'forwards'
        };
        
        return element.animate(keyframes, { ...defaultOptions, ...options });
    }

    /**
     * Fade in element
     * @param {HTMLElement} element - Element to fade in
     * @param {number} duration - Animation duration
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    /**
     * Fade out element
     * @param {HTMLElement} element - Element to fade out
     * @param {number} duration - Animation duration
     * @returns {Promise} - Animation completion promise
     */
    fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            const animation = this.animate(element, [
                { opacity: 1 },
                { opacity: 0 }
            ], { duration });
            
            animation.onfinish = () => {
                element.style.display = 'none';
                resolve();
            };
        });
    }

    // ==================== LOCAL STORAGE UTILITIES ====================

    /**
     * Set item in localStorage with expiration
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @param {number} ttl - Time to live in milliseconds
     */
    setWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * Get item from localStorage with expiration check
     * @param {string} key - Storage key
     * @returns {*} - Stored value or null if expired
     */
    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }

    // ==================== UI UTILITIES ====================

    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Display duration in milliseconds
     */
    showToast(message, type = 'info', duration = 5000) {
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            style: `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.getToastColor(type)};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                max-width: 350px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                font-weight: 500;
            `
        }, message);

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto-remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || colors.info;
    }

    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {Object} - Loading instance with hide method
     */
    showLoading(message = 'Loading...') {
        const loading = this.createElement('div', {
            className: 'loading-overlay',
            style: `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
            `
        });

        const spinner = this.createElement('div', {
            className: 'spinner',
            style: `
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            `
        });

        const text = this.createElement('div', {
            style: 'font-size: 1.1rem;'
        }, message);

        // Add CSS animation if not already present
        if (!document.querySelector('#loading-styles')) {
            const style = this.createElement('style', { id: 'loading-styles' });
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        loading.appendChild(spinner);
        loading.appendChild(text);
        document.body.appendChild(loading);

        return {
            hide: () => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }
        };
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @param {string} title - Dialog title
     * @returns {Promise<boolean>} - User confirmation
     */
    showConfirmDialog(message, title = 'Confirm') {
        return new Promise(resolve => {
            const overlay = this.createElement('div', {
                className: 'confirm-overlay',
                style: `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `
            });

            const dialog = this.createElement('div', {
                style: `
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                `
            });

            const titleEl = this.createElement('h3', {
                style: 'margin: 0 0 15px 0; color: #2c3e50;'
            }, title);

            const messageEl = this.createElement('p', {
                style: 'margin: 0 0 25px 0; color: #7f8c8d; line-height: 1.5;'
            }, message);

            const buttonContainer = this.createElement('div', {
                style: 'display: flex; gap: 15px; justify-content: center;'
            });

            const cancelBtn = this.createElement('button', {
                style: `
                    padding: 10px 20px;
                    border: 2px solid #e9ecef;
                    background: white;
                    color: #6c757d;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                `
            }, 'Cancel');

            const confirmBtn = this.createElement('button', {
                style: `
                    padding: 10px 20px;
                    border: none;
                    background: #e74c3c;
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                `
            }, 'Confirm');

            // Event handlers
            const cleanup = () => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });

            // Build dialog
            buttonContainer.appendChild(cancelBtn);
            buttonContainer.appendChild(confirmBtn);
            dialog.appendChild(titleEl);
            dialog.appendChild(messageEl);
            dialog.appendChild(buttonContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        });
    }

    // ==================== FILE UTILITIES ====================

    /**
     * Read file as data URL
     * @param {File} file - File to read
     * @returns {Promise<string>} - Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Download data as file
     * @param {string} data - Data to download
     * @param {string} filename - File name
     * @param {string} type - MIME type
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        
        const link = this.createElement('a', {
            href: url,
            download: filename,
            style: 'display: none;'
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ==================== ERROR HANDLING ====================

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError('GLOBAL_ERROR', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError('UNHANDLED_REJECTION', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    logError(type, data = {}) {
        const errorLog = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };

        // Send to logging service (implement as needed)
        console.error('Error logged:', errorLog);
        
        // Store locally for debugging
        const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
        errors.push(errorLog);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        localStorage.setItem('error_logs', JSON.stringify(errors));
    }

    // ==================== PERFORMANCE MONITORING ====================

    initializePerformanceMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.logPerformance('PAGE_LOAD', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domReady: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }
            }, 0);
        });
    }

    logPerformance(metric, data = {}) {
        const perfLog = {
            metric,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            ...data
        };

        // Send to analytics service (implement as needed)
        console.log('Performance metric:', perfLog);
    }

    // ==================== SERVICE WORKER ====================

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    // ==================== ACCESSIBILITY ====================

    initializeAccessibility() {
        // Add keyboard navigation support
        this.setupKeyboardNavigation();
        
        // Add focus management
        this.setupFocusManagement();
        
        // Add ARIA live regions for dynamic content
        this.setupLiveRegions();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Skip links with Tab key
            if (e.key === 'Tab' && e.shiftKey) {
                // Handle skip links
            }
            
            // Modal navigation with Escape key
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    // Close top modal
                    openModals[openModals.length - 1].classList.remove('show');
                }
            }
        });
    }

    setupFocusManagement() {
        // Track focus for accessibility
        let lastFocusedElement;
        
        document.addEventListener('focusin', (e) => {
            lastFocusedElement = e.target;
        });

        // Return focus when modals close
        this.returnFocus = (element) => {
            if (element && typeof element.focus === 'function') {
                element.focus();
            } else if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };
    }

    setupLiveRegions() {
        // Create live region for announcements
        const liveRegion = this.createElement('div', {
            'aria-live': 'polite',
            'aria-atomic': 'true',
            style: `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `
        });
        
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }

    announce(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
        }
    }
}

// ==================== GLOBAL INSTANCE ====================

// Create global instance
window.sharedUtils = new SharedUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedUtils;
}

// ==================== POLYFILLS ====================

// Polyfill for older browsers
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

// ==================== CONVENIENCE METHODS ====================

// Global convenience functions
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);
window.toast = (message, type, duration) => window.sharedUtils.showToast(message, type, duration);
window.loading = (message) => window.sharedUtils.showLoading(message);
window.confirm = (message, title) => window.sharedUtils.showConfirmDialog(message, title);
window.api = (url, options, retries) => window.sharedUtils.apiCall(url, options, retries);

console.log('Shared utilities initialized ✅');
