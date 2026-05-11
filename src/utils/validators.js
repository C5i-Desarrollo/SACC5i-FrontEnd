/**
 * Validadores de formularios y datos
 */

/**
 * Validar CURP
 * @param {string} curp 
 * @returns {boolean}
 */
export const isValidCURP = (curp) => {
  if (!curp || typeof curp !== 'string') return false;
  
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  return curpRegex.test(curp.toUpperCase());
};

/**
 * Validar RFC
 * @param {string} rfc 
 * @returns {boolean}
 */
export const isValidRFC = (rfc) => {
  if (!rfc || typeof rfc !== 'string') return false;
  
  // RFC puede ser de 12 o 13 caracteres
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc.toUpperCase());
};

/**
 * Validar email
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono (10 dígitos)
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

/**
 * Validar extensión (4-5 dígitos)
 * @param {string} ext 
 * @returns {boolean}
 */
export const isValidExtension = (ext) => {
  if (!ext) return false;
  
  const extRegex = /^\d{4,5}$/;
  return extRegex.test(ext);
};

/**
 * Validar fecha no futura
 * @param {string} dateString 
 * @returns {boolean}
 */
export const isValidPastDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return !isNaN(date.getTime()) && date <= today;
};

/**
 * Validar fecha no pasada
 * @param {string} dateString 
 * @returns {boolean}
 */
export const isValidFutureDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return !isNaN(date.getTime()) && date >= today;
};

/**
 * Validar rango de fechas
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {boolean}
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};

/**
 * Validar longitud de texto
 * @param {string} text 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
export const isValidLength = (text, min = 0, max = Infinity) => {
  if (!text) return min === 0;
  
  const length = text.trim().length;
  return length >= min && length <= max;
};

/**
 * Validar que el campo no esté vacío
 * @param {any} value 
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validar formato de nombre (solo letras, espacios, acentos)
 * @param {string} name 
 * @returns {boolean}
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const nameRegex = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

/**
 * Validar username (alfanumérico, guiones bajos)
 * @param {string} username 
 * @returns {boolean}
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validar contraseña (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número)
 * @param {string} password 
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};

/**
 * Obtener mensajes de error de validación
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_CURP: 'CURP inválido',
  INVALID_RFC: 'RFC inválido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono debe tener 10 dígitos',
  INVALID_EXTENSION: 'Extensión debe tener 4-5 dígitos',
  INVALID_DATE: 'Fecha inválida',
  INVALID_DATE_PAST: 'La fecha no puede ser futura',
  INVALID_DATE_FUTURE: 'La fecha no puede ser pasada',
  INVALID_DATE_RANGE: 'Rango de fechas inválido',
  INVALID_LENGTH: 'Longitud inválida',
  INVALID_NAME: 'Nombre inválido (solo letras)',
  INVALID_USERNAME: 'Usuario inválido (3-20 caracteres, solo letras, números y _)',
  INVALID_PASSWORD: 'Contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
};
