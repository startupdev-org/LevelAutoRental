import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with dark styling */}
      <Header />
      
      {/* Main content */}
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full text-center px-4">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/">
              <Button className="w-full">
                Go Back Home
              </Button>
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Or try one of these pages:</p>
              <div className="flex justify-center space-x-4 mt-2">
                <Link to="/cars" className="text-blue-600 hover:text-blue-800">
                  Cars
                </Link>
                <Link to="/about" className="text-blue-600 hover:text-blue-800">
                  About
                </Link>
                <Link to="/how-to-rent" className="text-blue-600 hover:text-blue-800">
                  How to Rent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
