// src/components/PrivateRoute.jsx
import React, { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const PrivateRoute = ({ children }) => {
  // Use ref to store authentication status and prevent re-renders
  const authRef = useRef(null);
  
  // Only check authentication once on mount
  if (authRef.current === null) {
    authRef.current = isAuthenticated();
  }
  
  return authRef.current ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;