import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data)
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: () => api.get('/projects/stats')
};

// Test Cases API
export const testCasesAPI = {
  generate: (data) => api.post('/testcases/generate', data),
  getByProject: (projectId, params) => 
    api.get(`/testcases/project/${projectId}`, { params }),
  getById: (id) => api.get(`/testcases/${id}`),
  create: (data) => api.post('/testcases', data),
  update: (id, data) => api.put(`/testcases/${id}`, data),
  delete: (id) => api.delete(`/testcases/${id}`)
};

// Test Runs API
export const testRunsAPI = {
  getByProject: (projectId, params) => 
    api.get(`/testruns/project/${projectId}`, { params }),
  getById: (id) => api.get(`/testruns/${id}`),
  execute: (testCaseId) => api.post(`/testruns/execute/${testCaseId}`),
  executeBatch: (testCaseIds) => api.post('/testruns/execute-batch', { testCaseIds }),
  getBugReports: (projectId, params) => 
    api.get(`/testruns/bugs/${projectId}`, { params }),
  updateBugReport: (id, data) => api.put(`/testruns/bugs/${id}`, data),
  exportPDF: (id) => api.get(`/testruns/${id}/export-pdf`, { responseType: 'blob' }),
  exportBugHTML: (id) => api.get(`/testruns/bugs/${id}/export-html`, { responseType: 'blob' })
};

export default api;
