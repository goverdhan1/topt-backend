const database = require('./config/database');

async function verifyUser() {
    try {
        await database.connect();
        const user = await database.collection('users').findOne({ mobile_number: '+15714305024' });
        if (user) {
            await database.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        is_verified: true,
                        updated_at: new Date()
                    }
                }
            );
            console.log('User +15714305024 verified');
        } else {
            console.log('User +15714305024 not found');
        }
    } catch (error) {
        console.error('Error verifying user:', error);
    } finally {
        await database.close();
    }
}

verifyUser();
