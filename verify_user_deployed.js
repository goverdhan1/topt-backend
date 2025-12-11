const axios = require('axios');

const BASE_URL = 'https://topt-backend.onrender.com';

async function verifyUserOnDeployed() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            username: 'admin',
            password: 'demo123'
        });
        console.log('✅ Admin login successful');

        const token = loginResponse.data.token;

        console.log('👤 Verifying user +15714305024...');
        const verifyResponse = await axios.post(`${BASE_URL}/api/admin/users/verify`, {
            mobile: '+15714305024'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ User verification response:', verifyResponse.data);

        if (verifyResponse.data.success) {
            console.log('🎉 User +15714305024 is now verified on the deployed environment!');
            console.log('You should now be able to access /api/user/documents with a valid user token.');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

verifyUserOnDeployed();
