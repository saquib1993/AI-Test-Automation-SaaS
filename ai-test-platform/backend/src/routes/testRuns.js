const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  getTestRuns,
  getTestRun,
  executeTestCase,
  executeBatch,
  getBugReports,
  updateBugReport,
  exportReportPDF,
  exportBugReportHTML
} = require('../controllers/testRunController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/error');

// Validation rules
const executeValidation = [
  body('testCaseIds').isArray().withMessage('Test case IDs must be an array'),
  validate
];

// All routes are protected
router.use(protect);

// Routes
router.get('/project/:projectId', getTestRuns);
router.get('/:id/export-pdf', exportReportPDF);
router.route('/')
  .get(getTestRuns)
  .post(executeValidation, executeBatch);

router.route('/:id')
  .get(getTestRun);

router.post('/execute/:testCaseId', executeTestCase);
router.post('/execute-batch', executeValidation, executeBatch);

// Bug reports
router.get('/bugs/:projectId', getBugReports);
router.put('/bugs/:id', updateBugReport);
router.get('/bugs/:id/export-html', exportBugReportHTML);

module.exports = router;
