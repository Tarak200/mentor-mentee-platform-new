#!/usr/bin/env node

/**
 * Login Test Script - Test actual login functionality
 * Usage: node test-login.js
 */

const http = require('http');

console.log('🔐 TESTING LOGIN FUNCTIONALITY\n');

// Test credentials from database
const testCredentials = [
    { email: 'sarah.johnson@email.com', password: 'password123', role: 'mentor' },
    { email: 'alex.thompson@email.com', password: 'password123', role: 'mentee' },
    { email: 'admin@mentorlink.com', password: 'password123', role: 'admin' }
];

async function testLogin(credentials) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            email: credentials.email,
            password: credentials.password
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        response: response,
                        credentials: credentials
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        error: 'Invalid JSON response',
                        rawData: data,
                        credentials: credentials
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({
                status: 'ERROR',
                error: error.message,
                credentials: credentials
            });
        });

        req.setTimeout(10000, () => {
            req.abort();
            resolve({
                status: 'TIMEOUT',
                error: 'Request timeout',
                credentials: credentials
            });
        });

        req.write(postData);
        req.end();
    });
}

async function testServerHealth() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            resolve({ status: res.statusCode, healthy: res.statusCode === 200 });
        });

        req.on('error', (error) => {
            resolve({ status: 'ERROR', error: error.message, healthy: false });
        });

        req.setTimeout(5000, () => {
            req.abort();
            resolve({ status: 'TIMEOUT', healthy: false });
        });

        req.end();
    });
}

async function runLoginTests() {
    try {
        // First check if server is running
        console.log('🏥 Checking server health...');
        const healthCheck = await testServerHealth();
        
        if (!healthCheck.healthy) {
            console.log('❌ Server is not running or not responding');
            console.log(`   Status: ${healthCheck.status}`);
            if (healthCheck.error) {
                console.log(`   Error: ${healthCheck.error}`);
            }
            console.log('\n💡 Please make sure the server is running:');
            console.log('   cd backend && npm start');
            console.log('   OR: npm start (from root directory)');
            return;
        }
        
        console.log('✅ Server is healthy and responding\n');
        
        // Test each login credential
        for (let i = 0; i < testCredentials.length; i++) {
            const cred = testCredentials[i];
            console.log(`🧪 Test ${i + 1}: Testing login for ${cred.email} (${cred.role})`);
            
            const result = await testLogin(cred);
            
            if (result.status === 200 && result.response?.success) {
                console.log('✅ LOGIN SUCCESS');
                console.log(`   Token: ${result.response.data.token ? 'Generated ✓' : 'Missing ✗'}`);
                console.log(`   User: ${result.response.data.user?.firstName} ${result.response.data.user?.lastName}`);
                console.log(`   Role: ${result.response.data.user?.role}`);
            } else if (result.status === 401) {
                console.log('❌ LOGIN FAILED - Invalid credentials');
                if (result.response?.message) {
                    console.log(`   Message: ${result.response.message}`);
                }
            } else if (result.status === 'ERROR') {
                console.log('❌ CONNECTION ERROR');
                console.log(`   Error: ${result.error}`);
            } else {
                console.log(`❌ LOGIN FAILED - Status: ${result.status}`);
                if (result.response?.message) {
                    console.log(`   Message: ${result.response.message}`);
                }
                if (result.error) {
                    console.log(`   Error: ${result.error}`);
                }
                if (result.rawData && result.rawData.length < 500) {
                    console.log(`   Raw Response: ${result.rawData}`);
                }
            }
            console.log();
        }
        
        // Test API endpoints
        console.log('🔍 Testing API endpoints...');
        const endpoints = [
            '/api/auth/login',
            '/api/auth/register', 
            '/mentor/login',
            '/mentee/login'
        ];
        
        for (const endpoint of endpoints) {
            const result = await testEndpoint(endpoint);
            const status = result.status === 404 ? '❌ Not Found' : 
                         result.status >= 200 && result.status < 300 ? '✅ Available' :
                         result.status === 405 ? '⚠️  Method not allowed (normal for GET)' : 
                         `⚠️  Status ${result.status}`;
            console.log(`${endpoint.padEnd(25)} ${status}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

async function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            resolve({ status: res.statusCode });
        });

        req.on('error', (error) => {
            resolve({ status: 'ERROR', error: error.message });
        });

        req.setTimeout(5000, () => {
            req.abort();
            resolve({ status: 'TIMEOUT' });
        });

        req.end();
    });
}

// Show diagnosis info
console.log('📋 DIAGNOSIS INFORMATION:');
console.log('Server URL: http://localhost:3000');
console.log('Login API: http://localhost:3000/api/auth/login');
console.log('Expected Method: POST');
console.log('Expected Headers: Content-Type: application/json');
console.log();

runLoginTests().then(() => {
    console.log('🏁 Login tests completed!');
    console.log('\n💡 If login fails:');
    console.log('1. Check if server is running: npm start');
    console.log('2. Check database has users: node view-database.js');
    console.log('3. Check server logs for errors');
    console.log('4. Verify JWT_SECRET in .env file');
});
