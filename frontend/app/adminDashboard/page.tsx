"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Box,
  Typography,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import Grid from '../../components/ui/grid';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  People as UsersIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as BookOpenIcon,
  EmojiEvents as AwardIcon,
  Logout as LogOutIcon,
  BarChart as BarChartIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SxProps } from '@mui/material/styles';

// Type definitions
interface AdminDashboardProps {
  onLogout: () => void;
  user: { full_name?: string | null; username: string } | null;
}

interface Stats {
  totalStudents: number;
  activeTeachers: number;
  totalQuizzes: number;
  avgCompletion: number;
  pendingApprovals: number;
}

interface EngagementDataItem {
  month: string;
  students: number;
}

interface PerformanceDataItem {
  subject: string;
  avg: number;
}

interface RecentActivityItem {
  teacher: string;
  action: string;
  subject: string;
  time: string;
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sx?: SxProps;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value?: React.ReactNode }>;
}

interface UserRow {
  id: number;
  username: string;
  email: string | null;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  approval_status: string;
  created_at: string;
}

// MUI Theme matching original Tailwind design tokens
const dashboardTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6', // blue-500
    },
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#64748b', // slate-500
    },
    divider: '#e2e8f0', // slate-200
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
});

// Custom KPI Card Component using MUI
function KPICard({ label, value, icon: Icon, sx }: KPICardProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: 'primary.light',
          color: 'primary.main',
          opacity: 0.2,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={600} color="text.primary">
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

// Custom Tooltip for Recharts matching MUI styling
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {payload[0].value}
        </Typography>
      </Card>
    );
  }
  return null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AdminDashboard({ onLogout, user }: AdminDashboardProps) {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "user",
    is_active: true,
    approval_status: "pending",
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const stats: Stats = {
    totalStudents: 245,
    activeTeachers: 18,
    totalQuizzes: 156,
    avgCompletion: 78,
    pendingApprovals: pendingUsers.length,
  };

  const engagementData: EngagementDataItem[] = [
    { month: 'Sep', students: 180 },
    { month: 'Oct', students: 210 },
    { month: 'Nov', students: 230 },
    { month: 'Dec', students: 225 },
    { month: 'Jan', students: 240 },
    { month: 'Feb', students: 245 },
  ];

  const performanceData: PerformanceDataItem[] = [
    { subject: 'Mathematics', avg: 72 },
    { subject: 'Sciences', avg: 68 },
    { subject: 'Languages', avg: 81 },
    { subject: 'History', avg: 75 },
    { subject: 'Geography', avg: 70 },
  ];

  const recentActivity: RecentActivityItem[] = [
    { teacher: 'Ms. Ndlovu', action: 'uploaded new content', subject: 'Mathematics', time: '2 hours ago' },
    { teacher: 'Mr. Dlamini', action: 'generated quiz', subject: 'Physical Sciences', time: '4 hours ago' },
    { teacher: 'Mrs. Mokoena', action: 'uploaded new content', subject: 'Life Sciences', time: '5 hours ago' },
    { teacher: 'Mr. Mbatha', action: 'generated quiz', subject: 'History', time: '1 day ago' },
  ];

  const chartColors = {
    students: '#3b82f6', // blue-500
    avg: '#22c55e', // green-500
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/users/admin/all`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/users/admin/pending`, { headers: getAuthHeaders() }),
      ]);
      if (allRes.ok) {
        const data = await allRes.json();
        setUsers(data);
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    setActionMessage(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/${userId}/approve`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      if (res.ok) {
        setActionMessage("User approved successfully");
        fetchUsers();
      } else {
        const err = await res.json();
        setActionMessage(err.detail || "Failed to approve user");
      }
    } catch (err) {
      setActionMessage("Error approving user");
    }
  };

  const handleReject = async (userId: number) => {
    setActionMessage(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/${userId}/reject`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      if (res.ok) {
        setActionMessage("User rejected successfully");
        fetchUsers();
      } else {
        const err = await res.json();
        setActionMessage(err.detail || "Failed to reject user");
      }
    } catch (err) {
      setActionMessage("Error rejecting user");
    }
  };

  const handleEditClick = (u: UserRow) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      role: u.role,
      is_active: u.is_active,
      approval_status: u.approval_status,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setActionMessage(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/${editingUser.id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setActionMessage("User updated successfully");
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        setActionMessage(err.detail || "Failed to update user");
      }
    } catch (err) {
      setActionMessage("Error updating user");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setActionMessage(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setActionMessage("User deleted successfully");
        fetchUsers();
      } else {
        const err = await res.json();
        setActionMessage(err.detail || "Failed to delete user");
      }
    } catch (err) {
      setActionMessage("Error deleting user");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "error";
      case "teacher": return "primary";
      default: return "default";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ThemeProvider theme={dashboardTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ maxWidth: '1280px', mx: 'auto', px: 2, py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    opacity: 0.1,
                  }}
                >
                  <BarChartIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    School Admin Dashboard
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Academic Monitoring System
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Button
                  onClick={fetchUsers}
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon fontSize="small" />}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {user?.full_name
                    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : user?.username?.slice(0, 2).toUpperCase() || 'U'}
                </Box>
                <Button
                  onClick={onLogout}
                  variant="text"
                  size="small"
                  startIcon={<LogOutIcon fontSize="small" />}
                  sx={{ color: 'text.primary' }}
                >
                  Logout
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ maxWidth: '1280px', mx: 'auto', px: 2, py: 3 }}>
          <Stack spacing={3}>
            {actionMessage && (
              <Alert severity={actionMessage.includes("success") || actionMessage.includes("approved") || actionMessage.includes("rejected") || actionMessage.includes("updated") || actionMessage.includes("deleted") ? "success" : "error"} onClose={() => setActionMessage(null)}>
                {actionMessage}
              </Alert>
            )}

            {/* KPI Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card>
                  <CardContent sx={{ pt: 3 }}>
                    <KPICard
                      label="Total Students"
                      value={stats.totalStudents}
                      icon={UsersIcon}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card>
                  <CardContent sx={{ pt: 3 }}>
                    <KPICard
                      label="Active Teachers"
                      value={stats.activeTeachers}
                      icon={AwardIcon}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card>
                  <CardContent sx={{ pt: 3 }}>
                    <KPICard
                      label="Total Quizzes"
                      value={stats.totalQuizzes}
                      icon={BookOpenIcon}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card>
                  <CardContent sx={{ pt: 3 }}>
                    <KPICard
                      label="Pending Approvals"
                      value={
                        <Badge badgeContent={pendingUsers.length} color="warning">
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            {stats.pendingApprovals}
                          </Typography>
                        </Badge>
                      }
                      icon={PersonAddIcon}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* User Management Section */}
            <Card>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    User Management
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Review, approve, and manage user accounts
                  </Typography>
                }
              />
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  <Tab label={`All Users (${users.length})`} />
                  <Tab 
                    label={
                      <Badge badgeContent={pendingUsers.length} color="warning">
                        Pending Approval
                      </Badge>
                    } 
                  />
                </Tabs>
              </Box>
              <CardContent>
                {tabValue === 0 && (
                  <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Username</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Approval</strong></TableCell>
                          <TableCell><strong>Joined</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} hover>
                            <TableCell>{u.full_name || "-"}</TableCell>
                            <TableCell>{u.username}</TableCell>
                            <TableCell>{u.email || "-"}</TableCell>
                            <TableCell>
                              <Chip label={u.role} size="small" color={getRoleColor(u.role) as any} variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={u.is_active ? "Active" : "Disabled"} 
                                size="small" 
                                color={u.is_active ? "success" : "default"} 
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={u.approval_status} 
                                size="small" 
                                color={getStatusColor(u.approval_status) as any} 
                              />
                            </TableCell>
                            <TableCell>{formatDate(u.created_at)}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <IconButton size="small" onClick={() => handleEditClick(u)} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                {u.approval_status === "pending" && (
                                  <>
                                    <IconButton size="small" onClick={() => handleApprove(u.id)} title="Approve" color="success">
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleReject(u.id)} title="Reject" color="error">
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton size="small" onClick={() => handleDelete(u.id)} title="Delete" color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                        {users.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {tabValue === 1 && (
                  <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Username</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Joined</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingUsers.map((u) => (
                          <TableRow key={u.id} hover>
                            <TableCell>{u.full_name || "-"}</TableCell>
                            <TableCell>{u.username}</TableCell>
                            <TableCell>{u.email || "-"}</TableCell>
                            <TableCell>
                              <Chip label={u.role} size="small" color={getRoleColor(u.role) as any} variant="outlined" />
                            </TableCell>
                            <TableCell>{formatDate(u.created_at)}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <IconButton size="small" onClick={() => handleApprove(u.id)} title="Approve" color="success">
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleReject(u.id)} title="Reject" color="error">
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleEditClick(u)} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                        {pendingUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                              No pending approvals
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Charts Row */}
            <Grid container spacing={2}>
              {/* Engagement Trend Chart */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card>
                  <CardHeader
                    title={
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        Student Engagement Trend
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary">
                        Active students per month
                      </Typography>
                    }
                    sx={{ pb: 0 }}
                  />
                  <CardContent>
                    <Box sx={{ height: 280, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="students"
                            stroke={chartColors.students}
                            strokeWidth={2}
                            dot={{ fill: chartColors.students, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance by Subject Chart */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card>
                  <CardHeader
                    title={
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        Performance by Subject
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary">
                        Average scores across subjects
                      </Typography>
                    }
                    sx={{ pb: 0 }}
                  />
                  <CardContent>
                    <Box sx={{ height: 280, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="subject"
                            width={100}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="avg"
                            fill={chartColors.avg}
                            radius={[0, 4, 4, 0]}
                            maxBarSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Recent Activity */}
            <Card>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Recent Teacher Activity
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Latest content uploads and quiz generation
                  </Typography>
                }
              />
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {recentActivity.map((activity, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <Divider />}
                      <Box
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.primary">
                            <Typography component="span" fontWeight={500}>
                              {activity.teacher}
                            </Typography>{' '}
                            {activity.action}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip
                              label={activity.subject}
                              variant="outlined"
                              size="small"
                              sx={{
                                fontSize: '0.75rem',
                                height: 20,
                                '& .MuiChip-label': { px: 1 },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {activity.time}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
              <TextField
                label="Email"
                fullWidth
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editForm.role}
                  label="Role"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <MenuItem value="user">Learner</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">School Management</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={editForm.approval_status}
                  label="Approval Status"
                  onChange={(e) => setEditForm({ ...editForm, approval_status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Active</InputLabel>
                <Select
                  value={editForm.is_active ? "true" : "false"}
                  label="Active"
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "true" })}
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = React.useState<{ full_name?: string | null; username: string } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
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

  return (
    <AdminDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}
