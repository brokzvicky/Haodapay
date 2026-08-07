import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/ui/PageLoader';

/**
 * Wraps a set of routes (via <Outlet/>) behind authentication. Pass
 * `allowedRoles` to additionally gate by role - if the user is signed in
 * but lacks any of the allowed roles, they're redirected to the dashboard
 * rather than the login page (they don't need to re-authenticate, they
 * just don't have access to that particular screen).
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
