require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testOTPEndpoint() {
    console.log('🔍 Testing OTP Endpoint');
    console.log('======================');

    try {
        // First, let's check if the server is running
        console.log('1. Checking server health...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running:', healthResponse.data);

        // Test the Twilio status endpoint
        console.log('\n2. Checking Twilio service status...');
        const twilioStatusResponse = await axios.get(`${BASE_URL}/api/twilio/status`);
        console.log('✅ Twilio Status:', twilioStatusResponse.data);

        // Test the admin login to get a token
        console.log('\n3. Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            username: 'admin',
            password: 'demo123'
        });
        console.log('✅ Admin Login:', loginResponse.data);

        const token = loginResponse.data.token;

        // Test the send-otp endpoint (this was failing before)
        console.log('\n4. Testing send-otp endpoint (this was the failing endpoint)...');
        const otpResponse = await axios.post(`${BASE_URL}/api/admin/send-otp`, {
            mobile: '+15714305024'  // Updated test phone number
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ OTP Response:', otpResponse.data);
        console.log('\n🎉 SUCCESS: The OTP error has been completely resolved!');
        console.log('🎉 Your SMSMode service is working correctly with real credentials.');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running. Please start the server first:');
            console.log('   npm start (in the server directory)');
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

testOTPEndpoint();
