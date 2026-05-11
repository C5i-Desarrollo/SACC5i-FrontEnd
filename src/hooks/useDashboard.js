import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../constants/roles';
import {
  getEstadisticasAdmin,
  getMisSolicitudes,
  getMisSolicitudesDependencia,
  obtenerEnProcesoRevision,
  obtenerEnProcesoCuip,
  obtenerPersonasPendientesC3,
  obtenerHistorialC3,
  getPanelDireccionApi,
  getCcpListApi,
  getHistorialRegistrosCcpApi,
  getCcpSiguienteNumeroApi
} from '../services/api';

const FASES_EN_PROCESO = [
  'datos_solicitud',
  'validacion_personal',
  'enviado_c3',
  'dictaminado_c3',
  'revision_propuesta_c3',
  'revision_requisitos',
  'validacion_cuip',
  'cita_programada',
  'evaluacion_controles'
];

const FASES_RECHAZADOS = ['rechazado_c3', 'rechazado_no_corresponde', 'rechazado'];
const FASES_BORRADOR = ['datos_solicitud', 'validacion_personal'];

const ROLE_TIPS = {
  [ROLES.SUPER_ADMIN]: [
    'Revisa usuarios sin cambio de contraseña para reducir riesgo operativo.',
    'Valida picos por región para anticipar saturación de trámites.',
    'Si hay alta carga en CCP, prioriza revisión de formato y exportación diaria.'
  ],
  [ROLES.ADMIN]: [
    'Mantén actualizados roles y permisos para evitar bloqueos de operación.',
    'Verifica consistencia de trámites por región en cortes semanales.',
    'Monitorea usuarios activos para detectar cuentas sin uso prolongado.'
  ],
  [ROLES.ANALISTA]: [
    'Prioriza expedientes en revisión de requisitos antes de cierre diario.',
    'Cada envío oportuno a C3 reduce cuellos de botella en validación.',
    'Mantén observaciones claras para agilizar correcciones y reingresos.'
  ],
  [ROLES.VALIDADOR_C3]: [
    'Dictaminar pendientes primero mejora el tiempo de respuesta institucional.',
    'Registra observaciones concretas para facilitar seguimiento de C5.',
    'Revisa historial por resultado para detectar patrones de rechazo recurrente.'
  ],
  [ROLES.OPERADOR_CCP]: [
    'Conserva consistencia de formato en oficios para reducir retrabajo.',
    'Archiva oportunamente registros eliminados para mantener trazabilidad.',
    'Aprovecha exportación de tabla para respaldo de cierre operativo diario.'
  ],
  [ROLES.DEPENDENCIA]: [
    'Envía expedientes con datos completos para acelerar dictamen.',
    'Da seguimiento a trámites activos antes de registrar nuevos.',
    'Consulta rechazos para corregir documentación en el siguiente envío.'
  ],
  [ROLES.DIRECCION]: [
    'Supervisa balance entre en proceso y finalizados para medir desempeño.',
    'Detecta analistas con carga alta para ajustar distribución.',
    'Usa métricas de rechazo para definir acciones preventivas.'
  ]
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const formatStamp = () =>
  new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const isRejectedPhase = (fase) => FASES_RECHAZADOS.includes(String(fase || '').toLowerCase());

const isProcessingPhase = (fase) => FASES_EN_PROCESO.includes(String(fase || '').toLowerCase());

const isDraftPhase = (fase) => FASES_BORRADOR.includes(String(fase || '').toLowerCase());

const rotateTips = (tips = []) => {
  if (tips.length <= 1) return tips;
  const offset = new Date().getDate() % tips.length;
  return [...tips.slice(offset), ...tips.slice(0, offset)];
};

const personaC3EsRechazada = (persona = {}) => {
  const fase = String(persona.fase_c3 || '').toLowerCase();
  return Boolean(persona.rechazado) || ['rechazado_c3', 'rechazado', 'rechazado_no_corresponde'].includes(fase);
};

const personaC3EsAprobada = (persona = {}) => {
  const fase = String(persona.fase_c3 || '').toLowerCase();
  return Boolean(persona.validado) || fase === 'validado_c3';
};

/**
 * useDashboard — Hook principal del Dashboard por rol.
 * Orquesta estadísticas reales por perfil y provee metadatos visuales.
 */
export const useDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tips, setTips] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!user) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      let computedStats = [];
      let computedNotices = [];
      const roleLabel = ROLE_LABELS[user.rol] || 'Usuario';

      if (user.rol === ROLES.SUPER_ADMIN || user.rol === ROLES.ADMIN) {
        const statsRes = await getEstadisticasAdmin();
        const adminStats = statsRes?.data?.data || {};
        const usuariosPorRol = asArray(adminStats.usuarios_por_rol);

        const totalActivos = usuariosPorRol.reduce((acc, item) => acc + toNumber(item.activos), 0);
        const totalUsuarios = usuariosPorRol.reduce((acc, item) => acc + toNumber(item.cantidad), 0);
        const totalInactivos = Math.max(0, totalUsuarios - totalActivos);
        const usuariosSinPassword = toNumber(adminStats.usuarios_sin_cambiar_password);

        let totalRegistrosCcp = 0;
        try {
          const ccpRes = await getCcpListApi({ pagina: 1, limit: 1 });
          totalRegistrosCcp = toNumber(ccpRes?.data?.total);
        } catch (_) {
          totalRegistrosCcp = 0;
        }

        computedStats = [
          { key: 'users_active', label: 'Usuarios activos', value: totalActivos, icon: 'bxs-user-check', color: 'guinda', description: 'Cuentas con acceso operativo', section: 'Usuarios' },
          { key: 'users_total', label: 'Usuarios registrados', value: totalUsuarios, icon: 'bxs-group', color: 'dorado', description: 'Padrón completo de cuentas', section: 'Usuarios' },
          { key: 'users_inactive', label: 'Usuarios inactivos', value: totalInactivos, icon: 'bx-user-x', color: 'pizarra', description: 'Cuentas deshabilitadas actualmente', section: 'Usuarios' },
          { key: 'users_password_pending', label: 'Sin actualizar contraseña', value: usuariosSinPassword, icon: 'bx-key', color: 'gris', description: 'Requieren actualización de credenciales', section: 'Usuarios' },
          { key: 'ccp_total', label: 'Registros CCP vigentes', value: totalRegistrosCcp, icon: 'bx-file', color: 'dorado', description: 'Control documental de copias', section: 'CopiasConocimiento' }
        ];

        if (usuariosSinPassword > 0) {
          computedNotices.push(`Hay ${usuariosSinPassword} usuario(s) activo(s) con contraseña temporal o sin cambio.`);
        }
        setSummary({
          title: 'Bienvenido',
          subtitle: 'Monitoreo integral de operación, usuarios y flujo documental del sistema.',
          roleLabel
        });
      } else if (user.rol === ROLES.ANALISTA) {
        const [solRes, enProcesoRevisionRes, enProcesoCuipRes] = await Promise.all([
          getMisSolicitudes(),
          obtenerEnProcesoRevision(),
          obtenerEnProcesoCuip()
        ]);

        const solicitudes = asArray(solRes?.data?.data);
        const enProcesoRevision = asArray(enProcesoRevisionRes?.data?.data);
        const enProcesoCuip = asArray(enProcesoCuipRes?.data?.data);

        const idsEnProceso = new Set(
          [...enProcesoRevision, ...enProcesoCuip]
            .map((item) => Number(item?.id || 0))
            .filter((id) => Number.isFinite(id) && id > 0)
        );

        const solicitudesActuales = solicitudes.filter((item) => {
          const personasRegistradas = toNumber(item?.total_personas) > 0;
          return !isDraftPhase(item?.fase_actual) && personasRegistradas;
        });
        const tramitesAtendidos = solicitudesActuales.length;
        const enProceso = idsEnProceso.size;
        const finalizadas = solicitudes.filter((item) => String(item.fase_actual || '').toLowerCase() === 'finalizado').length;
        const rechazadas = solicitudes.filter((item) => isRejectedPhase(item.fase_actual)).length;

        computedStats = [
          { key: 'sol_total', label: 'Tramites atendidos', value: tramitesAtendidos, icon: 'bxs-file-plus', color: 'guinda', description: 'Solicitudes con personas registradas', section: 'Alta' },
          { key: 'sol_process', label: 'En proceso', value: enProceso, icon: 'bx-time-five', color: 'dorado', description: 'Expedientes activos en revisión o CUIP', section: 'EnProceso' },
          { key: 'sol_done', label: 'Finalizadas', value: finalizadas, icon: 'bxs-check-circle', color: 'pizarra', description: 'Trámites concluidos', section: 'Finalizados' },
          { key: 'sol_rejected', label: 'Rechazadas', value: rechazadas, icon: 'bxs-x-circle', color: 'gris', description: 'Requieren atención o corrección', section: 'RechazosC3' }
        ];

        if (enProceso > finalizadas) {
          computedNotices.push('Prioriza expedientes de mayor antigüedad.');
        }
        if (rechazadas > 0) {
          computedNotices.push(`Hay ${rechazadas} trámite(s) rechazado(s) que conviene revisar hoy.`);
        }

        setSummary({
          title: 'Bienvenido',
          subtitle: 'Seguimiento de solicitudes, avance por fase y estado de validación diaria.',
          roleLabel
        });
      } else if (user.rol === ROLES.VALIDADOR_C3) {
        const [pendRes, histRes] = await Promise.all([
          obtenerPersonasPendientesC3(),
          obtenerHistorialC3()
        ]);

        const pendientes = asArray(pendRes?.data?.data);
        const historial = asArray(histRes?.data?.data);
        const personasHistorial = historial.flatMap((tramite) => asArray(tramite.personas));

        const aprobadas = personasHistorial.filter((persona) => personaC3EsAprobada(persona)).length;
        const rechazadas = personasHistorial.filter((persona) => personaC3EsRechazada(persona)).length;

        computedStats = [
          { key: 'c3_pending', label: 'Pendientes por dictamen', value: pendientes.length, icon: 'bxs-user-check', color: 'guinda', description: 'Personas listas para evaluar', section: 'PersonasPendientesC3' },
          { key: 'c3_processed', label: 'Dictámenes en historial', value: personasHistorial.length, icon: 'bx-history', color: 'dorado', description: 'Total de personas evaluadas', section: 'HistorialC3' },
          { key: 'c3_ok', label: 'Aprobatorios C3', value: aprobadas, icon: 'bxs-check-shield', color: 'pizarra', description: 'Dictámenes positivos emitidos', section: 'HistorialC3' },
          { key: 'c3_rej', label: 'No procedentes', value: rechazadas, icon: 'bxs-x-circle', color: 'gris', description: 'Dictámenes rechazados o no aptos', section: 'HistorialC3' }
        ];

        if (pendientes.length > 0) {
          computedNotices.push(`Existen ${pendientes.length} persona(s) pendientes para dictamen inmediato.`);
        }

        setSummary({
          title: 'Centro de Dictamen C3',
          subtitle: 'Control de pendientes, historial de resultados y consistencia de resolución técnica.',
          roleLabel
        });
      } else if (user.rol === ROLES.OPERADOR_CCP) {
        const anioActual = new Date().getFullYear();
        const [ccpRes, historialRes, consecutivoRes] = await Promise.all([
          getCcpListApi({ pagina: 1, limit: 1 }),
          getHistorialRegistrosCcpApi({ pagina: 1, limit: 1 }),
          getCcpSiguienteNumeroApi(anioActual)
        ]);

        const activos = toNumber(ccpRes?.data?.total);
        const archivados = toNumber(historialRes?.data?.total);
        const siguiente = toNumber(consecutivoRes?.data?.siguiente);
        const emitidosAnio = Math.max(0, siguiente - 1);
        const gestionados = activos + archivados;

        computedStats = [
          { key: 'ccp_archive', label: 'Registros archivados', value: archivados, icon: 'bx-archive-in', color: 'dorado', description: 'Historial persistente consolidado', section: 'HistorialOperadorCCP' },
          { key: 'ccp_managed', label: 'Registros gestionados', value: gestionados, icon: 'bx-folder-open', color: 'pizarra', description: 'Total entre vigentes y archivados', section: 'CopiasConocimiento' },
          { key: 'ccp_pending', label: 'Pendientes por depurar', value: activos, icon: 'bx-task', color: 'gris', description: 'Registros vigentes por gestionar', section: 'CopiasConocimiento' }
        ];

        if (activos > 0) {
          computedNotices.push('Mantén respaldo Excel/ZIP al cierre para control documental institucional.');
        }

        setSummary({
          title: 'Bienvenido',
          subtitle: 'Seguimiento de oficios, trazabilidad histórica y continuidad operativa del módulo.',
          roleLabel
        });
      } else if (user.rol === ROLES.DEPENDENCIA) {
        const depRes = await getMisSolicitudesDependencia();
        const solicitudes = asArray(depRes?.data?.data);

        const total = solicitudes.length;
        const finalizados = solicitudes.filter((item) => String(item.fase_actual || '').toLowerCase() === 'finalizado').length;
        const rechazados = solicitudes.filter((item) => isRejectedPhase(item.fase_actual)).length;
        const activos = solicitudes.filter((item) => !isRejectedPhase(item.fase_actual) && String(item.fase_actual || '').toLowerCase() !== 'finalizado').length;
        const totalPersonas = solicitudes.reduce((acc, item) => acc + toNumber(item.total_personas), 0);

        computedStats = [
          { key: 'dep_total', label: 'Trámites de la dependencia', value: total, icon: 'bxs-folder-open', color: 'guinda', description: 'Solicitudes creadas por el usuario', section: 'TramitesDependencia' },
          { key: 'dep_active', label: 'Activos', value: activos, icon: 'bx-loader-circle', color: 'dorado', description: 'Trámites en flujo operativo', section: 'TramitesDependencia' },
          { key: 'dep_done', label: 'Finalizados', value: finalizados, icon: 'bxs-badge-check', color: 'pizarra', description: 'Solicitudes ya concluidas', section: 'TramitesDependencia' },
          { key: 'dep_rej', label: 'Rechazados', value: rechazados, icon: 'bxs-x-circle', color: 'gris', description: 'Expedientes con rechazo', section: 'TramitesDependencia' },
          { key: 'dep_people', label: 'Personas registradas', value: totalPersonas, icon: 'bxs-group', color: 'guinda', description: 'Personas asociadas a trámites', section: 'TramitesDependencia' }
        ];

        if (activos > 0) {
          computedNotices.push('Hay trámites activos; revisa observaciones para acelerar avance al siguiente paso.');
        }

        setSummary({
          title: 'Panel de Seguimiento de Dependencia',
          subtitle: 'Control de solicitudes, estatus operativo y avance de expedientes enviados.',
          roleLabel
        });
      } else if (user.rol === ROLES.DIRECCION) {
        const panelRes = await getPanelDireccionApi();
        const resumen = panelRes?.data?.data?.resumen_general || {};

        const totalTramites = toNumber(resumen.total_tramites);
        const enProceso = toNumber(resumen.tramites_en_proceso);
        const finalizados = toNumber(resumen.tramites_finalizados);
        const rechazados = toNumber(resumen.tramites_rechazados);
        const pendientesPersona = toNumber(resumen.personas_pendientes);
        const analistasActivos = toNumber(resumen.analistas_activos);

        computedStats = [
          { key: 'dir_total', label: 'Trámites totales', value: totalTramites, icon: 'bxs-briefcase', color: 'guinda', description: 'Visión global de carga institucional', section: 'EnProceso' },
          { key: 'dir_process', label: 'En proceso', value: enProceso, icon: 'bx-time-five', color: 'dorado', description: 'Flujo operativo vigente', section: 'EnProceso' },
          { key: 'dir_done', label: 'Finalizados', value: finalizados, icon: 'bxs-badge-check', color: 'pizarra', description: 'Trámites concluidos', section: 'Finalizados' },
          { key: 'dir_rejected', label: 'Rechazados', value: rechazados, icon: 'bxs-message-square-x', color: 'gris', description: 'Casos que requieren intervención', section: 'RechazosC3' },
          { key: 'dir_pending_people', label: 'Personas pendientes', value: pendientesPersona, icon: 'bx-user-voice', color: 'guinda', description: 'Expedientes personales sin cierre', section: 'EnProceso' },
          { key: 'dir_analistas', label: 'Analistas activos', value: analistasActivos, icon: 'bx-user-pin', color: 'dorado', description: 'Analistas monitoreados por dirección', section: 'EnProceso' }
        ];

        if (enProceso > finalizados) {
          computedNotices.push('La carga en proceso supera finalizados; considera balanceo entre analistas.');
        }

        setSummary({
          title: 'Vigilancia Estratégica de Operación',
          subtitle: 'Lectura institucional de desempeño, estatus y capacidad de respuesta por equipo.',
          roleLabel
        });
      } else {
        computedStats = [];
        setSummary({
          title: 'Panel General del Sistema',
          subtitle: 'Monitoreo básico de actividad según permisos del usuario.',
          roleLabel
        });
      }

      setStats(computedStats);
      setNotices(
        computedNotices.length > 0
          ? computedNotices
          : ['Operación estable. No se detectan alertas prioritarias en este momento.']
      );
      setTips(rotateTips(ROLE_TIPS[user.rol] || ROLE_TIPS[ROLES.ANALISTA]));
      setLastUpdated(formatStamp());
    } catch (err) {
      console.error('[useDashboard] Error:', err);
      setError('No se pudieron cargar las estadísticas del dashboard.');
      setStats([]);
      setNotices(['No fue posible sincronizar datos. Intenta actualizar nuevamente.']);
      setTips(rotateTips(ROLE_TIPS[user?.rol] || []));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let mounted = true;

    const bootstrap = async () => {
      if (!mounted) return;
      await loadDashboard();
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [user, loadDashboard]);

  useEffect(() => {
    if (!user) return undefined;

    const timerId = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 90000);

    return () => window.clearInterval(timerId);
  }, [user, loadDashboard]);

  return {
    stats,
    summary,
    tips,
    notices,
    loading,
    error,
    lastUpdated,
    refreshDashboard: loadDashboard
  };
};
