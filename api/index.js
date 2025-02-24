const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./authentication');
const lineRoutes = require('./send-line-message');

// Mount routes with a base path
app.use('/auth', authRoutes);
app.use('/line', lineRoutes);

// Export the app for Vercel
module.exports = app;
