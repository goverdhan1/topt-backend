const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'https://topt-backend.onrender.com';

async function testTotpFlow() {
  try {
    // Step 1: Request OTP (TOTP setup)
    console.log('🔐 Requesting TOTP setup...');
    const requestOtpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      mobile: '+15714305024'
    });
    console.log('Request OTP Response:', requestOtpResponse.data);

    if (!requestOtpResponse.data.success) {
      console.error('Failed to request OTP');
      return;
    }

    if (requestOtpResponse.data.enabled) {
      console.log('✅ TOTP is already enabled for this user');
    } else {
      console.log('📱 TOTP setup required');
      console.log('🔑 Secret:', requestOtpResponse.data.secret);
      console.log('📷 QR Code SVG:', requestOtpResponse.data.qrData.svg);
      console.log('📷 QR Code Base64:', requestOtpResponse.data.qrData.base64);
      console.log('\n📋 Instructions:');
      console.log('1. Open Google Authenticator or similar TOTP app');
      console.log('2. Scan the QR code or manually enter the secret');
      console.log('3. Get the 6-digit code from your TOTP app');
    }

    // Prompt for TOTP code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the 6-digit TOTP code from your app: ', async (otp) => {
      rl.close();

      try {
        // Step 2: Verify TOTP and login
        console.log('🔍 Verifying TOTP...');
        const verifyOtpResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
          mobile: '+15714305024',
          otp: otp
        });
        console.log('Verify OTP Response:', verifyOtpResponse.data);

        if (!verifyOtpResponse.data.success) {
          console.error('TOTP verification failed');
          return;
        }

        const token = verifyOtpResponse.data.token;
        console.log('✅ Received Token:', token);

        // Step 3: Test documents endpoint with new token
        console.log('📄 Testing documents endpoint...');
        const documentsResponse = await axios.get(`${BASE_URL}/api/user/documents`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Documents Response:', documentsResponse.data);

        console.log('🎉 SUCCESS: Full TOTP authentication flow completed successfully!');

      } catch (error) {
        console.error('Error verifying TOTP or fetching documents:', error.response?.data || error.message);
      }
    });

  } catch (error) {
    console.error('Error requesting TOTP setup:', error.response?.data || error.message);
  }
}

testTotpFlow();
