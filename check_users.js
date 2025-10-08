const sqlite3 = require('sqlite3').verbose();

const dbPath = './database.sqlite';

async function checkUsers() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
        });

        // Check users table
        db.all('SELECT * FROM users', async (err, rows) => {
            if (err) {
                console.error('Error querying users:', err.message);
                reject(err);
                return;
            }

            console.log('Users in database:', rows.length);
            for (const user of rows) {
                console.log(`ID: ${user.id}`);
                console.log(`Mobile: ${user.mobile_number}`);
                console.log(`Verified: ${user.is_verified}`);
                console.log(`Verification Status: ${user.verification_status}`);
                console.log(`Login Attempts: ${user.login_attempts}`);
                console.log('---');
            }

            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });
}

checkUsers()
    .then(() => {
        console.log('User check completed');
    })
    .catch((error) => {
        console.error('User check failed:', error);
    });
