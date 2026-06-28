"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useAuth, type UserRole } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as UserRole,
    consent_accepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.consent_accepted) {
      setError("You must accept the privacy and data-collection consent before registering");
      return;
    }

    try {
      await register({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        consent_accepted: formData.consent_accepted,
      });

      setSuccess("Registration successful! Your account is pending admin approval. You will be able to sign in once an administrator verifies your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create your EduTrackSA account
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Register as a learner, teacher, or school manager to access the academic monitoring system.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="fullName"
              label="Full name"
              name="fullName"
              autoComplete="name"
              value={formData.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={(event) => updateField("username", event.target.value)}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              disabled={isLoading}
            />

            <FormControl fullWidth margin="normal" disabled={isLoading}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                value={formData.role}
                label="Role"
                onChange={(event) => updateField("role", event.target.value as UserRole)}
              >
                <MenuItem value="user">Learner</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">School management</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              disabled={isLoading}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consent_accepted}
                  onChange={(event) => updateField("consent_accepted", event.target.checked)}
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="body2">
                  I consent to EduTrackSA collecting and processing my account and learning progress data in line with the privacy policy.
                </Typography>
              }
              sx={{ mt: 2, mb: 1, alignItems: "flex-start" }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={
                isLoading ||
                !formData.full_name ||
                !formData.username ||
                !formData.email ||
                !formData.password ||
                !formData.confirmPassword
              }
              sx={{ mt: 2, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Register"}
            </Button>

            <Typography align="center" variant="body2">
              Already have an account?{" "}
              <Link href="/login" style={{ textDecoration: "none" }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
