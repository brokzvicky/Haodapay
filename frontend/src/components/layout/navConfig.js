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
  Wallet,
  ListChecks,
  FileSpreadsheet,
  PlayCircle,
  Radio,
  Presentation,
  UserCheck,
  Receipt,
  MonitorSmartphone,
  Fingerprint,
  BarChart3,
} from 'lucide-react';

/**
 * Single source of truth for app navigation. The Sidebar renders these
 * sections directly; the global search index (Topbar) and the favorites
 * picker both flatten this same list, so a new page only needs to be
 * added here once to show up everywhere consistently.
 *
 * `collapsible: true` sections default closed unless they contain the
 * active route or a favorited item - this is the direct fix for the
 * Payroll section's five flat links flagged in the Phase 1 audit.
 */
export const NAV_SECTIONS = [
  {
    id: 'root',
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  },
  {
    id: 'workforce',
    label: 'Workforce',
    items: [
      { to: '/employees', icon: Users, label: 'Employees' },
      { to: '/attendance', icon: Clock, label: 'Attendance' },
      { to: '/attendance/devices', icon: Radio, label: 'Devices', permission: 'DEVICE_MANAGE' },
      { to: '/leave', icon: CalendarDays, label: 'Leave' },
      { to: '/my-payslip', icon: Receipt, label: 'My Payslip' },
    ],
  },
  {
    id: 'talent',
    label: 'Talent',
    items: [
      { to: '/recruitment', icon: Briefcase, label: 'Recruitment', permission: 'RECRUITMENT_VIEW' },
      { to: '/my-recruitment', icon: UserCheck, label: 'My Recruiting', permission: 'RECRUITMENT_MANAGE' },
      { to: '/my-interviews', icon: CalendarClock, label: 'My Interviews' },
      { to: '/performance', icon: TrendingUp, label: 'Performance' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    collapsible: true,
    items: [
      { to: '/monitoring', icon: MonitorSmartphone, label: 'Dashboard', end: true },
      { to: '/monitoring/devices', icon: MonitorSmartphone, label: 'Devices' },
      { to: '/monitoring/assignments', icon: Fingerprint, label: 'Device Assignment', permission: 'MONITORING_MANAGE' },
      { to: '/monitoring/activity', icon: Clock, label: 'Activity' },
      { to: '/monitoring/reports', icon: BarChart3, label: 'Productivity Reports', permission: 'MONITORING_VIEW' },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    collapsible: true,
    // SALARY_VIEW gates every /api/salary/* read endpoint as of this
    // phase (see backend SalaryDashboardController etc.) - without this,
    // a Manager/Employee would see this whole section and get a 403 the
    // moment they clicked into it.
    permission: 'SALARY_VIEW',
    items: [
      { to: '/salary', icon: Wallet, label: 'Salary Dashboard', end: true },
      { to: '/salary/employees', icon: ListChecks, label: 'Employee Salary' },
      { to: '/salary/structure', icon: FileSpreadsheet, label: 'Salary Structure' },
      { to: '/salary/payroll-processing', icon: PlayCircle, label: 'Payroll Processing' },
      { to: '/salary/reports', icon: FileBarChart, label: 'Salary Reports' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { to: '/executive', icon: Presentation, label: 'Executive Overview', permission: 'REPORTS_VIEW' },
      { to: '/reports', icon: FileBarChart, label: 'Reports', permission: 'REPORTS_VIEW' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    collapsible: true,
    items: [
      { to: '/settings/users', icon: ShieldCheck, label: 'Users & Roles', permission: 'USER_VIEW' },
      { to: '/settings/organization', icon: Building2, label: 'Organization', permission: 'ORG_VIEW' },
      { to: '/settings/leave', icon: CalendarDays, label: 'Leave Settings', permission: 'LEAVE_MANAGE' },
      { to: '/settings/audit', icon: ScrollText, label: 'Audit Logs', permission: 'AUDIT_VIEW' },
    ],
  },
];

/** Flat list of every navigable page, each tagged with its section label -
 *  what the search index and favorites picker actually iterate over. */
export const NAV_INDEX = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.label, permission: item.permission || section.permission }))
);

export function findNavItemByPath(path) {
  return NAV_INDEX.find((item) => item.to === path);
}

/** Filters sections/items down to what a user with the given `hasPermission`
 *  check can actually reach. An item/section with no `permission` tag is
 *  assumed open to any authenticated user (matches today's backend reality
 *  for modules that haven't had permission codes carved out yet). */
export function visibleNavSections(hasPermission) {
  return NAV_SECTIONS.map((section) => {
    const items = section.items.filter((item) => {
      const required = item.permission || section.permission;
      return !required || hasPermission(required);
    });
    return { ...section, items };
  }).filter((section) => section.items.length > 0);
}
