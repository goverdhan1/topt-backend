const database = require('./config/database');

async function checkDB() {
    try {
        await database.connect();
        const user = await database.get('SELECT * FROM users WHERE mobile_number = ?', ['+1987654321']);
        console.log('User data:', user);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await database.close();
    }
}

checkDB();
