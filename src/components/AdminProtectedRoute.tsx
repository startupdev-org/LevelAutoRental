import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

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
  const { user, isAdmin, roleLoaded, userProfile, loading } = useAuth();
  const { i18n } = useTranslation();
  const [languageChanging, setLanguageChanging] = useState(false);

  // Force Romanian language for admin panel
  useEffect(() => {
    if (i18n.language !== 'ro') {
      setLanguageChanging(true);
      i18n.changeLanguage('ro').then(() => {
        localStorage.setItem('selectedLanguage', 'ro');
        setLanguageChanging(false);
      });
    }
  }, [i18n]);

  // Debug logging (remove in production)
  useEffect(() => {
    console.log('AdminProtectedRoute State:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      roleLoaded,
      userRole: userProfile?.role,
      roleUpper: userProfile?.role?.toUpperCase(),
      isAdmin,
      language: i18n.language,
      languageChanging
    });
  }, [loading, user, roleLoaded, userProfile, isAdmin, i18n.language, languageChanging]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to 404
  if (!user) {
    console.log('AdminProtectedRoute: No user, redirecting to 404');
    return <Navigate to="/not-found" replace />;
  }

  // Show loading while role or language is being loaded/changed
  if (!roleLoaded || languageChanging) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">
            {languageChanging ? 'Changing language...' : 'Loading admin access...'}
          </p>
        </div>
      </div>
    );
  }

  // Role loaded and user is not admin → redirect to 404
  if (!isAdmin) {
    console.warn('AdminProtectedRoute: User is not admin, redirecting to 404', {
      userRole: userProfile?.role,
      roleUpper: userProfile?.role?.toUpperCase(),
      isAdmin
    });
    return <Navigate to="/not-found" replace />;
  }

  // Language is not Romanian → redirect to 404 (admin only in Romanian)
  // Only check after language change is complete and role is loaded
  if (i18n.language !== 'ro') {
    console.warn('AdminProtectedRoute: Language is not Romanian, redirecting to 404', {
      language: i18n.language
    });
    return <Navigate to="/not-found" replace />;
  }

  // All checks passed → render admin page
  console.log('AdminProtectedRoute: All checks passed, rendering admin page');
  return <>{children}</>;
};

