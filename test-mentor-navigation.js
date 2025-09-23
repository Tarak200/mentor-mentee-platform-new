const http = require('http');

async function testNavigation() {
    console.log('🔍 Testing Mentor Login Navigation...\n');
    
    const tests = [
        { name: 'Home Page', url: 'http://localhost:3000/' },
        { name: 'Mentor Login', url: 'http://localhost:3000/mentor/login' },
        { name: 'CSS - Shared', url: 'http://localhost:3000/components/shared/shared.css' },
        { name: 'CSS - Mentor Login', url: 'http://localhost:3000/components/mentor/login/login.css' },
        { name: 'JS - Mentor Auth', url: 'http://localhost:3000/components/mentor/login/mentor-auth.js' }
    ];
    
    for (const test of tests) {
        try {
            const result = await testURL(test.url);
            if (result.status === 200) {
                console.log(`✅ ${test.name}: OK (${result.contentType})`);
            } else {
                console.log(`❌ ${test.name}: Status ${result.status}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    }
    
    console.log('\n🎯 Navigation Test Summary:');
    console.log('1. Visit http://localhost:3000 (home page)');
    console.log('2. Click "Get Started as Mentor" button');
    console.log('3. Should navigate to http://localhost:3000/mentor/login');
    console.log('4. You should see the mentor login/register form');
    console.log('\n💡 If you still see issues:');
    console.log('- Clear browser cache (Ctrl+Shift+Del)');
    console.log('- Use incognito/private window');
    console.log('- Hard refresh (Ctrl+F5)');
    console.log('- Check browser console (F12) for errors');
}

function testURL(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            resolve({
                status: response.statusCode,
                contentType: response.headers['content-type'] || 'unknown'
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(5000, () => {
            request.abort();
            reject(new Error('Request timeout'));
        });
    });
}

testNavigation();
