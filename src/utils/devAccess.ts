import React from 'react';

export const isDevelopmentMode = (): boolean => {
  const hostname = window.location.hostname;
  const port = parseInt(window.location.port);
  
  // Check for localhost or 127.0.0.1
  const isLocalhost = hostname === 'localhost' || 
                     hostname === '127.0.0.1' ||
                     hostname.includes('localhost') ||
                     hostname.includes('127.0.0.1');
  
  // Check for common development ports (3000-6000 range)
  const isDevPort = port >= 3000 && port <= 6000;
  
  // Check for specific Vite ports
  const isVitePort = port === 5173 || port === 5174;
  
  return isLocalhost && (isDevPort || isVitePort);
};

export const requireDevAccess = (): boolean => {
  if (!isDevelopmentMode()) {
    console.warn('This feature is only available in development mode');
    return false;
  }
  return true;
};

interface DevOnlyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const DevOnlyComponent: React.FC<DevOnlyComponentProps> = ({ children, fallback = null }) => {
  if (!requireDevAccess()) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
};