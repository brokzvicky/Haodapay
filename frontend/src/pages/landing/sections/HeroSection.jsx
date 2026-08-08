import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Users as UsersIcon,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  Clock,
  Wallet,
  CalendarCheck,
  UserPlus,
  Building2,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="hz-hero">
      {/* Ambient depth - gradient orbs + dotted mesh live behind everything */}
      <span className="hz-hero-orb hz-hero-orb-1" aria-hidden="true" />
      <span className="hz-hero-orb hz-hero-orb-2" aria-hidden="true" />
      <span className="hz-hero-orb hz-hero-orb-3" aria-hidden="true" />

      <div className="hz-hero-inner container" style={{ padding: '92px 0 56px' }}>
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-6">
            <span className="hz-hero-eyebrow hz-anim-fade-up" style={{ animationDelay: '0.05s' }}>
              <span className="hz-eyebrow-dot" />
              <Sparkles size={13} /> Enterprise HRMS platform
            </span>

            <h1 className="hz-hero-headline hz-anim-fade-up" style={{ animationDelay: '0.15s' }}>
              Run your entire workforce <span className="hz-hero-headline-gradient">from one place.</span>
            </h1>

            <p className="hz-hero-subtitle hz-anim-fade-up" style={{ animationDelay: '0.25s' }}>
              Attendance, payroll, leave, and recruitment - unified into a single, modern HRMS built for
              organizations that have outgrown spreadsheets and outgrown generic HR software too.
            </p>

            <div className="hz-hero-ctas hz-anim-fade-up" style={{ animationDelay: '0.35s' }}>
              <Link to="/contact" className="hz-btn-hero-primary">
                Request Demo <ArrowRight size={16} className="ms-2" />
              </Link>
              <Link to="/login" className="hz-btn-hero-secondary">
                Get Started
              </Link>
            </div>

            <div className="hz-hero-mini-stats hz-anim-fade-up" style={{ animationDelay: '0.45s' }}>
              <MiniStat label="Modules" value="6+" />
              <MiniStat label="Role-based access" value="Built-in" />
              <MiniStat label="Deployment" value="Cloud or on-prem" />
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="hz-hero-art hz-anim-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="hz-dash-panel">
                <DashboardMockup />
              </div>

              <FloatingChip
                icon={<Clock size={14} color="#fff" />}
                iconBg="#0ea5a4"
                label="Attendance"
                sub="231 checked in today"
                style={{ top: -14, left: -10, animationDelay: '0s' }}
              />
              <FloatingChip
                icon={<Wallet size={14} color="#fff" />}
                iconBg="#4f46e5"
                label="Payroll"
                sub="Run completed · Aug"
                style={{ top: 36, right: -24, animationDelay: '0.9s' }}
              />
              <FloatingChip
                icon={<CalendarCheck size={14} color="#fff" />}
                iconBg="#16a34a"
                label="Leave"
                sub="Request approved"
                style={{ bottom: 118, left: -34, animationDelay: '1.6s' }}
              />
              <FloatingChip
                icon={<UserPlus size={14} color="#fff" />}
                iconBg="#d97706"
                label="Recruitment"
                sub="4 interviews this week"
                style={{ bottom: 8, right: -18, animationDelay: '0.5s' }}
              />
              <FloatingChip
                icon={<UsersIcon size={14} color="#fff" />}
                iconBg="#0284c7"
                label="Employees"
                sub="248 active profiles"
                style={{ bottom: -26, left: 64, animationDelay: '2.1s' }}
              />
              <FloatingChip
                icon={<BarChart3 size={14} color="#fff" />}
                iconBg="#db2777"
                label="Reports"
                sub="Real-time analytics"
                style={{ top: -22, right: 90, animationDelay: '1.3s' }}
              />
            </div>
          </div>
        </div>
      </div>

      <TrustBar />
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="hz-hero-mini-stat-value">{value}</div>
      <div className="hz-hero-mini-stat-label">{label}</div>
    </div>
  );
}

function FloatingChip({ icon, iconBg, label, sub, style }) {
  return (
    <div className="hz-hero-chip" style={style}>
      <span className="hz-chip-icon" style={{ background: iconBg }}>
        {icon}
      </span>
      <span>
        {label}
        <span className="hz-chip-sub">{sub}</span>
      </span>
    </div>
  );
}

/** A believable HRMS dashboard preview - built from real UI primitives
 *  (topbar, icon rail, stat cards, chart, activity list) rather than a
 *  fabricated screenshot, so it reads as "product", not "illustration". */
function DashboardMockup() {
  return (
    <>
      <div className="hz-dash-topbar">
        <span className="hz-dash-dot" />
        <span className="hz-dash-dot" />
        <span className="hz-dash-dot" style={{ background: 'rgba(255,255,255,0.55)' }} />
        <span className="hz-dash-title">HaodaOne · Workforce Overview</span>
      </div>

      <div className="hz-dash-body">
        <div className="hz-dash-rail">
          <span className="hz-dash-rail-icon is-active">
            <LayoutGrid size={14} />
          </span>
          <span className="hz-dash-rail-icon">
            <UsersIcon size={14} />
          </span>
          <span className="hz-dash-rail-icon">
            <CalendarDays size={14} />
          </span>
          <span className="hz-dash-rail-icon">
            <BarChart3 size={14} />
          </span>
          <span className="hz-dash-rail-icon">
            <SettingsIcon size={14} />
          </span>
        </div>

        <div className="hz-dash-main">
          <div className="hz-dash-stats">
            <div className="hz-dash-stat">
              <div className="hz-dash-stat-value">248</div>
              <div className="hz-dash-stat-label">Employees</div>
            </div>
            <div className="hz-dash-stat">
              <div className="hz-dash-stat-value">231</div>
              <div className="hz-dash-stat-label">Present</div>
            </div>
            <div className="hz-dash-stat">
              <div className="hz-dash-stat-value">12</div>
              <div className="hz-dash-stat-label">On Leave</div>
            </div>
          </div>

          <div className="hz-dash-chart-card">
            <div className="hz-dash-chart-head">
              <span className="hz-dash-chart-head-title">Attendance trend</span>
              <span className="hz-dash-chart-head-pill">+12.4%</span>
            </div>
            <ChartGlyph />
          </div>

          <div className="hz-dash-chart-card" style={{ marginBottom: 0 }}>
            <div className="hz-dash-chart-head">
              <span className="hz-dash-chart-head-title">Recent activity</span>
            </div>
            <ActivityRow name="Ananya Rao" sub="Leave request · Approved" badgeBg="rgba(22,163,74,0.2)" badgeColor="#6ee7b7" badge="Done" />
            <ActivityRow name="Karthik Iyer" sub="Payroll run · Aug 2026" badgeBg="rgba(79,70,229,0.22)" badgeColor="#c7d2fe" badge="Synced" />
            <ActivityRow name="Priya Nair" sub="Interview · Design role" badgeBg="rgba(217,119,6,0.2)" badgeColor="#fcd34d" badge="Today" />
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityRow({ name, sub, badge, badgeBg, badgeColor }) {
  return (
    <div className="hz-dash-list-row">
      <span className="hz-dash-list-avatar" />
      <div className="hz-dash-list-text">
        <div className="hz-dash-list-name">{name}</div>
        <div className="hz-dash-list-sub">{sub}</div>
      </div>
      <span className="hz-dash-list-badge" style={{ background: badgeBg, color: badgeColor }}>
        {badge}
      </span>
    </div>
  );
}

/** Compact bar + trend-line chart, plain SVG so it never depends on a
 *  charting library the hero doesn't otherwise need. */
function ChartGlyph() {
  const bars = [38, 58, 46, 70, 52, 64, 44];
  return (
    <svg viewBox="0 0 260 64" width="100%" height="64" role="img" aria-label="Attendance trend chart">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 36 + 6}
          y={64 - h}
          width="16"
          height={h}
          rx="4"
          fill={i === 3 ? '#6ee7d8' : 'rgba(255,255,255,0.22)'}
        />
      ))}
      <polyline
        points="14,40 50,30 86,36 122,14 158,24 194,10 230,18"
        fill="none"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustBar() {
  const items = [
    { icon: <Building2 size={17} />, value: '500+', label: 'Companies onboarded' },
    { icon: <UsersIcon size={17} />, value: '50K+', label: 'Employees managed' },
    { icon: <ShieldCheck size={17} />, value: '99.9%', label: 'Platform uptime' },
    { icon: <Globe2 size={17} />, value: '12+', label: 'Countries supported' },
  ];
  return (
    <div className="hz-trust-bar">
      <div className="hz-hero-inner container">
        <div className="hz-trust-grid">
          {items.map((item) => (
            <div className="hz-trust-item" key={item.label}>
              <span className="hz-trust-icon">{item.icon}</span>
              <div>
                <div className="hz-trust-value">{item.value}</div>
                <div className="hz-trust-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
