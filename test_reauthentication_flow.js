const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'https://topt-backend.onrender.com';

async function testReauthentication() {
  try {
    // Step 1: Request OTP (SMS)
    console.log('Requesting OTP via SMS...');
    const requestOtpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      mobile: '+15714305024'
    });
    console.log('Request OTP Response:', requestOtpResponse.data);

    if (!requestOtpResponse.data.success) {
      console.error('Failed to request OTP');
      return;
    }

    console.log('OTP sent to +15714305024. Please check your SMS for the code.');

    // Prompt for OTP code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the OTP code from SMS: ', async (otp) => {
      rl.close();

      try {
        // Step 2: Verify OTP and login
        console.log('Verifying OTP...');
        const verifyOtpResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
          mobile: '+15714305024',
          otp: otp
        });
        console.log('Verify OTP Response:', verifyOtpResponse.data);

        if (!verifyOtpResponse.data.success) {
          console.error('OTP verification failed');
          return;
        }

        const token = verifyOtpResponse.data.token;
        console.log('Received Token:', token);

        // Step 3: Test documents endpoint with new token
        console.log('Testing documents endpoint...');
        const documentsResponse = await axios.get(`${BASE_URL}/api/user/documents`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Documents Response:', documentsResponse.data);

        console.log('✅ SUCCESS: Full reauthentication flow completed successfully!');

      } catch (error) {
        console.error('Error verifying OTP or fetching documents:', error.response?.data || error.message);
      }
    });

  } catch (error) {
    console.error('Error requesting OTP:', error.response?.data || error.message);
  }
}

testReauthentication();
