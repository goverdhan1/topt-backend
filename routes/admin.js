const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const database = require('../config/database');
const googleDriveService = require('../services/googleDriveService');
const {
    authenticateAdmin,
    createAdminSession,
    invalidateAdminSession,
    comparePassword
} = require('../middleware/auth');
const {
    authRateLimit,
    validateAdminLogin,
    validateMobileNumber,
    validateDocument,
    sanitizeInput,
    getAuditLog
} = require('../middleware/security');

/**
 * Admin Login
 * POST /api/admin/login
 */
router.post('/login',
    authRateLimit,
    sanitizeInput,
    validateAdminLogin,
    getAuditLog()('admin_login'),
    async (req, res) => {
        try {
            const { username, password } = req.body;

            // Find admin by username
            const admin = await database.get('admins', { username: username });

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Verify password
            const isValidPassword = await comparePassword(password, admin.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Create session
            const sessionResult = await createAdminSession(admin._id.toString());
            if (!sessionResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create session'
                });
            }

            res.json({
                success: true,
                message: 'Login successful',
                token: sessionResult.token,
                admin: {
                    id: admin._id.toString(),
                    username: admin.username
                },
                expiresAt: sessionResult.expiresAt
            });

        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Admin Logout
 * POST /api/admin/logout
 */
router.post('/logout',
    authenticateAdmin,
    getAuditLog()('admin_logout'),
    async (req, res) => {
        try {
            await invalidateAdminSession(req.admin.id, req.sessionId);

            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Admin logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get Admin Profile
 * GET /api/admin/profile
 */
router.get('/profile',
    authenticateAdmin,
    async (req, res) => {
        try {
            res.json({
                success: true,
                admin: {
                    id: req.admin.id,
                    username: req.admin.username
                }
            });
        } catch (error) {
            console.error('Get admin profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Add User
 * POST /api/admin/users
 */
router.post('/users',
    authenticateAdmin,
    sanitizeInput,
    validateMobileNumber,
    getAuditLog()('add_user', 'users'),
    async (req, res) => {
        try {
            const { mobile } = req.body;

            // Basic phone number validation (E.164 format)
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(mobile)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)'
                });
            }

            // Check if user already exists
            const existingUser = await database.get('users', { mobile_number: mobile });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'User with this mobile number already exists'
                });
            }

            // Store user in database as verified (TOTP-only system)
            const result = await database.run('users', 'insert', {
                mobile_number: mobile,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'User added successfully',
                user: {
                    id: result.id,
                    mobileNumber: mobile,
                    isVerified: true
                }
            });


        } catch (error) {
            console.error('Add user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);



/**
 * Get All Users
 * GET /api/admin/users
 */
router.get('/users',
    authenticateAdmin,
    getAuditLog()('list_users', 'users'),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get users with pagination
            const users = await database.query('users', {}, {
                sort: { created_at: -1 },
                skip: offset,
                limit: limit
            });

            // Get total count
            const total = await database.count('users', {});

            res.json({
                success: true,
                users: users,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });


        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get User Details
 * GET /api/admin/users/:id
 */
router.get('/users/:id',
    authenticateAdmin,
    getAuditLog()('get_user', 'users'),
    async (req, res) => {
        try {
            const userId = req.params.id;

            const user = await database.get('users', { _id: new ObjectId(userId) });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }



            res.json({
                success: true,
                user: user
            });

        } catch (error) {
            console.error('Get user details error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Delete User
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id',
    authenticateAdmin,
    getAuditLog()('delete_user', 'users'),
    async (req, res) => {
        try {
            const userId = req.params.id;

            const result = await database.run('users', 'delete', { filter: { _id: new ObjectId(userId) } });

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Get All Documents
 * GET /api/admin/documents
 */
router.get('/documents',
    authenticateAdmin,
    getAuditLog()('list_documents', 'documents'),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const documents = await database.query('documents', { is_active: true }, {
                sort: { created_at: -1 },
                skip: offset,
                limit: limit
            });

            const total = await database.count('documents', { is_active: true });

            res.json({
                success: true,
                documents: documents,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });


        } catch (error) {
            console.error('Get documents error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Create Document
 * POST /api/admin/documents
 */
router.post('/documents',
    authenticateAdmin,
    sanitizeInput,
    validateDocument,
    getAuditLog()('create_document', 'documents'),
    async (req, res) => {
        try {
            const { title, description, google_drive_link } = req.body;

            // Extract file ID from Google Drive URL
            const fileId = googleDriveService.extractFileIdFromUrl(google_drive_link);

            const result = await database.run('documents', 'insert', {
                title: title,
                description: description,
                google_drive_link: google_drive_link,
                file_id: fileId,
                created_by: new ObjectId(req.admin.id),
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'Document created successfully',
                document: {
                    id: result.id,
                    title: title,
                    description: description,
                    google_drive_link: google_drive_link,
                    file_id: fileId
                }
            });


        } catch (error) {
            console.error('Create document error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Update Document
 * PUT /api/admin/documents/:id
 */
router.put('/documents/:id',
    authenticateAdmin,
    sanitizeInput,
    validateDocument,
    getAuditLog()('update_document', 'documents'),
    async (req, res) => {
        try {
            const documentId = req.params.id;
            const { title, description, google_drive_link } = req.body;

            const fileId = googleDriveService.extractFileIdFromUrl(google_drive_link);

            const result = await database.run('documents', 'update', {
                filter: { _id: new ObjectId(documentId), is_active: true },
                update: {
                    $set: {
                        title: title,
                        description: description,
                        google_drive_link: google_drive_link,
                        file_id: fileId,
                        updated_at: new Date()
                    }
                }
            });

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found'
                });
            }

            res.json({
                success: true,
                message: 'Document updated successfully'
            });

        } catch (error) {
            console.error('Update document error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Delete Document
 * DELETE /api/admin/documents/:id
 */
router.delete('/documents/:id',
    authenticateAdmin,
    getAuditLog()('delete_document', 'documents'),
    async (req, res) => {
        try {
            const documentId = req.params.id;

            // Validate ObjectId format
            if (!ObjectId.isValid(documentId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid document ID format'
                });
            }

            const result = await database.run('documents', 'update', {
                filter: { _id: new ObjectId(documentId) },
                update: {
                    $set: {
                        is_active: false,
                        updated_at: new Date()
                    }
                }
            });

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found'
                });
            }

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });

        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

/**
 * Verify User by Mobile Number
 * POST /api/admin/users/verify
 */
router.post('/users/verify',
    authenticateAdmin,
    sanitizeInput,
    getAuditLog()('verify_user', 'users'),
    async (req, res) => {
        try {
            const { mobile } = req.body;

            if (!mobile) {
                return res.status(400).json({
                    success: false,
                    error: 'Mobile number is required'
                });
            }

            const user = await database.collection('users').findOne({ mobile_number: mobile });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            if (user.is_verified) {
                return res.json({
                    success: true,
                    message: 'User is already verified',
                    user: {
                        id: user._id,
                        mobileNumber: user.mobile_number,
                        isVerified: user.is_verified
                    }
                });
            }

            const result = await database.run('users', 'update', {
                filter: { _id: user._id },
                update: {
                    $set: {
                        is_verified: true,
                        updated_at: new Date()
                    }
                }
            });

            if (result.changes === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to verify user'
                });
            }

            res.json({
                success: true,
                message: 'User verified successfully',
                user: {
                    id: user._id,
                    mobileNumber: user.mobile_number,
                    isVerified: true
                }
            });

        } catch (error) {
            console.error('Verify user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
);

module.exports = router;
