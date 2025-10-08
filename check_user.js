const database = require('./config/database');

async function checkUser() {
    try {
        await database.connect();
        const user = await database.collection('users').findOne({ mobile_number: '+15714305024' });
        console.log('User found:', user);
        if (user) {
            console.log('is_verified:', user.is_verified);
        }
        await database.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser();
