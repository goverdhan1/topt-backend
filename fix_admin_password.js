const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = './database.sqlite';

async function fixAdminPassword() {
    const db = new sqlite3.Database(dbPath);

    try {
        // Generate correct hash for 'demo123'
        const correctHash = await bcrypt.hash('demo123', 12);
        console.log('Correct hash for "demo123":', correctHash);

        // Update admin password
        await new Promise((resolve, reject) => {
            db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [correctHash, 'admin'], function(err) {
                if (err) {
                    console.error('Error updating admin password:', err.message);
                    reject(err);
                    return;
                }

                console.log(`Updated ${this.changes} admin record(s)`);
                resolve();
            });
        });

        // Verify the update
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT password_hash FROM admins WHERE username = ?', ['admin'], (err, row) => {
                if (err) {
                    console.error('Error verifying update:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });

        if (row) {
            const isValid = await bcrypt.compare('demo123', row.password_hash);
            console.log('Password verification after update:', isValid ? 'SUCCESS' : 'FAILED');
        }

        console.log('Admin password fix completed successfully');
    } catch (error) {
        console.error('Admin password fix failed:', error);
    } finally {
        db.close();
    }
}

fixAdminPassword();
