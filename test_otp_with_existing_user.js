const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testOTPWithExistingUser() {
    try {
        console.log('🔍 Testing OTP with Existing User');
        console.log('=================================');

        // Test with the existing user from database
        const testPhone = '+919885514982';

        console.log(`\n📱 Testing with existing user: ${testPhone}`);

        // Step 1: Request OTP
        console.log('\n1. Requesting OTP...');
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: testPhone
        });

        if (otpResponse.data.success) {
            console.log('✅ OTP request successful');
            console.log('📝 Response:', otpResponse.data);

            if (otpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - SMS was not actually sent');
                console.log('🔧 Issue: Twilio is not properly configured');
            } else {
                console.log('📨 Real SMS should have been sent to:', otpResponse.data.to);
                console.log('🎉 If you received the SMS, the issue is resolved!');
            }
        } else {
            console.log('❌ OTP request failed');
            console.log('Error:', otpResponse.data.error);
        }

        // Step 2: Check Twilio status again
        console.log('\n2. Checking Twilio configuration...');
        const statusResponse = await axios.get(`${BASE_URL}/api/twilio/status`);

        if (statusResponse.data.success) {
            console.log('📊 Twilio Status:', statusResponse.data.twilio);

            if (!statusResponse.data.twilio.configured) {
                console.log('\n🔧 SOLUTION: Update your .env file with real Twilio credentials:');
                console.log('   TWILIO_ACCOUNT_SID=your_actual_account_sid');
                console.log('   TWILIO_AUTH_TOKEN=your_actual_auth_token');
                console.log('   TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid');
                console.log('\n   Get these from: https://console.twilio.com');
            }
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

// Run the test
testOTPWithExistingUser();
