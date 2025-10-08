require('dotenv').config();

console.log('🔍 Checking Environment Variables');
console.log('================================');

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? (process.env.TWILIO_ACCOUNT_SID.includes('placeholder') ? 'Contains placeholder' : 'Set (not placeholder)') : 'Not set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? (process.env.TWILIO_AUTH_TOKEN.includes('placeholder') ? 'Contains placeholder' : 'Set (not placeholder)') : 'Not set');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? (process.env.TWILIO_VERIFY_SERVICE_SID.includes('placeholder') ? 'Contains placeholder' : 'Set (not placeholder)') : 'Not set');

console.log('\nFull values (masked):');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'Not set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.substring(0, 10) + '...' : 'Not set');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? process.env.TWILIO_VERIFY_SERVICE_SID.substring(0, 10) + '...' : 'Not set');
