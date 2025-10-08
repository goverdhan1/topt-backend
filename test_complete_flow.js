const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testCompleteFlow() {
    try {
        console.log('🔄 Testing Complete Twilio Flow');
        console.log('===============================');

        // Step 1: Admin Login
        console.log('\n1. Admin Login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            username: 'admin',
            password: 'demo123'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Admin login failed:', loginResponse.data.error);
            return;
        }

        const adminToken = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // Step 2: Create a test user
        console.log('\n2. Creating test user...');
        const testPhone = '+15714305024';

        const createUserResponse = await axios.post(`${BASE_URL}/api/admin/users`, {
            mobile: testPhone,
            otpCode: '123456' // Mock OTP for testing
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (createUserResponse.data.success) {
            console.log('✅ User created successfully');
            console.log('📱 Phone:', createUserResponse.data.user.mobileNumber);
        } else {
            console.log('❌ User creation failed:', createUserResponse.data.error);
            // Continue anyway to test OTP sending
        }

        // Step 3: Test OTP sending to the user
        console.log('\n3. Testing OTP sending...');
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: testPhone
        });

        if (otpResponse.data.success) {
            console.log('✅ OTP request successful');
            console.log('📱 Phone:', otpResponse.data.to);
            console.log('📝 Message:', otpResponse.data.message);

            if (otpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - SMS was not actually sent');
                console.log('🔧 Issue: Twilio credentials may not be properly loaded');
            } else {
                console.log('📨 Real SMS should have been sent to:', otpResponse.data.to);
                console.log('🎉 SUCCESS! Real OTP sent via Twilio!');
            }
        } else {
            console.log('❌ OTP request failed');
            console.log('Error:', otpResponse.data.error);
        }

        // Step 4: Test admin OTP sending
        console.log('\n4. Testing admin OTP sending...');
        const adminOtpResponse = await axios.post(`${BASE_URL}/api/admin/send-otp`, {
            mobile: testPhone
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (adminOtpResponse.data.success) {
            console.log('✅ Admin OTP request successful');
            console.log('📱 Phone:', adminOtpResponse.data.formattedMobile);
            console.log('📝 Message:', adminOtpResponse.data.message);

            if (adminOtpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - SMS was not actually sent');
            } else {
                console.log('📨 Real SMS should have been sent to:', adminOtpResponse.data.formattedMobile);
                console.log('🎉 SUCCESS! Real admin OTP sent via Twilio!');
            }
        } else {
            console.log('❌ Admin OTP request failed');
            console.log('Error:', adminOtpResponse.data.error);
        }

        // Step 5: Check Twilio status
        console.log('\n5. Checking Twilio configuration...');
        const statusResponse = await axios.get(`${BASE_URL}/api/twilio/status`);

        if (statusResponse.data.success) {
            console.log('✅ Twilio status endpoint working');
            console.log('📊 Configuration Status:', statusResponse.data.twilio);

            if (statusResponse.data.twilio.configured) {
                console.log('✅ Twilio is configured and ready');
                console.log('🎉 OTP should be sent via real SMS');
            } else {
                console.log('❌ Twilio is NOT configured');
                console.log('📝 Current status:', statusResponse.data.twilio);
            }
        } else {
            console.log('❌ Failed to get Twilio status');
            console.log('Error:', statusResponse.data.error);
        }

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
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
        console.error('   node server/index.js');
        return false;
    }
}

// Run the test
async function runTest() {
    const serverRunning = await checkServerHealth();
    if (serverRunning) {
        await testCompleteFlow();
    }
}

runTest();
