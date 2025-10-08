const database = require('./config/database');

async function updateTestUser() {
    try {
        await database.connect();
        const user = await database.collection('users').findOne({ mobile_number: '+1987654321' });
        if (user) {
            await database.collection('users').updateOne(
                { _id: user._id },
                { $set: { id: user._id.toString() } }
            );
            console.log('Test user updated with ID:', user._id.toString());
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error updating test user:', error);
    } finally {
        await database.close();
    }
}

updateTestUser();
