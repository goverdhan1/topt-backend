const database = require('./config/database');

async function addNewTestUser() {
    try {
        await database.connect();
        const result = await database.run(
            'INSERT INTO users (mobile_number, is_verified) VALUES (?, ?)',
            ['+1987654321', 1]
        );
        console.log('New test user added with ID:', result.id);
    } catch (error) {
        console.error('Error adding new test user:', error);
    } finally {
        await database.close();
    }
}

addNewTestUser();
