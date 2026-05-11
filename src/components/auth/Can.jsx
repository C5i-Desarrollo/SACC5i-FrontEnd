/**
 * Componente para mostrar/ocultar elementos basado en permisos
 */
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Mostrar contenido solo si el usuario tiene el permiso
 * @param {Object} props
 * @param {React.Component} props.children - Contenido a mostrar
 * @param {string|string[]} props.permission - Permiso(s) requerido(s)
 * @param {boolean} props.requireAll - Si se requieren todos los permisos
 * @param {React.Component} props.fallback - Componente alternativo
 */
export const Can = ({ 
  children, 
  permission, 
  requireAll = false,
  fallback = null 
}) => {
  const { can, canAll, canAny } = usePermissions();
  
  // Si no se especifica permiso, mostrar contenido
  if (!permission) return children;
  
  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll ? canAll(permission) : canAny(permission);
  } else {
    hasAccess = can(permission);
  }
  
  if (!hasAccess) {
    return fallback;
  }
  
  return children;
};

/**
 * Ocultar contenido si el usuario tiene el permiso (inverso)
 */
export const Cannot = ({ children, permission, fallback = null }) => {
  const { can } = usePermissions();
  
  const hasAccess = can(permission);
  
  if (hasAccess) {
    return fallback;
  }
  
  return children;
};
