/**
 * Exportación centralizada de hooks personalizados
 */
export { usePermissions } from './usePermissions';
export { useApi } from './useApi';
export { useFetch } from './useFetch';
export { useForm } from './useForm';
export { usePagination } from './usePagination';
export { useSearch } from './useSearch';
export { useToggle } from './useToggle';
export { useLocalStorage } from './useLocalStorage';

// Hooks especializados por módulo
export * from './alta';
export * from './baja';
export * from './consulta';
export * from './usuarios';
