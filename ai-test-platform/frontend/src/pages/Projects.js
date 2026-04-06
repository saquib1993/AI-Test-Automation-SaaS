import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Paper, Box } from '@mui/material';

export default function Projects() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Projects
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography>Projects page - Manage your test projects here</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Features:
          </Typography>
          <ul>
            <li>Create new projects with website URL</li>
            <li>List all projects</li>
            <li>Edit project settings</li>
            <li>Delete projects</li>
          </ul>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
