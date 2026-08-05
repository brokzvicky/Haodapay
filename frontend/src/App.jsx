import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/landing/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import AttendanceList from './pages/attendance/AttendanceList';
import Devices from './pages/attendance/Devices';
import LeaveRequests from './pages/leave/LeaveRequests';
import JobOpenings from './pages/recruitment/JobOpenings';
import CandidatePipeline from './pages/recruitment/CandidatePipeline';
import CareersList from './pages/careers/CareersList';
import JobApply from './pages/careers/JobApply';
import PerformanceHub from './pages/performance/PerformanceHub';
import Reports from './pages/reports/Reports';
import SettingsUsers from './pages/SettingsUsers';
import SettingsOrganization from './pages/SettingsOrganization';
import SettingsLeave from './pages/SettingsLeave';
import SettingsAudit from './pages/SettingsAudit';
import ModulePlaceholder from './pages/ModulePlaceholder';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/careers" element={<CareersList />} />
      <Route path="/careers/:jobId" element={<JobApply />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="attendance" element={<AttendanceList />} />
          <Route path="attendance/devices" element={<Devices />} />
          <Route path="leave" element={<LeaveRequests />} />
          <Route path="recruitment" element={<JobOpenings />} />
          <Route path="recruitment/:jobOpeningId" element={<CandidatePipeline />} />
          <Route path="performance" element={<PerformanceHub />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings/users" element={<SettingsUsers />} />
          <Route path="settings/organization" element={<SettingsOrganization />} />
          <Route path="settings/leave" element={<SettingsLeave />} />
          <Route path="settings/audit" element={<SettingsAudit />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
