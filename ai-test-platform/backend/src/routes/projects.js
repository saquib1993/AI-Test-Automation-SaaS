const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  getDashboardStats 
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/error');

// Validation rules
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('url').isURL().withMessage('Please provide a valid URL'),
  validate
];

// All routes are protected
router.use(protect);

// Routes
router.get('/stats', getDashboardStats);
router.route('/')
  .get(getProjects)
  .post(projectValidation, createProject);

router.route('/:id')
  .get(getProject)
  .put(projectValidation, updateProject)
  .delete(deleteProject);

module.exports = router;
