const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testTwilioConfiguration() {
    try {
        console.log('🔍 Testing Twilio Configuration');
        console.log('===============================');

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
                console.log('\n🔧 To fix this, you need to:');
                console.log('   1. Get your Twilio credentials from https://console.twilio.com');
                console.log('   2. Update your .env file with:');
                console.log('      - TWILIO_ACCOUNT_SID=your_actual_account_sid');
                console.log('      - TWILIO_AUTH_TOKEN=your_actual_auth_token');
                console.log('      - TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid');
                console.log('   3. Restart your server');
            }
        } else {
            console.log('❌ Failed to get Twilio status');
            console.log('Error:', statusResponse.data.error);
        }

        // Step 2: Test OTP sending (will be mock if not configured)
        console.log('\n2. Testing OTP sending...');
        const testPhone = '+1234567890'; // Test phone number
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: testPhone
        });

        if (otpResponse.data.success) {
            console.log('✅ OTP request successful');
            console.log('📱 Phone:', otpResponse.data.to);
            console.log('📝 Message:', otpResponse.data.message);

            if (otpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - SMS was not actually sent');
            } else {
                console.log('📨 Real SMS should have been sent to:', otpResponse.data.to);
            }
        } else {
            console.log('❌ OTP request failed');
            console.log('Error:', otpResponse.data.error);
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
        console.error('   npm run dev');
        return false;
    }
}

// Run the test
async function runTest() {
    const serverRunning = await checkServerHealth();
    if (serverRunning) {
        await testTwilioConfiguration();
    }
}

runTest();
