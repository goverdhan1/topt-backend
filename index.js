const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Database and middleware
const database = require('./config/database');
const { initializeAuditLog, corsOptions } = require('./middleware/security');

const PORT = process.env.PORT || 3001;

(async () => {
    try {
        // Initialize database
        await database.connect();
        console.log('Database connected');

        // Initialize audit log middleware
        initializeAuditLog(database);

const authRoutes = require('./routes/auth');
// Now require routes after initialization
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

        // Health check
        app.get('/health', (req, res) => {
            res.json({ message: 'OK' });
        });

        app.listen(PORT, () => {
            console.log('Server running on port', PORT);
        });

    } catch (err) {
        console.error('Initialization failed:', err);
        process.exit(1);
    }
})();
