# AI Test Platform - Complete Setup Guide

## Overview
AI Test Platform is a comprehensive web-based test automation solution with AI-powered test case generation, self-healing automation, and a no-code UI for non-technical users.

## Features
- ✅ User Authentication (JWT, Role-based access)
- ✅ SaaS Dashboard with statistics
- ✅ Project Management
- ✅ AI Test Case Generator (OpenAI integration)
- ✅ No-Code Test Builder
- ✅ Selenium Test Execution Engine
- ✅ Self-Healing Automation
- ✅ Bug Report System with PDF/HTML export
- ✅ Admin Panel
- ✅ Webhook Support for CI/CD
- ✅ Email Notifications (configurable)

## Prerequisites
- Node.js v16+ 
- MongoDB v5+
- Chrome browser (for Selenium)
- OpenAI API Key (optional, for AI features)

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd ai-test-platform/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-test-platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
```

### 4. Start MongoDB
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Create logs directory
```bash
mkdir -p logs uploads/screenshots uploads/reports
```

### 6. Start the backend server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd ai-test-platform/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment (optional)
Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the frontend
```bash
npm start
```

Frontend will run on `http://localhost:3000`

---

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "...", "role": "user" },
    "token": "jwt-token-here"
  }
}
```

### Projects Endpoints

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Website",
  "url": "https://example.com",
  "description": "Test project"
}
```

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

### Test Cases Endpoints

#### Generate Test Cases with AI
```http
POST /api/testcases/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project-id-here",
  "url": "https://example.com",
  "prompt": "Generate login and registration test cases"
}
```

#### Get Test Cases by Project
```http
GET /api/testcases/project/:projectId
Authorization: Bearer <token>
```

#### Create Test Case Manually
```http
POST /api/testcases
Authorization: Bearer <token>
Content-Type: application/json

{
  "project": "project-id",
  "name": "Login Test",
  "type": "functional",
  "priority": "high",
  "steps": [
    {
      "action": "navigate",
      "selector": "",
      "selectorType": "css",
      "value": "https://example.com/login"
    },
    {
      "action": "type",
      "selector": "#email",
      "selectorType": "id",
      "value": "test@example.com"
    },
    {
      "action": "click",
      "selector": "#login-btn",
      "selectorType": "id"
    }
  ]
}
```

### Test Runs Endpoints

#### Execute Single Test
```http
POST /api/testruns/execute/:testCaseId
Authorization: Bearer <token>
```

#### Execute Batch Tests
```http
POST /api/testruns/execute-batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "testCaseIds": ["id1", "id2", "id3"]
}
```

#### Get Test Run Results
```http
GET /api/testruns/:id
Authorization: Bearer <token>
```

#### Export Test Report as PDF
```http
GET /api/testruns/:id/export-pdf
Authorization: Bearer <token>
```

### Bug Reports Endpoints

#### Get Bug Reports
```http
GET /api/testruns/bugs/:projectId
Authorization: Bearer <token>
```

#### Update Bug Status
```http
PUT /api/testruns/bugs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "resolved",
  "resolution": "Fixed in version 1.2.0"
}
```

#### Export Bug Report as HTML
```http
GET /api/testruns/bugs/:id/export-html
Authorization: Bearer <token>
```

### Webhook for CI/CD

#### Trigger Tests via Webhook
```http
POST /api/webhooks/trigger-tests
Content-Type: application/json

{
  "projectId": "project-id",
  "testCaseIds": ["test1", "test2"],
  "webhookSecret": "your-webhook-secret"
}
```

---

## Folder Structure

```
ai-test-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, logging, error handling
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (test execution, AI)
│   │   └── server.js        # Entry point
│   ├── uploads/             # Screenshots, reports
│   ├── logs/                # Application logs
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── context/         # State management (Zustand)
    │   ├── pages/           # Page components
    │   ├── services/        # API services
    │   ├── App.js           # Main app component
    │   └── index.js         # Entry point
    └── package.json
```

---

## Usage Guide

### 1. Create Account
- Navigate to `http://localhost:3000/register`
- Fill in your details and create an account

### 2. Create a Project
- Go to Projects page
- Click "New Project"
- Enter project name and website URL

### 3. Generate Test Cases with AI
- Select a project
- Click "Generate Test Cases"
- Enter URL or use project URL
- Optionally add custom prompt
- AI will generate functional, edge, and UI test cases

### 4. Edit Test Cases (No-Code Builder)
- View generated test cases
- Click to edit steps
- Add/remove actions: click, type, validate, navigate, wait
- Save changes

### 5. Execute Tests
- Select test cases to run
- Click "Run Tests"
- View real-time execution status
- Check logs and screenshots

### 6. View Bug Reports
- Failed tests automatically create bug reports
- View bugs in Bug Reports page
- Update status, assign to team members
- Export as HTML/PDF

---

## Self-Healing Automation

The system automatically attempts to heal failed element locators:

1. **Primary Strategy**: Try original selector
2. **Alternative Strategies**:
   - ID → CSS/XPath alternatives
   - Class → CSS/XPath with contains
   - Name → CSS/XPath alternatives
   - Text content search as fallback

3. **Tracking**: All healed locators are logged and can be reviewed

---

## Testing with Postman

Import this collection or test manually:

### Health Check
```
GET http://localhost:5000/api/health
```

### Register & Login Flow
1. Register new user
2. Login and copy token
3. Use token in Authorization header: `Bearer <token>`

### Sample Test Creation
```json
POST http://localhost:5000/api/testcases
{
  "project": "YOUR_PROJECT_ID",
  "name": "Homepage Load Test",
  "type": "functional",
  "priority": "high",
  "steps": [
    {
      "action": "navigate",
      "selector": "",
      "value": "https://example.com"
    },
    {
      "action": "validate",
      "selector": "title",
      "selectorType": "tag",
      "expectedValue": "Example Domain"
    }
  ]
}
```

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`

### Selenium/ChromeDriver Issues
- Install Chrome browser
- Update chromedriver: `npm install chromedriver@latest`
- For headless servers, ensure Xvfb is installed

### AI Generation Not Working
- Verify OPENAI_API_KEY in `.env`
- Check API key has credits
- Fallback basic generation will work without AI

### Port Already in Use
- Change PORT in backend `.env`
- Update REACT_APP_API_URL in frontend `.env`

---

## Production Deployment

### Backend
```bash
NODE_ENV=production npm start
```

### Frontend
```bash
npm run build
# Deploy build folder to static hosting
```

### Environment Variables for Production
- Set strong JWT_SECRET
- Use production MongoDB URI
- Configure proper CORS origins
- Set up SSL/TLS

---

## License
MIT License - Feel free to use and modify

## Support
For issues and feature requests, please check documentation or contact support.
