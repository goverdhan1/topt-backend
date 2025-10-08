const database = require('./config/database');

async function addThirdTestUser() {
    try {
        await database.connect();
        const result = await database.run(
            'INSERT INTO users (mobile_number, is_verified) VALUES (?, ?)',
            ['+1123456789', 1]
        );
        console.log('Third test user added with ID:', result.id);
    } catch (error) {
        console.error('Error adding third test user:', error);
    } finally {
        await database.close();
    }
}

addThirdTestUser();
