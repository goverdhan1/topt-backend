const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function resetRateLimit() {
    try {
        console.log('🔄 Resetting Rate Limit and Testing OTP');
        console.log('=====================================');

        console.log('\n📋 Issue Identified:');
        console.log('   - Rate limit: 3 OTP requests per 5 minutes per IP');
        console.log('   - You hit the limit due to multiple test requests');
        console.log('   - Need to wait or reset the rate limit');

        console.log('\n🔧 Solutions:');
        console.log('   1. Wait 5 minutes for rate limit to reset');
        console.log('   2. Use a different IP address (if possible)');
        console.log('   3. Temporarily increase rate limit for testing');
        console.log('   4. Clear rate limit data (if using Redis)');

        // Test with a longer wait time
        console.log('\n⏰ Waiting 10 seconds before testing again...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('\n📱 Testing OTP request after wait...');
        const testPhone = '+15714305024';

        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: testPhone
        });

        if (response.data.success) {
            console.log('✅ OTP request successful!');
            console.log('📝 Response:', response.data);

            if (response.data.message.includes('Mock')) {
                console.log('ℹ️  Still getting mock response - Twilio not configured');
            } else {
                console.log('📨 Real SMS should be sent now!');
                console.log('🎉 Check your phone for the SMS');
            }
        } else {
            console.log('❌ Still rate limited or other error:');
            console.log('   Error:', response.data.error);
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

// Run the reset test
resetRateLimit();
