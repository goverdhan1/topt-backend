const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testVoiceOTP() {
    try {
        console.log('🧪 Testing Voice OTP Functionality');
        console.log('==================================');

        // Step 1: Check if server is running
        console.log('\n1. Checking server health...');
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server is not running. Please start the server first:');
            console.log('   npm run dev');
            return;
        }

        // Step 2: Test voice OTP endpoint directly
        console.log('\n2. Testing voice OTP endpoint...');
        const testCode = '123456';

        try {
            const response = await axios.get(`${BASE_URL}/api/twilio/voice-otp?code=${testCode}`);

            if (response.status === 200) {
                console.log('✅ Voice OTP endpoint is accessible');
                console.log('📝 Response type:', response.headers['content-type']);
                console.log('📝 Response preview:', response.data.substring(0, 200) + '...');

                // Check if TwiML contains the OTP code
                if (response.data.includes(testCode)) {
                    console.log('✅ TwiML contains the OTP code');
                } else {
                    console.log('❌ TwiML does not contain the OTP code');
                }

                // Check if TwiML has proper structure
                if (response.data.includes('<Say>') && response.data.includes('</Say>')) {
                    console.log('✅ TwiML has proper Say elements');
                } else {
                    console.log('❌ TwiML missing proper Say elements');
                }

            } else {
                console.log('❌ Voice OTP endpoint returned unexpected status:', response.status);
            }
        } catch (error) {
            console.log('❌ Voice OTP endpoint error:', error.message);
        }

        // Step 3: Test with invalid request (no code)
        console.log('\n3. Testing voice OTP with invalid request...');
        try {
            const response = await axios.get(`${BASE_URL}/api/twilio/voice-otp`);

            if (response.status === 400) {
                console.log('✅ Invalid request properly handled');
            } else {
                console.log('❌ Invalid request should return 400, got:', response.status);
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Invalid request properly handled');
            } else {
                console.log('❌ Unexpected error for invalid request:', error.message);
            }
        }

        // Step 4: Test Twilio service status
        console.log('\n4. Checking Twilio service status...');
        try {
            const statusResponse = await axios.get(`${BASE_URL}/api/twilio/status`);
            console.log('✅ Twilio status:', statusResponse.data);
        } catch (error) {
            console.log('❌ Twilio status check failed:', error.message);
        }

        console.log('\n📋 Summary:');
        console.log('   - Voice OTP endpoint should be accessible at /api/twilio/voice-otp');
        console.log('   - TwiML should contain the OTP code in Say elements');
        console.log('   - Invalid requests should return 400 status');
        console.log('   - Server should handle voice OTP requests properly');

        console.log('\n🎯 Next Steps:');
        console.log('   1. Start your server: npm run dev');
        console.log('   2. Test with real Twilio credentials');
        console.log('   3. Add a user through admin dashboard to trigger voice OTP');
        console.log('   4. Check server logs for voice OTP generation');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
testVoiceOTP();
