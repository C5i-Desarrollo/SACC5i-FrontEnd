/**
 * Hook para gestión del historial de trámites dictaminados por C3
 */
import { useState, useCallback, useEffect } from 'react';
import { obtenerHistorialC3 } from '../../services/api';
import { handleError } from '../../utils/errorHandler';

const INITIAL_FILTERS = {
  busqueda: '',
  dictamen: '',
  fecha_inicio: '',
  fecha_fin: '',
};

export const useHistorialC3 = () => {
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);

  // Estadísticas globales
  const [stats, setStats] = useState({ total: 0, aprobados: 0, rechazados: 0 });

  const cargarHistorial = useCallback(async (filtrosOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = filtrosOverride || filtros;

      // Solo enviar params no vacíos
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanParams[key] = value;
        }
      });

      const response = await obtenerHistorialC3(cleanParams);
      const data = response.data.data || [];
      setTramites(data);

      // Calcular estadísticas con base en filas reales de la tabla (personas), no por trámite.
      const filasTabla = data.flatMap((tramite) =>
        Array.isArray(tramite.personas) ? tramite.personas : []
      );

      const rechazados = filasTabla.reduce((acc, persona) => {
        const faseC3 = String(persona.fase_c3 || '').toLowerCase();
        const motivoRechazo = String(persona.motivo_rechazo || '').toLowerCase();

        const esRechazado = Boolean(persona.rechazado)
          || faseC3 === 'rechazado_c3'
          || faseC3 === 'rechazado'
          || faseC3 === 'rechazado_no_corresponde'
          || motivoRechazo.startsWith('dictamen c3:');

        return esRechazado ? acc + 1 : acc;
      }, 0);

      const total = filasTabla.length;
      const estadisticas = {
        total,
        rechazados,
        aprobados: Math.max(total - rechazados, 0)
      };

      setStats(estadisticas);
    } catch (err) {
      handleError(err, { showNotification: true });
      setError(err);
      setTramites([]);
      setStats({ total: 0, aprobados: 0, rechazados: 0 });
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const aplicarFiltros = useCallback(() => {
    cargarHistorial({ ...filtros });
  }, [filtros, cargarHistorial]);

  const limpiarFiltros = useCallback(() => {
    setFiltros(INITIAL_FILTERS);
    cargarHistorial(INITIAL_FILTERS);
  }, [cargarHistorial]);

  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  return {
    tramites,
    loading,
    error,
    filtros,
    stats,
    cargarHistorial,
    aplicarFiltros,
    limpiarFiltros,
    actualizarFiltro
  };
};
