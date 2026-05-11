/**
 * useRecibidosC3 — Hook para la sección "Recibidos de C3"
 *
 * Split logic usa accion_disponible (campo por-persona) en lugar de tramite_fase
 * (campo por-tramite), para que cuando se inicia la revisión de una persona en un
 * trámite con múltiples personas, únicamente ESA persona salga de Pendientes.
 *
 * Pendientes: persona todavía necesita acción de C5
 *   - accion_disponible === 'revision_requisitos'  → aprobada, esperando iniciar revisión
 *   - accion_disponible === 'pendiente'             → esperando dictamen C3
 *
 * Historial: acción ya tomada sobre la persona
 *   - accion_disponible === 'persona_en_revision'   → revisión en curso
 *   - accion_disponible === 'persona_en_cuip'       → en validación CUIP
 *   - accion_disponible === 'ver_rechazados'        → rechazada por C3
 *   - tramite_fase in fases terminales              → finalizado / rechazado global
 */
import { useState, useCallback } from 'react';
import { obtenerTodasLasPersonasC5 } from '../../services/api';

const ACCIONES_PENDIENTE = ['revision_requisitos', 'pendiente'];
const ACCIONES_HISTORIAL = ['persona_en_revision', 'persona_en_cuip', 'ver_rechazados'];
const FASES_HISTORIAL_GLOBAL = ['validacion_cuip', 'cita_programada', 'rechazado_c3', 'rechazado', 'rechazado_no_corresponde', 'finalizado'];

function clasificar(data) {
  const pendientes = [];
  const historial  = [];

  for (const p of data) {
    const accion = p.accion_disponible;
    const fase   = p.tramite_fase;

    if (ACCIONES_HISTORIAL.includes(accion) || FASES_HISTORIAL_GLOBAL.includes(fase)) {
      historial.push(p);
    } else if (ACCIONES_PENDIENTE.includes(accion)) {
      pendientes.push(p);
    }
    // Fases previas a C3 (datos_solicitud, validacion_personal, enviado_c3) no se muestran aquí
  }

  return { pendientes, historial };
}

export const useRecibidosC3 = () => {
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const cargarTodo = useCallback(async (options = {}) => {
    const silent = Boolean(options?.silent);

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await obtenerTodasLasPersonasC5({});
      const data = response.data.data || [];
      const { pendientes: p, historial: h } = clasificar(data);
      setPendientes(p);
      setHistorial(h);
    } catch (err) {
      setError(err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  return { pendientes, historial, loading, error, cargarTodo };
};

