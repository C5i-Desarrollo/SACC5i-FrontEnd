/**
 * HOC para proteger componentes basados en permisos
 */
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Componente wrapper para proteger rutas basadas en permisos
 * @param {Object} props
 * @param {React.Component} props.children - Componente a proteger
 * @param {string|string[]} props.permission - Permiso(s) requerido(s)
 * @param {string} props.fallback - Ruta de redirección si no tiene permiso
 * @param {boolean} props.requireAll - Si se requieren todos los permisos (por defecto false)
 * @param {React.Component} props.fallbackComponent - Componente alternativo a mostrar
 */
export const PermissionGuard = ({ 
  children, 
  permission, 
  fallback = '/dashboard',
  requireAll = false,
  fallbackComponent = null 
}) => {
  const { can, canAll, canAny } = usePermissions();
  
  // Si no se especifica permiso, permitir acceso
  if (!permission) return children;
  
  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll ? canAll(permission) : canAny(permission);
  } else {
    hasAccess = can(permission);
  }
  
  if (!hasAccess) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    return <Navigate to={fallback} replace />;
  }
  
  return children;
};

/**
 * HOC para envolver componentes con protección de permisos
 */
export const withPermission = (Component, permission, options = {}) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard permission={permission} {...options}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};
