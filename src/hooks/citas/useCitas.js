import { useState, useCallback, useEffect } from 'react';
import {
  getHistorialCitasApi,
  getEstadisticasCitasApi,
  actualizarEstadoCitaApi,
  getBitacoraCitaApi,
  reprogramarCitaApi,
  cancelarCitaApi,
  finalizarFlujoCitaApi
} from '../../services/api';

const ESTADO_MAP = {
  pendientes: 'programada',
  asistencias: 'completada',
  reagendadas: 'reprogramada',
  rechazadas: 'cancelada',
  vencidas: '__temporal_vencidas__'
};

const STATS_INITIAL_STATE = {
  citas_hoy: 0,
  asistencias: 0,
  inasistencias: 0,
  proximas_citas: 0,
  disponibles_manana: 30
};

export function useCitas({ analistaId = null, enabled = true } = {}) {
  const analistaNumerico = Number(analistaId);
  const hasAnalistaFilter = Number.isFinite(analistaNumerico) && analistaNumerico > 0;

  const [citas, setCitas]         = useState([]);
  const [stats, setStats]         = useState(STATS_INITIAL_STATE);
  const [loading, setLoading]     = useState(false);
  const [filtros, setFiltros]     = useState({
    busqueda: '',
    tab: 'todas',
    fechaVista: 'todas',
    fechaObjetivo: '',
    pagina: 1
  });
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1, pagina: 1 });

  const cargarCitas = useCallback(async () => {
    if (!enabled) {
      setCitas([]);
      setPaginacion({ total: 0, totalPaginas: 1, pagina: 1 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = { pagina: filtros.pagina, limit: 10 };
      if (filtros.busqueda) params.busqueda = filtros.busqueda;
      if (hasAnalistaFilter) params.analista_id = analistaNumerico;
      if (filtros.tab !== 'todas' && filtros.tab !== 'vencidas') {
        params.estado = ESTADO_MAP[filtros.tab] || filtros.tab;
      }

      if (filtros.tab === 'vencidas') {
        // En "Vencidas" solo se listan citas ya vencidas (no las que vencen hoy).
        params.fecha_vista = 'vencidas';
      } else if (filtros.fechaVista && filtros.fechaVista !== 'todas') {
        params.fecha_vista = filtros.fechaVista;
      }

      if (filtros.fechaVista === 'fecha' && filtros.fechaObjetivo) {
        params.fecha_objetivo = filtros.fechaObjetivo;
      }

      const res = await getHistorialCitasApi(params);
      const { citas: lista, paginacion: pag } = res.data.data;
      setCitas(lista || []);
      setPaginacion(pag || { total: 0, totalPaginas: 1, pagina: 1 });
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, filtros, hasAnalistaFilter, analistaNumerico]);

  const cargarStats = useCallback(async () => {
    if (!enabled) {
      setStats(STATS_INITIAL_STATE);
      return;
    }

    try {
      const params = hasAnalistaFilter ? { analista_id: analistaNumerico } : {};
      const res = await getEstadisticasCitasApi(params);
      setStats(res.data.data || {});
    } catch {
      setStats(STATS_INITIAL_STATE);
    }
  }, [enabled, hasAnalistaFilter, analistaNumerico]);

  const actualizarEstado = useCallback(async (citaId, estado) => {
    await actualizarEstadoCitaApi(citaId, estado);
    await Promise.all([cargarCitas(), cargarStats()]);
  }, [cargarCitas, cargarStats]);

  const obtenerBitacora = useCallback(async (citaId) => {
    const res = await getBitacoraCitaApi(citaId);
    return res.data?.data || [];
  }, []);

  const reprogramarCita = useCallback(async (citaId, payload) => {
    await reprogramarCitaApi(citaId, payload);
    await Promise.all([cargarCitas(), cargarStats()]);
  }, [cargarCitas, cargarStats]);

  const cancelarCita = useCallback(async (citaId, motivo) => {
    await cancelarCitaApi(citaId, motivo);
    await Promise.all([cargarCitas(), cargarStats()]);
  }, [cargarCitas, cargarStats]);

  const finalizarFlujo = useCallback(async (citaId, payload) => {
    const res = await finalizarFlujoCitaApi(citaId, payload);
    await Promise.all([cargarCitas(), cargarStats()]);
    return res.data?.data || {};
  }, [cargarCitas, cargarStats]);

  const cambiarTab = useCallback((tab) => {
    setFiltros((prev) => {
      let fechaVista = prev.fechaVista;

      if (tab === 'reagendadas') fechaVista = 'todas';
      if (tab === 'asistencias' && fechaVista === 'proximas') fechaVista = 'todas';
      if (tab === 'vencidas') fechaVista = 'vencidas';
      if (tab !== 'vencidas' && fechaVista === 'vencidas') fechaVista = 'todas';

      return {
        ...prev,
        tab,
        fechaVista,
        fechaObjetivo: fechaVista === 'fecha' ? prev.fechaObjetivo : '',
        pagina: 1
      };
    });
  }, []);

  const cambiarBusqueda = useCallback((busqueda) => {
    setFiltros(prev => ({ ...prev, busqueda, pagina: 1 }));
  }, []);

  const cambiarVistaFecha = useCallback((fechaVista) => {
    setFiltros(prev => ({
      ...prev,
      fechaVista,
      pagina: 1,
      fechaObjetivo: fechaVista === 'fecha' ? prev.fechaObjetivo : ''
    }));
  }, []);

  const cambiarFechaObjetivo = useCallback((fechaObjetivo) => {
    setFiltros(prev => ({ ...prev, fechaObjetivo, fechaVista: 'fecha', pagina: 1 }));
  }, []);

  const cambiarPagina = useCallback((pagina) => {
    setFiltros(prev => ({ ...prev, pagina }));
  }, []);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);
  useEffect(() => { cargarStats(); }, [cargarStats]);

  return {
    citas,
    stats,
    loading,
    filtros,
    paginacion,
    cargarCitas,
    cargarStats,
    actualizarEstado,
    obtenerBitacora,
    reprogramarCita,
    cancelarCita,
    finalizarFlujo,
    cambiarTab,
    cambiarBusqueda,
    cambiarVistaFecha,
    cambiarFechaObjetivo,
    cambiarPagina
  };
}
