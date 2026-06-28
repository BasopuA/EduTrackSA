"use client";

import React from "react";
import Link from "next/link";
import { Typography, Box, Button, Container, Stack, Chip } from "@mui/material";
import { BookOpen, BarChart3, Wand2, WifiOff, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "AI-generated quizzes",
    description: "Teachers upload learning content and review AI-generated questions before publishing.",
    icon: Wand2,
  },
  {
    title: "Learner dashboards",
    description: "Learners track progress, points, streaks, and subject performance.",
    icon: BarChart3,
  },
  {
    title: "Offline-first access",
    description: "Content packs and sync queues help learners continue when connectivity drops.",
    icon: WifiOff,
  },
  {
    title: "Secure academic monitoring",
    description: "Role-based access, consent capture, and learner-only data visibility.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Chip label="EduTrack SA" color="primary" />
          <Typography component="h1" variant="h3" fontWeight={800}>
            Digital Academic Monitoring and Engagement System
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth={760}>
            A Progressive Web App for South African schools that combines content access, AI-assisted quiz generation,
            gamified learner engagement, and teacher dashboards.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="contained" size="large">Sign in</Button>
            </Link>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Button variant="outlined" size="large">Register</Button>
            </Link>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ mt: 8 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Box
                key={feature.title}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "primary.light", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                  <Icon color="#1976d2" />
                </Box>
                <Typography variant="h6" fontWeight={700}>{feature.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {feature.description}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: "primary.50" }}>
          <Typography variant="h6" fontWeight={700}>Built for disadvantaged schools</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            EduTrack SA focuses on Quintile 1–3 schools with data-saving design, offline content access, teacher review of AI output, and dashboards for early intervention.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
