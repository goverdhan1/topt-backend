const { google } = require('googleapis');
require('dotenv').config();

class GoogleDriveService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
        
        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            console.warn('Google Drive credentials not configured. Some features may not work.');
            this.oauth2Client = null;
            this.drive = null;
        } else {
            this.oauth2Client = new google.auth.OAuth2(
                this.clientId,
                this.clientSecret,
                this.redirectUri
            );
            this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        }
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            throw new Error('Google OAuth2 client not initialized. Check your credentials.');
        }

        const scopes = [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Set OAuth2 credentials
     */
    setCredentials(tokens) {
        if (!this.oauth2Client) {
            throw new Error('Google OAuth2 client not initialized. Check your credentials.');
        }
        this.oauth2Client.setCredentials(tokens);
    }

    /**
     * Get OAuth2 tokens from authorization code
     */
    async getTokens(code) {
        if (!this.oauth2Client) {
            throw new Error('Google OAuth2 client not initialized. Check your credentials.');
        }

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return {
                success: true,
                tokens: tokens
            };
        } catch (error) {
            console.error('Error getting Google tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file metadata from Google Drive
     */
    async getFileMetadata(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive client not initialized.');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,permissions'
            });

            return {
                success: true,
                file: response.data
            };
        } catch (error) {
            console.error('Error getting file metadata:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * List files in a folder
     */
    async listFiles(folderId = null, pageSize = 10) {
        if (!this.drive) {
            throw new Error('Google Drive client not initialized.');
        }

        try {
            let query = "trashed=false";
            if (folderId) {
                query += ` and '${folderId}' in parents`;
            }

            const response = await this.drive.files.list({
                q: query,
                pageSize: pageSize,
                fields: 'nextPageToken, files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)'
            });

            return {
                success: true,
                files: response.data.files,
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            console.error('Error listing files:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Create a shareable link for a file
     */
    async createShareableLink(fileId, role = 'reader', type = 'anyone') {
        if (!this.drive) {
            throw new Error('Google Drive client not initialized.');
        }

        try {
            // Create permission
            await this.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: role,
                    type: type
                }
            });

            // Get the file with webViewLink
            const fileResponse = await this.drive.files.get({
                fileId: fileId,
                fields: 'webViewLink,webContentLink'
            });

            return {
                success: true,
                webViewLink: fileResponse.data.webViewLink,
                webContentLink: fileResponse.data.webContentLink
            };
        } catch (error) {
            console.error('Error creating shareable link:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Check if a file exists and is accessible
     */
    async checkFileAccess(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive client not initialized.');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id,name,mimeType,trashed'
            });

            return {
                success: true,
                exists: true,
                trashed: response.data.trashed,
                file: response.data
            };
        } catch (error) {
            if (error.code === 404) {
                return {
                    success: true,
                    exists: false
                };
            }
            
            console.error('Error checking file access:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Extract file ID from Google Drive URL
     */
    extractFileIdFromUrl(url) {
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)/,  // Standard file URL
            /id=([a-zA-Z0-9-_]+)/,         // URL with id parameter
            /folders\/([a-zA-Z0-9-_]+)/    // Folder URL
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Validate Google Drive URL
     */
    validateDriveUrl(url) {
        const driveUrlPattern = /^https:\/\/(drive|docs)\.google\.com\//;
        return driveUrlPattern.test(url);
    }

    /**
     * Get file type from MIME type
     */
    getFileTypeFromMimeType(mimeType) {
        const typeMap = {
            'application/vnd.google-apps.document': 'Google Docs',
            'application/vnd.google-apps.spreadsheet': 'Google Sheets',
            'application/vnd.google-apps.presentation': 'Google Slides',
            'application/vnd.google-apps.folder': 'Folder',
            'application/pdf': 'PDF',
            'image/jpeg': 'Image',
            'image/png': 'Image',
            'text/plain': 'Text File',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet'
        };

        return typeMap[mimeType] || 'Unknown';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

module.exports = new GoogleDriveService();
