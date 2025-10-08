const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('Testing admin login...');
        console.log('Waiting 2 seconds for rate limit to reset...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await axios.post('http://localhost:3001/api/admin/login', {
            username: 'admin',
            password: 'demo123'
        });

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testAdminLogin();
