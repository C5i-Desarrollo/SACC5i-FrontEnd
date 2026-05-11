/**
 * Componente de rutas protegidas con lazy loading
 */
import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { protectedRoutes } from './routesConfig';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import LoadingScreen from '../components/ui/components/LoadingScreen';

/**
 * Componente de loading para Suspense
 */
const PageLoader = () => (
  <LoadingScreen message="Cargando modulo..." size="medium" />
);

/**
 * Router de rutas protegidas con lazy loading y permisos
 */
export const ProtectedRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {protectedRoutes.map((route) => {
          const Element = route.element;
          
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                route.permission ? (
                  <PermissionGuard 
                    permission={route.permission}
                    fallback="/dashboard"
                  >
                    <Element />
                  </PermissionGuard>
                ) : (
                  <Element />
                )
              }
            />
          );
        })}
        
        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
