"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "user" | "teacher" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  approval_status: ApprovalStatus;
  full_name?: string | null;
  consent_accepted?: boolean;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role: UserRole;
  consent_accepted: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getRedirectPath(role: UserRole) {
  if (role === "admin") return "/adminDashboard";
  if (role === "teacher") return "/teacherDashboard";
  return "/learner-dashboard";
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const savedUser = localStorage.getItem("user");
  return savedUser ? (JSON.parse(savedUser) as User) : null;
}

function saveSession(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      const loggedInUser = data.user as User;

      setToken(data.access_token);
      setUser(loggedInUser);
      saveSession(data.access_token, loggedInUser);

      router.push(getRedirectPath(loggedInUser.role));
    } catch (error: unknown) {
      logout();
      throw new Error(getErrorMessage(error, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Registration failed");
      }
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearSession();
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
