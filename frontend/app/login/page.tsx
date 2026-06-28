"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Paper,
  Container
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { login, isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
     if (user.role === "admin") {
       router.push("/adminDashboard");
     } else if (user.role === "teacher") {
       router.push("/teacherDashboard");
     } else {
       router.push("/learner-dashboard");
     }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      // Redirect handled in auth context
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid username or password";
      if (message.includes("pending approval")) {
        setError("Your account is pending approval. Please wait for an administrator to verify your registration.");
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            EduTrackSA
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Sign in to access your academic dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            
           <Button
             type="submit"
             fullWidth
             variant="contained"
             size="large"
             disabled={isSubmitting || !username || !password}
             sx={{ mt: 3, mb: 2 }}
           >
             {isSubmitting ? <CircularProgress size={24} /> : "Sign In"}
           </Button>

           <Button
             fullWidth
             variant="text"
             onClick={() => router.push("/register")}
             sx={{ mt: 1 }}
           >
             Create an EduTrackSA account
           </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}