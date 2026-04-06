const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  generateTestCases,
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase
} = require('../controllers/testCaseController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/error');

// Validation rules
const testCaseValidation = [
  body('name').trim().notEmpty().withMessage('Test case name is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  validate
];

const generateValidation = [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  validate
];

// All routes are protected
router.use(protect);

// Routes
router.post('/generate', generateValidation, generateTestCases);
router.get('/project/:projectId', getTestCases);
router.route('/')
  .post(testCaseValidation, createTestCase)
  .get(getTestCases);

router.route('/:id')
  .get(getTestCase)
  .put(updateTestCase)
  .delete(deleteTestCase);

module.exports = router;
