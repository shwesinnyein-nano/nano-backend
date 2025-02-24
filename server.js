const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./api/authentication");
const lineRoutes = require("./api/send-line-message");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/line", lineRoutes);

// Start server for local development
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
