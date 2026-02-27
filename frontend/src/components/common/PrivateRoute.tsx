import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Властивості для компонента PrivateRoute.
 */
interface PrivateRouteProps {
  /** Дочірні елементи, які будуть відрендерені, якщо користувач авторизований. */
  children: React.ReactNode; 
}

/**
 * Компонент-обгортка для захищених маршрутів.
 * Перевіряє наявність JWT-токену в localStorage. Якщо токен відсутній,
 * автоматично перенаправляє користувача на сторінку авторизації.
 * * @param props - Властивості компонента (містить children).
 * @returns Відрендерені дочірні компоненти або компонент Navigate для редиректу.
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('jwt_token'); 
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};