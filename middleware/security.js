const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

/**
 * Rate limiting middleware
 */
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            error: message
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// General API rate limit
const generalRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
);

// Strict rate limit for authentication endpoints
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'Too many authentication attempts, please try again later.'
);

// OTP rate limit
const otpRateLimit = createRateLimit(
    5 * 60 * 1000, // 5 minutes
    3, // limit each IP to 3 OTP requests per windowMs
    'Too many OTP requests, please try again later.'
);

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.twilio.com", "https://www.googleapis.com"],
        },
    },
    crossOriginEmbedderPolicy: false
});

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Admin login validation
 */
const validateAdminLogin = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('Password must be between 6 and 100 characters'),
    handleValidationErrors
];

/**
 * User mobile number validation
 */
const validateMobileNumber = [
    body('mobile')
        .trim()
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Mobile number must be in E.164 format (e.g., +1234567890)'),
    handleValidationErrors
];

/**
 * OTP method validation
 */
const validateMethod = [
    body('method')
        .optional()
        .isIn(['totp'])
        .withMessage('Method must be "totp"'),
    handleValidationErrors
];

/**
 * OTP validation
 */
const validateOTP = [
    body('mobile')
        .trim()
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Mobile number must be in E.164 format'),
    body('otp')
        .trim()
        .isLength({ min: 4, max: 8 })
        .withMessage('OTP must be between 4 and 8 characters')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
    handleValidationErrors
];

/**
 * Document validation
 */
const validateDocument = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title is required and must be less than 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('google_drive_link')
        .trim()
        .isURL()
        .withMessage('Google Drive link must be a valid URL')
        .matches(/^https:\/\/(drive|docs)\.google\.com\//)
        .withMessage('Must be a valid Google Drive or Google Docs URL'),
    handleValidationErrors
];

/**
 * Sanitize input middleware
 */
const sanitizeInput = (req, res, next) => {
    // Remove any potential XSS attempts from string fields
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
    };

    // Recursively sanitize object properties
    const sanitizeObject = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            }
        }
        return obj;
    };

    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Allow all origins
        callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Audit logging middleware factory
 */
const createAuditLog = (database) => {
    return (action, resource = null) => {
        return async (req, res, next) => {
            const originalSend = res.send;

            res.send = function(data) {
                // Log the action after response is sent
                setImmediate(async () => {
                    try {
                        const userType = req.admin ? 'admin' : (req.user ? 'user' : 'anonymous');
                        const userId = req.admin?.id || req.user?.id || 0;
                        const resourceId = req.params.id || null;

                        await database.run('audit_logs', 'insert', {
                            user_type: userType,
                            user_id: userId,
                            action: action,
                            resource: resource,
                            resource_id: resourceId,
                            details: JSON.stringify({
                                method: req.method,
                                url: req.originalUrl,
                                body: req.body,
                                success: res.statusCode < 400
                            }),
                            ip_address: req.ip,
                            user_agent: req.get('User-Agent'),
                            created_at: new Date()
                        });
                    } catch (error) {
                        console.error('Audit logging error:', error);
                    }
                });

                originalSend.call(this, data);
            };

            next();
        };
    };
};

// Create audit log middleware with database instance
let auditLog;
const initializeAuditLog = (database) => {
    auditLog = createAuditLog(database);
};

const getAuditLog = () => {
    if (!auditLog) {
        throw new Error('Audit log middleware not initialized. Call initializeAuditLog first.');
    }
    return auditLog;
};

module.exports = {
    generalRateLimit,
    authRateLimit,
    otpRateLimit,
    securityHeaders,
    validateAdminLogin,
    validateMobileNumber,
    validateMethod,
    validateOTP,
    validateDocument,
    sanitizeInput,
    corsOptions,
    auditLog,
    initializeAuditLog,
    getAuditLog
};
