const database = require('./config/database');

async function addTestUser() {
    try {
        await database.connect();
        const result = await database.run(
            'INSERT INTO users (mobile_number, is_verified) VALUES (?, ?)',
            ['+1234567890', 1]
        );
        console.log('Test user added with ID:', result.id);
    } catch (error) {
        console.error('Error adding test user:', error);
    } finally {
        await database.close();
    }
}

addTestUser();
