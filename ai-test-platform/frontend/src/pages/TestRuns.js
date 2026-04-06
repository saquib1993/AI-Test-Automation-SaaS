import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function TestRuns() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Test Runs
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography>Test Runs page - Execute and monitor tests</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Features:
          </Typography>
          <ul>
            <li>Execute single or batch test cases</li>
            <li>View execution logs and screenshots</li>
            <li>Self-healing automation tracking</li>
            <li>Export reports as PDF</li>
          </ul>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
