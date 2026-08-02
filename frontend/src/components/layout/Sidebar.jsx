import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Briefcase,
  TrendingUp,
  FileBarChart,
  ShieldCheck,
  ScrollText,
  Building2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: null,
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true }],
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
      { to: '/performance', icon: TrendingUp, label: 'Performance' },
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
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, var(--hz-primary-600), var(--hz-accent-500))',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          H1
        </div>
        {!collapsed && <span style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)' }}>HaodaOne</span>}
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
                  `d-flex align-items-center gap-3 mx-2 px-3 py-2 mb-1 text-decoration-none rounded-3 ${
                    isActive ? 'hz-nav-active' : 'hz-nav-inactive'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--hz-primary-700)' : 'var(--hz-text-secondary)',
                  background: isActive ? 'var(--hz-primary-50)' : 'transparent',
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
        className="btn btn-light d-flex align-items-center justify-content-center border-0 m-2"
        style={{ borderRadius: 9 }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  );
}
