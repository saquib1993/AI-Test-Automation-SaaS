const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const BugReport = require('../models/BugReport');

class TestExecutionEngine {
  constructor() {
    this.driver = null;
    this.screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
    
    // Ensure screenshots directory exists
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async initialize(browser = 'chrome') {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser(browser)
      .setChromeOptions(options)
      .build();

    this.driver.manage().setTimeouts({ implicit: 10000 });
  }

  async quit() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async takeScreenshot(testRunId, stepIndex) {
    try {
      const screenshot = await this.driver.takeScreenshot();
      const filename = `testrun_${testRunId}_step${stepIndex}_${Date.now()}.png`;
      const filepath = path.join(this.screenshotsDir, filename);
      
      fs.writeFileSync(filepath, screenshot, 'base64');
      return `/uploads/screenshots/${filename}`;
    } catch (error) {
      console.error('Screenshot error:', error);
      return null;
    }
  }

  // Self-healing locator mechanism
  async findElementWithHealing(selector, selectorType, alternatives = []) {
    const strategies = [
      { type: selectorType, value: selector },
      ...alternatives
    ];

    for (const strategy of strategies) {
      try {
        let element;
        switch (strategy.type) {
          case 'id':
            element = await this.driver.findElement(By.id(strategy.value));
            break;
          case 'name':
            element = await this.driver.findElement(By.name(strategy.value));
            break;
          case 'class':
            element = await this.driver.findElement(By.className(strategy.value));
            break;
          case 'css':
            element = await this.driver.findElement(By.css(strategy.value));
            break;
          case 'xpath':
            element = await this.driver.findElement(By.xpath(strategy.value));
            break;
          case 'tag':
            element = await this.driver.findElement(By.tagName(strategy.value));
            break;
          default:
            element = await this.driver.findElement(By.css(strategy.value));
        }
        
        // Verify element is interactable
        await element.isDisplayed();
        await element.isEnabled();
        
        return { element, usedStrategy: strategy };
      } catch (error) {
        continue; // Try next strategy
      }
    }

    throw new Error(`Element not found with any strategy. Original: ${selectorType}=${selector}`);
  }

  generateAlternativeLocators(selector, selectorType) {
    const alternatives = [];
    
    // Generate common alternative strategies
    if (selectorType === 'id') {
      alternatives.push({ type: 'css', value: `[id="${selector}"]` });
      alternatives.push({ type: 'xpath', value: `//*[@id="${selector}"]` });
    } else if (selectorType === 'class') {
      alternatives.push({ type: 'css', value: `.${selector}` });
      alternatives.push({ type: 'xpath', value: `//*[contains(@class, "${selector}")]` });
    } else if (selectorType === 'name') {
      alternatives.push({ type: 'css', value: `[name="${selector}"]` });
      alternatives.push({ type: 'xpath', value: `//*[@name="${selector}"]` });
    }
    
    // Add text-based search as last resort
    if (selectorType !== 'xpath') {
      alternatives.push({ type: 'xpath', value: `//*[contains(text(), "${selector}")]` });
    }

    return alternatives;
  }

  async executeStep(step, testRunId, stepIndex) {
    const { action, selector, selectorType, value, expectedValue } = step;
    let healedLocator = null;

    try {
      const alternatives = this.generateAlternativeLocators(selector, selectorType);
      const { element, usedStrategy } = await this.findElementWithHealing(
        selector, 
        selectorType, 
        alternatives
      );

      // Track if we used an alternative locator (self-healing)
      if (usedStrategy.type !== selectorType || usedStrategy.value !== selector) {
        healedLocator = {
          originalSelector: `${selectorType}:${selector}`,
          newSelector: `${usedStrategy.type}:${usedStrategy.value}`,
          stepIndex
        };
      }

      switch (action) {
        case 'click':
          await element.click();
          break;

        case 'type':
          await element.clear();
          await element.sendKeys(value);
          break;

        case 'validate':
          const text = await element.getText();
          const isVisible = await element.isDisplayed();
          
          if (expectedValue) {
            if (expectedValue === 'visible' && !isVisible) {
              throw new Error(`Element not visible. Expected: visible, Got: ${isVisible}`);
            }
            if (text !== expectedValue) {
              throw new Error(`Text mismatch. Expected: "${expectedValue}", Got: "${text}"`);
            }
          }
          break;

        case 'navigate':
          await this.driver.get(value);
          break;

        case 'wait':
          await this.driver.sleep(parseInt(value) || 1000);
          break;

        case 'scroll':
          await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
          break;

        case 'hover':
          const actions = this.driver.actions({ async: true });
          await actions.move({ origin: element }).perform();
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return { success: true, healedLocator };
    } catch (error) {
      const screenshot = await this.takeScreenshot(testRunId, stepIndex);
      return {
        success: false,
        error: error.message,
        screenshot,
        healedLocator
      };
    }
  }

  async executeTestCase(testCaseId, userId) {
    const testCase = await TestCase.findById(testCaseId).populate('project');
    
    if (!testCase) {
      throw new Error('Test case not found');
    }

    // Create test run record
    const testRun = await TestRun.create({
      project: testCase.project._id,
      testCase: testCase._id,
      status: 'running',
      startedAt: new Date(),
      triggeredBy: userId,
      result: {
        totalSteps: testCase.steps.length
      }
    });

    try {
      // Initialize browser
      await this.initialize('chrome');

      // Navigate to project URL
      await this.driver.get(testCase.project.url);
      await this.driver.sleep(2000); // Wait for page load

      const logs = [];
      const screenshots = [];
      const errors = [];
      let passedSteps = 0;
      let failedSteps = 0;
      const healedLocators = [];

      // Execute each step
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        logs.push(`Executing step ${i + 1}: ${step.action} on ${step.selector}`);

        const result = await this.executeStep(step, testRun._id, i);

        if (result.success) {
          passedSteps++;
          logs.push(`Step ${i + 1} passed`);
          
          if (result.healedLocator) {
            healedLocators.push(result.healedLocator);
            logs.push(`Self-healing: Used alternative locator ${result.healedLocator.newSelector}`);
          }
        } else {
          failedSteps++;
          logs.push(`Step ${i + 1} failed: ${result.error}`);
          errors.push({
            stepIndex: i,
            message: result.error,
            screenshot: result.screenshot,
            timestamp: new Date()
          });

          if (result.screenshot) {
            screenshots.push(result.screenshot);
          }

          if (result.healedLocator) {
            healedLocators.push(result.healedLocator);
          }
        }
      }

      // Final screenshot
      const finalScreenshot = await this.takeScreenshot(testRun._id, 'final');
      if (finalScreenshot) {
        screenshots.push(finalScreenshot);
      }

      // Update test run
      testRun.status = failedSteps === 0 ? 'passed' : 'failed';
      testRun.completedAt = new Date();
      testRun.result = {
        passedSteps,
        failedSteps,
        totalSteps: testCase.steps.length
      };
      testRun.logs = logs;
      testRun.screenshots = screenshots;
      testRun.errors = errors;
      testRun.isHealed = healedLocators.length > 0;
      testRun.healedLocators = healedLocators;

      await testRun.save();

      // Create bug report if test failed
      if (testRun.status === 'failed') {
        await this.createBugReport(testRun, testCase, userId);
      }

      return testRun;
    } catch (error) {
      testRun.status = 'error';
      testRun.completedAt = new Date();
      testRun.logs.push(`Fatal error: ${error.message}`);
      await testRun.save();

      throw error;
    } finally {
      await this.quit();
    }
  }

  async createBugReport(testRun, testCase, userId) {
    const firstError = testRun.errors[0];
    
    const bugReport = await BugReport.create({
      project: testRun.project,
      testRun: testRun._id,
      testCase: testRun.testCase,
      title: `Test Failed: ${testCase.name}`,
      description: `Automated test case "${testCase.name}" failed during execution.\n\nFailed at step ${firstError?.stepIndex + 1 || 'unknown'}\nError: ${firstError?.message || 'Unknown error'}`,
      severity: testCase.priority === 'critical' ? 'critical' : 
                testCase.priority === 'high' ? 'high' : 'medium',
      stepsToReproduce: testCase.steps.slice(0, (firstError?.stepIndex || 0) + 1).map((step, i) => ({
        step: `Step ${i + 1}: ${step.action} on ${step.selector}`,
        expected: step.expectedValue || 'Action to complete successfully',
        actual: i === firstError?.stepIndex ? firstError.message : 'Success'
      })),
      evidence: {
        screenshots: testRun.screenshots,
        logs: testRun.logs
      },
      errorMessage: firstError?.message || '',
      reportedBy: userId
    });

    return bugReport;
  }

  async executeMultipleTests(testCaseIds, userId) {
    const results = [];
    
    for (const testCaseId of testCaseIds) {
      try {
        const result = await this.executeTestCase(testCaseId, userId);
        results.push({ testCaseId, status: result.status, testRun: result._id });
      } catch (error) {
        results.push({ testCaseId, status: 'error', error: error.message });
      }
    }

    return results;
  }
}

module.exports = new TestExecutionEngine();
