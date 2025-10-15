import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { About } from '../pages/about/About';
import { Booking } from '../pages/booking/Booking';
import { Cars } from '../pages/cars/Cars';
import { Contact } from '../pages/contact/Contact';
import { Home } from '../pages/home/Home';
import { HowToRent } from '../pages/howToRent/HowToRent';
import Loader from '../components/layout/Loader';
import { FAQ } from '../pages/faq/FAQ';
import { usePageTransition } from '../hooks/usePageTransition';
import { createPortal } from 'react-dom';
import NotFound from '../pages/NotFound';

const RouterWrapper = () => {
  const { isLoading, isTransitioning, onLoadingComplete } = usePageTransition();

  return (
    <>
      {/* Page transition loader - rendered as portal to ensure it's above everything */}
      {isLoading && createPortal(
        <Loader 
          isLoading={isLoading} 
          isTransitioning={isTransitioning} 
          onLoadingComplete={onLoadingComplete} 
        />,
        document.body
      )}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-rent" element={<HowToRent />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/help" element={<FAQ />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default RouterWrapper;