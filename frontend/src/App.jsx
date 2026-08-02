import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import AttendanceList from './pages/attendance/AttendanceList';
import Devices from './pages/attendance/Devices';
import LeaveRequests from './pages/leave/LeaveRequests';
import SettingsUsers from './pages/SettingsUsers';
import SettingsOrganization from './pages/SettingsOrganization';
import SettingsLeave from './pages/SettingsLeave';
import SettingsAudit from './pages/SettingsAudit';
import ModulePlaceholder from './pages/ModulePlaceholder';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="attendance" element={<AttendanceList />} />
          <Route path="attendance/devices" element={<Devices />} />
          <Route path="leave" element={<LeaveRequests />} />
          <Route path="recruitment" element={<ModulePlaceholder title="Recruitment" phase="Phase 4" />} />
          <Route path="performance" element={<ModulePlaceholder title="Performance Management" phase="Phase 4" />} />
          <Route path="reports" element={<ModulePlaceholder title="Reports & Analytics" phase="Phase 5" />} />
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
