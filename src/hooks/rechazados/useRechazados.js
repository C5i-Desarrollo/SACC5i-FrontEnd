/**
 * Hook para gestion del historial de personas rechazadas
 */
import { useState, useCallback, useEffect } from 'react';
import { obtenerPersonasRechazadas, actualizarMotivoRechazo, generarOficioRechazo } from '../../services/api';
import { handleError } from '../../utils/errorHandler';

const INITIAL_FILTERS = {
  busqueda: '',
  etapa_rechazo: '',
  fecha_inicio: '',
  fecha_fin: '',
  page: 1,
  limit: 15
};

const EMPTY_PAGINACION = { total: 0, pagina: 1, limite: 15, total_paginas: 0 };

export const useRechazados = ({ analistaId = null, enabled = true } = {}) => {
  const analistaNumerico = Number(analistaId);
  const hasAnalistaFilter = Number.isFinite(analistaNumerico) && analistaNumerico > 0;

  const [personas, setPersonas] = useState([]);
  const [paginacion, setPaginacion] = useState(EMPTY_PAGINACION);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarPersonas = useCallback(async (filtrosOverride = null) => {
    if (!enabled) {
      setPersonas([]);
      setPaginacion(EMPTY_PAGINACION);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paramsBase = filtrosOverride || filtros;
      const params = { ...paramsBase };
      if (hasAnalistaFilter) params.analista_id = analistaNumerico;

      // Solo enviar params no vacios
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanParams[key] = value;
        }
      });

      const response = await obtenerPersonasRechazadas(cleanParams);
      const data = response.data;

      setPersonas(data.data || []);
      setPaginacion(data.paginacion || EMPTY_PAGINACION);
    } catch (err) {
      handleError(err, { showNotification: true });
      setError(err);
      setPersonas([]);
      setPaginacion(EMPTY_PAGINACION);
    } finally {
      setLoading(false);
    }
  }, [filtros, enabled, hasAnalistaFilter, analistaNumerico]);

  useEffect(() => {
    if (!enabled) {
      setPersonas([]);
      setPaginacion(EMPTY_PAGINACION);
      setLoading(false);
      return;
    }

    cargarPersonas();
  }, [filtros.page, analistaNumerico, enabled]);

  const aplicarFiltros = useCallback(() => {
    const nuevosFiltros = { ...filtros, page: 1 };
    setFiltros(nuevosFiltros);
    cargarPersonas(nuevosFiltros);
  }, [filtros, cargarPersonas]);

  const limpiarFiltros = useCallback(() => {
    setFiltros(INITIAL_FILTERS);
    cargarPersonas(INITIAL_FILTERS);
  }, [cargarPersonas]);

  const cambiarPagina = useCallback((page) => {
    setFiltros((prev) => ({ ...prev, page }));
  }, []);

  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const editarMotivo = useCallback(async (personaId, nuevoMotivo) => {
    if (!enabled) return false;

    try {
      await actualizarMotivoRechazo(personaId, { motivo_rechazo: nuevoMotivo });
      if (window.showNotification) {
        window.showNotification('Motivo actualizado correctamente', 'success');
      }
      cargarPersonas();
      return true;
    } catch (err) {
      handleError(err, { showNotification: true });
      return false;
    }
  }, [cargarPersonas, enabled]);

  const obtenerOficio = useCallback(async (personaId) => {
    if (!enabled) return null;

    try {
      const response = await generarOficioRechazo(personaId);
      return response.data.data;
    } catch (err) {
      handleError(err, { showNotification: true });
      return null;
    }
  }, [enabled]);

  return {
    personas,
    paginacion,
    filtros,
    loading,
    error,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    actualizarFiltro,
    editarMotivo,
    obtenerOficio,
    recargar: cargarPersonas
  };
};
