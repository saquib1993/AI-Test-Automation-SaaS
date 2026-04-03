const TestRun = require('../models/TestRun');
const BugReport = require('../models/BugReport');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get all test runs for a project
// @route   GET /api/testruns/project/:projectId
// @access  Private
exports.getTestRuns = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, limit = 50 } = req.query;

    const query = { project: projectId };
    if (status) query.status = status;

    const testRuns = await TestRun.find(query)
      .populate('testCase', 'name type priority')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: testRuns.length,
      data: testRuns
    });
  } catch (error) {
    console.error('Get test runs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single test run
// @route   GET /api/testruns/:id
// @access  Private
exports.getTestRun = async (req, res) => {
  try {
    const testRun = await TestRun.findById(req.params.id)
      .populate('testCase', 'name type priority steps')
      .populate('project', 'name url');

    if (!testRun) {
      return res.status(404).json({
        success: false,
        message: 'Test run not found'
      });
    }

    res.status(200).json({
      success: true,
      data: testRun
    });
  } catch (error) {
    console.error('Get test run error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Execute test case
// @route   POST /api/testruns/execute/:testCaseId
// @access  Private
exports.executeTestCase = async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const testExecutionService = require('../services/testExecutionService');

    // Execute test in background
    const result = await testExecutionService.executeTestCase(testCaseId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Test execution completed',
      data: result
    });
  } catch (error) {
    console.error('Execute test case error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Test execution failed'
    });
  }
};

// @desc    Execute multiple test cases
// @route   POST /api/testruns/execute-batch
// @access  Private
exports.executeBatch = async (req, res) => {
  try {
    const { testCaseIds } = req.body;

    if (!testCaseIds || !Array.isArray(testCaseIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of test case IDs'
      });
    }

    const testExecutionService = require('../services/testExecutionService');

    // Execute tests in background (don't wait for completion)
    const executionPromise = testExecutionService.executeMultipleTests(testCaseIds, req.user.id);

    res.status(202).json({
      success: true,
      message: 'Test execution started',
      data: {
        totalTests: testCaseIds.length,
        status: 'running'
      }
    });

    // Don't await - let it run in background
    executionPromise.catch(err => console.error('Batch execution error:', err));
  } catch (error) {
    console.error('Execute batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get bug reports for a project
// @route   GET /api/testruns/bugs/:projectId
// @access  Private
exports.getBugReports = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, severity, limit = 50 } = req.query;

    const query = { project: projectId };
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const bugReports = await BugReport.find(query)
      .populate('testCase', 'name')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: bugReports.length,
      data: bugReports
    });
  } catch (error) {
    console.error('Get bug reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update bug report status
// @route   PUT /api/testruns/bugs/:id
// @access  Private
exports.updateBugReport = async (req, res) => {
  try {
    const { status, resolution, assignedTo } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (resolution) updateData.resolution = resolution;
    if (assignedTo) updateData.assignedTo = assignedTo;

    if (status === 'resolved') {
      updateData.resolvedBy = req.user.id;
    }

    const bugReport = await BugReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('testCase', 'name');

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bug report updated successfully',
      data: bugReport
    });
  } catch (error) {
    console.error('Update bug report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export test run report as PDF
// @route   GET /api/testruns/:id/export-pdf
// @access  Private
exports.exportReportPDF = async (req, res) => {
  try {
    const testRun = await TestRun.findById(req.params.id)
      .populate('testCase', 'name type priority steps description')
      .populate('project', 'name url');

    if (!testRun) {
      return res.status(404).json({
        success: false,
        message: 'Test run not found'
      });
    }

    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `report_${testRun._id}_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Test Execution Report', { align: 'center' });
    doc.moveDown();

    // Project Info
    doc.fontSize(14).text('Project Information', { underline: true });
    doc.fontSize(12).text(`Project: ${testRun.project.name}`);
    doc.text(`URL: ${testRun.project.url}`);
    doc.moveDown();

    // Test Case Info
    doc.fontSize(14).text('Test Case Information', { underline: true });
    doc.fontSize(12).text(`Name: ${testRun.testCase.name}`);
    doc.text(`Type: ${testRun.testCase.type}`);
    doc.text(`Priority: ${testRun.testCase.priority}`);
    doc.text(`Description: ${testRun.testCase.description || 'N/A'}`);
    doc.moveDown();

    // Execution Results
    doc.fontSize(14).text('Execution Results', { underline: true });
    doc.fontSize(12).text(`Status: ${testRun.status.toUpperCase()}`);
    doc.text(`Started: ${testRun.startedAt ? new Date(testRun.startedAt).toLocaleString() : 'N/A'}`);
    doc.text(`Completed: ${testRun.completedAt ? new Date(testRun.completedAt).toLocaleString() : 'N/A'}`);
    doc.text(`Duration: ${testRun.duration}ms`);
    doc.text(`Passed Steps: ${testRun.result.passedSteps}/${testRun.result.totalSteps}`);
    doc.moveDown();

    // Steps Summary
    doc.fontSize(14).text('Test Steps Summary', { underline: true });
    doc.fontSize(12);
    
    if (testRun.testCase.steps && testRun.testCase.steps.length > 0) {
      testRun.testCase.steps.forEach((step, index) => {
        const stepResult = testRun.errors.find(e => e.stepIndex === index) ? '❌ FAILED' : '✅ PASSED';
        doc.text(`${index + 1}. [${step.action}] ${step.selector} - ${stepResult}`);
      });
    }
    doc.moveDown();

    // Errors
    if (testRun.errors && testRun.errors.length > 0) {
      doc.fontSize(14).text('Errors', { underline: true });
      doc.fontSize(12);
      testRun.errors.forEach((error, index) => {
        doc.text(`${index + 1}. Step ${error.stepIndex + 1}: ${error.message}`);
      });
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(filepath, `test-report-${testRun._id}.pdf`, (err) => {
        if (err) console.error('Download error:', err);
        // Clean up file after download
        setTimeout(() => {
          fs.unlink(filepath, (unlinkErr) => {
            if (unlinkErr) console.error('Cleanup error:', unlinkErr);
          });
        }, 1000);
      });
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report'
    });
  }
};

// @desc    Export bug report as HTML
// @route   GET /api/testruns/bugs/:id/export-html
// @access  Private
exports.exportBugReportHTML = async (req, res) => {
  try {
    const bugReport = await BugReport.findById(req.params.id)
      .populate('testCase', 'name type')
      .populate('project', 'name url')
      .populate('reportedBy', 'name email');

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Bug Report: ${bugReport.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { background: #f44336; color: white; padding: 20px; border-radius: 5px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .severity-critical { border-left: 4px solid #f44336; }
    .severity-high { border-left: 4px solid #ff9800; }
    .severity-medium { border-left: 4px solid #ffeb3b; }
    .severity-low { border-left: 4px solid #4caf50; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .status-open { background: #f44336; color: white; padding: 3px 8px; border-radius: 3px; }
    .status-resolved { background: #4caf50; color: white; padding: 3px 8px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${bugReport.title}</h1>
    <p>Status: <span class="status-${bugReport.status}">${bugReport.status}</span></p>
  </div>
  
  <div class="section severity-${bugReport.severity}">
    <h2>Project: ${bugReport.project.name}</h2>
    <p><strong>URL:</strong> ${bugReport.project.url}</p>
    <p><strong>Severity:</strong> ${bugReport.severity}</p>
    <p><strong>Test Case:</strong> ${bugReport.testCase.name}</p>
    <p><strong>Reported By:</strong> ${bugReport.reportedBy.name} (${bugReport.reportedBy.email})</p>
    <p><strong>Created:</strong> ${new Date(bugReport.createdAt).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Description</h2>
    <p>${bugReport.description}</p>
  </div>

  <div class="section">
    <h2>Steps to Reproduce</h2>
    <table>
      <tr><th>Step</th><th>Expected</th><th>Actual</th></tr>
      ${bugReport.stepsToReproduce.map(s => `
        <tr>
          <td>${s.step}</td>
          <td>${s.expected}</td>
          <td>${s.actual}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  ${bugReport.errorMessage ? `
  <div class="section">
    <h2>Error Message</h2>
    <pre>${bugReport.errorMessage}</pre>
  </div>
  ` : ''}

  ${bugReport.evidence.screenshots && bugReport.evidence.screenshots.length > 0 ? `
  <div class="section">
    <h2>Screenshots</h2>
    ${bugReport.evidence.screenshots.map(s => `<img src="${s}" style="max-width: 100%; margin: 10px 0;">`).join('')}
  </div>
  ` : ''}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="bug-report-${bugReport._id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Export HTML error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate HTML report'
    });
  }
};
