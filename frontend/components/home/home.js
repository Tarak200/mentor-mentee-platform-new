/**
 * Home Page Functionality
 * Handles user type selection and navigation
 */

// SPA-friendly navigation
function selectUserType(type) {
    // Store selected user type in localStorage for later use
    localStorage.setItem('selectedUserType', type);

    // Add animation to the selected card
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (card.classList.contains(`${type}-card`)) {
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';
        }
    });

    // Show loading state
    showLoading();

    // SPA navigation instead of full reload
    setTimeout(() => {
        if (type === 'mentor') {
            window.history.pushState({}, '', '/mentor/login');
            if (window.appConfig && typeof window.appConfig.loadComponent === 'function') {
                window.appConfig.loadComponent('login').finally(hideLoading);
            } else {
                // Fallback if appConfig not available
                window.location.href = '/mentor/login';
            }
        } else if (type === 'mentee') {
            window.history.pushState({}, '', '/mentee/login');
            if (window.appConfig && typeof window.appConfig.loadComponent === 'function') {
                window.appConfig.loadComponent('login').finally(hideLoading);
            } else {
                // Fallback if appConfig not available
                window.location.href = '/mentee/login';
            }
        }
    }, 500);
}

// Show loading state
function showLoading() {
    hideLoading(); // remove any previous overlay

    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Redirecting to login...</p>
        </div>
    `;

    document.body.appendChild(loadingOverlay);
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

// Add smooth scroll behavior for features section
function scrollToFeatures() {
    const featuresSection = document.querySelector('.features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add intersection observer for animations
function initializeAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.card, .feature-item');
    animateElements.forEach(el => observer.observe(el));
}

// Initialize hover effects
function initializeHoverEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Keyboard navigation support
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.classList && focusedElement.classList.contains('btn')) {
                event.preventDefault();
                focusedElement.click();
            }
        }
    });
}

// Performance monitoring
function trackPagePerformance() {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Home page loaded in ${loadTime.toFixed(2)}ms`);

        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                event_category: 'Performance',
                event_label: 'Home Page',
                value: Math.round(loadTime)
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    hideLoading(); // Remove leftover overlays if any

    console.log('Home page initialized');

    // Initialize all functionality
    initializeAnimations();
    initializeHoverEffects();
    initializeKeyboardNavigation();
    trackPagePerformance();
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectUserType,
        scrollToFeatures,
        initializeAnimations
    };
}
