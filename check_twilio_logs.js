const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function checkTwilioLogs() {
    try {
        console.log('🔍 Checking Server Logs for Twilio Issues');
        console.log('=========================================');

        console.log('\n📋 Instructions for debugging:');
        console.log('1. Open a new terminal and start your server with verbose logging:');
        console.log('   npm run dev');
        console.log('\n2. In the server terminal, you should see detailed logs when OTP is requested');

        console.log('\n3. Now let\'s test OTP request and see what the server logs show...');

        // Test OTP request
        const testPhone = '+15714305024';
        console.log(`\n📱 Testing OTP request for: ${testPhone}`);

        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: testPhone
        });

        console.log('📝 API Response:', response.data);

        console.log('\n4. Check your server console/terminal for these log entries:');
        console.log('   - "Twilio OTP send error:" (if there are API errors)');
        console.log('   - "Twilio credentials not configured" (if using placeholders)');
        console.log('   - "Mock OTP sent" (if Twilio not configured)');
        console.log('   - Actual Twilio API response details');

        console.log('\n5. If you see "Mock OTP sent", then Twilio is not configured');
        console.log('   - Check your .env file for placeholder values');
        console.log('   - Replace with real Twilio credentials');

        console.log('\n6. If you see Twilio API errors, check:');
        console.log('   - Twilio account balance');
        console.log('   - Phone number validity');
        console.log('   - API rate limits');

        console.log('\n7. To get real Twilio credentials:');
        console.log('   - Go to https://console.twilio.com');
        console.log('   - Get your Account SID and Auth Token');
        console.log('   - Create a Verify Service for OTP');
        console.log('   - Update your .env file');

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

// Run the check
checkTwilioLogs();
