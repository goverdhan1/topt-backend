const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const database = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { sanitizeInput, getAuditLog } = require('../middleware/security');

/**
 * Get Available Documents for User
 * GET /api/user/documents
 */
router.get('/documents',
    authenticateUser,
    sanitizeInput,
    getAuditLog()('view_documents'),
    async (req, res) => {
        try {
            // Get all active documents
            const documents = await database.query('documents', { is_active: true }, {
                sort: { created_at: -1 }
            });

            res.json({
                success: true,
                documents: documents,
                count: documents.length
            });


        } catch (error) {
            console.error('Get user documents error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get Document by ID
 * GET /api/user/documents/:id
 */
router.get('/documents/:id',
    authenticateUser,
    sanitizeInput,
    getAuditLog()('view_document'),
    async (req, res) => {
        try {
            const documentId = req.params.id;

            const document = await database.get('documents', { _id: new ObjectId(documentId), is_active: true });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found'
                });
            }

            res.json({
                success: true,
                document: document
            });

        } catch (error) {
            console.error('Get document error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Search Documents
 * GET /api/user/documents/search?q=query
 */
router.get('/documents/search',
    authenticateUser,
    sanitizeInput,
    getAuditLog()('search_documents'),
    async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query must be at least 2 characters long'
                });
            }

            const searchTerm = `%${q.trim()}%`;

            const documents = await database.query('documents', {
                is_active: true,
                $or: [
                    { title: { $regex: q.trim(), $options: 'i' } },
                    { description: { $regex: q.trim(), $options: 'i' } }
                ]
            }, {
                sort: { created_at: -1 }
            });

            res.json({
                success: true,
                documents: documents,
                count: documents.length,
                query: q
            });


        } catch (error) {
            console.error('Search documents error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get User Profile
 * GET /api/user/profile
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
                    verificationStatus: user.verification_status,
                    createdAt: user.created_at,
                    lastLogin: user.last_login,
                    loginAttempts: user.login_attempts
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
 * Update User Profile (limited fields)
 * PUT /api/user/profile
 */
router.put('/profile',
    authenticateUser,
    sanitizeInput,
    getAuditLog()('update_profile'),
    async (req, res) => {
        try {
            // Only allow updating certain fields
            const allowedFields = ['mobile_number'];
            const updates = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid fields to update'
                });
            }

            const result = await database.run('users', 'update', {
                filter: { _id: new ObjectId(req.user.id) },
                update: {
                    $set: {
                        ...updates,
                        updated_at: new Date()
                    }
                }
            });

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });


        } catch (error) {
            console.error('Update user profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

module.exports = router;
