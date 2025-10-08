const axios = require('axios');
const { authenticator } = require('otplib');

const BASE_URL = 'https://topt-back-47b6d49bc89e.herokuapp.com';

async function testFullUserFlow() {
    console.log('🔍 Testing full user flow: request-otp -> verify-otp -> get documents');
    console.log('=====================================================================');

    try {
        // Step 1: Request OTP
        console.log('Step 1: Requesting OTP...');
        const requestResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            mobile: '+1987654321'
        });

        console.log('Request OTP Response:', JSON.stringify(requestResponse.data, null, 2));

        if (!requestResponse.data.success) {
            console.log('❌ Request OTP failed:', requestResponse.data.error);
            return;
        }

        let secret;
        if (requestResponse.data.enabled) {
            // TOTP already enabled, but for deployed testing, we can't access the secret
            // You need to know the secret from when it was set up, or reset the user
            console.log('✅ TOTP already enabled. To test, you need the secret from initial setup.');
            console.log('If you don\'t have the secret, run update_test_user.js to reset TOTP.');
            return; // Exit since we can't proceed without secret
        } else {
            secret = requestResponse.data.secret;
            console.log('✅ TOTP setup initiated, Secret:', secret);
        }

        // Step 2: Generate OTP and verify
        console.log('Step 2: Generating OTP and verifying...');
        const otp = authenticator.generate(secret);
        console.log('Generated OTP:', otp);

        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            mobile: '+1987654321',
            otp: otp
        });

        console.log('Verify OTP Response:', JSON.stringify(verifyResponse.data, null, 2));

        if (!verifyResponse.data.success) {
            console.log('❌ Verify OTP failed:', verifyResponse.data.error);
            return;
        }

        const token = verifyResponse.data.token;
        console.log('✅ Login successful, Token:', token);

        // Step 3: Get user documents
        console.log('Step 3: Getting user documents...');
        const documentsResponse = await axios.get(`${BASE_URL}/api/user/documents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Get Documents Response:', JSON.stringify(documentsResponse.data, null, 2));

        if (documentsResponse.data.success) {
            console.log('✅ Get documents successful');
        } else {
            console.log('❌ Get documents failed:', documentsResponse.data.error);
        }

    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

testFullUserFlow();
