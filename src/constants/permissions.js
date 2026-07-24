import { ROLES } from './roles';

/**
 * Permisos del sistema
 * Define qué roles pueden acceder a qué funcionalidades
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECCION, ROLES.COORDINADOR, ROLES.ANALISTA, ROLES.VALIDADOR_C3, ROLES.DEPENDENCIA, ROLES.OPERADOR_CCP],
  VIEW_PANEL_DIRECCION: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COORDINADOR, ROLES.DIRECCION],
  VIEW_TEST_MUNICIPIO: [ROLES.ADMIN, ROLES.DIRECCION, ROLES.COORDINADOR],

  // Usuarios
  VIEW_USUARIOS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  CREATE_USUARIO: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  EDIT_USUARIO: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  DELETE_USUARIO: [ROLES.SUPER_ADMIN],
  RESET_PASSWORD: [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Trámites - Alta
  VIEW_ALTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA],
  CREATE_ALTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA],
  EDIT_ALTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA],
  DELETE_ALTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  VALIDATE_ALTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA],

  // Trámites - Baja
  VIEW_BAJA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COORDINADOR, ROLES.ANALISTA],
  CREATE_BAJA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA],

  // Consultas
  VIEW_CONSULTA: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COORDINADOR, ROLES.DIRECCION, ROLES.ANALISTA, ROLES.DEPENDENCIA],

  // C3
  VIEW_PENDIENTES_C3: [ROLES.VALIDADOR_C3],
  VALIDATE_C3: [ROLES.VALIDADOR_C3],
  VIEW_HISTORIAL_C3: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.VALIDADOR_C3],
  VIEW_RECHAZOS_C3: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECCION, ROLES.COORDINADOR, ROLES.ANALISTA],

  // Citas biométricas
  VIEW_CITAS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COORDINADOR, ROLES.ANALISTA],

  // Finalizados
  VIEW_FINALIZADOS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECCION, ROLES.COORDINADOR, ROLES.ANALISTA],

  // Dependencias
  VIEW_TRAMITES_DEPENDENCIA: [ROLES.DEPENDENCIA],
  CREATE_TRAMITE_DEPENDENCIA: [ROLES.DEPENDENCIA],

  // Catálogos
  VIEW_CATALOGOS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  EDIT_CATALOGOS: [ROLES.SUPER_ADMIN],

  // Configuración
  VIEW_CONFIGURACION: [ROLES.SUPER_ADMIN],
  EDIT_CONFIGURACION: [ROLES.SUPER_ADMIN],

  // Copias de Conocimiento
  VIEW_CCP: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERADOR_CCP],
  VIEW_HISTORIAL_CCP: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERADOR_CCP],
  CREATE_CCP: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERADOR_CCP],
  EDIT_CCP: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERADOR_CCP],
  DELETE_CCP: [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Repositorio Digital
  VIEW_REPOSITORIO_DIGITAL: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALISTA, ROLES.DEPENDENCIA, ROLES.OPERADOR_CCP],

  // Perfil
  VIEW_PERFIL: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECCION, ROLES.ANALISTA, ROLES.VALIDADOR_C3, ROLES.DEPENDENCIA, ROLES.OPERADOR_CCP],
  EDIT_PERFIL: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECCION, ROLES.ANALISTA, ROLES.VALIDADOR_C3, ROLES.DEPENDENCIA, ROLES.OPERADOR_CCP]
};

/**
 * Verificar si un rol tiene un permiso específico
 * @param {string} userRole - Rol del usuario
 * @param {string} permission - Permiso a verificar (clave de PERMISSIONS)
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

/**
 * Verificar si un rol tiene TODOS los permisos especificados
 * @param {string} userRole 
 * @param {string[]} permissions 
 * @returns {boolean}
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Verificar si un rol tiene AL MENOS UNO de los permisos especificados
 * @param {string} userRole 
 * @param {string[]} permissions 
 * @returns {boolean}
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Filtrar elementos de menú basados en permisos
 * @param {Array} menuItems 
 * @param {string} userRole 
 * @returns {Array}
 */
export const filterMenuByPermissions = (menuItems, userRole) => {
  return menuItems.filter(item => {
    if (item.permission) {
      return hasPermission(userRole, item.permission);
    }
    return true;
  });
};
