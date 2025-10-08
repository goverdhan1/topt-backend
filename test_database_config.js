const database = require('./config/database');

async function testDatabaseConfig() {
    try {
        console.log('Testing database config...');
        await database.connect();
        console.log('Database connected successfully.');

        // Try to get collections or something
        const collections = await database.db.collections();
        console.log('Collections:', collections.map(c => c.collectionName));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await database.close();
    }
}

testDatabaseConfig();
