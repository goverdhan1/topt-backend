const { MongoClient } = require('mongodb');
require('dotenv').config();

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.uri = process.env.MONGODB_URI;
        this.dbName = process.env.MONGODB_DB;
        console.log('Using MongoDB database:', this.uri, this.dbName);
    }

    async connect() {
        try {
            this.client = new MongoClient(this.uri, {
                tls: true,
                serverSelectionTimeoutMS: 5000
            });
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            console.log('Connected to MongoDB database');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('MongoDB connection closed');
        }
    }

    // Generic query method - returns array of documents
    async query(collectionName, filter = {}, options = {}) {
        const collection = this.db.collection(collectionName);
        const cursor = collection.find(filter, options);
        return await cursor.toArray();
    }

    // Generic run method for INSERT, UPDATE, DELETE - returns result
    async run(collectionName, operation, data) {
        const collection = this.db.collection(collectionName);
        let result;

        switch (operation) {
            case 'insert':
                result = await collection.insertOne(data);
                return { id: result.insertedId, changes: result.acknowledged ? 1 : 0 };
            case 'update':
                result = await collection.updateOne(data.filter, data.update, data.options);
                return { id: null, changes: result.modifiedCount };
            case 'delete':
                result = await collection.deleteOne(data.filter);
                return { id: null, changes: result.deletedCount };
            default:
                throw new Error('Unsupported operation');
        }
    }

    // Get single document
    async get(collectionName, filter = {}, options = {}) {
        const collection = this.db.collection(collectionName);
        return await collection.findOne(filter, options);
    }

    // Insert multiple documents
    async insertMany(collectionName, documents) {
        const collection = this.db.collection(collectionName);
        const result = await collection.insertMany(documents);
        return { ids: Object.values(result.insertedIds), changes: result.insertedCount };
    }

    // Update multiple documents
    async updateMany(collectionName, filter, update, options = {}) {
        const collection = this.db.collection(collectionName);
        const result = await collection.updateMany(filter, update, options);
        return { changes: result.modifiedCount };
    }

    // Delete multiple documents
    async deleteMany(collectionName, filter) {
        const collection = this.db.collection(collectionName);
        const result = await collection.deleteMany(filter);
        return { changes: result.deletedCount };
    }

    // Count documents
    async count(collectionName, filter = {}) {
        const collection = this.db.collection(collectionName);
        return await collection.countDocuments(filter);
    }

    // Create index
    async createIndex(collectionName, keys, options = {}) {
        const collection = this.db.collection(collectionName);
        return await collection.createIndex(keys, options);
    }

    // Transaction support - simplified for now
    async beginTransaction() {
        const session = this.client.startSession();
        session.startTransaction();
        return session;
    }

    async commit(session) {
        await session.commitTransaction();
        session.endSession();
    }

    async rollback(session) {
        await session.abortTransaction();
        session.endSession();
    }

    // Helper method to get collection
    collection(name) {
        return this.db.collection(name);
    }
}

// Create singleton instance
const database = new Database();

module.exports = database;
