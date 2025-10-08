const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://goverdhank:goverdhank@cluster0.x9squ5a.mongodb.net/callcenter?retryWrites=true&w=majority';

async function testConnection() {
    const client = new MongoClient(uri);
    try {
        console.log('Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('Connected successfully!');

        const db = client.db('callcenter'); // assuming db name
        const collections = await db.collections();
        console.log('Collections:', collections.map(c => c.collectionName));

        // Check if admins collection exists
        const admins = await db.collection('admins').find({}).toArray();
        console.log('Admins:', admins);

    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await client.close();
    }
}

testConnection();
