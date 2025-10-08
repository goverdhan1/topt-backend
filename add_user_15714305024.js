const database = require('./config/database');

async function addUser() {
    try {
        await database.connect();
        const insertResult = await database.collection('users').insertOne({
            mobile_number: '+15714305024',
            is_verified: true,
            totp_enabled: false,
            login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Set the id field to the inserted _id
        await database.collection('users').updateOne(
            { _id: insertResult.insertedId },
            { $set: { id: insertResult.insertedId.toString() } }
        );

        console.log('User +15714305024 added with ID:', insertResult.insertedId);
    } catch (error) {
        console.error('Error adding user:', error);
    } finally {
        await database.close();
    }
}

addUser();
