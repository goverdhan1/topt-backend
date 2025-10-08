const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testVerifyOTP() {
    console.log('🔍 Testing /verify-otp endpoint');
    console.log('=================================');

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            mobile: '+1234567890',
            otp: '120002'
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ OTP verification successful');
            console.log('Token:', response.data.token ? 'Present' : 'Missing');
        } else {
            console.log('❌ OTP verification failed:', response.data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testVerifyOTP();
