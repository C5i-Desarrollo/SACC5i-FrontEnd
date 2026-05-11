import { useState, useCallback } from 'react';
import {
  obtenerPendientesRevision,
  obtenerEnProcesoRevision,
  iniciarRevisionPersona,
  obtenerDetalleRevision,
  guardarAntecedentes,
  validarDocumentoRevision,
  validarTodosDocumentosRevision,
  completarRevisionPersona,
  rechazarEnRevision
} from '../../services/api';

/**
 * Hook para gestión de Revisión de Requisitos
 * Maneja el flujo completo: pendientes → en proceso → antecedentes → documentos → completado
 */
export const useRevision = () => {
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
      const res = await obtenerPendientesRevision(filtros);
      setPendientes(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar pendientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEnProceso = useCallback(async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await obtenerEnProcesoRevision(filtros);
      setEnProceso(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar en proceso');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Iniciar revisión ──

  const iniciarRevision = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await iniciarRevisionPersona(personaId);
      setPersonaActual(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar revisión';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Detalle persona ──

  const cargarDetalle = useCallback(async (personaId) => {
    setLoading(true);
    try {
      const res = await obtenerDetalleRevision(personaId);
      const persona = res.data.data;
      // Parsear documentos si vienen como string
      if (persona.documentos_validados && typeof persona.documentos_validados === 'string') {
        persona.documentos_validados = JSON.parse(persona.documentos_validados);
      }
      setPersonaActual(persona);
      return persona;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar detalle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Antecedentes ──

  const registrarAntecedentes = useCallback(async (personaId, datos) => {
    setSubmitting(true);
    try {
      await guardarAntecedentes(personaId, datos);
      // Refetch fresh data after DB transaction commit
      const res = await obtenerDetalleRevision(personaId);
      const persona = res.data.data;
      if (persona.documentos_validados && typeof persona.documentos_validados === 'string') {
        persona.documentos_validados = JSON.parse(persona.documentos_validados);
      }
      setPersonaActual(persona);
      return persona;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar antecedentes';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Documentos ──

  const validarDocumento = useCallback(async (personaId, clave, validado, observacion = null) => {
    try {
      const res = await validarDocumentoRevision(personaId, { clave, validado, observacion });
      const documentos = res.data.data;
      // Actualizar documentos en la persona actual
      setPersonaActual(prev => prev ? { ...prev, documentos_validados: documentos } : null);
      return documentos;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar documento';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const validarTodos = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await validarTodosDocumentosRevision(personaId);
      const documentos = res.data.data;
      setPersonaActual(prev => prev ? { ...prev, documentos_validados: documentos } : null);
      return documentos;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al validar documentos';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ── Completar / Rechazar ──

  const completarRevision = useCallback(async (personaId) => {
    setSubmitting(true);
    try {
      const res = await completarRevisionPersona(personaId);
      setPersonaActual(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al completar revisión';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const rechazar = useCallback(async (personaId, motivo) => {
    setSubmitting(true);
    try {
      const res = await rechazarEnRevision(personaId, motivo);
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

  // ── Utils ──

  const limpiarPersona = useCallback(() => {
    setPersonaActual(null);
    setError(null);
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    // Estado
    pendientes,
    enProceso,
    personaActual,
    loading,
    submitting,
    error,

    // Acciones
    cargarPendientes,
    cargarEnProceso,
    iniciarRevision,
    cargarDetalle,
    registrarAntecedentes,
    validarDocumento,
    validarTodos,
    completarRevision,
    rechazar,
    limpiarPersona,
    limpiarError
  };
};
