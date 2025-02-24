const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./authentication");
const lineRoutes = require("./send-line-message");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/line", lineRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Nano Backend is working!" });
});

// Export as serverless function
module.exports = app;
module.exports.handler = serverless(app);
