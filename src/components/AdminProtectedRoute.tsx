import { useAuth } from '../hooks/useAuth';
import NotFound from '../pages/NotFound';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Admin route protection with language check
 * - Not authenticated → 404 (stealth mode)
 * - Authenticated but not admin → 404 (stealth mode)
 * - Language is not Romanian → redirect to 404 (admin only in Romanian)
 * - Authenticated and admin and Romanian → render admin page
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, roleLoaded } = useAuth();
  const { i18n } = useTranslation();

  // Force Romanian language for admin panel
  useEffect(() => {
    if (i18n.language !== 'ro') {
      i18n.changeLanguage('ro');
      localStorage.setItem('selectedLanguage', 'ro');
    }
  }, [i18n]);

  // Not authenticated → show 404
  if (!user) {
    return <NotFound />;
  }

  // Language is not Romanian → show 404 (admin only in Romanian)
  if (i18n.language !== 'ro') {
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

