const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { ObjectId } = require('mongodb');
const database = require('../config/database');
const { sanitizeInput, getAuditLog } = require('../middleware/security');

/**
 * Twilio Caller ID Verification Callback
 * POST /api/twilio/caller-id-callback
 */
router.post('/caller-id-callback',
    sanitizeInput,
    getAuditLog()('twilio_caller_id_callback'),
    async (req, res) => {
        try {
            const {
                CallerIdSid,
                PhoneNumber,
                ValidationCode,
                Status,
                FriendlyName
            } = req.body;

            console.log('Twilio Caller ID Callback:', {
                CallerIdSid,
                PhoneNumber,
                Status,
                ValidationCode
            });

            // Update user verification status
            const result = await database.run('users', 'update', {
                filter: { mobile_number: PhoneNumber },
                update: {
                    $set: {
                        caller_id_sid: CallerIdSid,
                        validation_code: ValidationCode,
                        verification_status: Status,
                        updated_at: new Date()
                    }
                }
            });

            if (result.changes > 0) {
                // If verification successful, mark user as verified
                if (Status === 'verified') {
                    await database.run('users', 'update', {
                        filter: { mobile_number: PhoneNumber },
                        update: {
                            $set: {
                                is_verified: true,
                                verification_status: "verified",
                                updated_at: new Date()
                            }
                        }
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Callback processed successfully',
                    status: Status
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'User not found for phone number'
                });
            }

        } catch (error) {
            console.error('Twilio callback error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Twilio SMS Status Callback
 * POST /api/twilio/sms-callback
 */
router.post('/sms-callback',
    sanitizeInput,
    getAuditLog()('twilio_sms_callback'),
    async (req, res) => {
        try {
            const {
                MessageSid,
                MessageStatus,
                To,
                From,
                ErrorCode,
                ErrorMessage
            } = req.body;

            console.log('Twilio SMS Callback:', {
                MessageSid,
                MessageStatus,
                To,
                ErrorCode
            });

            // Log SMS status for debugging
            if (ErrorCode) {
                console.error('SMS Error:', {
                    ErrorCode,
                    ErrorMessage,
                    To,
                    MessageSid
                });
            }

            res.status(200).json({
                success: true,
                message: 'SMS callback processed'
            });

        } catch (error) {
            console.error('Twilio SMS callback error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Twilio Voice OTP Endpoint
 * GET /api/twilio/voice-otp
 */
router.get('/voice-otp',
    async (req, res) => {
        try {
            const { code } = req.query;

            if (!code) {
                console.error('Voice OTP called without code parameter');
                return res.status(400).send('Invalid request');
            }

            // Create TwiML response for voice OTP
            const twiml = new twilio.twiml.VoiceResponse();

            // Add a pause and then say the OTP code
            twiml.pause({ length: 1 });
            twiml.say(
                {
                    voice: 'alice',
                    language: 'en-US'
                },
                `Your verification code is ${code}. I repeat, ${code}.`
            );

            // Add another pause and repeat the code
            twiml.pause({ length: 1 });
            twiml.say(
                {
                    voice: 'alice',
                    language: 'en-US'
                },
                `Please enter this code to complete verification.`
            );

            console.log('Voice OTP TwiML generated for code:', code);

            res.type('text/xml');
            res.send(twiml.toString());

        } catch (error) {
            console.error('Voice OTP error:', error);
            res.status(500).send('Internal server error');
        }
    }
);

/**
 * Twilio Verify Service Webhook
 * POST /api/twilio/verify-callback
 */
router.post('/verify-callback',
    sanitizeInput,
    getAuditLog()('twilio_verify_callback'),
    async (req, res) => {
        try {
            const {
                VerificationSid,
                PhoneNumber,
                Status,
                Channel
            } = req.body;

            console.log('Twilio Verify Callback:', {
                VerificationSid,
                PhoneNumber,
                Status,
                Channel
            });

            // Update user verification status based on OTP verification
            if (Status === 'approved') {
                await database.run('users', 'update', {
                    filter: { mobile_number: PhoneNumber },
                    update: {
                        $set: {
                            verification_status: "verified",
                            updated_at: new Date()
                        }
                    }
                });
            } else if (Status === 'denied') {
                await database.run('users', 'update', {
                    filter: { mobile_number: PhoneNumber },
                    update: {
                        $set: {
                            verification_status: "failed",
                            updated_at: new Date()
                        }
                    }
                });
            }

            res.status(200).json({
                success: true,
                message: 'Verify callback processed',
                status: Status
            });

        } catch (error) {
            console.error('Twilio verify callback error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get Twilio Service Status
 * GET /api/twilio/status
 */
router.get('/status',
    async (req, res) => {
        try {
            // Check if Twilio credentials are configured
            const hasCredentials = !!(
                process.env.TWILIO_ACCOUNT_SID &&
                process.env.TWILIO_AUTH_TOKEN
                // && process.env.TWILIO_VERIFY_SERVICE_SID
            );

            res.json({
                success: true,
                twilio: {
                    configured: hasCredentials,
                    accountSid: hasCredentials ? 'configured' : 'missing',
                    verifyService: hasCredentials ? 'configured' : 'missing'
                }
            });

        } catch (error) {
            console.error('Twilio status error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

module.exports = router;
