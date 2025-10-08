const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const database = require('../config/database');
const totpService = require('../services/totpService');
const crypto = require('crypto');
const {
    authenticateUser,
    createUserSession,
    invalidateUserSession
} = require('../middleware/auth');
const {
    otpRateLimit,
    authRateLimit,
    validateMobileNumber,
    validateMethod,
    validateOTP,
    sanitizeInput,
    getAuditLog
} = require('../middleware/security');

/**
 * Request OTP for User Login
 * POST /api/auth/request-otp
 */
router.post('/request-otp',
    otpRateLimit,
    sanitizeInput,
    validateMobileNumber,
    validateMethod,
    getAuditLog()('request_otp'),
    async (req, res) => {
        try {
            const { mobile, method = 'totp' } = req.body;
            const formattedMobile = mobile.startsWith('+') ? mobile : '+' + mobile;

            // Check if user exists and is verified
            const user = await database.get('users', { mobile_number: formattedMobile, is_verified: true });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found or not verified. Please contact admin.'
                });
            }

            // Check login attempts (prevent brute force)
            if (user.login_attempts >= 5) {
                const lastAttempt = new Date(user.updated_at);
                const now = new Date();
                const timeDiff = now - lastAttempt;
                const lockoutTime = 15 * 60 * 1000; // 15 minutes

                if (timeDiff < lockoutTime) {
                    return res.status(429).json({
                        success: false,
                        error: 'Account temporarily locked due to too many failed attempts. Please try again later.'
                    });
                }

                // Reset login attempts after lockout period
                await database.run('users', 'update', {
                    filter: { _id: new ObjectId(user._id) },
                    update: {
                        $set: {
                            login_attempts: 0
                        }
                    }
                });
            }

            // Check if TOTP is already enabled for this user
            if (user.totp_enabled) {
                return res.json({
                    success: true,
                    enabled: true,
                    method: 'totp'
                });
            }

            // Generate TOTP secret and QR code for new setup
            const secret = totpService.generateSecret();
            const qrData = await totpService.getQRData(secret, `OTP App:${formattedMobile}`);

            // Store TOTP secret in database
            await database.run('users', 'update', {
                filter: { _id: new ObjectId(user._id) },
                update: {
                    $set: {
                        totp_secret: secret
                    }
                }
            });

            res.json({
                success: true,
                enabled: false,
                method: 'totp',
                qrData: {
                    svg: qrData.svg,
                    base64: qrData.base64
                },
                secret: secret // For debugging, remove in production
            });

        } catch (error) {
            console.error('Request OTP error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Verify OTP and Login User
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp',
    otpRateLimit,
    sanitizeInput,
    validateMobileNumber,
    validateOTP,
    getAuditLog()('verify_otp'),
    async (req, res) => {
        try {
            const { mobile, otp } = req.body;
            const formattedMobile = mobile.startsWith('+') ? mobile : '+' + mobile;

            // Get user from database
            const user = await database.get('users', { mobile_number: formattedMobile, is_verified: true });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found or not verified'
                });
            }

            // Check if account is locked
            if (user.login_attempts >= 5) {
                const lastAttempt = new Date(user.updated_at);
                const now = new Date();
                const timeDiff = now - lastAttempt;
                const lockoutTime = 15 * 60 * 1000; // 15 minutes

                if (timeDiff < lockoutTime) {
                    return res.status(429).json({
                        success: false,
                        error: 'Account temporarily locked. Please try again later.'
                    });
                }
            }

            if (!user.totp_secret) {
                return res.status(400).json({
                    success: false,
                    error: 'TOTP not set up. Please request OTP first.'
                });
            }

            // Verify TOTP
            const isValidOTP = totpService.verifyCode(user.totp_secret, otp);

            if (!isValidOTP) {
                // Increment login attempts
                await database.run('users', 'update', {
                    filter: { _id: new ObjectId(user._id) },
                    update: {
                        $inc: { login_attempts: 1 },
                        $set: { updated_at: new Date() }
                    }
                });

                return res.status(401).json({
                    success: false,
                    error: 'Invalid OTP'
                });
            }

            // OTP verified successfully - create session
            const sessionResult = await createUserSession(user._id.toString());
            if (!sessionResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create session'
                });
            }

            // Update user login info and reset attempts
            const updateObj = {
                last_login: new Date(),
                login_attempts: 0,
                updated_at: new Date()
            };

            // If TOTP was just set up (secret exists but not enabled), enable it
            if (user.totp_secret && !user.totp_enabled) {
                updateObj.totp_enabled = true;
            }

            await database.run('users', 'update', {
                filter: { _id: new ObjectId(user._id) },
                update: {
                    $set: updateObj
                }
            });

            res.json({
                success: true,
                message: 'Login successful',
                token: sessionResult.token,
                user: {
                    id: user._id.toString(),
                    mobileNumber: user.mobile_number,
                    isVerified: user.is_verified,
                    totpEnabled: user.totp_enabled || true
                },
                expiresAt: sessionResult.expiresAt
            });

        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout',
    authenticateUser,
    getAuditLog()('user_logout'),
    async (req, res) => {
        try {
            await invalidateUserSession(req.user.id, req.sessionId);
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('User logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get User Profile
 * GET /api/auth/profile
 */
router.get('/profile',
    authenticateUser,
    async (req, res) => {
        try {
            const user = await database.get('users', { _id: new ObjectId(req.user.id) });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    mobileNumber: user.mobile_number,
                    isVerified: user.is_verified,
                    totpEnabled: user.totp_enabled,
                    createdAt: user.created_at,
                    lastLogin: user.last_login
                }
            });
        } catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh',
    authenticateUser,
    async (req, res) => {
        try {
            // Invalidate current session
            await invalidateUserSession(req.user.id, req.sessionId);
            
            // Create new session
            const sessionResult = await createUserSession(req.user.id);
            if (!sessionResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to refresh session'
                });
            }

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                token: sessionResult.token,
                expiresAt: sessionResult.expiresAt
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Check Authentication Status
 * GET /api/auth/status
 */
router.get('/status',
    authenticateUser,
    async (req, res) => {
        try {
            res.json({
                success: true,
                authenticated: true,
                user: {
                    id: req.user.id,
                    mobileNumber: req.user.mobileNumber,
                    isVerified: req.user.isVerified
                }
            });
        } catch (error) {
            console.error('Auth status error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

module.exports = router;
