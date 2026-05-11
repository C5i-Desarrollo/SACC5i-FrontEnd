import { useState, useCallback } from 'react';
import {
  obtenerPendientesCuip,
  obtenerEnProcesoCuip,
  iniciarCuipPersona,
  obtenerDetalleCuip,
  validarCampoCuip,
  validarSeccionCuip,
  marcarExcepcionCuip,
  validarTodoCuipApi,
  completarCuipPersona,
  rechazarEnCuip,
  aprobarYGenerarCitaApi
} from '../../services/api';

/**
 * Hook para gestión de Validación CUIP
 * Maneja el flujo: pendientes → en_proceso → checklist 23 secciones → completado
 */
export const useCuip = () => {
  const [pendientes, setPendientes] = useState([]);
  const [enProceso, setEnProceso] = useState([]);
  const [personaActual, setPersonaActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ── Listas ──

  const cargarPendientes = useCallback(async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await obtenerPendientesCuip(filtros);
      setPendientes(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar pendientes CUIP');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEnProceso = useCallback(async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await obtenerEnProcesoCuip(filtros);
      setEnProceso(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar en proceso CUIP');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Iniciar CUIP ──

  const iniciarCuip = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await iniciarCuipPersona(personaId);
      setPersonaActual(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar CUIP';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Detalle ──

  const cargarDetalle = useCallback(async (personaId) => {
    setLoading(true);
    try {
      const res = await obtenerDetalleCuip(personaId);
      const persona = res.data.data;
      if (persona.cuip_validacion && typeof persona.cuip_validacion === 'string') {
        persona.cuip_validacion = JSON.parse(persona.cuip_validacion);
      }
      if (persona.cuip_excepciones && typeof persona.cuip_excepciones === 'string') {
        persona.cuip_excepciones = JSON.parse(persona.cuip_excepciones);
      }
      setPersonaActual(persona);
      return persona;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar detalle CUIP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Validar campo individual ──

  const validarCampo = useCallback(async (personaId, seccionClave, campoNum, validado) => {
    try {
      const res = await validarCampoCuip(personaId, {
        seccion_clave: seccionClave,
        campo_num: campoNum,
        validado
      });
      const cuipActualizado = res.data.data;
      setPersonaActual(prev => prev ? { ...prev, cuip_validacion: cuipActualizado } : null);
      return cuipActualizado;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar campo';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Validar sección completa ──

  const validarSeccion = useCallback(async (personaId, seccionClave) => {
    setSubmitting(true);
    try {
      const res = await validarSeccionCuip(personaId, seccionClave);
      const cuipActualizado = res.data.data;
      setPersonaActual(prev => prev ? { ...prev, cuip_validacion: cuipActualizado } : null);
      return cuipActualizado;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar sección';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Marcar excepción NINGUNO ──

  const marcarExcepcion = useCallback(async (personaId, seccionClave, activa) => {
    setSubmitting(true);
    try {
      const res = await marcarExcepcionCuip(personaId, seccionClave, activa);
      const { cuip_validacion, cuip_excepciones } = res.data.data;
      setPersonaActual(prev => prev ? { ...prev, cuip_validacion, cuip_excepciones } : null);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al marcar excepción';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Validar todo ──

  const validarTodo = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await validarTodoCuipApi(personaId);
      const { cuip_validacion, cuip_excepciones } = res.data.data;
      setPersonaActual(prev => prev ? { ...prev, cuip_validacion, cuip_excepciones } : null);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar todo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Completar / Rechazar ──

  const completarCuip = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await completarCuipPersona(personaId);
      setPersonaActual(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al completar CUIP';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const rechazar = useCallback(async (personaId, motivo) => {
    setSubmitting(true);
    try {
      const res = await rechazarEnCuip(personaId, motivo);
      setPersonaActual(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al rechazar';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Aprobar CUIP + Generar cita ──

  const aprobarYGenerarCita = useCallback(async (personaId, datosCita) => {
    setSubmitting(true);
    try {
      const res = await aprobarYGenerarCitaApi(personaId, datosCita);
      const { data: cita, correo_enviado, notificacion_solicitada } = res.data;
      // Recargar la persona con el estado actualizado (fase_cuip = completado)
      const personaActualizada = await obtenerDetalleCuip(personaId);
      const persona = personaActualizada.data.data;
      if (persona.cuip_validacion && typeof persona.cuip_validacion === 'string') {
        persona.cuip_validacion = JSON.parse(persona.cuip_validacion);
      }
      if (persona.cuip_excepciones && typeof persona.cuip_excepciones === 'string') {
        persona.cuip_excepciones = JSON.parse(persona.cuip_excepciones);
      }
      setPersonaActual(persona);
      return {
        cita,
        correoEnviado: correo_enviado,
        notificacionSolicitada: notificacion_solicitada === true,
        persona
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al generar la cita';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Utils ──

  const limpiarPersona = useCallback(() => {
    setPersonaActual(null);
    setError(null);
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    pendientes,
    enProceso,
    personaActual,
    loading,
    submitting,
    error,

    cargarPendientes,
    cargarEnProceso,
    iniciarCuip,
    cargarDetalle,
    validarCampo,
    validarSeccion,
    marcarExcepcion,
    validarTodo,
    completarCuip,
    rechazar,
    aprobarYGenerarCita,
    limpiarPersona,
    limpiarError
  };
};
