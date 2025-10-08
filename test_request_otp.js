const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRequestOTP() {
    console.log('🔍 Testing /request-otp endpoint');
    console.log('================================');

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: '+1234567890'
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Request OTP successful');
            if (response.data.enabled) {
                console.log('✅ TOTP already enabled');
            } else {
                console.log('✅ TOTP setup initiated, QR data provided');
                console.log('Secret:', response.data.secret);
            }
        } else {
            console.log('❌ Request OTP failed:', response.data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testRequestOTP();
