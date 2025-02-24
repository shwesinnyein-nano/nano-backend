const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./api/authentication");
const lineRoutes = require("./api/send-line-message");

// Define API routes
app.use("/auth", authRoutes);
app.use("/line", lineRoutes);

// Default route to prevent 404
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Export the app for serverless deployment
module.exports = app;

// Start server for local development
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
