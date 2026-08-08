import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, ChevronDown, Star } from 'lucide-react';
import Logo from '../brand/Logo';
import { NAV_SECTIONS, NAV_INDEX, findNavItemByPath, visibleNavSections } from './navConfig';
import { useNavMemory } from './NavMemoryContext';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { favoritePaths, toggleFavorite, isFavorite, recordVisit } = useNavMemory();
  const sections = useMemo(() => visibleNavSections(hasPermission), [hasPermission]);
  // Favorites can include an item from a section the user no longer has
  // permission for (e.g. a role change) - filter those out defensively
  // rather than rendering a link that 403s.
  const visiblePaths = new Set(sections.flatMap((s) => s.items.map((i) => i.to)));
  const favorites = favoritePaths
    .map((p) => NAV_INDEX.find((item) => item.to === p))
    .filter((item) => item && visiblePaths.has(item.to));

  // Collapsible sections (Payroll, Administration) default open only when
  // they contain the active route - otherwise they start collapsed, which
  // is the direct fix for Payroll's five flat links from the Phase 1 audit.
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    NAV_SECTIONS.forEach((section) => {
      if (!section.collapsible) return;
      initial[section.id] = section.items.some((item) => location.pathname.startsWith(item.to));
    });
    return initial;
  });
  useEffect(() => {
    const matched = findNavItemByPath(location.pathname);
    if (matched) recordVisit(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSection = (id) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

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
        {favorites.length > 0 && (
          <NavSection
            label="Favorites"
            items={favorites}
            collapsed={collapsed}
            isOpen
            onToggleOpen={null}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {sections.map((section) => {
          if (!section.label) {
            return (
              <div key={section.id} className="mb-3">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    isFavorite={isFavorite(item.to)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            );
          }

          const isOpen = section.collapsible ? Boolean(openSections[section.id]) : true;

          return (
            <NavSection
              key={section.id}
              sectionId={section.id}
              label={section.label}
              items={section.items}
              collapsed={collapsed}
              isOpen={isOpen}
              collapsible={section.collapsible}
              onToggleOpen={section.collapsible ? () => toggleSection(section.id) : null}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          );
        })}
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

function NavSection({ sectionId, label, items, collapsed, isOpen, collapsible, onToggleOpen, isFavorite, onToggleFavorite }) {
  return (
    <div className="mb-3">
      {label && !collapsed && (
        <button
          type="button"
          onClick={onToggleOpen || undefined}
          className="d-flex align-items-center justify-content-between w-100 px-3 mb-1 border-0 bg-transparent"
          style={{ cursor: collapsible ? 'pointer' : 'default' }}
          aria-expanded={collapsible ? isOpen : undefined}
        >
          <span
            className="text-uppercase"
            style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--hz-text-muted)', fontWeight: 600 }}
          >
            {label}
          </span>
          {collapsible && (
            <ChevronDown
              size={13}
              color="var(--hz-text-muted)"
              style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform var(--hz-transition-fast)' }}
            />
          )}
        </button>
      )}
      {(isOpen || collapsed) &&
        items.map((item) => (
          <NavItem
            key={`${sectionId || 'favs'}-${item.to}`}
            item={item}
            collapsed={collapsed}
            isFavorite={isFavorite(item.to)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
    </div>
  );
}

function NavItem({ item, collapsed, isFavorite, onToggleFavorite }) {
  return (
    <div className="hz-sidebar-item position-relative mx-2 mb-1">
      <NavLink
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `hz-sidebar-link d-flex align-items-center gap-3 px-3 py-2 text-decoration-none rounded-3 ${
            isActive ? 'hz-nav-active' : 'hz-nav-inactive'
          }`
        }
        style={({ isActive }) => ({
          color: isActive ? '#fff' : 'var(--hz-text-secondary)',
          background: isActive ? 'var(--hz-gradient-primary)' : 'transparent',
          boxShadow: isActive ? 'var(--hz-shadow-primary)' : 'none',
          fontWeight: isActive ? 600 : 500,
          fontSize: 'var(--hz-text-sm)',
          paddingRight: collapsed ? undefined : 30,
        })}
      >
        <item.icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
        {!collapsed && <span className="text-truncate">{item.label}</span>}
      </NavLink>
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite({ to: item.to, icon: item.icon, label: item.label, end: item.end });
          }}
          className="hz-sidebar-fav-btn position-absolute d-flex align-items-center justify-content-center border-0 bg-transparent"
          style={{ right: 6, top: '50%', transform: 'translateY(-50%)' }}
          aria-label={isFavorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
          aria-pressed={isFavorite}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}
