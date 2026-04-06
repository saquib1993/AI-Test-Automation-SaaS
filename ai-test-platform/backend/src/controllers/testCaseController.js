const axios = require('axios');
const TestCase = require('../models/TestCase');
const cheerio = require('cheerio');

// @desc    Generate test cases using AI
// @route   POST /api/testcases/generate
// @access  Private
exports.generateTestCases = async (req, res) => {
  try {
    const { url, html, prompt, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    let pageContent = '';

    // If URL provided, fetch the page
    if (url) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AITestPlatform/1.0)'
          }
        });
        pageContent = response.data;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Failed to fetch URL. Please check if the URL is accessible.'
        });
      }
    } else if (html) {
      pageContent = html;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either URL or HTML content'
      });
    }

    // Parse HTML to extract key elements
    const $ = cheerio.load(pageContent);
    const extractedInfo = {
      title: $('title').text(),
      headings: [],
      buttons: [],
      links: [],
      forms: [],
      inputs: []
    };

    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      if (i < 10) extractedInfo.headings.push($(el).text().trim());
    });

    $('button, [role="button"]').each((i, el) => {
      if (i < 15) {
        extractedInfo.buttons.push({
          text: $(el).text().trim(),
          id: $(el).attr('id') || '',
          class: $(el).attr('class') || ''
        });
      }
    });

    $('a[href]').each((i, el) => {
      if (i < 15) {
        extractedInfo.links.push({
          text: $(el).text().trim(),
          href: $(el).attr('href')
        });
      }
    });

    $('form').each((i, el) => {
      if (i < 5) {
        extractedInfo.forms.push({
          action: $(el).attr('action') || '',
          method: $(el).attr('method') || 'post'
        });
      }
    });

    $('input, select, textarea').each((i, el) => {
      if (i < 15) {
        extractedInfo.inputs.push({
          type: $(el).attr('type') || 'text',
          name: $(el).attr('name') || '',
          placeholder: $(el).attr('placeholder') || '',
          required: $(el).attr('required') !== undefined
        });
      }
    });

    // Prepare AI prompt
    const aiPrompt = prompt || `Generate comprehensive test cases for a website with the following structure:
    
Page Title: ${extractedInfo.title}
Headings: ${extractedInfo.headings.join(', ')}
Buttons: ${extractedInfo.buttons.map(b => b.text).join(', ')}
Links: ${extractedInfo.links.map(l => l.text).join(', ')}
Form Inputs: ${extractedInfo.inputs.map(i => `${i.type}:${i.name}`).join(', ')}

Generate test cases including:
1. Functional test cases for main features
2. Edge cases and error scenarios
3. UI/UX validation tests
4. Navigation tests

Return the response in JSON format with an array of test cases, each containing:
- name: test case name
- description: brief description
- type: functional/edge/ui/performance
- priority: low/medium/high/critical
- steps: array of actions with selector, selectorType, action, value, expectedValue`;

    // Call AI API (OpenAI or fallback to mock)
    let aiResponse;
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      try {
        const openAIResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.AI_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a QA expert. Generate detailed test cases in JSON format.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        aiResponse = openAIResponse.data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        aiResponse = null;
      }
    }

    // If AI fails or not configured, generate basic test cases
    if (!aiResponse) {
      aiResponse = JSON.stringify(generateBasicTestCases(extractedInfo));
    }

    // Parse AI response
    let generatedTests;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedTests = JSON.parse(jsonMatch[0]);
      } else {
        generatedTests = JSON.parse(aiResponse);
      }
    } catch (error) {
      // Fallback to basic test generation
      generatedTests = generateBasicTestCases(extractedInfo);
    }

    // Save test cases to database
    const savedTests = [];
    for (const test of generatedTests.slice(0, 20)) { // Limit to 20 tests
      const testCase = await TestCase.create({
        project: projectId,
        name: test.name || 'Untitled Test',
        description: test.description || '',
        type: test.type || 'functional',
        priority: test.priority || 'medium',
        steps: test.steps || [],
        isGenerated: true,
        aiPrompt: aiPrompt
      });
      savedTests.push(testCase);
    }

    res.status(200).json({
      success: true,
      message: `Generated ${savedTests.length} test cases`,
      data: {
        testCases: savedTests,
        extractedInfo
      }
    });
  } catch (error) {
    console.error('Generate test cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating test cases'
    });
  }
};

// Helper function to generate basic test cases without AI
function generateBasicTestCases(info) {
  const tests = [];

  // Title validation test
  tests.push({
    name: 'Validate Page Title',
    description: 'Verify that the page title is displayed correctly',
    type: 'functional',
    priority: 'high',
    steps: [
      {
        action: 'validate',
        selector: 'title',
        selectorType: 'tag',
        expectedValue: info.title
      }
    ]
  });

  // Navigation test for each link
  info.links.slice(0, 5).forEach((link, index) => {
    tests.push({
      name: `Navigate to ${link.text || 'Link ' + (index + 1)}`,
      description: `Click on ${link.text} link and verify navigation`,
      type: 'functional',
      priority: 'medium',
      steps: [
        {
          action: 'click',
          selector: `a[href="${link.href}"]`,
          selectorType: 'css',
          value: link.text
        }
      ]
    });
  });

  // Button click tests
  info.buttons.slice(0, 5).forEach((btn, index) => {
    tests.push({
      name: `Click ${btn.text || 'Button ' + (index + 1)}`,
      description: `Verify ${btn.text} button is clickable`,
      type: 'ui',
      priority: 'medium',
      steps: [
        {
          action: 'click',
          selector: btn.id ? `#${btn.id}` : `button:contains("${btn.text}")`,
          selectorType: btn.id ? 'id' : 'css'
        }
      ]
    });
  });

  // Form input tests
  if (info.inputs.length > 0) {
    tests.push({
      name: 'Form Input Validation',
      description: 'Test form input fields',
      type: 'functional',
      priority: 'high',
      steps: info.inputs.slice(0, 5).map(input => ({
        action: 'type',
        selector: input.name ? `[name="${input.name}"]` : `input[type="${input.type}"]`,
        selectorType: input.name ? 'css' : 'css',
        value: 'test value',
        expectedValue: 'test value'
      }))
    });
  }

  // Edge case - empty form submission
  if (info.forms.length > 0) {
    tests.push({
      name: 'Empty Form Submission',
      description: 'Try submitting form without filling required fields',
      type: 'edge',
      priority: 'high',
      steps: [
        {
          action: 'click',
          selector: 'button[type="submit"]',
          selectorType: 'css'
        },
        {
          action: 'validate',
          selector: '.error, .invalid, [aria-invalid="true"]',
          selectorType: 'css',
          expectedValue: 'visible'
        }
      ]
    });
  }

  return tests;
}

// @desc    Get all test cases for a project
// @route   GET /api/testcases/project/:projectId
// @access  Private
exports.getTestCases = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, priority } = req.query;

    const query = { project: projectId };
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const testCases = await TestCase.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases
    });
  } catch (error) {
    console.error('Get test cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single test case
// @route   GET /api/testcases/:id
// @access  Private
exports.getTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    res.status(200).json({
      success: true,
      data: testCase
    });
  } catch (error) {
    console.error('Get test case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create test case
// @route   POST /api/testcases
// @access  Private
exports.createTestCase = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const testCase = await TestCase.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Test case created successfully',
      data: testCase
    });
  } catch (error) {
    console.error('Create test case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update test case
// @route   PUT /api/testcases/:id
// @access  Private
exports.updateTestCase = async (req, res) => {
  try {
    let testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    testCase = await TestCase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Test case updated successfully',
      data: testCase
    });
  } catch (error) {
    console.error('Update test case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete test case
// @route   DELETE /api/testcases/:id
// @access  Private
exports.deleteTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    await testCase.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Test case deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
