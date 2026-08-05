import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Logo from '../components/brand/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Brand panel */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between p-5"
        style={{
          width: '46%',
          background: 'linear-gradient(160deg, var(--hz-primary-800), var(--hz-primary-600) 55%, var(--hz-accent-600))',
          color: '#fff',
        }}
      >
        <Link to="/" className="text-decoration-none">
          <Logo tone="onDark" size={36} wordmarkSize="var(--hz-text-xl)" />
        </Link>

        <div>
          <h1 style={{ fontSize: 'var(--hz-text-4xl)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
            One platform for your entire workforce.
          </h1>
          <p style={{ fontSize: 'var(--hz-text-lg)', opacity: 0.85, maxWidth: 460 }}>
            Attendance, leave, performance, and people operations - built for organizations that have outgrown
            spreadsheets and outgrown generic HR software too.
          </p>

          <div className="d-flex flex-column gap-3 mt-5">
            <FeatureRow icon={Users} text="A single source of truth for every employee record" />
            <FeatureRow icon={Clock} text="Live attendance, straight from your biometric devices" />
            <FeatureRow icon={TrendingUp} text="Executive-grade reporting, not just raw data dumps" />
          </div>
        </div>

        <p style={{ fontSize: 'var(--hz-text-sm)', opacity: 0.6 }}>© {new Date().getFullYear()} HaodaOne. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 p-4">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="d-flex d-lg-none mb-4">
            <Link to="/" className="text-decoration-none">
              <Logo size={32} />
            </Link>
          </div>

          <h2 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
          <p className="text-secondary-hz mb-4" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Sign in to your HaodaOne workspace
          </p>

          {error && (
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 mb-3"
              style={{
                background: 'var(--hz-danger-50)',
                color: 'var(--hz-danger-600)',
                borderRadius: 'var(--hz-radius-md)',
                fontSize: 'var(--hz-text-sm)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Password
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control pe-5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                  style={{ color: 'var(--hz-text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-100 justify-content-center" loading={submitting}>
              Sign In
            </Button>
          </form>

          <div
            className="d-flex align-items-center gap-2 mt-4 px-3 py-2"
            style={{ background: 'var(--hz-gray-50)', borderRadius: 'var(--hz-radius-md)', fontSize: 12, color: 'var(--hz-text-muted)' }}
          >
            <ShieldCheck size={14} />
            First run? Default admin credentials are in the backend README - you'll be asked to change the password immediately.
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }) {
  return (
    <div className="d-flex align-items-center gap-3">
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)' }}
      >
        <Icon size={16} />
      </div>
      <span style={{ fontSize: 'var(--hz-text-sm)', opacity: 0.9 }}>{text}</span>
    </div>
  );
}
