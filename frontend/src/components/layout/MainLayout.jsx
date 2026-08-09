import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from './Breadcrumbs';
import { NavMemoryProvider } from './NavMemoryContext';
import { BreadcrumbProvider } from './BreadcrumbContext';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Below the lg breakpoint the sidebar is an overlay drawer, not part of
  // the flex layout (see hz-sidebar-mobile-* in components.css) - close it
  // whenever the route changes so tapping a link doesn't leave the drawer
  // sitting open over the new page.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <NavMemoryProvider>
      <div className="d-flex" style={{ minHeight: '100vh', background: 'var(--hz-bg-canvas)' }}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-grow-1 p-3 p-md-4">
            <BreadcrumbProvider>
              <Breadcrumbs />
              <Outlet />
            </BreadcrumbProvider>
          </main>
        </div>
      </div>
    </NavMemoryProvider>
  );
}
