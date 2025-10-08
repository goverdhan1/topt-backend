require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAddUser() {
    console.log('🔍 Testing Add User Endpoint');
    console.log('===========================');

    try {
        // First, let's check if the server is running
        console.log('1. Checking server health...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running');

        // Test the admin login to get a token
        console.log('\n2. Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            username: 'admin',
            password: 'demo123'
        });
        console.log('✅ Admin Login successful');

        const token = loginResponse.data.token;

        // Test the send-otp endpoint
        console.log('\n3. Testing send-otp endpoint...');
        const otpResponse = await axios.post(`${BASE_URL}/api/admin/send-otp`, {
            mobile: '+1234567890'  // Test phone number
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!otpResponse.data.success) {
            console.log('❌ Send OTP failed:', otpResponse.data);
            return;
        }

        console.log('✅ OTP sent successfully');

        // Now test adding user with OTP code
        console.log('\n4. Testing add user with OTP code...');
        const addUserResponse = await axios.post(`${BASE_URL}/api/admin/users`, {
            mobile: '+1234567890',
            otpCode: '123456'  // Mock code
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (addUserResponse.data.success) {
            console.log('✅ User added successfully:', addUserResponse.data.user);
            console.log('\n🎉 SUCCESS: Add user with OTP verification works!');
        } else {
            console.log('❌ Add user failed:', addUserResponse.data);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running. Please start the server first.');
        } else {
            console.log('❌ Error:', error.response?.data || error.message);
        }
    }
}

testAddUser();
