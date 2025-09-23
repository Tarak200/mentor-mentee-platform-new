/**
 * Homepage Diagnostic Script
 * Helps identify and fix display issues
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Homepage Diagnostic Started ===');
    
    // Check if stylesheets are loaded
    checkStylesheets();
    
    // Check for CSS conflicts
    checkCSSConflicts();
    
    // Check element visibility
    checkElementVisibility();
    
    // Fix any detected issues
    applyFixes();
    
    console.log('=== Homepage Diagnostic Completed ===');
});

function checkStylesheets() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`Found ${links.length} stylesheets:`);
    
    links.forEach((link, index) => {
        // Check if stylesheet is loaded
        if (link.href.startsWith('http://localhost') || link.href.startsWith('/')) {
            // Local stylesheet - check if loaded
            fetch(link.href)
                .then(response => {
                    if (response.ok) {
                        console.log(`✓ Loaded: ${link.href}`);
                    } else {
                        console.warn(`✗ Failed to load: ${link.href}`);
                    }
                })
                .catch(error => {
                    console.warn(`✗ Error loading: ${link.href}`, error.message);
                });
        } else {
            // External stylesheet - just log
            console.log(`✓ External stylesheet: ${link.href}`);
        }
        
        // Check if the stylesheet has actually loaded
        if (link.sheet) {
            console.log(`✓ CSS rules loaded for: ${link.href}`);
        } else {
            console.warn(`⚠ No CSS rules found for: ${link.href}`);
        }
    });
}

function checkCSSConflicts() {
    console.log('Checking for CSS conflicts...');
    
    // Check button styles
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        const styles = window.getComputedStyle(btn);
        if (styles.width === '100%' && !btn.classList.contains('btn-full')) {
            console.warn(`Button has unexpected full width:`, btn);
            // Fix: Remove full width if not intended
            if (btn.classList.contains('btn-mentor') || btn.classList.contains('btn-mentee')) {
                btn.style.width = 'auto';
                btn.style.display = 'inline-block';
            }
        }
    });
    
    // Check container styles
    const container = document.querySelector('.container');
    if (container) {
        const styles = window.getComputedStyle(container);
        console.log('Container styles:', {
            maxWidth: styles.maxWidth,
            margin: styles.margin,
            padding: styles.padding
        });
    }
}

function checkElementVisibility() {
    console.log('Checking element visibility...');
    
    const elements = [
        '.container',
        'header',
        '.selection-container',
        '.selection-card',
        '.card',
        '.features'
    ];
    
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (!isVisible) {
                console.warn(`Element not visible: ${selector}`, rect);
                // Try to make it visible
                element.style.display = element.style.display === 'none' ? 'block' : element.style.display;
                element.style.visibility = 'visible';
            } else {
                console.log(`✓ Element visible: ${selector}`);
            }
        } else {
            console.warn(`Element not found: ${selector}`);
            // Don't throw error, just log warning
        }
    });
}

function applyFixes() {
    console.log('Applying automatic fixes...');
    
    // Fix 1: Ensure proper button styling
    const mentorBtn = document.querySelector('.btn-mentor');
    const menteeBtn = document.querySelector('.btn-mentee');
    
    if (mentorBtn) {
        mentorBtn.style.width = 'auto';
        mentorBtn.style.display = 'inline-block';
    }
    
    if (menteeBtn) {
        menteeBtn.style.width = 'auto';
        menteeBtn.style.display = 'inline-block';
    }
    
    // Fix 2: Ensure cards are properly displayed
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (card.offsetHeight === 0) {
            card.style.minHeight = '400px';
            console.log('Fixed card height');
        }
    });
    
    // Fix 3: Check for font loading issues
    if (document.fonts) {
        document.fonts.ready.then(() => {
            console.log('All fonts loaded successfully');
        });
    }
    
    // Fix 4: Add fallback for emoji icons if not supported
    const iconElements = document.querySelectorAll('.card-icon i');
    iconElements.forEach(icon => {
        if (!icon.textContent.trim()) {
            if (icon.classList.contains('icon-mentor')) {
                icon.textContent = '👨‍🏫';
            } else if (icon.classList.contains('icon-mentee')) {
                icon.textContent = '👨‍🎓';
            }
        }
    });
    
    console.log('Fixes applied successfully');
}

// Export for debugging
window.homepageDiagnostic = {
    checkStylesheets,
    checkCSSConflicts,
    checkElementVisibility,
    applyFixes,
    
    // Manual fix function
    fixDisplay: function() {
        // Remove any conflicting styles
        const buttons = document.querySelectorAll('.btn-mentor, .btn-mentee');
        buttons.forEach(btn => {
            btn.style.width = 'auto';
            btn.style.display = 'inline-block';
            btn.style.padding = '12px 24px';
        });
        
        // Ensure cards are visible
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.display = 'block';
            card.style.visibility = 'visible';
        });
        
        console.log('Manual display fix applied');
    }
};
