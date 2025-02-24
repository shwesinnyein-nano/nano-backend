const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./api/authentication');
const lineRoutes = require('./api/send-line-message');

// Mount routes with a base path
app.use('/auth', authRoutes);
app.use('/line', lineRoutes);

const PORT = process.env.PORT || 8080;

// Export for Vercel
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
