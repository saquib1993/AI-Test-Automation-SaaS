import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function TestCases() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Test Cases
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography>Test Cases page - Create and manage test cases</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Features:
          </Typography>
          <ul>
            <li>AI-powered test case generation</li>
            <li>No-code test builder with drag-and-drop</li>
            <li>Edit test steps (click, type, validate)</li>
            <li>Organize by type and priority</li>
          </ul>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
