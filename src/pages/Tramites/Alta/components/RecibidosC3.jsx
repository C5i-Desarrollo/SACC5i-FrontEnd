import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../../../context/NotificationContext';
import { useRecibidosC3 } from '../../../../hooks/historial/useRecibidosC3';
import { iniciarRevisionPersona } from '../../../../services/api';
import '../styles/RecibidosC3.css';

const POR_PAGINA = 10;
const VENTANA_NUEVO_MINUTOS = 10;
const MILISEGUNDOS_MINUTO = 60 * 1000;
const LIVE_REFRESH_INTERVAL_MS = Math.max(
  2000,
  Number(import.meta.env.VITE_C3_LIVE_REFRESH_MS) || 2000
);

const FASE_HISTORIAL_LABEL = {
  persona_en_revision: { text: 'EN REVISION', className: 'rc3-hist-tag-revision' },
  revision_requisitos: { text: 'EN REVISION', className: 'rc3-hist-tag-revision' },
  persona_en_cuip: { text: 'EN VALIDACION CUIP', className: 'rc3-hist-tag-cuip' },
  validacion_cuip: { text: 'EN VALIDACION CUIP', className: 'rc3-hist-tag-cuip' },
  cita_programada: { text: 'CITA PROGRAMADA', className: 'rc3-hist-tag-cuip' },
  ver_rechazados: { text: 'EN RECHAZADOS', className: 'rc3-hist-tag-rechazado' },
  rechazado_c3: { text: 'RECHAZADO C3', className: 'rc3-hist-tag-rechazado' },
  rechazado: { text: 'RECHAZADO FINAL', className: 'rc3-hist-tag-rechazado' },
  rechazado_no_corresponde: { text: 'NO CORRESPONDE', className: 'rc3-hist-tag-rechazado' },
  finalizado: { text: 'FINALIZADO', className: 'rc3-hist-tag-finalizado' }
};

const formatFechaCorreo = (fecha) => {
  if (!fecha) return '--';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short'
  }).format(fechaObj);
};

const formatFechaDetalle = (fecha) => {
  if (!fecha) return '--';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(fechaObj);
};

const getNumeroSolicitudCorto = (numeroSolicitud, fallback = '--') => {
  if (!numeroSolicitud && numeroSolicitud !== 0) return fallback;

  const texto = String(numeroSolicitud).trim();
  if (!texto) return fallback;
  if (/^\d+$/.test(texto)) return String(parseInt(texto, 10));

  const match = texto.match(/(\d+)$/);
  return match ? String(parseInt(match[1], 10)) : texto;
};

const normalizarTexto = (valor = '') => String(valor).trim().toLowerCase();

const esFechaReciente = (fecha, minutos = VENTANA_NUEVO_MINUTOS) => {
  if (!fecha) return false;
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return false;

  const diferencia = Date.now() - fechaObj.getTime();
  return diferencia >= 0 && diferencia <= minutos * MILISEGUNDOS_MINUTO;
};

const esPendienteDictamenC3 = (persona) => {
  const estatus = normalizarTexto(persona.estatus_descriptivo);
  return persona.accion_disponible === 'pendiente' || estatus.includes('pendiente dictamen c3');
};

const esDictamenPendienteRegistrado = (persona) => {
  const motivo = normalizarTexto(persona.motivo_rechazo);
  const observaciones = normalizarTexto(persona.observaciones_c3);
  return motivo.includes('dictamen c3: pendiente') || observaciones.includes('dictamen c3: pendiente');
};

const esTramiteNuevo = (persona) => {
  const sinAtender = persona.accion_disponible === 'revision_requisitos';
  if (!sinAtender) return false;
  if (esPendienteDictamenC3(persona)) return false;

  const fechaBase = persona.updated_at || persona.created_at || persona.fecha_solicitud;
  return esFechaReciente(fechaBase);
};

const getDictamenBadge = (persona) => {
  if (persona.rechazado) {
    if (esDictamenPendienteRegistrado(persona)) {
      return { status: 'pendiente', text: 'PENDIENTE', className: 'rc3-dict-pendiente' };
    }

    return { status: 'rechazado', text: 'NO PUDO SER DADO DE ALTA', className: 'rc3-dict-rechazado' };
  }

  if (esPendienteDictamenC3(persona)) {
    return { status: 'enviado', text: 'ENVIADO', className: 'rc3-dict-enviado' };
  }

  if (persona.validado || persona.accion_disponible === 'revision_requisitos') {
    return { status: 'aprobado', text: 'ALTA OK', className: 'rc3-dict-aprobado' };
  }

  return { status: 'proceso', text: 'EN PROCESO', className: 'rc3-dict-proceso' };
};

const getFaseHistorial = (persona) => {
  const clave = persona.accion_disponible && FASE_HISTORIAL_LABEL[persona.accion_disponible]
    ? persona.accion_disponible
    : persona.tramite_fase;

  return FASE_HISTORIAL_LABEL[clave] || { text: (clave || 'PROCESADO').toUpperCase(), className: 'rc3-hist-tag-default' };
};

const getRemitente = (persona) => {
  if (persona.es_tramite_dependencia) {
    return persona.dependencia_nombre || 'Dependencia';
  }
  return persona.municipio_nombre || 'Municipio';
};

const mostrarChipMunicipio = (persona, remitente) => {
  if (!persona.municipio_nombre) return false;
  return normalizarTexto(persona.municipio_nombre) !== normalizarTexto(remitente);
};

const getResumenFila = (persona) => {
  const detalleMovimiento = persona.proceso_movimiento || 'Alta';
  const detallePuesto = persona.puesto_propuesto_nombre || persona.puesto_original_nombre || 'Sin puesto';
  const detalleObservaciones = persona.observaciones_c3 || 'Sin observaciones registradas';
  return `${detalleMovimiento} - ${detallePuesto}. ${detalleObservaciones}`;
};

const buildRangeLabel = (pagina, total) => {
  if (total === 0) {
    return '0 resultados';
  }

  const inicio = (pagina - 1) * POR_PAGINA + 1;
  const fin = Math.min(pagina * POR_PAGINA, total);
  return `${inicio}-${fin} de ${total}`;
};

export default function RecibidosC3({
  onVolver,
  onIrRechazados,
  onIrRevision,
  forcedTab = null,
  searchTerm = null,
  externalFiltersVisible = null,
  onExternalFiltersVisibleChange = null,
  refreshSignal = 0
}) {
  const [tab, setTab] = useState('pendientes');

  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroDictamen, setFiltroDictamen] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [personaSeleccionadaId, setPersonaSeleccionadaId] = useState(null);

  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [mostrarFiltrosHistorial, setMostrarFiltrosHistorial] = useState(false);
  const [filtroFaseHistorial, setFiltroFaseHistorial] = useState('');
  const [filtroMunicipioHistorial, setFiltroMunicipioHistorial] = useState('');
  const [personaHistorialSeleccionadaId, setPersonaHistorialSeleccionadaId] = useState(null);

  const [iniciandoRevisionIds, setIniciandoRevisionIds] = useState([]);
  const [detalleModal, setDetalleModal] = useState({
    open: false,
    source: 'pendientes',
    personaId: null
  });

  const { showNotification } = useNotification();
  const { pendientes, historial, loading, cargarTodo } = useRecibidosC3();

  const cargarPersonas = useCallback(async (options = {}) => {
    const {
      silent = false,
      keepPagination = false,
      notifyOnError = true
    } = options;

    try {
      await cargarTodo({ silent });

      if (!keepPagination) {
        setPagina(1);
        setPaginaHistorial(1);
      }
    } catch {
      if (notifyOnError) {
        showNotification('Error al cargar personas recibidas de C3', 'error');
      }
    }
  }, [cargarTodo, showNotification]);

  useEffect(() => {
    cargarPersonas();
  }, [cargarPersonas]);

  useEffect(() => {
    if (refreshSignal > 0) {
      cargarPersonas();
    }
  }, [refreshSignal, cargarPersonas]);

  useEffect(() => {
    let disposed = false;

    const refrescarEnVivo = async () => {
      if (disposed || document.hidden) {
        return;
      }

      await cargarPersonas({
        silent: true,
        keepPagination: true,
        notifyOnError: false
      });
    };

    const timerId = window.setInterval(() => {
      void refrescarEnVivo();
    }, LIVE_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      void refrescarEnVivo();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      disposed = true;
      window.clearInterval(timerId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [cargarPersonas]);

  const municipiosUnicosPendientes = useMemo(() =>
    [...new Set(pendientes.map((persona) => persona.municipio_nombre).filter(Boolean))].sort(),
    [pendientes]
  );

  const municipiosUnicosHistorial = useMemo(() =>
    [...new Set(historial.map((persona) => persona.municipio_nombre).filter(Boolean))].sort(),
    [historial]
  );

  const usaBusquedaGlobal = typeof searchTerm === 'string';
  const usaFiltrosExternos = typeof externalFiltersVisible === 'boolean' && typeof onExternalFiltersVisibleChange === 'function';
  const busquedaPendienteActiva = usaBusquedaGlobal ? searchTerm : busqueda;
  const busquedaHistorialActiva = usaBusquedaGlobal ? searchTerm : busquedaHistorial;
  const mostrarTopbarLocal = !usaBusquedaGlobal && !forcedTab;

  useEffect(() => {
    if (forcedTab === 'pendientes' || forcedTab === 'historial') {
      setTab(forcedTab);
    }
  }, [forcedTab]);

  const fasesHistorialDisponibles = useMemo(() => {
    const valores = historial.map((persona) => {
      if (persona.accion_disponible && FASE_HISTORIAL_LABEL[persona.accion_disponible]) {
        return persona.accion_disponible;
      }
      return persona.tramite_fase;
    }).filter(Boolean);

    return [...new Set(valores)];
  }, [historial]);

  const personasFiltradas = useMemo(() => {
    return pendientes.filter((persona) => {
      if (busquedaPendienteActiva.trim()) {
        const texto = busquedaPendienteActiva.toLowerCase();
        const coincide =
          (persona.nombre_completo || '').toLowerCase().includes(texto) ||
          (persona.numero_oficio_c3 || '').toLowerCase().includes(texto) ||
          (persona.municipio_nombre || '').toLowerCase().includes(texto);

        if (!coincide) return false;
      }

      if (filtroDictamen) {
        if (getDictamenBadge(persona).status !== filtroDictamen) return false;
      }

      if (filtroMunicipio && persona.municipio_nombre !== filtroMunicipio) return false;

      return true;
    });
  }, [pendientes, busquedaPendienteActiva, filtroDictamen, filtroMunicipio]);

  const historialFiltrado = useMemo(() => {
    return historial.filter((persona) => {
      if (busquedaHistorialActiva.trim()) {
        const texto = busquedaHistorialActiva.toLowerCase();
        const coincide =
          (persona.nombre_completo || '').toLowerCase().includes(texto) ||
          (persona.numero_oficio_c3 || '').toLowerCase().includes(texto) ||
          (persona.municipio_nombre || '').toLowerCase().includes(texto);

        if (!coincide) return false;
      }

      if (filtroMunicipioHistorial && persona.municipio_nombre !== filtroMunicipioHistorial) return false;

      if (filtroFaseHistorial) {
        const faseValor = persona.accion_disponible && FASE_HISTORIAL_LABEL[persona.accion_disponible]
          ? persona.accion_disponible
          : persona.tramite_fase;

        if (faseValor !== filtroFaseHistorial) return false;
      }

      return true;
    });
  }, [historial, busquedaHistorialActiva, filtroMunicipioHistorial, filtroFaseHistorial]);

  useEffect(() => {
    setPagina(1);
  }, [busquedaPendienteActiva, filtroDictamen, filtroMunicipio]);

  useEffect(() => {
    setPaginaHistorial(1);
  }, [busquedaHistorialActiva, filtroMunicipioHistorial, filtroFaseHistorial]);

  const totalPaginas = Math.ceil(personasFiltradas.length / POR_PAGINA);
  const personasPaginadas = personasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const totalPaginasHistorial = Math.ceil(historialFiltrado.length / POR_PAGINA);
  const historialPaginado = historialFiltrado.slice((paginaHistorial - 1) * POR_PAGINA, paginaHistorial * POR_PAGINA);

  useEffect(() => {
    if (tab !== 'pendientes') return;

    if (personasPaginadas.length === 0) {
      setPersonaSeleccionadaId(null);
      return;
    }

    const existeSeleccion = personasPaginadas.some((persona) => persona.id === personaSeleccionadaId);
    if (!existeSeleccion) {
      setPersonaSeleccionadaId(personasPaginadas[0].id);
    }
  }, [tab, personasPaginadas, personaSeleccionadaId]);

  useEffect(() => {
    if (tab !== 'historial') return;

    if (historialPaginado.length === 0) {
      setPersonaHistorialSeleccionadaId(null);
      return;
    }

    const existeSeleccion = historialPaginado.some((persona) => persona.id === personaHistorialSeleccionadaId);
    if (!existeSeleccion) {
      setPersonaHistorialSeleccionadaId(historialPaginado[0].id);
    }
  }, [tab, historialPaginado, personaHistorialSeleccionadaId]);

  const personaDetalleActiva = useMemo(() => {
    if (!detalleModal.open || !detalleModal.personaId) {
      return null;
    }

    const fuente = detalleModal.source === 'pendientes' ? personasFiltradas : historialFiltrado;
    return fuente.find((persona) => persona.id === detalleModal.personaId) || null;
  }, [detalleModal, personasFiltradas, historialFiltrado]);

  useEffect(() => {
    if (!detalleModal.open) return;
    if (!personaDetalleActiva) {
      setDetalleModal((prev) => ({ ...prev, open: false, personaId: null }));
    }
  }, [detalleModal.open, personaDetalleActiva]);

  const dictamenDetalle = useMemo(() => {
    if (!personaDetalleActiva || detalleModal.source !== 'pendientes') return null;
    return getDictamenBadge(personaDetalleActiva);
  }, [personaDetalleActiva, detalleModal.source]);

  const faseDetalle = useMemo(() => {
    if (!personaDetalleActiva || detalleModal.source !== 'historial') return null;
    return getFaseHistorial(personaDetalleActiva);
  }, [personaDetalleActiva, detalleModal.source]);

  const handleLimpiarPendientes = () => {
    setFiltroDictamen('');
    setFiltroMunicipio('');
  };

  const handleLimpiarHistorial = () => {
    setFiltroFaseHistorial('');
    setFiltroMunicipioHistorial('');
  };

  const abrirDetalle = (source, personaId) => {
    setDetalleModal({
      open: true,
      source,
      personaId
    });
  };

  const cerrarDetalle = () => {
    setDetalleModal((prev) => ({ ...prev, open: false, personaId: null }));
  };

  const handleIniciarRevision = useCallback(async (persona) => {
    if (iniciandoRevisionIds.includes(persona.id)) return;

    setIniciandoRevisionIds((prev) => [...prev, persona.id]);

    try {
      await iniciarRevisionPersona(persona.id);
      if (onIrRevision) onIrRevision(persona);
      showNotification('Revisión de requisitos iniciada', 'success');
      await cargarTodo();
      if (!forcedTab) {
        setTab('historial');
        setPaginaHistorial(1);
      }
      setDetalleModal({ open: false, source: 'pendientes', personaId: null });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al iniciar revisión', 'error');
    } finally {
      setIniciandoRevisionIds((prev) => prev.filter((id) => id !== persona.id));
    }
  }, [iniciandoRevisionIds, onIrRevision, cargarTodo, showNotification, forcedTab]);

  const getAccionButton = (persona, esDetalle = false) => {
    const accion = persona.accion_disponible;
    const claseTamano = esDetalle ? 'rc3-btn-accion-lg' : '';

    if (accion === 'ver_rechazados') {
      return (
        <button className={`rc3-btn-accion rc3-btn-rechazados ${claseTamano}`} onClick={() => onIrRechazados && onIrRechazados()}>
          ver en rechazados <span>&rsaquo;</span>
        </button>
      );
    }

    if (accion === 'revision_requisitos') {
      const cargando = iniciandoRevisionIds.includes(persona.id);
      return (
        <button
          className={`rc3-btn-accion rc3-btn-revision ${claseTamano} ${cargando ? 'rc3-btn-loading' : ''}`}
          onClick={() => handleIniciarRevision(persona)}
          disabled={cargando}
        >
          {cargando
            ? <><i className='bx bx-loader-alt bx-spin'></i> Iniciando...</>
            : <>REVISION DE REQUISITOS <span>&rsaquo;</span></>}
        </button>
      );
    }

    return (
      <button className={`rc3-btn-accion rc3-btn-disabled ${claseTamano}`} disabled>
        REVISION DE REQUISITOS <span>&rsaquo;</span>
      </button>
    );
  };

  const getAccionFilaButton = (persona) => {
    const accion = persona.accion_disponible;

    if (accion === 'revision_requisitos') {
      const cargando = iniciandoRevisionIds.includes(persona.id);
      return (
        <button
          className={`rc3-row-action-btn rc3-row-action-revision ${cargando ? 'rc3-btn-loading' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleIniciarRevision(persona);
          }}
          disabled={cargando}
        >
          {cargando ? 'Iniciando...' : 'Revision de requisitos'}
        </button>
      );
    }

    if (accion === 'ver_rechazados') {
      return (
        <button
          className="rc3-row-action-btn rc3-row-action-rechazados"
          onClick={(e) => {
            e.stopPropagation();
            if (onIrRechazados) onIrRechazados();
          }}
        >
          Ver rechazados
        </button>
      );
    }

    return (
      <button
        className="rc3-row-action-btn rc3-row-action-disabled"
        onClick={(e) => e.stopPropagation()}
        disabled
      >
        Revision de Requisitos
      </button>
    );
  };

  const toggleHistorial = () => {
    setTab((prev) => (prev === 'pendientes' ? 'historial' : 'pendientes'));
    setDetalleModal({ open: false, source: 'pendientes', personaId: null });
  };

  const totalActivos = tab === 'pendientes' ? personasFiltradas.length : historialFiltrado.length;
  const busquedaActiva = tab === 'pendientes' ? busquedaPendienteActiva : busquedaHistorialActiva;
  const filtrosPendientesAbiertos = tab === 'pendientes' && (usaFiltrosExternos ? externalFiltersVisible : mostrarFiltros);
  const filtrosHistorialAbiertos = tab === 'historial' && (usaFiltrosExternos ? externalFiltersVisible : mostrarFiltrosHistorial);

  const handleToggleFiltrosLocales = () => {
    if (tab === 'pendientes') {
      setMostrarFiltros((prev) => !prev);
    } else {
      setMostrarFiltrosHistorial((prev) => !prev);
    }
  };

  const handleCerrarFiltros = () => {
    if (usaFiltrosExternos) {
      onExternalFiltersVisibleChange(false);
      return;
    }

    if (tab === 'pendientes') {
      setMostrarFiltros(false);
    } else {
      setMostrarFiltrosHistorial(false);
    }
  };

  if (loading) {
    return (
      <div className="rc3-loading">
        <i className='bx bx-loader-alt bx-spin'></i>
        <p>Cargando solicitudes recibidas...</p>
      </div>
    );
  }

  return (
    <div className="rc3-container">
      {mostrarTopbarLocal && (
      <div className="rc3-topbar">
        <div className="rc3-topbar-main">
          <div className="rc3-topbar-left">
            <span className={`rc3-view-chip ${tab === 'pendientes' ? 'is-pending' : 'is-history'}`}>
              <i className={`bx ${tab === 'pendientes' ? 'bx-inbox' : 'bx-history'}`}></i>
              {tab === 'pendientes' ? 'Bandeja Entrante' : 'Bandeja Historial'}
              <strong>{totalActivos}</strong>
            </span>
          </div>

          <button className="rc3-refresh-btn-small" onClick={cargarPersonas} title="Refrescar">
            <i className='bx bx-refresh'></i>
          </button>
        </div>

        <div className="rc3-topbar-tools">
          <button className="rc3-volver-btn rc3-view-switch-btn" onClick={toggleHistorial}>
            <i className={`bx ${tab === 'pendientes' ? 'bx-history' : 'bx-arrow-back'}`}></i>
            {tab === 'pendientes' ? 'Ir a historial' : 'Regresar a entrantes'}
          </button>

          <button
            className={`rc3-filtros-btn ${(tab === 'pendientes' ? mostrarFiltros : mostrarFiltrosHistorial) ? 'rc3-filtros-btn-active' : ''}`}
            onClick={handleToggleFiltrosLocales}
          >
            <i className='bx bx-filter-alt'></i> Filtros
          </button>

          {!usaBusquedaGlobal && (
            <div className="rc3-search-box">
              <i className='bx bx-search'></i>
              <input
                type="text"
                placeholder={tab === 'pendientes' ? 'Buscar por Folio o Nombre...' : 'Buscar en historial...'}
                value={busquedaActiva}
                onChange={(e) => {
                  if (tab === 'pendientes') {
                    setBusqueda(e.target.value);
                  } else {
                    setBusquedaHistorial(e.target.value);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
      )}

      {filtrosPendientesAbiertos && (
        <div className="rc3-filtros-panel">
          <div className="rc3-filtros-grid">
            <div className="rc3-filtro-group">
              <label>Dictamen</label>
              <select value={filtroDictamen} onChange={(e) => setFiltroDictamen(e.target.value)}>
                <option value="">Todos los dictamenes</option>
                <option value="enviado">Enviado</option>
                <option value="aprobado">Alta OK</option>
                <option value="rechazado">No pudo ser dado de alta</option>
                <option value="proceso">En Proceso</option>
              </select>
            </div>

            <div className="rc3-filtro-group">
              <label>Municipio</label>
              <select value={filtroMunicipio} onChange={(e) => setFiltroMunicipio(e.target.value)}>
                <option value="">Todos los municipios</option>
                {municipiosUnicosPendientes.map((municipio) => (
                  <option key={municipio} value={municipio}>{municipio}</option>
                ))}
              </select>
            </div>

            <div className="rc3-filtro-actions">
              <button className="rc3-filtro-aplicar" onClick={handleCerrarFiltros}>Aplicar</button>
              <button className="rc3-filtro-limpiar" onClick={handleLimpiarPendientes}>Limpiar</button>
            </div>
          </div>
        </div>
      )}

      {filtrosHistorialAbiertos && (
        <div className="rc3-filtros-panel">
          <div className="rc3-filtros-grid">
            <div className="rc3-filtro-group">
              <label>Fase</label>
              <select value={filtroFaseHistorial} onChange={(e) => setFiltroFaseHistorial(e.target.value)}>
                <option value="">Todas las fases</option>
                {fasesHistorialDisponibles.map((fase) => (
                  <option key={fase} value={fase}>{FASE_HISTORIAL_LABEL[fase]?.text || fase}</option>
                ))}
              </select>
            </div>

            <div className="rc3-filtro-group">
              <label>Municipio</label>
              <select value={filtroMunicipioHistorial} onChange={(e) => setFiltroMunicipioHistorial(e.target.value)}>
                <option value="">Todos los municipios</option>
                {municipiosUnicosHistorial.map((municipio) => (
                  <option key={municipio} value={municipio}>{municipio}</option>
                ))}
              </select>
            </div>

            <div className="rc3-filtro-actions">
              <button className="rc3-filtro-aplicar" onClick={handleCerrarFiltros}>Aplicar</button>
              <button className="rc3-filtro-limpiar" onClick={handleLimpiarHistorial}>Limpiar</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'pendientes' && (
        <section className="rc3-mail-list-panel rc3-mail-list-panel-full rc3-mail-list-standalone">
            <header className="rc3-mail-list-header rc3-mail-list-header-minimal">
              <span className="rc3-mail-table-title">Todas las solicitudes enviadas a C3</span>
              <div className="rc3-mail-range">{buildRangeLabel(pagina, personasFiltradas.length)}</div>
            </header>

            <div className="rc3-mail-list">
              {personasPaginadas.map((persona) => {
                const dictamen = getDictamenBadge(persona);
                const filaActiva = personaSeleccionadaId === persona.id;
                const remitente = getRemitente(persona);
                const mostrarNuevo = esTramiteNuevo(persona);
                const moverEnviadoAFlag = dictamen.status === 'enviado';

                return (
                  <div
                    key={persona.id}
                    role="button"
                    tabIndex={0}
                    className={`rc3-mail-row rc3-mail-row-pend${filaActiva ? ' is-active' : ''}`}
                    onClick={() => {
                      setPersonaSeleccionadaId(persona.id);
                      abrirDetalle('pendientes', persona.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPersonaSeleccionadaId(persona.id);
                        abrirDetalle('pendientes', persona.id);
                      }
                    }}
                  >
                    <span className="rc3-mail-row-flag">
                      {moverEnviadoAFlag ? (
                        <span className={`rc3-dict-badge ${dictamen.className}`}>{dictamen.text}</span>
                      ) : (mostrarNuevo ? <span className="rc3-new-indicator">Nuevo</span> : null)}
                    </span>

                    <span className="rc3-mail-row-from" title={remitente}>{remitente}</span>

                    <span className="rc3-mail-row-main">
                      <span className="rc3-mail-row-subject">{persona.nombre_completo || '--'}</span>
                      <span className="rc3-mail-row-snippet" title={getResumenFila(persona)}>{getResumenFila(persona)}</span>
                    </span>

                    <span className="rc3-mail-row-tags">
                      {!moverEnviadoAFlag && (
                        <span className={`rc3-dict-badge ${dictamen.className}`}>{dictamen.text}</span>
                      )}
                      {mostrarChipMunicipio(persona, remitente) && (
                        <span className="rc3-mail-row-chip">{persona.municipio_nombre}</span>
                      )}
                    </span>

                    <span className="rc3-mail-row-action">
                      {getAccionFilaButton(persona)}
                    </span>

                    <span className="rc3-mail-row-date">{formatFechaCorreo(persona.fecha_solicitud)}</span>
                  </div>
                );
              })}

              {personasFiltradas.length === 0 && (
                <div className="rc3-empty rc3-empty-mail">
                  <i className='bx bx-envelope-open'></i>
                  <p>No hay trámites pendientes para mostrar</p>
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="rc3-paginacion rc3-paginacion-mail">
                <button
                  className="rc3-pag-btn"
                  onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
                  disabled={pagina === 1}
                >
                  &larr; Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(0, 6).map((num) => (
                  <button
                    key={num}
                    className={`rc3-pag-btn ${num === pagina ? 'rc3-pag-active' : ''}`}
                    onClick={() => setPagina(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="rc3-pag-btn"
                  onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente &rarr;
                </button>
              </div>
            )}
        </section>
      )}

      {tab === 'historial' && (
        <section className="rc3-mail-list-panel rc3-mail-list-panel-full rc3-mail-list-standalone rc3-mail-shell-historial">
            <header className="rc3-mail-list-header rc3-mail-list-header-minimal">
              <span className="rc3-mail-table-title">Historial C3</span>
              <div className="rc3-mail-range">{buildRangeLabel(paginaHistorial, historialFiltrado.length)}</div>
            </header>

            <div className="rc3-mail-list">
              {historialPaginado.map((persona) => {
                const fase = getFaseHistorial(persona);
                const dictamen = getDictamenBadge(persona);
                const filaActiva = personaHistorialSeleccionadaId === persona.id;
                const remitente = getRemitente(persona);
                const mostrarNuevo = esTramiteNuevo(persona);
                const moverEnRechazadosAFlag = fase.text === 'EN RECHAZADOS';

                return (
                  <button
                    key={persona.id}
                    type="button"
                    className={`rc3-mail-row rc3-mail-row-hist${filaActiva ? ' is-active' : ''}`}
                    onClick={() => {
                      setPersonaHistorialSeleccionadaId(persona.id);
                      abrirDetalle('historial', persona.id);
                    }}
                  >
                    <span className="rc3-mail-row-flag">
                      {moverEnRechazadosAFlag ? (
                        <span className={`rc3-hist-tag ${fase.className}`}>{fase.text}</span>
                      ) : (mostrarNuevo ? <span className="rc3-new-indicator">Nuevo</span> : null)}
                    </span>

                    <span className="rc3-mail-row-from" title={remitente}>{remitente}</span>

                    <span className="rc3-mail-row-main">
                      <span className="rc3-mail-row-subject">{persona.nombre_completo || '--'}</span>
                      <span className="rc3-mail-row-snippet" title={getResumenFila(persona)}>{getResumenFila(persona)}</span>
                    </span>

                    <span className="rc3-mail-row-tags">
                      {!moverEnRechazadosAFlag && (
                        <span className={`rc3-hist-tag ${fase.className}`}>{fase.text}</span>
                      )}
                      <span className={`rc3-dict-badge ${dictamen.className}`}>{dictamen.text}</span>
                    </span>

                    <span className="rc3-mail-row-date">{formatFechaCorreo(persona.fecha_solicitud)}</span>
                  </button>
                );
              })}

              {historialFiltrado.length === 0 && (
                <div className="rc3-empty rc3-empty-mail">
                  <i className='bx bx-archive'></i>
                  <p>No hay trámites en historial para mostrar</p>
                </div>
              )}
            </div>

            {totalPaginasHistorial > 1 && (
              <div className="rc3-paginacion rc3-paginacion-mail">
                <button
                  className="rc3-pag-btn"
                  onClick={() => setPaginaHistorial((prev) => Math.max(1, prev - 1))}
                  disabled={paginaHistorial === 1}
                >
                  &larr; Anterior
                </button>
                {Array.from({ length: totalPaginasHistorial }, (_, i) => i + 1).slice(0, 6).map((num) => (
                  <button
                    key={num}
                    className={`rc3-pag-btn ${num === paginaHistorial ? 'rc3-pag-active' : ''}`}
                    onClick={() => setPaginaHistorial(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="rc3-pag-btn"
                  onClick={() => setPaginaHistorial((prev) => Math.min(totalPaginasHistorial, prev + 1))}
                  disabled={paginaHistorial === totalPaginasHistorial}
                >
                  Siguiente &rarr;
                </button>
              </div>
            )}
        </section>
      )}

      {detalleModal.open && personaDetalleActiva && typeof document !== 'undefined' && createPortal(
        <div className="rc3-detail-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) {
            cerrarDetalle();
          }
        }}>
          <div className="rc3-detail-modal" role="dialog" aria-modal="true" aria-labelledby="rc3-detail-title">
            <button type="button" className="rc3-detail-modal-close" onClick={cerrarDetalle} aria-label="Cerrar detalle">
              <i className='bx bx-x'></i>
            </button>

            <div className="rc3-mail-detail">
              <header className="rc3-mail-detail-header">
                <div className="rc3-mail-detail-main">
                  <p className="rc3-mail-detail-caption">
                    Numero de tramite: <strong>{getNumeroSolicitudCorto(personaDetalleActiva.numero_solicitud, String(personaDetalleActiva.id || '--'))}</strong>
                  </p>
                  <h3 id="rc3-detail-title">{personaDetalleActiva.nombre_completo || 'Sin nombre'}</h3>
                  <div className="rc3-oficio-highlight">
                    <span>Numero de oficio C3</span>
                    <strong>{personaDetalleActiva.numero_oficio_c3 ? String(personaDetalleActiva.numero_oficio_c3).toUpperCase() : '--'}</strong>
                  </div>
                  <p>
                    Fecha de solicitud: <strong>{formatFechaDetalle(personaDetalleActiva.fecha_solicitud)}</strong>
                  </p>
                </div>

                <div className="rc3-mail-detail-status">
                  {detalleModal.source === 'pendientes' && dictamenDetalle ? (
                    <>
                      <span className={`rc3-dict-badge ${dictamenDetalle.className}`}>
                        {dictamenDetalle.text}
                      </span>
                    </>
                  ) : null}

                  {detalleModal.source === 'historial' && faseDetalle ? (
                    <span className={`rc3-hist-tag ${faseDetalle.className}`}>
                      {faseDetalle.text}
                    </span>
                  ) : null}
                </div>
              </header>

              <div className="rc3-mail-actions-bar">
                {detalleModal.source === 'pendientes' ? (
                  getAccionButton(personaDetalleActiva, true)
                ) : (
                  personaDetalleActiva.accion_disponible === 'ver_rechazados' && onIrRechazados ? (
                    <button className="rc3-btn-accion rc3-btn-rechazados rc3-btn-accion-lg" onClick={() => onIrRechazados()}>
                      ver en rechazados <span>&rsaquo;</span>
                    </button>
                  ) : null
                )}

                <button className="rc3-mail-secondary-btn" onClick={cargarPersonas}>Actualizar</button>
                {onVolver && (
                  <button className="rc3-mail-secondary-btn" onClick={onVolver}>Volver a mis solicitudes</button>
                )}
              </div>

              <div className="rc3-mail-detail-grid">
                <article className="rc3-mail-detail-card">
                  <h4>Datos del tramite</h4>
                  <div className="rc3-mail-kv"><span>Numero de tramite</span><strong>{getNumeroSolicitudCorto(personaDetalleActiva.numero_solicitud, String(personaDetalleActiva.id || '--'))}</strong></div>
                  <div className="rc3-mail-kv"><span>Numero de oficio C3</span><strong>{personaDetalleActiva.numero_oficio_c3 ? String(personaDetalleActiva.numero_oficio_c3).toUpperCase() : '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Fecha solicitud</span><strong>{formatFechaDetalle(personaDetalleActiva.fecha_solicitud)}</strong></div>
                </article>

                <article className="rc3-mail-detail-card">
                  <h4>Datos del elemento</h4>
                  <div className="rc3-mail-kv"><span>Nombre completo</span><strong>{personaDetalleActiva.nombre_completo || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Puesto solicitado</span><strong>{personaDetalleActiva.puesto_propuesto_nombre || personaDetalleActiva.puesto_original_nombre || '--'}</strong></div>
                </article>

                <article className="rc3-mail-detail-card">
                  <h4>Origen y estatus</h4>
                  <div className="rc3-mail-kv"><span>Municipio</span><strong>{personaDetalleActiva.municipio_nombre || '--'}</strong></div>
                  {personaDetalleActiva.dependencia_nombre ? (
                    <div className="rc3-mail-kv"><span>Dependencia</span><strong>{personaDetalleActiva.dependencia_nombre}</strong></div>
                  ) : null}
                  <div className="rc3-mail-kv"><span>Movimiento</span><strong>{personaDetalleActiva.proceso_movimiento || 'Alta'}</strong></div>
                  <div className="rc3-mail-kv"><span>Accion disponible</span><strong>{personaDetalleActiva.accion_disponible || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Fase actual</span><strong>{personaDetalleActiva.tramite_fase || '--'}</strong></div>
                </article>
              </div>

              <section className="rc3-mail-observaciones">
                <h4>Observaciones de C3</h4>
                <p>{personaDetalleActiva.observaciones_c3 || 'Este trámite no tiene observaciones registradas por C3.'}</p>
              </section>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
