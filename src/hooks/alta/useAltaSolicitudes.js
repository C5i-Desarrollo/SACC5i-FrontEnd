import { useState, useCallback } from 'react';
import {
  getMisSolicitudes,
  crearNuevaSolicitud,
  obtenerSolicitudPorId,
  eliminarBorradorSolicitudAlta
} from '../../services/api';

const SOLICITUDES_CACHE_TTL_MS = 20 * 1000;
const solicitudesCache = new Map();
const solicitudesInFlight = new Map();

/**
 * Hook para manejo de solicitudes de alta
 * Centraliza todas las operaciones CRUD de solicitudes
 */
export const useAltaSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todas las solicitudes del usuario
   */
  const cargarSolicitudes = useCallback(async (filtros = {}) => {
    const cacheKey = JSON.stringify(filtros || {});
    const now = Date.now();
    const cached = solicitudesCache.get(cacheKey);

    if (cached && now - cached.timestamp < SOLICITUDES_CACHE_TTL_MS) {
      setSolicitudes(cached.data);
      return cached.data;
    }

    const inFlight = solicitudesInFlight.get(cacheKey);
    if (inFlight) {
      const data = await inFlight;
      setSolicitudes(data);
      return data;
    }

    setLoading(true);
    setError(null);
    try {
      const requestPromise = getMisSolicitudes(filtros)
        .then((response) => response.data.data || [])
        .finally(() => {
          solicitudesInFlight.delete(cacheKey);
        });

      solicitudesInFlight.set(cacheKey, requestPromise);

      const data = await requestPromise;
      solicitudesCache.set(cacheKey, { data, timestamp: Date.now() });
      setSolicitudes(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cargar solicitudes';
      setError(errorMsg);
      console.error('Error al cargar solicitudes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nueva solicitud
   */
  const crearSolicitud = useCallback(async (datos) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await crearNuevaSolicitud(datos);
      const nuevaSolicitud = response.data.data;
      setSolicitudActual(nuevaSolicitud);
      solicitudesCache.clear();
      return nuevaSolicitud;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear solicitud';
      setError(errorMsg);
      console.error('Error al crear solicitud:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  /**
   * Obtener detalle de una solicitud
   */
  const obtenerSolicitud = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerSolicitudPorId(id);
      const solicitud = response.data.data;
      setSolicitudActual(solicitud);
      solicitudesCache.clear();
      return solicitud;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al obtener solicitud';
      setError(errorMsg);
      console.error('Error al obtener solicitud:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar borrador no enviado
   */
  const eliminarBorradorSolicitud = useCallback(async (id, options = {}) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await eliminarBorradorSolicitudAlta(id, options);
      solicitudesCache.clear();

      setSolicitudes((prev) => prev.filter((solicitud) => Number(solicitud.id) !== Number(id)));
      setSolicitudActual((prev) => (Number(prev?.id) === Number(id) ? null : prev));

      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar borrador';
      setError(errorMsg);
      console.error('Error al eliminar borrador:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  /**
   * Limpiar solicitud actual
   */
  const limpiarSolicitudActual = useCallback(() => {
    setSolicitudActual(null);
  }, []);

  /**
   * Limpiar errores
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    solicitudes,
    solicitudActual,
    loading,
    submitting,
    error,
    
    // Acciones
    cargarSolicitudes,
    crearSolicitud,
    obtenerSolicitud,
    eliminarBorradorSolicitud,
    limpiarSolicitudActual,
    limpiarError
  };
};
