/**
 * Custom hook para manejo de permisos
 */
import { useAuth } from '../context/AuthContext';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '../constants/permissions';
import { ROLES } from '../constants/roles';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const userRole = user?.rol;
  
  /**
   * Verificar si tiene un permiso específico
   */
  const can = (permission) => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };
  
  /**
   * Verificar si tiene todos los permisos
   */
  const canAll = (permissions) => {
    if (!userRole) return false;
    return hasAllPermissions(userRole, permissions);
  };
  
  /**
   * Verificar si tiene al menos uno de los permisos
   */
  const canAny = (permissions) => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissions);
  };
  
  /**
   * Verificar si es un rol específico
   */
  const isRole = (role) => {
    return userRole === role;
  };
  
  /**
   * Verificar si es admin o super admin
   */
  const isAdmin = () => {
    return userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;
  };
  
  /**
   * Verificar si es super admin
   */
  const isSuperAdmin = () => {
    return userRole === ROLES.SUPER_ADMIN;
  };
  
  /**
   * Verificar si es analista
   */
  const isAnalista = () => {
    return userRole === ROLES.ANALISTA;
  };
  
  /**
   * Verificar si es validador C3
   */
  const isValidadorC3 = () => {
    return userRole === ROLES.VALIDADOR_C3;
  };
  
  /**
   * Verificar si es dependencia
   */
  const isDependencia = () => {
    return userRole === ROLES.DEPENDENCIA;
  };
  
  return {
    can,
    canAll,
    canAny,
    isRole,
    isAdmin,
    isSuperAdmin,
    isAnalista,
    isValidadorC3,
    isDependencia,
    userRole
  };
};
