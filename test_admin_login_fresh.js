const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('Testing admin login with fresh request...');
        const response = await axios.post('http://localhost:3001/api/admin/login', {
            username: 'admin',
            password: 'demo123'
        });

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ Admin login successful!');
            console.log('Token:', response.data.token ? 'Generated' : 'Not generated');
            console.log('Admin ID:', response.data.admin?.id);
        } else {
            console.log('❌ Admin login failed:', response.data.error);
        }
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testAdminLogin();
