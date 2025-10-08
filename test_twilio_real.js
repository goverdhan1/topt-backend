const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testTwilioWithRealCredentials() {
    try {
        console.log('🔍 Testing Twilio with Real Credentials');
        console.log('=====================================');

        // Step 1: Check Twilio status endpoint
        console.log('\n1. Checking Twilio service status...');
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
                console.log('⚠️  OTP requests will return mock responses');
            }
        } else {
            console.log('❌ Failed to get Twilio status');
            console.log('Error:', statusResponse.data.error);
        }

        // Step 2: Test OTP sending with a real phone number
        console.log('\n2. Testing OTP sending with real phone number...');
        const testPhone = '+919885514982'; // Use the phone number from the database

        console.log(`📱 Testing with phone number: ${testPhone}`);

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

        // Step 3: Test admin OTP sending
        console.log('\n3. Testing admin OTP sending...');
        const adminOtpResponse = await axios.post(`${BASE_URL}/api/admin/send-otp`, {
            mobile: testPhone
        });

        if (adminOtpResponse.data.success) {
            console.log('✅ Admin OTP request successful');
            console.log('📱 Phone:', adminOtpResponse.data.to);
            console.log('📝 Message:', adminOtpResponse.data.message);

            if (adminOtpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - SMS was not actually sent');
            } else {
                console.log('📨 Real SMS should have been sent to:', adminOtpResponse.data.to);
                console.log('🎉 SUCCESS! Real admin OTP sent via Twilio!');
            }
        } else {
            console.log('❌ Admin OTP request failed');
            console.log('Error:', adminOtpResponse.data.error);
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
        await testTwilioWithRealCredentials();
    }
}

runTest();
