/**
 * Utilidades para formateo de datos
 */

/**
 * Formatear fecha a formato local
 * @param {string|Date} date 
 * @param {boolean} includeTime 
 * @returns {string}
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
  
  return d.toLocaleDateString('es-MX', options);
};

/**
 * Formatear fecha para inputs (YYYY-MM-DD)
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
};

/**
 * Formatear nombre completo
 * @param {string} nombre 
 * @param {string} apellidoPaterno 
 * @param {string} apellidoMaterno 
 * @returns {string}
 */
export const formatFullName = (nombre, apellidoPaterno, apellidoMaterno = '') => {
  const parts = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);
  return parts.join(' ').trim() || '-';
};

/**
 * Formatear nombre desde objeto
 * @param {object} person 
 * @returns {string}
 */
export const formatPersonName = (person) => {
  if (!person) return '-';
  return formatFullName(person.nombre, person.apellido_paterno, person.apellido_materno);
};

/**
 * Formatear CURP (mayúsculas, sin espacios)
 * @param {string} curp 
 * @returns {string}
 */
export const formatCURP = (curp) => {
  if (!curp) return '';
  return curp.toUpperCase().replace(/\s/g, '');
};

/**
 * Formatear RFC (mayúsculas, sin espacios)
 * @param {string} rfc 
 * @returns {string}
 */
export const formatRFC = (rfc) => {
  if (!rfc) return '';
  return rfc.toUpperCase().replace(/\s/g, '');
};

/**
 * Formatear teléfono (XXX-XXX-XXXX)
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Formatear moneda (pesos mexicanos)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

/**
 * Formatear número con separadores de miles
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  return new Intl.NumberFormat('es-MX').format(num);
};

/**
 * Capitalizar primera letra
 * @param {string} text 
 * @returns {string}
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palabra
 * @param {string} text 
 * @returns {string}
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(capitalize).join(' ');
};

/**
 * Truncar texto
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formatear tiempo relativo (hace X minutos/horas/días)
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  
  return formatDate(d);
};

/**
 * Limpiar espacios extras
 * @param {string} text 
 * @returns {string}
 */
export const cleanSpaces = (text) => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};
