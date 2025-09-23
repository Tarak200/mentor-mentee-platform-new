const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

class ServerTester {
    constructor(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
        this.results = [];
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.serverUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ServerTester/1.0'
                }
            };

            if (data) {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: parsedData
                        });
                    } catch (err) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: responseData
                        });
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200) {
        try {
            this.log(`Testing ${name}...`, 'blue');
            const response = await this.makeRequest(path, method, data);
            
            const success = response.statusCode === expectedStatus;
            const result = {
                name,
                path,
                method,
                expected: expectedStatus,
                actual: response.statusCode,
                success,
                response: response.data
            };
            
            this.results.push(result);
            
            if (success) {
                this.log(`✅ ${name} - Status: ${response.statusCode}`, 'green');
            } else {
                this.log(`❌ ${name} - Expected: ${expectedStatus}, Got: ${response.statusCode}`, 'red');
            }
            
            return result;
        } catch (error) {
            const result = {
                name,
                path,
                method,
                expected: expectedStatus,
                actual: 'ERROR',
                success: false,
                error: error.message
            };
            
            this.results.push(result);
            this.log(`❌ ${name} - Error: ${error.message}`, 'red');
            return result;
        }
    }

    async checkServerHealth() {
        this.log('🏥 Checking server health...', 'yellow');
        
        try {
            const response = await this.makeRequest('/');
            if (response.statusCode === 200) {
                this.log('✅ Server is responding', 'green');
                return true;
            } else {
                this.log(`❌ Server responded with status ${response.statusCode}`, 'red');
                return false;
            }
        } catch (error) {
            this.log(`❌ Server is not responding: ${error.message}`, 'red');
            return false;
        }
    }

    async checkFileStructure() {
        this.log('📁 Checking file structure...', 'yellow');
        
        const requiredFiles = [
            'backend/server.js',
            'backend/routes/auth.js',
            'backend/routes/mentor.js',
            'backend/routes/mentee.js',
            'backend/routes/user.js',
            'backend/routes/notifications.js',
            'backend/services/userService.js',
            'backend/services/mentorService.js',
            'backend/services/menteeService.js',
            'backend/services/emailService.js',
            'frontend/components/auth/auth.html',
            'frontend/components/mentor-dashboard/mentor-dashboard.html',
            'frontend/components/mentee-dashboard/mentee-dashboard.html'
        ];

        const projectRoot = path.join(__dirname, '..', '..');
        let allExist = true;

        for (const file of requiredFiles) {
            const fullPath = path.join(projectRoot, file);
            try {
                await fs.access(fullPath);
                this.log(`✅ ${file}`, 'green');
            } catch (error) {
                this.log(`❌ ${file} - Not found`, 'red');
                allExist = false;
            }
        }

        return allExist;
    }

    async runAPITests() {
        this.log('🚀 Running API endpoint tests...', 'yellow');
        
        // Test public endpoints (should be accessible without auth)
        await this.testEndpoint('Home Page', '/', 'GET', null, 200);
        await this.testEndpoint('Login Page', '/login', 'GET', null, 200);
        await this.testEndpoint('Register Page', '/register', 'GET', null, 200);
        
        // Test API endpoints (may require auth or return proper error codes)
        await this.testEndpoint('Auth Login', '/api/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
        }, 401);
        
        await this.testEndpoint('Auth Register', '/api/auth/register', 'POST', {
            email: 'invalid-data'
        }, 400);
        
        // Test protected endpoints (should return 401 without auth)
        await this.testEndpoint('Mentor Stats', '/api/mentor/stats', 'GET', null, 401);
        await this.testEndpoint('User Profile', '/api/user/profile', 'GET', null, 401);
        await this.testEndpoint('Notifications', '/api/notifications', 'GET', null, 401);
        
        // Test non-existent endpoint
        await this.testEndpoint('Non-existent Endpoint', '/api/nonexistent', 'GET', null, 404);
    }

    async runFullTest() {
        this.log('🎯 Starting comprehensive server test...', 'blue');
        this.log('=' * 50, 'blue');
        
        // Check file structure
        const filesOk = await this.checkFileStructure();
        if (!filesOk) {
            this.log('⚠️  Some required files are missing. Server may not start properly.', 'yellow');
        }
        
        this.log(''); // Empty line
        
        // Check server health
        const serverHealthy = await this.checkServerHealth();
        if (!serverHealthy) {
            this.log('❌ Server is not running. Please start it with: npm start', 'red');
            return;
        }
        
        this.log(''); // Empty line
        
        // Run API tests
        await this.runAPITests();
        
        // Generate report
        this.generateReport();
    }

    generateReport() {
        this.log(''); // Empty line
        this.log('📊 Test Results Summary', 'blue');
        this.log('=' * 50, 'blue');
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;
        
        this.log(`Total Tests: ${total}`);
        this.log(`Passed: ${passed}`, passed === total ? 'green' : 'yellow');
        this.log(`Failed: ${failed}`, failed === 0 ? 'green' : 'red');
        
        if (failed > 0) {
            this.log(''); // Empty line
            this.log('❌ Failed Tests:', 'red');
            this.results.filter(r => !r.success).forEach(result => {
                this.log(`  • ${result.name} (${result.method} ${result.path})`, 'red');
                if (result.error) {
                    this.log(`    Error: ${result.error}`, 'red');
                } else {
                    this.log(`    Expected: ${result.expected}, Got: ${result.actual}`, 'red');
                }
            });
        }
        
        this.log(''); // Empty line
        
        if (passed === total) {
            this.log('🎉 All tests passed! Your server is working correctly.', 'green');
        } else if (passed > total * 0.5) {
            this.log('⚠️  Most tests passed. Check the failed tests above.', 'yellow');
        } else {
            this.log('❌ Many tests failed. Please review your server setup.', 'red');
        }
    }
}

// Instructions for running the test
function printInstructions() {
    console.log(`${colors.blue}📋 Server Testing Instructions:${colors.reset}
    
1. First, make sure your server is running:
   ${colors.yellow}npm start${colors.reset}
   
2. Then run this test in another terminal:
   ${colors.yellow}node backend/scripts/testServer.js${colors.reset}
   
3. Or use the npm script:
   ${colors.yellow}npm test${colors.reset}
   
${colors.blue}💡 What this test checks:${colors.reset}
   - File structure is complete
   - Server responds to requests
   - API endpoints return expected status codes
   - Authentication is working properly
   - Static files are served correctly
   
${colors.green}Starting test in 3 seconds...${colors.reset}
`);
}

// Run the test
async function runTest() {
    printInstructions();
    
    // Wait 3 seconds to let user read instructions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const tester = new ServerTester();
    await tester.runFullTest();
}

// Export for use in other files
module.exports = ServerTester;

// Run test if called directly
if (require.main === module) {
    runTest().catch(console.error);
}
