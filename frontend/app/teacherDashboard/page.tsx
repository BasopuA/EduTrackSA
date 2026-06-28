"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { Upload, Wand2, BarChart3, LogOut, BookOpen } from 'lucide-react';
import { ContentUpload } from './ContentUpload';
import { QuizGenerator } from './QuizGenerator';
import { PerformanceDashboard } from './PerformanceDashboard';

interface TeacherDashboardProps {
  onLogout: () => void;
  user: { full_name?: string | null; username: string } | null;
}

const STEPS = [
  {
    value: 'upload',
    label: 'Upload Content',
    icon: Upload,
  },
  {
    value: 'quiz',
    label: 'Generate Quiz',
    icon: Wand2,
  },
  {
    value: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
];

export function TeacherDashboard({ onLogout, user }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('upload');

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return user?.username?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Academic Monitoring &amp; Engagement System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">
                  {user?.full_name || user?.username || 'Teacher'}
                </span>
                <span className="text-xs text-muted-foreground">Teacher</span>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold ring-1 ring-primary/10">
                {getInitials()}
              </div>
              <Button onClick={onLogout} variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Manage learning content, quizzes, and learner performance from one place — each step
          feeds the next.
        </p>

        {/* Workflow rail */}
        <div role="tablist" aria-label="Dashboard sections" className="relative mb-8">
          <div
            className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-border sm:block"
            aria-hidden="true"
          />
          <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeTab === step.value;
              return (
                <button
                  key={step.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(step.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col items-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Step {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="upload" className="space-y-6">
            <ContentUpload />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            <QuizGenerator />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const [user, setUser] = useState<{ full_name?: string | null; username: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          window.localStorage.removeItem("user");
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    }
    window.location.href = "/login";
  };

  return <TeacherDashboard user={user} onLogout={handleLogout} />;
}
