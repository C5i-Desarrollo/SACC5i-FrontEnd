/**
 * Hook para gestion del historial de personas rechazadas
 */
import { useState, useCallback, useEffect } from 'react';
import {
  obtenerPersonasRechazadas,
  actualizarMotivoRechazo,
  generarOficioRechazo
} from '../../services/api';
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

const normalizarTexto = (valor = '') =>
  String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const useRechazados = ({ analistaId = null, enabled = true } = {}) => {
  const analistaNumerico = Number(analistaId);
  const hasAnalistaFilter = Number.isFinite(analistaNumerico) && analistaNumerico > 0;

  const [personas, setPersonas] = useState([]);
  const [personasOriginales, setPersonasOriginales] = useState([]);
  const [paginacion, setPaginacion] = useState(EMPTY_PAGINACION);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtrarLocalmente = useCallback((lista, filtrosAplicados) => {
    const texto = normalizarTexto(filtrosAplicados.busqueda);
    const etapaFiltro = normalizarTexto(filtrosAplicados.etapa_rechazo);

    return lista.filter((persona) => {
      const nombre = normalizarTexto(persona.nombre_completo);
      const etapa = normalizarTexto(persona.etapa_rechazo);

      const coincideBusqueda =
        !texto ||
        nombre.includes(texto) ||
        etapa.includes(texto);

      const coincideEtapa =
        !etapaFiltro ||
        etapa.includes(etapaFiltro);

      return coincideBusqueda && coincideEtapa;
    });
  }, []);

  const aplicarResultadoLocal = useCallback((lista, filtrosAplicados) => {
    const listaFiltrada = filtrarLocalmente(lista, filtrosAplicados);

    setPersonas(listaFiltrada);
    setPaginacion({
      total: listaFiltrada.length,
      pagina: 1,
      limite: filtrosAplicados.limit || 15,
      total_paginas: 1
    });
  }, [filtrarLocalmente]);

  const cargarPersonas = useCallback(async (filtrosOverride = null) => {
    if (!enabled) {
      setPersonas([]);
      setPersonasOriginales([]);
      setPaginacion(EMPTY_PAGINACION);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paramsBase = filtrosOverride || filtros;

      const params = {
        page: 1,
        limit: 1000
      };

      if (hasAnalistaFilter) params.analista_id = analistaNumerico;

      if (paramsBase.fecha_inicio) params.fecha_inicio = paramsBase.fecha_inicio;
      if (paramsBase.fecha_fin) params.fecha_fin = paramsBase.fecha_fin;

      const response = await obtenerPersonasRechazadas(params);
      const data = response.data;
      const registros = data.data || [];

      setPersonasOriginales(registros);
      aplicarResultadoLocal(registros, paramsBase);
    } catch (err) {
      handleError(err, { showNotification: true });
      setError(err);
      setPersonas([]);
      setPersonasOriginales([]);
      setPaginacion(EMPTY_PAGINACION);
    } finally {
      setLoading(false);
    }
  }, [
    filtros,
    enabled,
    hasAnalistaFilter,
    analistaNumerico,
    aplicarResultadoLocal
  ]);

  useEffect(() => {
    if (!enabled) {
      setPersonas([]);
      setPersonasOriginales([]);
      setPaginacion(EMPTY_PAGINACION);
      setLoading(false);
      return;
    }

    cargarPersonas();
  }, [analistaNumerico, enabled]);

  const aplicarFiltros = useCallback(() => {
    const nuevosFiltros = { ...filtros, page: 1 };

    if (personasOriginales.length > 0) {
      aplicarResultadoLocal(personasOriginales, nuevosFiltros);
      return;
    }

    cargarPersonas(nuevosFiltros);
  }, [
    filtros,
    personasOriginales,
    aplicarResultadoLocal,
    cargarPersonas
  ]);

  const limpiarFiltros = useCallback(() => {
    setFiltros(INITIAL_FILTERS);

    if (personasOriginales.length > 0) {
      aplicarResultadoLocal(personasOriginales, INITIAL_FILTERS);
      return;
    }

    cargarPersonas(INITIAL_FILTERS);
  }, [personasOriginales, aplicarResultadoLocal, cargarPersonas]);

  const cambiarPagina = useCallback((page) => {
    setFiltros((prev) => ({ ...prev, page }));
  }, []);

  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, page: 1 }));
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