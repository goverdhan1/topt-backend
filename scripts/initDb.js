const database = require('../config/database');
require('dotenv').config();

async function initializeDatabase() {
    try {
        console.log('Initializing database...');

        await database.connect();

        // Drop existing collections to ensure schema is up to date
        const collections = [
            'audit_logs',
            'admin_sessions',
            'user_sessions',
            'documents',
            'users',
            'admins',
            'temp_totp_secrets',
            'rapports'
        ];

        for (const collectionName of collections) {
            try {
                await database.db.dropCollection(collectionName);
                console.log(`Dropped collection: ${collectionName}`);
            } catch (error) {
                // Collection doesn't exist, ignore
                console.log(`Collection ${collectionName} does not exist or already dropped`);
            }
        }

        // Create indexes
        const indexes = [
            { collection: 'users', keys: { mobile_number: 1 }, options: { unique: true } },
            { collection: 'users', keys: { is_verified: 1 } },
            { collection: 'admins', keys: { username: 1 }, options: { unique: true } },
            { collection: 'user_sessions', keys: { is_active: 1, expires_at: 1 } },
            { collection: 'admin_sessions', keys: { is_active: 1, expires_at: 1 } },
            { collection: 'documents', keys: { is_active: 1 } },
            { collection: 'audit_logs', keys: { created_at: 1 } },
            { collection: 'temp_totp_secrets', keys: { mobile_number: 1 }, options: { unique: true } },
            { collection: 'temp_totp_secrets', keys: { expires_at: 1 } }
        ];

        for (const index of indexes) {
            await database.createIndex(index.collection, index.keys, index.options || {});
            console.log(`Created index on ${index.collection}`);
        }

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('demo123', 12);

        const existingAdmin = await database.get('admins', { username: 'admin' });
        if (!existingAdmin) {
            await database.run('admins', 'insert', {
                username: 'admin',
                password_hash: hashedPassword,
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('Inserted default admin user');
        } else {
            console.log('Admin user already exists');
        }

        console.log('Database initialization completed successfully!');

        await database.close();
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database initialization completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
