import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, ChevronDown, LogOut, UserCircle, KeyRound, Clock3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { employeesApi } from '../../api/endpoints/employees';
import Avatar from '../ui/Avatar';
import { NAV_INDEX } from './navConfig';
import { useNavMemory } from './NavMemoryContext';

export default function Topbar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchBoxRef = useRef(null);
  const { recentPaths } = useNavMemory();

  const searchableNavItems = useMemo(
    () => NAV_INDEX.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  );

  const matchedPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchableNavItems
      .filter((item) => item.label.toLowerCase().includes(q) || item.section?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, searchableNavItems]);

  // Debounced employee search - only fires once the person pauses typing,
  // and only once there's enough to search on.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setDebouncedQuery('');
      return undefined;
    }
    const timer = setTimeout(() => setDebouncedQuery(q), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: employeeResults, isFetching: employeesLoading } = useQuery({
    queryKey: ['global-search-employees', debouncedQuery],
    queryFn: () => employeesApi.list(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const matchedEmployees = (employeeResults || []).slice(0, 5);

  const recentItems = useMemo(
    () =>
      recentPaths
        .map((p) => NAV_INDEX.find((item) => item.to === p))
        .filter((item) => item && (!item.permission || hasPermission(item.permission))),
    [recentPaths, hasPermission]
  );

  const flatResults = useMemo(() => {
    if (!query.trim()) {
      return recentItems.map((item) => ({ kind: 'page', item }));
    }
    return [
      ...matchedPages.map((item) => ({ kind: 'page', item })),
      ...matchedEmployees.map((emp) => ({ kind: 'employee', item: emp })),
    ];
  }, [query, matchedPages, matchedEmployees, recentItems]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goTo = (result) => {
    setSearchOpen(false);
    setQuery('');
    if (result.kind === 'page') navigate(result.item.to);
    else navigate(`/employees/${result.item.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      e.preventDefault();
      goTo(flatResults[activeIndex]);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

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
      <div className="position-relative" style={{ width: 360, maxWidth: '40vw' }} ref={searchBoxRef}>
        <div className="position-relative w-100">
          <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
          <input
            type="search"
            placeholder="Search employees, pages…"
            className="form-control ps-5 hz-search-input"
            style={{ background: 'var(--hz-gray-50)', border: '1px solid var(--hz-border)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="hz-global-search-results"
            aria-autocomplete="list"
          />
        </div>

        {searchOpen && (
          <div id="hz-global-search-results" className="position-absolute hz-surface hz-search-panel" style={{ top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 20 }}>
            {!query.trim() && (
              <div className="px-3 pt-2 pb-1 d-flex align-items-center gap-2" style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Clock3 size={12} /> Recent
              </div>
            )}
            {query.trim() && matchedPages.length === 0 && matchedEmployees.length === 0 && !employeesLoading && (
              <div className="px-3 py-3" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>
                No matches for "{query}"
              </div>
            )}
            {!query.trim() && recentItems.length === 0 && (
              <div className="px-3 py-3" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>
                Pages you visit will show up here
              </div>
            )}

            {query.trim() && matchedPages.length > 0 && (
              <SearchGroup label="Pages">
                {matchedPages.map((item, i) => (
                  <SearchRow
                    key={item.to}
                    active={activeIndex === i}
                    icon={<item.icon size={15} />}
                    title={item.label}
                    subtitle={item.section}
                    onClick={() => goTo({ kind: 'page', item })}
                  />
                ))}
              </SearchGroup>
            )}

            {query.trim() && (matchedEmployees.length > 0 || employeesLoading) && (
              <SearchGroup label="Employees">
                {employeesLoading && <div className="px-3 py-2" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>Searching…</div>}
                {!employeesLoading &&
                  matchedEmployees.map((emp, i) => (
                    <SearchRow
                      key={emp.id}
                      active={activeIndex === matchedPages.length + i}
                      icon={<Avatar name={emp.fullName} size="sm" />}
                      title={emp.fullName}
                      subtitle={emp.designationTitle || emp.departmentName || 'Employee'}
                      onClick={() => goTo({ kind: 'employee', item: emp })}
                    />
                  ))}
              </SearchGroup>
            )}

            {!query.trim() &&
              recentItems.map((item, i) => (
                <SearchRow
                  key={item.to}
                  active={activeIndex === i}
                  icon={<item.icon size={15} />}
                  title={item.label}
                  subtitle={item.section}
                  onClick={() => goTo({ kind: 'page', item })}
                />
              ))}
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          className="hz-icon-btn position-relative d-flex align-items-center justify-content-center"
          style={{ width: 38, height: 38 }}
          aria-label="Notifications"
        >
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
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
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
                role="menu"
                className="position-absolute end-0 mt-2 hz-surface"
                style={{ width: 220, zIndex: 20, padding: 6 }}
              >
                <div className="px-2 py-2 mb-1" style={{ borderBottom: '1px solid var(--hz-border)' }}>
                  <div style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600 }}>{user?.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{user?.email}</div>
                </div>
                <button role="menuitem" className="btn btn-light border-0 w-100 d-flex align-items-center gap-2 text-start px-2 py-2">
                  <UserCircle size={16} /> My Profile
                </button>
                <button role="menuitem" className="btn btn-light border-0 w-100 d-flex align-items-center gap-2 text-start px-2 py-2">
                  <KeyRound size={16} /> Change Password
                </button>
                <button
                  role="menuitem"
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

function SearchGroup({ label, children }) {
  return (
    <div className="pb-1">
      <div className="px-3 pt-2 pb-1" style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SearchRow({ icon, title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hz-search-row d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start px-3 py-2"
      style={{ background: active ? 'var(--hz-gray-50)' : 'transparent' }}
    >
      <span className="d-flex align-items-center justify-content-center" style={{ width: 24, flexShrink: 0, color: 'var(--hz-text-secondary)' }}>
        {icon}
      </span>
      <span className="flex-grow-1 text-truncate">
        <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600, color: 'var(--hz-text-primary)' }}>{title}</span>
        {subtitle && <span className="d-block" style={{ fontSize: 11, color: 'var(--hz-text-muted)' }}>{subtitle}</span>}
      </span>
    </button>
  );
}
