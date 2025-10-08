const axios = require('axios');
const { authenticator } = require('otplib');

const BASE_URL = 'http://localhost:3001';
const mobile = '+1987654321';

async function testFullTOTPFlow() {
    console.log('🔍 Testing full TOTP flow for new user');
    console.log('====================================');

    try {
        // Step 1: Request OTP (should generate secret and QR)
        console.log('\n1. Requesting OTP...');
        const requestResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile
        });

        if (!requestResponse.data.success || requestResponse.data.enabled) {
            console.log('❌ Request OTP failed or TOTP already enabled');
            return;
        }

        const secret = requestResponse.data.secret;
        console.log('Secret generated:', secret);

        // Step 2: Generate TOTP code immediately
        console.log('\n2. Generating TOTP code...');
        const otp = authenticator.generate(secret);
        console.log('Generated OTP:', otp);

        // Step 3: Verify OTP immediately
        console.log('\n3. Verifying OTP...');
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            mobile,
            otp
        });

        console.log('Verify Response:', JSON.stringify(verifyResponse.data, null, 2));

        if (verifyResponse.data.success) {
            console.log('✅ Full TOTP flow successful!');
            console.log('Token received:', verifyResponse.data.token ? 'Yes' : 'No');
            console.log('User logged in successfully');
        } else {
            console.log('❌ Verify OTP failed:', verifyResponse.data.error);
        }
    } catch (error) {
        console.log('❌ Error in flow:', error.response?.data || error.message);
    }
}

testFullTOTPFlow();
