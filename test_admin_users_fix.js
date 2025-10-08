const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'demo123'
};

async function testAdminUsersEndpoint() {
    let adminToken = null;

    try {
        console.log('🧪 Testing Admin Users Endpoint Fix');
        console.log('=====================================');

        // Step 1: Login as admin to get token
        console.log('\n1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, ADMIN_CREDENTIALS);

        if (loginResponse.data.success) {
            adminToken = loginResponse.data.token;
            console.log('✅ Admin login successful');
            console.log(`📝 Token: ${adminToken.substring(0, 50)}...`);
        } else {
            throw new Error('Admin login failed');
        }

        // Step 2: Test POST /api/admin/users with a new mobile number
        console.log('\n2. Testing POST /api/admin/users...');
        const testMobile = '+1234567890';
        const userData = { mobile: testMobile };

        const createUserResponse = await axios.post(
            `${BASE_URL}/api/admin/users`,
            userData,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (createUserResponse.data.success) {
            console.log('✅ User creation successful!');
            console.log('📱 Mobile:', createUserResponse.data.user.mobileNumber);
            console.log('🔑 Caller ID SID:', createUserResponse.data.user.callerIdSid);
            console.log('📝 Validation Code:', createUserResponse.data.user.validationCode);
            console.log('📊 Verification Status:', createUserResponse.data.user.verificationStatus);

            if (createUserResponse.data.user.callerIdSid === 'mock-caller-id-sid') {
                console.log('ℹ️  Note: Using mock Twilio verification (credentials not configured)');
            }
        } else {
            throw new Error(`User creation failed: ${createUserResponse.data.error}`);
        }

        // Step 3: Test GET /api/admin/users to list users
        console.log('\n3. Testing GET /api/admin/users...');
        const listUsersResponse = await axios.get(
            `${BASE_URL}/api/admin/users`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (listUsersResponse.data.success) {
            console.log('✅ Users list retrieved successfully!');
            console.log(`📊 Total users: ${listUsersResponse.data.pagination.total}`);
            console.log(`📄 Current page: ${listUsersResponse.data.pagination.page}`);
            console.log(`📈 Pages: ${listUsersResponse.data.pagination.pages}`);

            if (listUsersResponse.data.users.length > 0) {
                console.log('\n👥 Recent users:');
                listUsersResponse.data.users.slice(0, 3).forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.mobile_number} (${user.verification_status})`);
                });
            }
        } else {
            throw new Error(`List users failed: ${listUsersResponse.data.error}`);
        }

        console.log('\n🎉 All tests passed! The 500 error has been fixed.');
        console.log('📋 Summary:');
        console.log('   - Environment variables configured with placeholders');
        console.log('   - Twilio service gracefully handles missing credentials');
        console.log('   - User creation works with optional phone verification');
        console.log('   - Admin endpoints are functioning correctly');

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        process.exit(1);
    }
}

// Check if server is running first
async function checkServerHealth() {
    try {
        console.log('🔍 Checking server health...');
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        console.error('❌ Server is not running. Please start the server first:');
        console.error('   npm run dev');
        return false;
    }
}

// Run the test
async function runTest() {
    const serverRunning = await checkServerHealth();
    if (serverRunning) {
        await testAdminUsersEndpoint();
    }
}

runTest();
