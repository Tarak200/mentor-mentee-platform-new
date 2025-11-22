/**
 * Frontend Application Configuration
 * Manages component loading, routing, and global settings
 */

class AppConfig {
    constructor() {
        this.components = new Map();
        this.routes = new Map();
        this.globalSettings = {
            apiBaseUrl: this.getApiBaseUrl(),
            enableAnalytics: false,
            enableServiceWorker: false,
            theme: this.getPreferredTheme(),
            language: 'en',
            features: {
                googleAuth: true,
                notifications: true,
                fileUpload: true,
                realTimeUpdates: false
            }
        };
        this.init();
    }

    // Initialize the configuration
    init() {
        this.registerComponents();
        this.setupRoutes();
        this.loadGlobalSettings();
        this.setupEventListeners();
        console.log('Frontend configuration initialized');
    }

    // Register all available components
    registerComponents() {
        // Home component
        this.components.set('home', {
            path: '/components/home',
            files: {
                html: 'home.html',
                css: 'home.css',
                js: 'home.js',
                security: 'home-security.js'
            },
            dependencies: ['shared'],
            title: 'Home - Mentor-Mentee Platform'
        });

        // Authentication components
        this.components.set('login', {
            path: '/components/auth',
            files: {
                html: 'login.html',
                css: 'auth.css',
                js: 'auth.js',
                security: 'auth-security.js'
            },
            dependencies: ['shared'],
            title: 'Login - Mentor-Mentee Platform'
        });

        this.components.set('register', {
            path: '/components/auth',
            files: {
                html: 'register.html',
                css: 'auth.css',
                js: 'auth.js',
                security: 'auth-security.js'
            },
            dependencies: ['shared'],
            title: 'Register - Mentor-Mentee Platform'
        });

        // Role-specific registration components
        this.components.set('mentor-register', {
            path: '/components/mentor/register',
            files: {
                html: 'register.html',
                css: 'register.css',
                js: 'register.js',
                security: 'register-security.js'
            },
            dependencies: ['shared'],
            title: 'Register - Mentor-Mentee Platform'
        });

        this.components.set('mentee-register', {
            path: '/components/mentee/register',
            files: {
                html: 'register.html',
                css: 'register.css',
                js: 'register.js',
                security: 'register-security.js'
            },
            dependencies: ['shared'],
            title: 'Register - Mentor-Mentee Platform'
        });

        // Dashboard components
        this.components.set('mentor-dashboard', {
            path: '/components/mentor-dashboard',
            files: {
                html: 'mentor-dashboard.html',
                css: 'mentor-dashboard.css',
                js: 'mentor-dashboard.js',
                security: 'mentor-dashboard-security.js'
            },
            dependencies: ['shared', 'dashboard-common'],
            title: 'Mentor Dashboard',
            requiresAuth: true,
            userType: 'mentor'
        });

        this.components.set('mentee-dashboard', {
            path: '/components/mentee-dashboard',
            files: {
                html: 'mentee-dashboard.html',
                css: 'mentee-dashboard.css',
                js: 'mentee-dashboard.js',
                security: 'mentee-dashboard-security.js'
            },
            dependencies: ['shared', 'dashboard-common'],
            title: 'Mentee Dashboard',
            requiresAuth: true,
            userType: 'mentee'
        });

        // Forgot Password components
        this.components.set('mentor-forgot-password', {
            path: '/components/mentor/forgot-password',
            files: {
                html: 'forgot-password.html',
                css: 'forgot-password.css',
                js: 'forgot-password.js',
                security: 'forgot-password-security.js'
            },
            dependencies: ['shared'],
            title: 'Mentor - Forgot Password',
            userType: 'mentor'
        });

        this.components.set('mentee-forgot-password', {
            path: '/components/mentee/forgot-password',
            files: {
                html: 'forgot-password.html',
                css: 'forgot-password.css',
                js: 'forgot-password.js',
                security: 'forgot-password-security.js'
            },
            dependencies: ['shared'],
            title: 'Mentee - Forgot Password',
            userType: 'mentee'
        });

        // Reset Password components
        this.components.set('mentor-reset-password', {
            path: '/components/mentor/reset-password',
            files: {
                html: 'reset-password.html',
                css: 'reset-password.css',
                js: 'reset-password.js',
                security: 'reset-password-security.js'
            },
            dependencies: ['shared'],
            title: 'Mentor - Reset Password',
            userType: 'mentor'
        });

        this.components.set('mentee-reset-password', {
            path: '/components/mentee/reset-password',
            files: {
                html: 'reset-password.html',
                css: 'reset-password.css',
                js: 'reset-password.js',
                security: 'reset-password-security.js'
            },
            dependencies: ['shared'],
            title: 'Mentee - Reset Password',
            userType: 'mentee'
        });

        // Shared components
        this.components.set('shared', {
            path: '/components/shared',
            files: {
                css: 'shared.css',
                js: 'shared.js',
                security: 'shared-security.js'
            },
            title: 'Shared Components',
            isGlobal: true
        });
    }

    // Setup routing configuration
    setupRoutes() {
        this.routes.set('/', 'home');
        this.routes.set('/home', 'home');
        this.routes.set('/login', 'login');
        this.routes.set('/register', 'register');
        this.routes.set('/mentor-dashboard', 'mentor-dashboard');
        this.routes.set('/mentee-dashboard', 'mentee-dashboard');
        this.routes.set('/mentor/login', 'login');
        this.routes.set('/mentee/login', 'login');
        this.routes.set('/mentor/register', 'mentor-register');
        this.routes.set('/mentee/register', 'mentee-register');

        // Forgot password routes
        this.routes.set('/mentor/forgot-password', 'mentor-forgot-password');
        this.routes.set('/mentee/forgot-password', 'mentee-forgot-password');
        this.routes.set('/mentor/reset-password', 'mentor-reset-password');
        this.routes.set('/mentee/reset-password', 'mentee-reset-password');
    }

    // Get API base URL based on environment
    getApiBaseUrl() {
        if (window.location.hostname === 'localhost') {
            return `http://${window.location.host}/api`;
        }
        return '/api'; // Production
    }

    // Get preferred theme from localStorage or system preference
    getPreferredTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }

    // Load component by name
    async loadComponent(name) {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Component ${name} not found`);
        }

        // Check authentication if required
        if (component.requiresAuth && !this.isAuthenticated()) {
            if (this.getCurrentRoute() !== '/login') {
                this.redirect('/login');
            }
            return;
        }


        // Check user type if required
        if (component.userType && !this.hasCorrectUserType(component.userType)) {
            this.redirect('/home');
            return;
        }

        // Load dependencies first
        if (component.dependencies) {
            for (const dep of component.dependencies) {
                await this.loadComponentFiles(dep);
            }
        }

        // Load component files
        await this.loadComponentFiles(name);
        
        // Update document title
        if (component.title) {
            document.title = component.title;
        }

        return component;
    }

    // Load component files (CSS, JS, etc.)
    async loadComponentFiles(name) {
        const component = this.components.get(name);
        if (!component) return;

        const promises = [];

        try {
            if (component.files.css) {
                promises.push(this.loadCSS(`${component.path}/${component.files.css}`).catch(console.error));
            }
            if (component.files.js) {
                promises.push(this.loadJS(`${component.path}/${component.files.js}`).catch(console.error));
            }
            if (component.files.security) {
                promises.push(this.loadJS(`${component.path}/${component.files.security}`).catch(console.error));
            }
            await Promise.all(promises);
        } catch (err) {
            console.error('Error loading component files:', err);
        }
    }


    // Load CSS file
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Load JavaScript file
    loadJS(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken') || this.getCookie('authToken');
        return !!token;
    }

    // Check if user has correct user type
    hasCorrectUserType(requiredType) {
        const userType = localStorage.getItem('userType');
        return userType === requiredType;
    }

    // Get cookie value
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Redirect to path
    redirect(path) {
        window.location.href = path;
    }

    // Get current route
    getCurrentRoute() {
        return window.location.pathname;
    }

    // Get component for current route
    getComponentForRoute(path = this.getCurrentRoute()) {
        return this.routes.get(path) || 'home';
    }

    // Load global settings from localStorage
    loadGlobalSettings() {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.globalSettings = { ...this.globalSettings, ...parsed };
            } catch (error) {
                console.error('Failed to parse saved settings:', error);
            }
        }
    }

    // Save global settings to localStorage
    saveGlobalSettings() {
        localStorage.setItem('appSettings', JSON.stringify(this.globalSettings));
    }

    // Update a setting
    updateSetting(key, value) {
        if (key.includes('.')) {
            // Handle nested keys like 'features.googleAuth'
            const keys = key.split('.');
            let obj = this.globalSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!obj[keys[i]]) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
        } else {
            this.globalSettings[key] = value;
        }
        this.saveGlobalSettings();
    }

    // Get a setting value
    getSetting(key) {
        if (key.includes('.')) {
            // Handle nested keys
            const keys = key.split('.');
            let obj = this.globalSettings;
            for (const k of keys) {
                if (!obj || typeof obj !== 'object') return undefined;
                obj = obj[k];
            }
            return obj;
        }
        return this.globalSettings[key];
    }

    // Setup global event listeners
    setupEventListeners() {
        // Handle theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.updateSetting('theme', e.matches ? 'dark' : 'light');
                    this.applyTheme(this.globalSettings.theme);
                }
            });
        }

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.dispatchCustomEvent('app:online');
        });

        window.addEventListener('offline', () => {
            this.dispatchCustomEvent('app:offline');
        });

        window.addEventListener('popstate', async () => {
            try {
                const componentName = window.appConfig.getComponentForRoute();
                await window.appConfig.loadComponent(componentName);
            } catch (error) {
                window.appConfig.handleError(error, 'History Navigation');
            }
        });


        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.dispatchCustomEvent('app:focus');
            } else {
                this.dispatchCustomEvent('app:blur');
            }
        });
    }

    // Apply theme
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const isDark = theme === 'dark';
        
        // Update meta theme-color
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = isDark ? '#1a202c' : '#ffffff';
    }

    // Dispatch custom events
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    // API helper methods
    getApiUrl(endpoint) {
        return `${this.globalSettings.apiBaseUrl}${endpoint}`;
    }

    // Get authentication headers
    getAuthHeaders() {
        const token = localStorage.getItem('authToken') || this.getCookie('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Make API request
    async apiRequest(endpoint, options = {}) {
        const url = this.getApiUrl(endpoint);
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        return result;
    }

    // Error handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Send to analytics if enabled
        if (this.globalSettings.enableAnalytics && typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false,
                custom_map: { context }
            });
        }

        // Dispatch error event
        this.dispatchCustomEvent('app:error', { error, context });
    }

    // Initialize app for current page
    async initializeApp() {
        try {
            // Load shared components first
            await this.loadComponentFiles('shared');
            
            // Apply current theme
            this.applyTheme(this.globalSettings.theme);
            
            // Get and load component for current route
            const componentName = this.getComponentForRoute();
            await this.loadComponent(componentName);
            
            // Dispatch app ready event
            this.dispatchCustomEvent('app:ready');
            
            console.log('Application initialized successfully');
        } catch (error) {
            this.handleError(error, 'App Initialization');
        }
    }
}

// Create global app configuration instance
window.appConfig = new AppConfig();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.appConfig.initializeApp();
    });
} else {
    window.appConfig.initializeApp();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
