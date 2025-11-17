import { useAuth } from '../hooks/useAuth';
import NotFound from '../pages/NotFound';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Simple admin route protection
 * - Not authenticated → 404 (stealth mode)
 * - Authenticated but not admin → 404 (stealth mode)
 * - Authenticated and admin → render admin page
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, roleLoaded } = useAuth();

  // Not authenticated → show 404
  if (!user) {
    return <NotFound />;
  }

  // Wait for role to load before checking admin status
  // If role loaded and user is not admin → show 404
  if (roleLoaded && !isAdmin) {
    return <NotFound />;
  }

  // Role not loaded yet or user is admin → render admin page
  // If role loads later and user is not admin, Admin.tsx will handle it
  return <>{children}</>;
};

