/**
 * Manejo centralizado de errores
 */

import { logError } from './helpers';

/**
 * Tipos de errores
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
};

/**
 * Extraer mensaje de error de response de API
 * @param {Error} error 
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Error desconocido';
  
  // Error de Axios
  if (error.response) {
    const { data, status } = error.response;
    
    // Mensaje personalizado del backend
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    
    // Mensajes por código de estado
    switch (status) {
      case 400:
        return 'Solicitud inválida';
      case 401:
        return 'No autorizado. Por favor inicie sesión nuevamente';
      case 403:
        return 'No tiene permisos para realizar esta acción';
      case 404:
        return 'Recurso no encontrado';
      case 409:
        return 'Conflicto: el recurso ya existe';
      case 422:
        return 'Datos de validación incorrectos';
      case 500:
        return 'Error interno del servidor';
      case 503:
        return 'Servicio no disponible';
      default:
        return `Error del servidor (${status})`;
    }
  }
  
  // Error de red
  if (error.request) {
    return 'Error de conexión. Verifique su conexión a internet';
  }
  
  // Otros errores
  return error.message || 'Error desconocido';
};

/**
 * Determinar tipo de error
 * @param {Error} error 
 * @returns {string}
 */
export const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 401) return ERROR_TYPES.AUTHENTICATION;
    if (status === 403) return ERROR_TYPES.AUTHORIZATION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status === 422 || status === 400) return ERROR_TYPES.VALIDATION;
    if (status >= 500) return ERROR_TYPES.SERVER;
  }
  
  if (error.request) return ERROR_TYPES.NETWORK;
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Handler centralizado de errores
 * @param {Error} error 
 * @param {Object} options 
 */
export const handleError = (error, options = {}) => {
  const {
    showNotification = true,
    logToConsole = true,
    throwError = false,
    customMessage = null
  } = options;
  
  const message = customMessage || getErrorMessage(error);
  const type = getErrorType(error);
  
  // Log en consola
  if (logToConsole) {
    logError('Error:', {
      message,
      type,
      error
    });
  }
  
  // Mostrar notificación (se integrará con el sistema de notificaciones)
  if (showNotification && window.showNotification) {
    window.showNotification(message, 'error');
  }
  
  // Re-lanzar error si es necesario
  if (throwError) {
    throw error;
  }
  
  return { message, type };
};

/**
 * Wrapper para llamadas API con manejo de errores
 * @param {Function} apiCall 
 * @param {Object} options 
 * @returns {Promise}
 */
export const withErrorHandling = async (apiCall, options = {}) => {
  try {
    const response = await apiCall();
    return { data: response.data, error: null };
  } catch (error) {
    const errorInfo = handleError(error, options);
    return { data: null, error: errorInfo };
  }
};

/**
 * Validar respuesta de API
 * @param {Object} response 
 * @returns {boolean}
 */
export const isValidResponse = (response) => {
  return response && response.data && typeof response.data === 'object';
};

/**
 * Extraer datos de respuesta de API
 * @param {Object} response 
 * @returns {any}
 */
export const extractData = (response) => {
  if (!isValidResponse(response)) return null;
  
  // Si tiene estructura { data: {...} }
  if (response.data.data !== undefined) {
    return response.data.data;
  }
  
  return response.data;
};
