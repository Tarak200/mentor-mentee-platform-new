/**
 * Home Page Functionality
 * Handles user type selection and navigation
 */

// Main functionality
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
    
    // Navigate to user-specific login page after brief delay for animation
    setTimeout(() => {
        if (type === 'mentor') {
            window.location.href = '/mentor/login';
        } else if (type === 'mentee') {
            window.location.href = '/mentee/login';
        }
    }, 500);
}

// Show loading state
function showLoading() {
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
    
    // Observe elements for animation
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
            if (focusedElement.classList.contains('btn')) {
                event.preventDefault();
                focusedElement.click();
            }
        }
    });
}

// Performance monitoring
function trackPagePerformance() {
    // Track page load time
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Home page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Send analytics if needed
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
    console.log('Home page initialized');
    
    // Initialize all functionality
    initializeAnimations();
    initializeHoverEffects();
    initializeKeyboardNavigation();
    trackPagePerformance();
    
    // Add custom CSS for loading animation
    const style = document.createElement('style');
    style.textContent = `
        #loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-spinner {
            text-align: center;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.6s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectUserType,
        scrollToFeatures,
        initializeAnimations
    };
}
