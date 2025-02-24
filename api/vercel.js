const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http"); // ✅ Import serverless wrapper

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

module.exports = app;
module.exports.handler = serverless(app); // ✅ Export for Vercel
