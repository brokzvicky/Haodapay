import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--hz-bg, #f7f8fa)' }}>
      <header style={{ borderBottom: '1px solid var(--hz-border)', background: 'var(--hz-surface, #fff)' }}>
        <div className="container py-3">
          <Link to="/careers" className="text-decoration-none d-inline-flex align-items-center gap-2">
            <span style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 700, color: 'var(--hz-text-primary)' }}>HaodaOne</span>
            <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>Careers</span>
          </Link>
        </div>
      </header>
      <main className="container py-5" style={{ maxWidth: 860 }}>
        {children}
      </main>
      <footer className="container py-4 text-center" style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)' }}>
        &copy; {new Date().getFullYear()} HaodaOne. All rights reserved.
      </footer>
    </div>
  );
}
