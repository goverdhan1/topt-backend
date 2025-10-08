const axios = require('axios');

async function testAdminSendOTP() {
    try {
        console.log('🔍 Testing Admin Send OTP');
        console.log('========================');

        // Fresh admin token
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoxLCJzZXNzaW9uSWQiOiJhZjQ5MWQ5ZDY1Nzk1YWE0ZmE4YjBlZGQ3ZDQ0MWI3YzhhNDU2YTA3NWI3NGRkNjdhN2JkNGE4NmMzZWM2OWJiIiwidHlwZSI6ImFkbWluIiwiaWF0IjoxNzU4NjQ4MTM5LCJleHAiOjE3NTg3MzQ1Mzl9.8-EpeAHllZUE1zN7prpOnJ8aiGARAl8qn88wWMKRHIY';

        // Test phone number as requested
        const testPhone = '+15714305024';

        console.log(`📱 Testing with phone: ${testPhone}`);

        // Test the admin send-otp endpoint
        console.log('\n1. Testing /api/admin/send-otp...');
        const otpResponse = await axios.post('http://localhost:3001/api/admin/send-otp', {
            mobile: testPhone
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', otpResponse.status);
        console.log('Response data:', JSON.stringify(otpResponse.data, null, 2));

        if (otpResponse.data.success) {
            console.log('✅ Admin OTP send successful!');
            if (otpResponse.data.message.includes('Mock')) {
                console.log('ℹ️  This was a mock response - voice call was not actually made');
                console.log('🔧 Issue: Twilio voice configuration might need adjustment');
            } else {
                console.log('📞 Real voice call should have been made to:', otpResponse.data.formattedMobile);
                console.log('🎉 If you received the call, the issue is resolved!');
            }
        } else {
            console.log('❌ Admin OTP send failed');
            console.log('Error:', otpResponse.data.error);
        }

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

testAdminSendOTP();
