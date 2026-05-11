import { useState, useCallback } from 'react';

/**
 * Hook para manejo de filtros de usuarios
 * Gestiona todos los estados de filtrado y búsqueda
 */
export const useUsuariosFilters = () => {
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('');

  /**
   * Limpiar todos los filtros
   */
  const limpiarFiltros = useCallback(() => {
    setBuscar('');
    setFiltroRol('');
    setFiltroEstado('');
    setFiltroRegion('');
  }, []);

  /**
   * Obtener objeto con filtros aplicados
   */
  const obtenerFiltros = useCallback(() => {
    return {
      buscar,
      rol: filtroRol,
      activo: filtroEstado,
      region_id: filtroRegion
    };
  }, [buscar, filtroRol, filtroEstado, filtroRegion]);

  /**
   * Verificar si hay filtros activos
   */
  const hayFiltrosActivos = useCallback(() => {
    return buscar !== '' || filtroRol !== '' || filtroEstado !== '' || filtroRegion !== '';
  }, [buscar, filtroRol, filtroEstado, filtroRegion]);

  return {
    // Estados
    buscar,
    filtroRol,
    filtroEstado,
    filtroRegion,
    
    // Setters
    setBuscar,
    setFiltroRol,
    setFiltroEstado,
    setFiltroRegion,
    
    // Métodos
    limpiarFiltros,
    obtenerFiltros,
    hayFiltrosActivos
  };
};
