"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  BookOpen,
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
    { range: '0-20%', count: 3, color: 'bg-destructive' },
    { range: '21-40%', count: 8, color: 'bg-warning' },
    { range: '41-60%', count: 22, color: 'bg-info' },
    { range: '61-80%', count: 35, color: 'bg-primary' },
    { range: '81-100%', count: 19, color: 'bg-success' },
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

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Help';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/10">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-info/10">
                <CheckCircle2 className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At-Risk Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.atRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="border-border bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Score Distribution</CardTitle>
            <CardDescription>Number of students by score range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoreDistribution.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.range}</span>
                    <span className="font-medium text-foreground">{item.count} students</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / Math.max(...scoreDistribution.map((entry) => entry.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="border-border bg-card shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Performance Trend</CardTitle>
            <CardDescription>Average scores over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendData.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.week}</span>
                    <span className="font-medium text-foreground">{item.avg}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-success"
                      style={{ width: `${item.avg}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card className="border-border bg-card shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Recent Quiz Submissions</CardTitle>
          <CardDescription>Latest student activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentSubmissions.map((sub, idx) => (
            <div
              key={idx}
              className={[
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                idx !== recentSubmissions.length - 1 && "border-b border-border",
              ].filter(Boolean).join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{sub.student}</p>
                <p className="text-sm text-muted-foreground">{sub.quiz}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">{sub.score}%</p>
                  <p className="text-xs text-muted-foreground">{sub.time}</p>
                </div>
                <Badge variant={getScoreBadgeVariant(sub.score) as any}>
                  {getScoreLabel(sub.score)}
                </Badge>
              </div>
              <div className="w-full sm:w-48">
                <Progress value={sub.score} className="h-1.5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PerformanceDashboardPage() {
  return <PerformanceDashboard />;
}
