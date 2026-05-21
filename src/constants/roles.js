/**
 * Roles del sistema
 * Constantes centralizadas para evitar typos y facilitar mantenimiento
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DIRECCION: 'direccion',
  ANALISTA: 'analista',
  VALIDADOR_C3: 'validador_c3',
  DEPENDENCIA: 'dependencia',
  OPERADOR_CCP: 'operador_ccp'
  ,MUNICIPIO: 'municipio',
  COORDINADOR: 'coordinador'
};

/**
 * Nombres legibles de roles para UI
 */
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.DIRECCION]: 'Direccion',
  [ROLES.ANALISTA]: 'Analista C5',
  [ROLES.VALIDADOR_C3]: 'Validador C3',
  [ROLES.DEPENDENCIA]: 'Dependencia',
  [ROLES.OPERADOR_CCP]: 'Operador CCP'
  ,[ROLES.MUNICIPIO]: 'Municipio',
  [ROLES.COORDINADOR]: 'Coordinador'
};

/**
 * Jerarquía de roles (mayor a menor privilegio)
 */
export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DIRECCION,
  ROLES.ANALISTA,
  ROLES.VALIDADOR_C3,
  ROLES.DEPENDENCIA,
  ROLES.OPERADOR_CCP
  ,ROLES.MUNICIPIO,
  ROLES.COORDINADOR
];

/**
 * Obtener nivel de privilegio de un rol
 * @param {string} role 
 * @returns {number} Nivel (0 = más alto)
 */
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY.indexOf(role);
};

/**
 * Verificar si un rol tiene mayor o igual privilegio que otro
 * @param {string} role 
 * @param {string} minRole 
 * @returns {boolean}
 */
export const hasMinimumRole = (role, minRole) => {
  return getRoleLevel(role) <= getRoleLevel(minRole);
};
