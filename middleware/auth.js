const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Hash password
 */
async function hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Middleware to authenticate admin users
 */
async function authenticateAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded || decoded.type !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Check if admin exists and session is valid
        const admin = await database.collection('admins').findOne({ _id: new ObjectId(decoded.adminId) });
        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Admin not found'
            });
        }

        const session = await database.collection('admin_sessions').findOne({
            admin_id: new ObjectId(decoded.adminId),
            token_hash: decoded.sessionId,
            is_active: true,
            expires_at: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        }

        req.admin = {
            id: decoded.adminId,
            username: admin.username
        };
        req.sessionId = decoded.sessionId;
        
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Middleware to authenticate regular users
 */
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded || decoded.type !== 'user') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Check if user exists, is verified, and session is valid
        const user = await database.collection('users').findOne({ _id: new ObjectId(decoded.userId), is_verified: true });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found or not verified'
            });
        }

        const session = await database.collection('user_sessions').findOne({
            user_id: new ObjectId(decoded.userId),
            token_hash: decoded.sessionId,
            is_active: true,
            expires_at: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Session expired, invalid, or user not verified'
            });
        }

        req.user = {
            id: decoded.userId,
            mobileNumber: user.mobile_number,
            isVerified: user.is_verified
        };
        req.sessionId = decoded.sessionId;
        
        next();
    } catch (error) {
        console.error('User authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Create admin session
 */
async function createAdminSession(adminId) {
    try {
        const sessionId = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store session in database
        await database.collection('admin_sessions').insertOne({
            admin_id: new ObjectId(adminId),
            token_hash: sessionId,
            expires_at: expiresAt,
            is_active: true
        });

        // Generate JWT token
        const token = generateToken({
            adminId: adminId,
            sessionId: sessionId,
            type: 'admin'
        });

        return {
            success: true,
            token: token,
            expiresAt: expiresAt
        };
    } catch (error) {
        console.error('Error creating admin session:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create user session
 */
async function createUserSession(userId) {
    try {
        const sessionId = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store session in database
        await database.collection('user_sessions').insertOne({
            user_id: new ObjectId(userId),
            token_hash: sessionId,
            expires_at: expiresAt,
            is_active: true
        });

        // Generate JWT token
        const token = generateToken({
            userId: userId,
            sessionId: sessionId,
            type: 'user'
        });

        return {
            success: true,
            token: token,
            expiresAt: expiresAt
        };
    } catch (error) {
        console.error('Error creating user session:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Invalidate admin session
 */
async function invalidateAdminSession(adminId, sessionId) {
    try {
        await database.collection('admin_sessions').updateOne(
            { admin_id: new ObjectId(adminId), token_hash: sessionId },
            { $set: { is_active: false } }
        );
        return { success: true };
    } catch (error) {
        console.error('Error invalidating admin session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Invalidate user session
 */
async function invalidateUserSession(userId, sessionId) {
    try {
        await database.collection('user_sessions').updateOne(
            { user_id: new ObjectId(userId), token_hash: sessionId },
            { $set: { is_active: false } }
        );
        return { success: true };
    } catch (error) {
        console.error('Error invalidating user session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
    try {
        const now = new Date();
        
        // Clean up expired admin sessions
        await database.collection('admin_sessions').updateMany(
            { expires_at: { $lte: now } },
            { $set: { is_active: false } }
        );
        
        // Clean up expired user sessions
        await database.collection('user_sessions').updateMany(
            { expires_at: { $lte: now } },
            { $set: { is_active: false } }
        );
        
        console.log('Expired sessions cleaned up');
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
}

// Clean up expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    authenticateAdmin,
    authenticateUser,
    createAdminSession,
    createUserSession,
    invalidateAdminSession,
    invalidateUserSession,
    cleanupExpiredSessions
};
