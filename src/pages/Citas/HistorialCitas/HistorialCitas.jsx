/**
 * HistorialCitas — Gestión de citas biométricas programadas
 * Sección: "Citas" accesible desde el sidebar
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { MdEventNote } from 'react-icons/md';
import { useCitas } from '../../../hooks/citas/useCitas';
import { useNotification } from '../../../context/NotificationContext';
import ReprogramarCitaModal from './components/ReprogramarCitaModal';
import BitacoraCitaModal from './components/BitacoraCitaModal';
import ContinuarProcesoCita from './components/ContinuarProcesoCita';
import './styles/HistorialCitas.css';

/* ── Helpers ──────────────────────────────────────────────────── */

function formatFecha(isoString) {
  if (!isoString) return '—';
  const fechaBase = String(isoString).includes('T') ? isoString : `${isoString}T12:00:00`;
  const d = new Date(fechaBase);
  if (Number.isNaN(d.getTime())) return String(isoString).slice(0, 10);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
  });
}

function formatHora(horaString) {
  if (!horaString) return '—';
  const [hh = '00', mm = '00'] = String(horaString).split(':');
  let h = Number(hh);
  const m = String(mm).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

const ESTADOS_CONFIG = {
  programada:   { label: 'PROGRAMADA',   cls: 'hc-badge-prog' },
  completada:   { label: 'ASISTIÓ',      cls: 'hc-badge-asistio' },
  cancelada:    { label: 'NO ASISTIÓ',   cls: 'hc-badge-no' },
  reprogramada: { label: 'REAGENDADA',   cls: 'hc-badge-rep' }
};

const ESTADOS_FILTRO = [
  { key: 'todas',       label: 'Mostrar todo' },
  { key: 'pendientes',  label: 'Programadas' },
  { key: 'asistencias', label: 'Asistencias' },
  { key: 'reagendadas', label: 'Reagendadas' },
  { key: 'vencidas',    label: 'Vencidas' },
  { key: 'rechazadas',  label: 'Rechazadas' }
];

const VISTAS_FECHA_BASE = [
  { key: 'todas', label: 'Todas las fechas' },
  { key: 'hoy', label: 'Hoy' },
  { key: 'proximas', label: 'Próximas' },
  { key: 'fecha', label: 'Por día' }
];

/* ── Main component ───────────────────────────────────────────── */

export default function HistorialCitas({
  setPageTitle,
  analistaId = null,
  readOnly = false,
  requireAnalista = false
}) {
  const { showNotification } = useNotification();
  const {
    citas,
    stats,
    loading,
    filtros,
    paginacion,
    obtenerBitacora,
    reprogramarCita,
    cancelarCita,
    finalizarFlujo,
    cambiarTab,
    cambiarBusqueda,
    cambiarVistaFecha,
    cambiarFechaObjetivo,
    cambiarPagina
  } = useCitas({
    analistaId,
    enabled: !requireAnalista || Boolean(Number(analistaId))
  });

  const [modalReagenda, setModalReagenda] = useState(null);
  const [modeReagenda, setModeReagenda] = useState('reagendar');
  const [bitacoraCita, setBitacoraCita] = useState(null);
  const [bitacoraEventos, setBitacoraEventos] = useState([]);
  const [citaProceso, setCitaProceso] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [busquedaLocal, setBusquedaLocal] = useState('');

  const vistaFechaOptions = useMemo(() => {
    if (filtros.tab === 'reagendadas') {
      return [{ key: 'todas', label: 'Todas las fechas' }];
    }

    if (filtros.tab === 'asistencias') {
      return VISTAS_FECHA_BASE.filter((v) => v.key !== 'proximas');
    }

    if (filtros.tab === 'vencidas') {
      return [
        { key: 'vencidas', label: 'Vencidas' }
      ];
    }

    return VISTAS_FECHA_BASE;
  }, [filtros.tab]);

  useEffect(() => {
    if (!setPageTitle) return undefined;

    setPageTitle({
      titulo: 'Citas',
      subtitulo: 'Gestión y seguimiento de citas biométricas',
      icon: <MdEventNote className="nav-icon-highlight" />
    });

    return () => setPageTitle(null);
  }, [setPageTitle]);

  useEffect(() => {
    const selectedEsValido = vistaFechaOptions.some((v) => v.key === filtros.fechaVista);
    if (!selectedEsValido) {
      cambiarVistaFecha(vistaFechaOptions[0]?.key || 'todas');
    }
  }, [vistaFechaOptions, filtros.fechaVista, cambiarVistaFecha]);

  const handleAbrirBitacora = useCallback(async (cita) => {
    try {
      const eventos = await obtenerBitacora(cita.id);
      setBitacoraEventos(eventos);
      setBitacoraCita(cita);
    } catch (err) {
      showNotification(err.message || 'No se pudo cargar la bitácora', 'error');
    }
  }, [obtenerBitacora, showNotification]);

  const handleReprogramar = useCallback(async (payload) => {
    if (!modalReagenda) return;
    setUpdatingId(modalReagenda.id);
    try {
      await reprogramarCita(modalReagenda.id, payload);
      setModalReagenda(null);
      showNotification('Cita reprogramada correctamente', 'success');
    } catch (err) {
      showNotification(err.message || 'No se pudo reprogramar la cita', 'error');
    } finally {
      setUpdatingId(null);
    }
  }, [modalReagenda, reprogramarCita, showNotification]);

  const handleCancelarDefinitivo = useCallback(async (motivo) => {
    if (!modalReagenda) return;
    setUpdatingId(modalReagenda.id);
    try {
      await cancelarCita(modalReagenda.id, motivo || 'Cancelación manual de cita');
      setModalReagenda(null);
      showNotification('Cita cancelada y enviada a rechazados', 'success');
    } catch (err) {
      showNotification(err.message || 'No se pudo cancelar la cita', 'error');
    } finally {
      setUpdatingId(null);
    }
  }, [cancelarCita, modalReagenda, showNotification]);

  const handleFinalizarProceso = useCallback(async (payload) => {
    if (!citaProceso) return;
    setUpdatingId(citaProceso.id);
    try {
      const result = await finalizarFlujo(citaProceso.id, payload);
      setCitaProceso(null);

      if (result?.rechazado) {
        showNotification('Trámite rechazado y enviado a rechazados', 'warning');
      } else if (result?.finalizado) {
        showNotification('Trámite finalizado con éxito', 'success');
      } else {
        showNotification('Flujo de cita actualizado correctamente', 'success');
      }
    } catch (err) {
      showNotification(err.message || 'No se pudo finalizar el flujo', 'error');
    } finally {
      setUpdatingId(null);
    }
  }, [citaProceso, finalizarFlujo, showNotification]);

  const handleCancelarPorInasistencia = useCallback(async () => {
    if (!citaProceso) return;
    setUpdatingId(citaProceso.id);
    try {
      await cancelarCita(citaProceso.id, 'No asistió a la cita biométrica');
      setCitaProceso(null);
      showNotification('Cita cancelada y persona enviada a rechazados', 'success');
    } catch (err) {
      showNotification(err.message || 'No se pudo cancelar la cita', 'error');
    } finally {
      setUpdatingId(null);
    }
  }, [cancelarCita, citaProceso, showNotification]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cambiarBusqueda(busquedaLocal.trim());
    }, 280);

    return () => clearTimeout(timer);
  }, [busquedaLocal, cambiarBusqueda]);

  /* ─ Render ─────────────────────────────────────────────────── */
  return (
    <main className="hc-container">
      <div className="hc-surface">

      {/* ── Stats cards ─────────────────────────────────────── */}
      <div className="hc-stats-grid">
        <div className="hc-stat-card hc-stat-hoy">
          <div className="hc-stat-icon"><i className="bx bx-calendar"></i></div>
          <div className="hc-stat-body">
            <span className="hc-stat-num">{stats.citas_hoy ?? 0}</span>
            <span className="hc-stat-lbl">CITAS DE HOY</span>
          </div>
        </div>

        <div className="hc-stat-card hc-stat-asistencias">
          <div className="hc-stat-icon"><i className="bx bx-check-circle"></i></div>
          <div className="hc-stat-body">
            <span className="hc-stat-num">{stats.asistencias ?? 0}</span>
            <span className="hc-stat-lbl">ASISTENCIAS CONFIRMADAS</span>
          </div>
        </div>

        <div className="hc-stat-card hc-stat-inasistencias">
          <div className="hc-stat-icon"><i className="bx bx-x-circle"></i></div>
          <div className="hc-stat-body">
            <span className="hc-stat-num">{stats.inasistencias ?? 0}</span>
            <span className="hc-stat-lbl">INASISTENCIAS</span>
          </div>
        </div>

        <div className="hc-stat-card hc-stat-disponibles">
          <div className="hc-stat-icon"><i className="bx bx-calendar-plus"></i></div>
          <div className="hc-stat-body">
            <span className="hc-stat-num">{stats.proximas_citas ?? 0}</span>
            <span className="hc-stat-lbl">PRÓXIMAS CITAS</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: búsqueda ─────────────────────────────────── */}
      <div className="hc-toolbar">
        <div className="hc-search">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Buscar por nombre, fecha..."
            value={busquedaLocal}
            onChange={e => setBusquedaLocal(e.target.value)}
          />
        </div>
      </div>

      <div className="hc-filter-panel">
        <div className="hc-filter-title">
          <i className="bx bx-filter-alt"></i>
          <span>Filtrar por agenda</span>
        </div>

        <div className="hc-advanced-filters-row">
          <div className="hc-advanced-filter-field">
            <label htmlFor="estadoFiltro">Estado del proceso</label>
            <select
              id="estadoFiltro"
              value={filtros.tab}
              onChange={(e) => cambiarTab(e.target.value)}
            >
              {ESTADOS_FILTRO.map((estado) => (
                <option key={estado.key} value={estado.key}>{estado.label}</option>
              ))}
            </select>
          </div>

          <div className="hc-date-chips">
            {vistaFechaOptions.map((v) => (
              <button
                key={v.key}
                type="button"
                className={`hc-chip${filtros.fechaVista === v.key ? ' hc-chip-active' : ''}`}
                onClick={() => cambiarVistaFecha(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {filtros.fechaVista === 'fecha' && (
          <div className="hc-date-picker-inline">
            <label htmlFor="fechaObjetivo">Selecciona una fecha específica</label>
            <input
              id="fechaObjetivo"
              type="date"
              value={filtros.fechaObjetivo || ''}
              onChange={(e) => cambiarFechaObjetivo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="hc-table-wrap">
        {loading ? (
          <div className="hc-loading">
            <i className="bx bx-loader-alt bx-spin"></i> Cargando citas...
          </div>
        ) : citas.length === 0 ? (
          <div className="hc-empty">
            <i className="bx bx-calendar-x"></i>
            <p>No hay citas registradas</p>
          </div>
        ) : (
          <table className="hc-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Fecha programada</th>
                <th>Hora</th>
                <th>Estatus del proceso</th>
                <th>Documentación</th>
                <th>Bitácora</th>
              </tr>
            </thead>
            <tbody>
              {citas.map(cita => {
                const est = ESTADOS_CONFIG[cita.estado] || ESTADOS_CONFIG.programada;
                const isUpdating = updatingId === cita.id;
                return (
                  <tr key={cita.id}>
                    <td>
                      <span className="hc-nombre">{cita.nombre_completo}</span>
                      {cita.puesto_nombre && (
                        <span className="hc-subtxt">{cita.puesto_nombre}</span>
                      )}
                    </td>
                    <td>
                      <span className="hc-fecha-cell">
                        <i className="bx bx-calendar"></i> {formatFecha(cita.fecha_cita_local || cita.fecha_cita)}
                      </span>
                    </td>
                    <td>
                      <span className="hc-hora-cell">
                        <i className="bx bx-time-five"></i> {formatHora(cita.hora_cita_local)}
                      </span>
                    </td>
                    <td>
                      <span className={`hc-badge ${est.cls}`}>{est.label}</span>
                    </td>
                    <td>
                      <AccionCita
                        cita={cita}
                        readOnly={readOnly}
                        isUpdating={isUpdating}
                        onAbrirReagenda={(modo) => {
                          setModeReagenda(modo);
                          setModalReagenda(cita);
                        }}
                        onContinuarProceso={() => setCitaProceso(cita)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="hc-btn hc-btn-bitacora"
                        onClick={() => handleAbrirBitacora(cita)}
                      >
                        <i className="bx bx-history"></i> VER BITÁCORA
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginación ──────────────────────────────────────── */}
      {paginacion.totalPaginas > 1 && (
        <Paginacion
          pagina={filtros.pagina}
          totalPaginas={paginacion.totalPaginas}
          onCambiar={cambiarPagina}
        />
      )}

      {modalReagenda && (
        <ReprogramarCitaModal
          cita={modalReagenda}
          mode={modeReagenda}
          onClose={() => setModalReagenda(null)}
          onReprogramar={handleReprogramar}
          onCancelarDefinitivo={handleCancelarDefinitivo}
          loading={updatingId === modalReagenda.id}
        />
      )}

      {bitacoraCita && (
        <BitacoraCitaModal
          cita={bitacoraCita}
          eventos={bitacoraEventos}
          onClose={() => {
            setBitacoraCita(null);
            setBitacoraEventos([]);
          }}
        />
      )}

      {citaProceso && (
        <ContinuarProcesoCita
          cita={citaProceso}
          onClose={() => setCitaProceso(null)}
          onFinalizar={handleFinalizarProceso}
          onCancelarNoAsistio={handleCancelarPorInasistencia}
          onAbrirReagenda={() => {
            setModeReagenda('reagendar');
            setModalReagenda(citaProceso);
            setCitaProceso(null);
          }}
          loading={updatingId === citaProceso.id}
        />
      )}
      </div>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function AccionCita({ cita, readOnly, isUpdating, onAbrirReagenda, onContinuarProceso }) {
  const esMismoDia = Number(cita?.es_dia_cita) === 1;

  if (readOnly) {
    return (
      <button className="hc-btn hc-btn-gray" disabled title="Modo solo lectura para dirección">
        <i className="bx bx-show"></i> SOLO LECTURA
      </button>
    );
  }

  if (isUpdating) {
    return (
      <button className="hc-btn hc-btn-gray" disabled>
        <i className="bx bx-loader-alt bx-spin"></i> Procesando...
      </button>
    );
  }

  switch (cita.estado) {
    case 'programada':
      if (esMismoDia) {
        return (
          <button
            className="hc-btn hc-btn-guinda"
            onClick={onContinuarProceso}
            title="Marcar asistencia y continuar flujo"
          >
            <i className="bx bx-play-circle"></i> CONTINUAR PROCESO
          </button>
        );
      }

      return (
        <button
          className="hc-btn hc-btn-gray"
          onClick={() => onAbrirReagenda('cancelar')}
          title="Cancelar cita actual para reagendar"
        >
          CANCELAR / REAGENDAR
        </button>
      );

    case 'cancelada':
      return (
        <button
          className="hc-btn hc-btn-reagendar"
          onClick={() => onAbrirReagenda('reagendar')}
        >
          <i className="bx bx-refresh"></i> REAGENDAR CITA
        </button>
      );

    case 'reprogramada':
      return (
        <button
          className="hc-btn hc-btn-guinda"
          onClick={() => onAbrirReagenda('reagendar')}
        >
          <i className="bx bx-calendar-check"></i> CONFIRMAR NUEVA FECHA
        </button>
      );

    case 'completada':
      return (
        <button className="hc-btn hc-btn-guinda" onClick={onContinuarProceso}>
          <i className="bx bx-edit-alt"></i> CONTINUAR PROCESO
        </button>
      );

    default:
      return null;
  }
}

function Paginacion({ pagina, totalPaginas, onCambiar }) {
  const pages = [];
  const delta = 2;
  const left = Math.max(1, pagina - delta);
  const right = Math.min(totalPaginas, pagina + delta);

  for (let i = left; i <= right; i++) pages.push(i);
  if (left > 2) pages.unshift('...');
  if (left > 1) pages.unshift(1);
  if (right < totalPaginas - 1) pages.push('...');
  if (right < totalPaginas) pages.push(totalPaginas);

  return (
    <div className="hc-pagination">
      <button
        className="hc-pag-btn"
        disabled={pagina === 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        ← Anterior
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="hc-pag-dots">...</span>
        ) : (
          <button
            key={p}
            className={`hc-pag-btn${p === pagina ? ' hc-pag-active' : ''}`}
            onClick={() => onCambiar(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="hc-pag-btn"
        disabled={pagina === totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
