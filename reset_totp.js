const database = require('./config/database');

async function resetTOTP() {
    try {
        await database.connect();
        const user = await database.collection('users').findOne({ mobile_number: '+1987654321' });
        if (user) {
            await database.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        totp_enabled: false,
                        totp_secret: null,
                        updated_at: new Date()
                    },
                    $unset: { totp_secret: 1 }
                }
            );
            console.log('TOTP reset for test user');
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error resetting TOTP:', error);
    } finally {
        await database.close();
    }
}

resetTOTP();
