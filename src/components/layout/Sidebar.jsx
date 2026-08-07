import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  CalendarClock,
  TrendingUp,
  FileBarChart,
  ShieldCheck,
  ScrollText,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
  ListChecks,
  FileSpreadsheet,
  PlayCircle,
} from 'lucide-react';
import Logo from '../brand/Logo';

const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  },
  {
    label: 'Workforce',
    items: [
      { to: '/employees', icon: Users, label: 'Employees' },
      { to: '/attendance', icon: Clock, label: 'Attendance' },
      { to: '/leave', icon: CalendarDays, label: 'Leave' },
    ],
  },
  {
    label: 'Talent',
    items: [
      { to: '/recruitment', icon: Briefcase, label: 'Recruitment' },
      { to: '/my-interviews', icon: CalendarClock, label: 'My Interviews' },
      { to: '/performance', icon: TrendingUp, label: 'Performance' },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { to: '/salary', icon: Wallet, label: 'Salary Dashboard', end: true },
      { to: '/salary/employees', icon: ListChecks, label: 'Employee Salary' },
      { to: '/salary/structure', icon: FileSpreadsheet, label: 'Salary Structure' },
      { to: '/salary/payroll-processing', icon: PlayCircle, label: 'Payroll Processing' },
      { to: '/salary/reports', icon: FileBarChart, label: 'Salary Reports' },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/reports', icon: FileBarChart, label: 'Reports' }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/settings/users', icon: ShieldCheck, label: 'Users & Roles' },
      { to: '/settings/organization', icon: Building2, label: 'Organization' },
      { to: '/settings/leave', icon: CalendarDays, label: 'Leave Settings' },
      { to: '/settings/audit', icon: ScrollText, label: 'Audit Logs' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className="d-flex flex-column"
      style={{
        width: collapsed ? 'var(--hz-sidebar-width-collapsed)' : 'var(--hz-sidebar-width)',
        background: 'var(--hz-bg-sidebar)',
        borderRight: '1px solid var(--hz-border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width var(--hz-transition-base)',
        flexShrink: 0,
      }}
    >
      <div
        className="d-flex align-items-center gap-2 px-3"
        style={{ height: 'var(--hz-topbar-height)', borderBottom: '1px solid var(--hz-border)' }}
      >
        <Logo variant={collapsed ? 'mark' : 'full'} size={32} />
      </div>

      <nav className="flex-grow-1 overflow-auto py-3" style={{ minHeight: 0 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="mb-3">
            {section.label && !collapsed && (
              <p
                className="text-uppercase px-3 mb-1"
                style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--hz-text-muted)', fontWeight: 600 }}
              >
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `hz-sidebar-link d-flex align-items-center gap-3 mx-2 px-3 py-2 mb-1 text-decoration-none rounded-3 ${
                    isActive ? 'hz-nav-active' : 'hz-nav-inactive'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'var(--hz-text-secondary)',
                  background: isActive ? 'var(--hz-gradient-primary)' : 'transparent',
                  boxShadow: isActive ? 'var(--hz-shadow-primary)' : 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--hz-text-sm)',
                })}
              >
                <item.icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="hz-sidebar-toggle d-flex align-items-center justify-content-center border-0 m-2"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  );
}
