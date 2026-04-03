import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function BugReports() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Bug Reports
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography>Bug Reports page - Track and manage bugs</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Features:
          </Typography>
          <ul>
            <li>View failed test cases as bugs</li>
            <li>Track bug status (open, in progress, resolved)</li>
            <li>Export bug reports as HTML</li>
            <li>Assign bugs to team members</li>
          </ul>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
