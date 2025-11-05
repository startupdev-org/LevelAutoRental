import { Route, Routes } from 'react-router-dom';
import { About } from '../pages/about/About';
import { Booking } from '../pages/booking/Booking';
import { Cars } from '../pages/cars/Cars';
import { CarDetails } from '../pages/cars/individual/CarDetails';
import { Reviews } from '../pages/reviews/Reviews.tsx';
import { Contact } from '../pages/contact/Contact';
import { Home } from '../pages/home/Home';
import { HowToRent } from '../pages/howToRent/HowToRent';
import { Terms } from '../pages/terms/Terms.tsx';
import { FAQ } from '../pages/faq/FAQ';
import { Login } from '../pages/auth/Login.tsx';
import { SignUp } from '../pages/auth/SignUp.tsx';
import { ForgotPassword } from '../pages/auth/ForgotPassword.tsx';
import { Calculator } from '../pages/calculator/Calculator';
import NotFound from '../pages/NotFound';
import ScrollToTop from './ScrollToTop';

import { Admin } from '../pages/admin/Admin.tsx';
import { UserDashboard } from '../pages/dashboard/UserDashboard';
import { ProtectedRoute } from './ProtectedRoute';

const RouterWrapper = () => {
  return (
    <>
      {/* Scroll to top on route change */}
      <ScrollToTop />

      {/* Page transition loader - temporarily disabled to fix multiple instances */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/:carId" element={<CarDetails />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-rent" element={<HowToRent />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/help" element={<FAQ />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/forgot" element={<ForgotPassword />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<NotFound />} />
      </Routes >
    </>
  );
};

export default RouterWrapper;