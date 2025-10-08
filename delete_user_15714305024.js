const database = require('./config/database');

async function deleteUser() {
    try {
        await database.connect();
        const result = await database.collection('users').deleteOne({ mobile_number: '+15714305024' });
        if (result.deletedCount > 0) {
            console.log('User +15714305024 deleted');
        } else {
            console.log('User +15714305024 not found');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await database.close();
    }
}

deleteUser();
