import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminProtectedRoute } from './AdminProtectedRoute';

// Helper to lazy load named exports
const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: T }>,
  exportName: string
) => {
  return lazy(() =>
    importFunc().then((module) => ({ default: module[exportName] as T }))
  );
};

// Lazy load routes to reduce initial bundle size and unused JavaScript
// Only keep Home in initial bundle as it's the landing page
import { Home } from '../pages/home/Home';

// Lazy load all other routes for better code splitting
const Cars = lazy(() => import('../pages/cars/CarsPage.tsx').then(m => ({ default: m.Cars })));
const CarDetails = lazy(() => import('../pages/cars/car-details/CarDetails.tsx').then(m => ({ default: m.CarDetails })));
const Reviews = lazy(() => import('../pages/reviews/Reviews.tsx').then(m => ({ default: m.Reviews })));
const About = lazy(() => import('../pages/about/About').then(m => ({ default: m.About })));
const HowToRent = lazy(() => import('../pages/howToRent/HowToRent').then(m => ({ default: m.HowToRent })));
const Contact = lazy(() => import('../pages/contact/Contact').then(m => ({ default: m.Contact })));
const Booking = lazy(() => import('../pages/booking/Booking').then(m => ({ default: m.Booking })));
const Terms = lazy(() => import('../pages/terms/Terms.tsx').then(m => ({ default: m.Terms })));
const FAQ = lazy(() => import('../pages/faq/FAQ').then(m => ({ default: m.FAQ })));
const Login = lazy(() => import('../pages/auth/Login.tsx').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('../pages/auth/SignUp.tsx').then(m => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.tsx').then(m => ({ default: m.ForgotPassword })));
const UpdatePassword = lazy(() => import('../pages/auth/UpdatePassword.tsx').then(m => ({ default: m.UpdatePassword })));
const NotFound = lazy(() => import('../pages/NotFound').then(m => ({ default: m.default })));

// Lazy load admin and dashboard (heavier components)
const Admin = lazyLoad(() => import('../pages/admin/Admin.tsx'), 'Admin');
const UserDashboard = lazyLoad(() => import('../pages/dashboard/UserDashboard'), 'UserDashboard');
const PorscheLogoTest = lazyLoad(() => import('../components/test/PorscheLogoTest'), 'PorscheLogoTest');

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-500"></div>
  </div>
);

const RouterWrapper = () => {
  return (
    <>
      {/* Scroll to top on route change */}
      <ScrollToTop />

      <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/:carId" element={<CarDetails />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-rent" element={<HowToRent />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/help" element={<FAQ />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/forgot" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/test/porsche-logo" element={<PorscheLogoTest />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default RouterWrapper;