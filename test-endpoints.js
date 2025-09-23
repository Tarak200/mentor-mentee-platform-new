const http = require('http');

const endpoints = [
    { path: '/', name: 'Home Page' },
    { path: '/mentor/login', name: 'Mentor Login' },
    { path: '/mentee/login', name: 'Mentee Login' },
    { path: '/mentor-dashboard', name: 'Mentor Dashboard' },
    { path: '/mentee-dashboard', name: 'Mentee Dashboard' }
];

function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint.path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            resolve({
                name: endpoint.name,
                path: endpoint.path,
                status: res.statusCode,
                contentType: res.headers['content-type']
            });
        });

        req.on('error', (error) => {
            resolve({
                name: endpoint.name,
                path: endpoint.path,
                status: 'ERROR',
                error: error.message
            });
        });

        req.setTimeout(5000, () => {
            req.abort();
            resolve({
                name: endpoint.name,
                path: endpoint.path,
                status: 'TIMEOUT'
            });
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing all endpoints...\n');
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        if (result.status === 200) {
            console.log(`✅ ${result.name} (${result.path}) - OK`);
        } else if (result.status === 'ERROR') {
            console.log(`❌ ${result.name} (${result.path}) - ${result.error}`);
        } else {
            console.log(`⚠️  ${result.name} (${result.path}) - Status: ${result.status}`);
        }
    }
    
    console.log('\n🎉 Testing complete! Server is ready to use at http://localhost:3001');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3001 to see the homepage');
    console.log('2. Click "Get Started as Mentor" to go to mentor login/register');
    console.log('3. Click "Get Started as Mentee" to go to mentee login/register');
    console.log('4. Each login page includes both login and registration forms');
}

runTests();
