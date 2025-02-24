const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./api/authentication');
const lineRoutes = require('./api/send-line-message');

// Mount routes with a base path
app.use('/auth', authRoutes);
app.use('/line', lineRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
