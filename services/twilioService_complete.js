const twilio = require('twilio');
require('dotenv').config();

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!this.accountSid || !this.authToken || !this.verifyServiceSid ||
            this.accountSid.includes('placeholder') || this.verifyServiceSid.includes('placeholder')) {
            console.warn('Twilio credentials not configured or using placeholder values. Phone verification will be disabled.');
            this.client = null;
            this.isConfigured = false;
        } else {
            this.client = twilio(this.accountSid, this.authToken);
            this.isConfigured = true;
        }
    }

    /**
     * Verify a phone number using Twilio Validation API
     * This validates the phone number format and reachability
     */
    async verifyCallerID(phoneNumber, friendlyName = 'User Phone') {
        if (!this.client) {
            throw new Error('Twilio client not initialized. Check your credentials.');
        }

        try {
            // First, validate the phone number format
            if (!this.validatePhoneNumber(phoneNumber)) {
                return {
                    success: false,
                    error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)',
                    code: 'INVALID_PHONE_NUMBER'
                };
            }

            // Use Twilio's validation API to check if the number is valid
            const validation = await this.client.lookups.v2
                .phoneNumbers(phoneNumber)
                .fetch();

            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Phone number is not valid or cannot be verified',
                    code: 'INVALID_PHONE_NUMBER'
                };
            }

            // If we get here, the phone number is valid
            return {
                success: true,
                sid: 'validation-success',
                validationCode: '000000',
                phoneNumber: phoneNumber,
                friendlyName: friendlyName,
                message: 'Phone number validated successfully'
            };
        } catch (error) {
            console.error('Twilio phone number validation error:', error);

            // If it's a 21217 error (invalid phone number), provide a helpful message
            if (error.code === 21217) {
                return {
                    success: false,
                    error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)',
                    code: error.code
                };
            }

            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Get caller ID verification status
     */
    async getCallerIDStatus(sid) {
        if (!this.client) {
            throw new Error('Twilio client not initialized. Check your credentials.');
        }

        try {
            const callerId = await this.client.lookups.v2.phoneNumbers(sid).fetch();
            return {
                success: true,
                sid: callerId.sid,
                phoneNumber: callerId.phoneNumber,
                friendlyName: callerId.friendlyName,
                validationCode: callerId.validationCode
            };
        } catch (error) {
            console.error('Error fetching caller ID status:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Send OTP verification code via SMS
     */
    async sendOTP(phoneNumber) {
        if (!this.client) {
            throw new Error('Twilio client not initialized. Check your credentials.');
        }

        // If Twilio is not configured, return mock success for development
        if (!this.isConfigured) {
            console.log(`Twilio not configured. Returning mock OTP for ${phoneNumber}`);
            return {
                success: true,
                sid: 'mock-otp-sid',
                status: 'mock-sent',
                to: phoneNumber,
                channel: 'sms',
                mock: true,
                message: 'Mock OTP sent (Twilio not configured)'
            };
        }

        try {
            const verification = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verifications
                .create({
                    to: phoneNumber,
                    channel: 'sms'
                });

            return {
                success: true,
                sid: verification.sid,
                status: verification.status,
                to: verification.to,
                channel: verification.channel
            };
        } catch (error) {
            console.error('Twilio OTP send error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Verify OTP code
     */
    async verifyOTP(phoneNumber, code) {
        if (!this.client) {
            throw new Error('Twilio client not initialized. Check your credentials.');
        }

        // If Twilio is not configured, accept any code for development
        if (!this.isConfigured) {
            console.log(`Twilio not configured. Accepting mock OTP verification for ${phoneNumber} with code ${code}`);
            return {
                success: true,
                status: 'approved',
                to: phoneNumber,
                sid: 'mock-verification-sid',
                mock: true,
                message: 'Mock OTP verification successful (Twilio not configured)'
            };
        }

        try {
            const verificationCheck = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks
                .create({
                    to: phoneNumber,
                    code: code
                });

            return {
                success: verificationCheck.status === 'approved',
                status: verificationCheck.status,
                to: verificationCheck.to,
                sid: verificationCheck.sid
            };
        } catch (error) {
            console.error('Twilio OTP verification error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Send SMS message (for notifications)
     */
    async sendSMS(to, message, from = null) {
        if (!this.client) {
            throw new Error('Twilio client not initialized. Check your credentials.');
        }

        // If Twilio is not configured, return mock success for development
        if (!this.isConfigured) {
            console.log(`Twilio not configured. Mock SMS sent to ${to}`);
            return {
                success: true,
                sid: 'mock-sms-sid',
                status: 'mock-sent',
                to: to,
                from: 'mock-from',
                mock: true,
                message: 'Mock SMS sent (Twilio not configured)'
            };
        }

        try {
            const messageOptions = {
                body: message,
                to: to
            };

            if (from) {
                messageOptions.from = from;
            } else {
                // Use messaging service SID if available
                messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            }

            const twilioMessage = await this.client.messages.create(messageOptions);

            return {
                success: true,
                sid: twilioMessage.sid,
                status: twilioMessage.status,
                to: twilioMessage.to,
                from: twilioMessage.from
            };
        } catch (error) {
            console.error('Twilio SMS send error:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Validate phone number format
     */
    validatePhoneNumber(phoneNumber) {
        // Basic E.164 format validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }

    /**
     * Format phone number to E.164 format
     */
    formatPhoneNumber(phoneNumber, countryCode = '+1') {
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');

        // If it starts with country code, return as is with +
        if (digits.length === 11 && digits.startsWith('1')) {
            return '+' + digits;
        }

        // If it's a 10-digit US number, add +1
        if (digits.length === 10) {
            return '+1' + digits;
        }

        // If it already has +, return as is
        if (phoneNumber.startsWith('+')) {
            return phoneNumber;
        }

        // Default: add provided country code
        return countryCode + digits;
    }

    /**
     * Optional phone verification - creates user without Twilio if not configured
     */
    async optionalVerifyCallerID(phoneNumber, friendlyName = 'User Phone') {
        // If Twilio is not configured, return success with mock data
        if (!this.isConfigured) {
            console.log(`Twilio not configured. Creating user ${phoneNumber} without phone verification.`);
            return {
                success: true,
                sid: 'mock-caller-id-sid',
                validationCode: '000000',
                phoneNumber: phoneNumber,
                friendlyName: friendlyName,
                mock: true,
                message: 'User created without phone verification (Twilio not configured)'
            };
        }

        // If Twilio is configured, use the real verification
        return await this.verifyCallerID(phoneNumber, friendlyName);
    }
}

module.exports = new TwilioService();
