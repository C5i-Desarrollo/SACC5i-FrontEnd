/**
 * Utilidades y helpers generales
 */

/**
 * Delay / Sleep
 * @param {number} ms 
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounce
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle
 * @param {Function} func 
 * @param {number} limit 
 * @returns {Function}
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Generar ID único
 * @returns {string}
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Agrupar array por propiedad
 * @param {Array} array 
 * @param {string} key 
 * @returns {Object}
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Ordenar array por propiedad
 * @param {Array} array 
 * @param {string} key 
 * @param {string} order 
 * @returns {Array}
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === bVal) return 0;
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Filtrar array por búsqueda en múltiples campos
 * @param {Array} array 
 * @param {string} searchTerm 
 * @param {Array} fields 
 * @returns {Array}
 */
export const searchInFields = (array, searchTerm, fields) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
};

/**
 * Copiar texto al portapapeles
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar:', err);
    return false;
  }
};

/**
 * Descargar archivo
 * @param {Blob} blob 
 * @param {string} filename 
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Obtener parámetros de URL
 * @param {string} param 
 * @returns {string|null}
 */
export const getURLParam = (param) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
};

/**
 * Verificar si está en modo desarrollo
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development';
};

/**
 * Logging mejorado (solo en desarrollo)
 * @param  {...any} args 
 */
export const log = (...args) => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

/**
 * Logging de errores (siempre)
 * @param  {...any} args 
 */
export const logError = (...args) => {
  console.error(...args);
};

/**
 * Obtener iniciales de nombre
 * @param {string} name 
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Verificar si objeto está vacío
 * @param {Object} obj 
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone de objeto
 * @param {any} obj 
 * @returns {any}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Comparar dos objetos superficialmente
 * @param {Object} obj1 
 * @param {Object} obj2 
 * @returns {boolean}
 */
export const shallowEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => obj1[key] === obj2[key]);
};

/**
 * Obtener color aleatorio
 * @returns {string}
 */
export const getRandomColor = () => {
  const colors = [
    '#3C91E6', '#FA7070', '#FEC260', '#A6D1E6',
    '#9B72AA', '#6BCB77', '#FF6B6B', '#4ECDC4'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
