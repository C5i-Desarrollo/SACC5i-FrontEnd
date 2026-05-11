import { useState, useCallback } from 'react';
import { 
  getMisSolicitudesDependencia, 
  crearSolicitudDependencia, 
  getSolicitudDependenciaPorId 
} from '../../services/api';

/**
 * Hook para manejo de solicitudes de dependencia
 * Centraliza todas las operaciones CRUD de solicitudes de dependencia
 */
export const useDepSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar todas las solicitudes del usuario dependencia
   */
  const cargarSolicitudes = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMisSolicitudesDependencia(filtros);
      setSolicitudes(response.data.data || []);
      return response.data.data;
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
   * Crear nueva solicitud de dependencia
   */
  const crearSolicitud = useCallback(async (datos) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await crearSolicitudDependencia(datos);
      const nuevaSolicitud = response.data.data;
      setSolicitudActual(nuevaSolicitud);
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
      const response = await getSolicitudDependenciaPorId(id);
      const solicitud = response.data.data;
      setSolicitudActual(solicitud);
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
   * Limpiar solicitud actual
   */
  const limpiarSolicitudActual = useCallback(() => {
    setSolicitudActual(null);
  }, []);

  return {
    solicitudes,
    solicitudActual,
    loading,
    submitting,
    error,
    cargarSolicitudes,
    crearSolicitud,
    obtenerSolicitud,
    limpiarSolicitudActual
  };
};
