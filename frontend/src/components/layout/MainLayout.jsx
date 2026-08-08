import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from './Breadcrumbs';
import { NavMemoryProvider } from './NavMemoryContext';
import { BreadcrumbProvider } from './BreadcrumbContext';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NavMemoryProvider>
      <div className="d-flex" style={{ minHeight: '100vh', background: 'var(--hz-bg-canvas)' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
          <Topbar />
          <main className="flex-grow-1 p-4">
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
