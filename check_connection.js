const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://goverdhank:goverdhank@cluster0.lfozvm7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'topt';

async function checkConnection() {
    const client = new MongoClient(uri, {
        tls: true,
        serverSelectionTimeoutMS: 5000
    });
    try {
        console.log('Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('Connected successfully!');

        const db = client.db(dbName);
        const collections = await db.collections();
        console.log('Database:', dbName);
        console.log('Collections:', collections.map(c => c.collectionName));

        // Try to list some documents if collections exist
        if (collections.length > 0) {
            const sampleCollection = collections[0];
            const count = await sampleCollection.countDocuments();
            console.log(`Collection '${sampleCollection.collectionName}' has ${count} documents.`);
        }

    } catch (error) {
        console.error('Connection failed:', error.message);
    } finally {
        await client.close();
        console.log('Connection closed.');
    }
}

checkConnection();
