import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
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

  // Not authenticated → redirect to 404
  if (!user) {
    return <Navigate to="/not-found" replace />;
  }

  // Language is not Romanian → redirect to 404 (admin only in Romanian)
  if (i18n.language !== 'ro') {
    return <Navigate to="/not-found" replace />;
  }

  // Wait for role to load before checking admin status
  // If role loaded and user is not admin → redirect to 404
  if (roleLoaded && !isAdmin) {
    return <Navigate to="/not-found" replace />;
  }

  // Role not loaded yet or user is admin → render admin page
  // If role loads later and user is not admin, Admin.tsx will handle it
  return <>{children}</>;
};

