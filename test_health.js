const axios = require('axios');

async function testHealth() {
    try {
        console.log('Testing health endpoint...');
        const response = await axios.get('http://localhost:3001/health');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testHealth();
