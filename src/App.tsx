import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { About } from './pages/about/About';
import { Booking } from './pages/booking/Booking';
import { Cars } from './pages/cars/Cars';
import { Contact } from './pages/contact/Contact';
import { Home } from './pages/home/Home';
import Loader from './components/layout/Loader';
import { FAQ } from './pages/faq/FAQ';

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />; // only loader visible
  }
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/help" element={<FAQ />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;