const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const mobile = '+1987654321';
const otp = '240482'; // Generated TOTP code

async function testNewUserVerifyOTP() {
    console.log('🔍 Testing /verify-otp for new user');
    console.log('====================================');

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            mobile,
            otp
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Verify OTP successful for new user');
            console.log('Token received:', response.data.token ? 'Yes' : 'No');
            console.log('TOTP enabled after verification');
        } else {
            console.log('❌ Verify OTP failed:', response.data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testNewUserVerifyOTP();
