import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import PublicSiteLayout from './pages/landing/PublicSiteLayout';
import Home from './pages/landing/Home';
import About from './pages/landing/About';
import Contact from './pages/landing/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import AttendanceList from './pages/attendance/AttendanceList';
import Devices from './pages/attendance/Devices';
import LeaveRequests from './pages/leave/LeaveRequests';
import JobOpenings from './pages/recruitment/JobOpenings';
import CandidatePipeline from './pages/recruitment/CandidatePipeline';
import MyInterviews from './pages/recruitment/MyInterviews';
import CareersList from './pages/careers/CareersList';
import JobApply from './pages/careers/JobApply';
import PerformanceHub from './pages/performance/PerformanceHub';
import Reports from './pages/reports/Reports';
import ExecutiveOverview from './pages/reports/ExecutiveOverview';
import RecruiterDashboard from './pages/recruitment/RecruiterDashboard';
import SalaryDashboard from './pages/salary/SalaryDashboard';
import EmployeeSalaryList from './pages/salary/EmployeeSalaryList';
import SalaryStructurePage from './pages/salary/SalaryStructurePage';
import PayrollProcessing from './pages/salary/PayrollProcessing';
import SalaryDetails from './pages/salary/SalaryDetails';
import SalaryReports from './pages/salary/SalaryReports';
import SettingsUsers from './pages/SettingsUsers';
import SettingsOrganization from './pages/SettingsOrganization';
import SettingsLeave from './pages/SettingsLeave';
import SettingsAudit from './pages/SettingsAudit';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicSiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<CareersList />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<Login />} />
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
          <Route path="my-recruitment" element={<RecruiterDashboard />} />
          <Route path="my-interviews" element={<MyInterviews />} />
          <Route path="performance" element={<PerformanceHub />} />
          <Route path="salary" element={<SalaryDashboard />} />
          <Route path="salary/employees" element={<EmployeeSalaryList />} />
          <Route path="salary/employees/:employeeId" element={<SalaryDetails />} />
          <Route path="salary/structure" element={<SalaryStructurePage />} />
          <Route path="salary/payroll-processing" element={<PayrollProcessing />} />
          <Route path="salary/reports" element={<SalaryReports />} />
          <Route path="my-payslip" element={<SalaryDetails />} />
          <Route path="reports" element={<Reports />} />
          <Route path="executive" element={<ExecutiveOverview />} />
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
