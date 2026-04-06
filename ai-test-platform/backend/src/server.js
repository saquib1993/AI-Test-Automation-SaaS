const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { requestLogger } = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const testCaseRoutes = require('./routes/testCases');
const testRunRoutes = require('./routes/testRuns');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger
app.use(requestLogger); // Custom request logger

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/testruns', testRunRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint for CI/CD integration
app.post('/api/webhooks/trigger-tests', async (req, res) => {
  try {
    const { projectId, testCaseIds, webhookSecret } = req.body;

    // Validate webhook secret (in production, use proper authentication)
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook secret'
      });
    }

    // Trigger test execution (simplified - in production use queue system)
    const testExecutionService = require('./services/testExecutionService');
    
    // Run tests asynchronously
    const executionPromise = testExecutionService.executeMultipleTests(testCaseIds, null);
    
    res.status(202).json({
      success: true,
      message: 'Test execution triggered via webhook',
      data: {
        projectId,
        totalTests: testCaseIds ? testCaseIds.length : 0,
        status: 'queued'
      }
    });

    executionPromise.catch(err => console.error('Webhook test execution error:', err));
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger tests'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
