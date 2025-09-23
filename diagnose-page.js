// Diagnostic script to test homepage rendering
const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        console.log('🔍 Starting browser diagnostic...');
        
        browser = await puppeteer.launch({
            headless: false, // Show browser for visual confirmation
            devtools: true,  // Open devtools to see console
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        
        const page = await browser.newPage();
        
        // Listen for console messages
        page.on('console', msg => {
            console.log(`📝 Browser Console [${msg.type()}]:`, msg.text());
        });
        
        // Listen for errors
        page.on('pageerror', error => {
            console.error(`❌ Page Error:`, error.message);
        });
        
        // Listen for failed requests
        page.on('requestfailed', request => {
            console.error(`❌ Failed Request: ${request.url()} - ${request.failure().errorText}`);
        });
        
        console.log('📊 Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // Wait a moment for everything to load
        await page.waitForTimeout(2000);
        
        // Check if CSS loaded
        const cssLoaded = await page.evaluate(() => {
            const styles = window.getComputedStyle(document.querySelector('.selection-container'));
            return {
                display: styles.display,
                justifyContent: styles.justifyContent,
                gap: styles.gap,
                hasStylesheet: document.querySelectorAll('link[rel="stylesheet"]').length > 0
            };
        });
        
        console.log('🎨 CSS Status:', cssLoaded);
        
        // Check if elements exist
        const elements = await page.evaluate(() => {
            return {
                selectionContainer: !!document.querySelector('.selection-container'),
                mentorCard: !!document.querySelector('.mentor-card'),
                menteeCard: !!document.querySelector('.mentee-card'),
                buttons: document.querySelectorAll('button').length,
                stylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href)
            };
        });
        
        console.log('🏗️  DOM Elements:', elements);
        
        // Take a screenshot
        await page.screenshot({ 
            path: 'C:\\Users\\suren\\mentor-mentee-platform\\homepage-screenshot.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved: homepage-screenshot.png');
        
        // Keep browser open for manual inspection
        console.log('✅ Diagnostic complete! Browser will stay open for manual inspection.');
        console.log('🔍 Check the browser DevTools console for any additional errors.');
        console.log('🚪 Close this terminal to close the browser.');
        
        // Wait indefinitely until user closes
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
        
        // Try simple HTTP test instead
        console.log('🔧 Falling back to simple HTTP test...');
        const http = require('http');
        
        const req = http.get('http://localhost:3000', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📊 HTTP Status: ${res.statusCode}`);
                console.log(`📄 Content-Type: ${res.headers['content-type']}`);
                console.log(`📏 Content Length: ${data.length} characters`);
                console.log(`🔍 First 200 chars: ${data.substring(0, 200)}...`);
                
                // Check if it contains expected elements
                const hasSelectionContainer = data.includes('selection-container');
                const hasCSSLinks = data.includes('components/home/home.css');
                console.log(`✅ Has selection-container: ${hasSelectionContainer}`);
                console.log(`✅ Has CSS links: ${hasCSSLinks}`);
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ HTTP Request failed:', error.message);
        });
    } finally {
        if (browser && false) { // Don't auto-close for now
            await browser.close();
        }
    }
})();
