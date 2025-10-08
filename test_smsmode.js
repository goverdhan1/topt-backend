const smsmodeService = require('./services/smsmodeService');

async function testSMSMode() {
    console.log('🔍 Testing SMSMode Service');
    console.log('==========================');

    // Test with a valid phone number (use your own for testing)
    const testPhone = '+15714305024'; // Provided phone number
    const testMessage = 'Test OTP: 123456';

    console.log(`Sending test SMS to: ${testPhone}`);
    console.log(`Message: ${testMessage}`);

    try {
        const result = await smsmodeService.sendSMS(testPhone, testMessage);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ SMS sent successfully');
        } else {
            console.log('❌ SMS failed');
            console.log('Error:', result.error || result.message);
            if (result.response) {
                console.log('API Response:', result.response);
            }
        }
    } catch (error) {
        console.error('Test error:', error);
    }
}

testSMSMode();
