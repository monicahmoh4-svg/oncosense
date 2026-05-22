// Vercel serverless entry point
// Wraps the entire Express app as a single serverless function
require("dotenv").config();

const app = require("../backend/src/app");

module.exports = app;
