require('dotenv').config();
const twilioService = require('./server/services/twilioService');

console.log('🔍 Testing Twilio Service with Real Credentials');
console.log('==============================================');

try {
    // Check if Twilio client is initialized
    console.log('Twilio Client Status:', twilioService.client ? '✅ INITIALIZED' : '❌ NOT INITIALIZED');
    console.log('Service Configured:', twilioService.isConfigured ? '✅ YES' : '❌ NO');

    if (twilioService.client) {
        console.log('✅ SUCCESS: Twilio client is properly initialized!');
        console.log('✅ The OTP error should now be resolved.');
        console.log('');
        console.log('📱 You can now test the /api/admin/send-otp endpoint');
        console.log('📝 Make sure your server is running on port 3001');
    } else {
        console.log('❌ ERROR: Twilio client is still not initialized');
        console.log('Please check your credentials in the .env file');
    }

} catch (error) {
    console.error('❌ ERROR testing Twilio service:', error.message);
}
