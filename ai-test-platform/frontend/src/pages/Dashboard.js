import React, { useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  Folder as ProjectsIcon,
  Assignment as TestsIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  TrendingUp as RateIcon
} from '@mui/icons-material';
import { useProjectStore } from '../context/store';
import { projectsAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 140
    }}
  >
    <Box>
      <Typography color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
    </Box>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 2,
        backgroundColor: `${color}.lighter`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 28 } })}
    </Box>
  </Paper>
);

export default function Dashboard() {
  const { stats, fetchStats } = useProjectStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      await fetchStats();
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Overview of your test automation activities
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            icon={<ProjectsIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Test Cases"
            value={stats?.totalTestCases || 0}
            icon={<TestsIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Test Runs"
            value={stats?.totalTestRuns || 0}
            icon={<RateIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Passed"
            value={stats?.passedRuns || 0}
            icon={<PassIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Failed"
            value={stats?.failedRuns || 0}
            icon={<FailIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Pass Rate Card */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pass Rate
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3" fontWeight="bold" color="success.main">
            {stats?.passRate || 0}%
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: 8,
              backgroundColor: 'grey.200',
              borderRadius: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${stats?.passRate || 0}%`,
                height: '100%',
                backgroundColor: 'success.main',
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Recent Activity Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography color="text.secondary">
          No recent activity to display
        </Typography>
      </Paper>
    </DashboardLayout>
  );
}
