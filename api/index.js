// Vercel Serverless Entry Point
// This file re-exports the Express app from backend/server.js as a serverless function.
// Vercel will invoke this file for all /api/* requests.

module.exports = require('../backend/server.js');
