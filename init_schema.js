const fs = require('fs');
const path = require('path');
const database = require('./config/database');

async function initSchema() {
    try {
        // Connect to database
        await database.connect();

        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split into individual statements
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

        console.log('Executing schema statements...');

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                console.log('Executing:', trimmed.substring(0, 50) + '...');
                await database.run(trimmed);
            }
        }

        console.log('Schema initialized successfully');

    } catch (error) {
        console.error('Error initializing schema:', error);
    } finally {
        await database.close();
    }
}

initSchema();
