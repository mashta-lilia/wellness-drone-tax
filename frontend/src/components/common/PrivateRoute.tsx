import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode; // Це замінить проблемний JSX.Element
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Переконайся, що ключ у localStorage такий самий, як при логіні ('jwt_token')
  const token = localStorage.getItem('jwt_token'); 
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};