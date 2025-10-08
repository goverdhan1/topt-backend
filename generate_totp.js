const { authenticator } = require('otplib');

const secret = 'DE6H6ZSXEBJCCEDZ';

const code = authenticator.generate(secret);
console.log('TOTP Code:', code);
