import { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, UserCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4"
      style={{
        height: 'var(--hz-topbar-height)',
        background: 'var(--hz-bg-surface)',
        borderBottom: '1px solid var(--hz-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div className="d-flex align-items-center" style={{ width: 360, maxWidth: '40vw' }}>
        <div className="position-relative w-100">
          <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
          <input
            type="search"
            placeholder="Search employees, requests, reports…"
            className="form-control ps-5 hz-search-input"
            style={{ background: 'var(--hz-gray-50)', border: '1px solid var(--hz-border)' }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button className="hz-icon-btn position-relative d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
          <Bell size={18} />
          <span
            className="position-absolute rounded-circle"
            style={{ width: 8, height: 8, background: 'var(--hz-danger-500)', top: 8, right: 9, boxShadow: '0 0 0 2px var(--hz-bg-surface)' }}
          />
        </button>

        <div className="position-relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="hz-icon-btn d-flex align-items-center gap-2 px-2"
            style={{ borderRadius: 10, width: 'auto', height: 44 }}
          >
            <Avatar name={user?.fullName} size="sm" />
            <div className="d-none d-md-flex flex-column align-items-start lh-1">
              <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600, color: 'var(--hz-text-primary)' }}>
                {user?.fullName}
              </span>
              <span style={{ fontSize: 11, color: 'var(--hz-text-muted)' }}>{user?.roles?.[0]}</span>
            </div>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <>
              <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ zIndex: 15 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="position-absolute end-0 mt-2 hz-surface"
                style={{ width: 220, zIndex: 20, padding: 6 }}
              >
                <div className="px-2 py-2 mb-1" style={{ borderBottom: '1px solid var(--hz-border)' }}>
                  <div style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600 }}>{user?.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{user?.email}</div>
                </div>
                <button className="btn btn-light border-0 w-100 d-flex align-items-center gap-2 text-start px-2 py-2">
                  <UserCircle size={16} /> My Profile
                </button>
                <button className="btn btn-light border-0 w-100 d-flex align-items-center gap-2 text-start px-2 py-2">
                  <KeyRound size={16} /> Change Password
                </button>
                <button
                  onClick={logout}
                  className="btn btn-light border-0 w-100 d-flex align-items-center gap-2 text-start px-2 py-2"
                  style={{ color: 'var(--hz-danger-600)' }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
