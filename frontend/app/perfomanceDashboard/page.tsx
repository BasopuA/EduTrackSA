"use client";

import React from 'react';
import Grid from '../../components/ui/grid';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function PerformanceDashboard() {
  // Mock data - replace with actual board aggregations
  const stats = {
    totalStudents: 87,
    avgScore: 73,
    completionRate: 82,
    atRisk: 12,
  };

  const scoreDistribution = [
    { range: '0-20%', count: 3 },
    { range: '21-40%', count: 8 },
    { range: '41-60%', count: 22 },
    { range: '61-80%', count: 35 },
    { range: '81-100%', count: 19 },
  ];

  const trendData = [
    { week: 'Week 1', avg: 65 },
    { week: 'Week 2', avg: 68 },
    { week: 'Week 3', avg: 71 },
    { week: 'Week 4', avg: 73 },
  ];

  const recentSubmissions = [
    {
      student: 'Thabo M.',
      quiz: 'Algebra Basics',
      score: 85,
      time: '2 hours ago',
    },
    {
      student: 'Naledi K.',
      quiz: "Newton's Laws",
      score: 72,
      time: '3 hours ago',
    },
    {
      student: 'Sipho D.',
      quiz: 'Cell Structure',
      score: 91,
      time: '5 hours ago',
    },
    {
      student: 'Kgotso P.',
      quiz: 'Algebra Basics',
      score: 45,
      time: '6 hours ago',
    },
    {
      student: 'Zanele N.',
      quiz: "Newton's Laws",
      score: 78,
      time: '1 day ago',
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* KPI CARDS */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Users color="#1976d2" />

                <Box>
                  <Typography variant="body2">
                    Active Students
                  </Typography>

                  <Typography variant="h5">
                    {stats.totalStudents}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Target color="#2e7d32" />

                <Box>
                  <Typography variant="body2">
                    Average Score
                  </Typography>

                  <Typography variant="h5">
                    {stats.avgScore}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle2 color="#ed6c02" />

                <Box>
                  <Typography variant="body2">
                    Completion Rate
                  </Typography>

                  <Typography variant="h5">
                    {stats.completionRate}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AlertCircle color="#d32f2f" />

                <Box>
                  <Typography variant="body2">
                    At-Risk Students
                  </Typography>

                  <Typography variant="h5">
                    {stats.atRisk}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CHARTS */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* SCORE DISTRIBUTION */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Score Distribution"
              subheader="Number of students by score range"
            />

            <CardContent>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="range" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      fill="#1976d2"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* PERFORMANCE TREND */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="Performance Trend"
              subheader="Average scores over time"
            />

            <CardContent>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="week" />

                    <YAxis domain={[0, 100]} />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#2e7d32"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RECENT SUBMISSIONS */}
      <Card sx={{ mt: 2 }}>
        <CardHeader
          title="Recent Quiz Submissions"
          subheader="Latest student activity"
        />

        <CardContent>
          {recentSubmissions.map((sub, idx) => (
            <Box
              key={idx}
              sx={{
                py: 2,
                borderBottom:
                  idx !== recentSubmissions.length - 1
                    ? '1px solid #eee'
                    : 'none',
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography fontWeight={600}>
                    {sub.student}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {sub.quiz}
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Box textAlign="right">
                    <Typography variant="h6">
                      {sub.score}%
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {sub.time}
                    </Typography>
                  </Box>

                  <Chip
                    label={
                      sub.score >= 80
                        ? 'Excellent'
                        : sub.score >= 60
                        ? 'Good'
                        : 'Needs Help'
                    }
                    color={
                      sub.score >= 80
                        ? 'success'
                        : sub.score >= 60
                        ? 'warning'
                        : 'error'
                    }
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={sub.score}
                />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function PerformanceDashboardPage() {
  return <PerformanceDashboard />;
}