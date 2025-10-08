const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'demo123'
};

async function testAdminOTPVerificationFlow() {
    let adminToken = null;

    try {
        console.log('🧪 Testing Admin OTP Verification Flow');
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

        // Step 2: Add a new user (this should trigger Caller ID verification)
        console.log('\n2. Adding a new user...');
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
            console.log('📊 Verification Status:', createUserResponse.data.user.verificationStatus);

            if (createUserResponse.data.user.callerIdSid === 'mock-caller-id-sid') {
                console.log('ℹ️  Note: Using mock Twilio verification (credentials not configured)');
            }
        } else {
            throw new Error(`User creation failed: ${createUserResponse.data.error}`);
        }

        // Step 3: Get the user details to check verification status
        console.log('\n3. Checking user verification status...');
        const listUsersResponse = await axios.get(
            `${BASE_URL}/api/admin/users`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (listUsersResponse.data.success && listUsersResponse.data.users.length > 0) {
            const newUser = listUsersResponse.data.users[0]; // Most recent user
            console.log('✅ User found in list');
            console.log(`📊 Status: ${newUser.verification_status}`);
            console.log(`✅ Verified: ${newUser.is_verified}`);

            // Step 4: Test OTP verification (using mock code for testing)
            if (!newUser.is_verified) {
                console.log('\n4. Testing OTP verification...');
                const otpCode = '123456'; // Mock OTP code

                const verifyResponse = await axios.put(
                    `${BASE_URL}/api/admin/users/${newUser.id}/verify-with-otp`,
                    { otpCode: otpCode },
                    {
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (verifyResponse.data.success) {
                    console.log('✅ OTP verification successful!');
                    console.log('🎉 User is now verified');
                } else {
                    console.log('❌ OTP verification failed:', verifyResponse.data.error);
                }
            } else {
                console.log('ℹ️  User is already verified, skipping OTP verification test');
            }
        } else {
            throw new Error('Failed to retrieve user list');
        }

        // Step 5: Verify the user is now verified
        console.log('\n5. Final verification check...');
        const finalUsersResponse = await axios.get(
            `${BASE_URL}/api/admin/users`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (finalUsersResponse.data.success && finalUsersResponse.data.users.length > 0) {
            const updatedUser = finalUsersResponse.data.users[0];
            console.log(`✅ Final Status: ${updatedUser.verification_status}`);
            console.log(`✅ Final Verified: ${updatedUser.is_verified}`);

            if (updatedUser.is_verified) {
                console.log('🎉 SUCCESS: User verification flow completed successfully!');
            } else {
                console.log('⚠️  User is not verified yet');
            }
        }

        console.log('\n📋 Summary:');
        console.log('   - Admin can add users with Caller ID verification');
        console.log('   - Users receive verification calls/SMS');
        console.log('   - Admin can verify users by entering OTP codes');
        console.log('   - Verified users get is_verified = true');

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
        await testAdminOTPVerificationFlow();
    }
}

runTest();
