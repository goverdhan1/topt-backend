const axios = require('axios');

const BASE_URL = 'https://topt-back-47b6d49bc89e.herokuapp.com';

async function addUserToDeployed() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            username: 'admin',
            password: 'demo123'
        });
        console.log('✅ Admin login successful');

        const token = loginResponse.data.token;

        console.log('👤 Adding user +15714305024...');
        const addUserResponse = await axios.post(`${BASE_URL}/api/admin/users`, {
            mobile: '+15714305024'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ User added successfully:', addUserResponse.data);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

addUserToDeployed();
