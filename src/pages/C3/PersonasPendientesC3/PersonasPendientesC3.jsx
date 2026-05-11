import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MdFactCheck } from 'react-icons/md';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../services/api';
import '../../Tramites/Alta/styles/RecibidosC3.css';
import './styles/PersonasPendientesC3.css';

const POR_PAGINA = 10;
const LIVE_REFRESH_INTERVAL_MS = Math.max(
  2000,
  Number(import.meta.env.VITE_C3_LIVE_REFRESH_MS) || 2000
);

const DICTAMEN_OPTIONS = [
  { value: '', label: 'En proceso' },
  { value: 'ALTA OK', label: 'ALTA OK' },
  { value: 'NO PUEDE SER DADO DE ALTA', label: 'No puede ser dado de alta' },
  { value: 'PENDIENTE', label: 'Pendiente' }
];

const formatFechaCorreo = (fecha) => {
  if (!fecha) return '--';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return '--';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short'
  }).format(fechaObj);
};

const formatFechaDetalle = (fecha) => {
  if (!fecha) return '--';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return '--';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(fechaObj);
};

const formatFechaSimple = (fecha) => {
  if (!fecha) return '--';

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return '--';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(fechaObj);
};

const buildRangeLabel = (pagina, total) => {
  if (total === 0) return '0 resultados';
  const inicio = (pagina - 1) * POR_PAGINA + 1;
  const fin = Math.min(pagina * POR_PAGINA, total);
  return `${inicio}-${fin} de ${total}`;
};

const getDictamenClass = (dictamenActual) => {
  if (dictamenActual === 'ALTA OK') return 'c3v-dict-ok';
  if (dictamenActual === 'NO PUEDE SER DADO DE ALTA') return 'c3v-dict-rechazado';
  if (dictamenActual === 'PENDIENTE') return 'c3v-dict-pendiente';
  return 'c3v-dict-proceso';
};

export default function PersonasPendientesC3({ setPageTitle }) {
  const { showNotification } = useNotification();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({ dictamen: '', region: '', puesto: '' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [personaSeleccionadaId, setPersonaSeleccionadaId] = useState(null);
  const [detalleModal, setDetalleModal] = useState({ open: false, personaId: null });
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [dictamenes, setDictamenes] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, total: 0, payload: [] });

  useEffect(() => {
    if (!setPageTitle) return undefined;

    const timer = setTimeout(() => {
      setPageTitle({
        titulo: 'Panel de Validacion C3',
        subtitulo: 'Revise y emita dictamenes de validacion para solicitudes pendientes',
        icon: <MdFactCheck className="nav-icon-highlight" />
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      setPageTitle(null);
    };
  }, [setPageTitle]);

  const cargarPersonas = useCallback(async (options = {}) => {
    const {
      silent = false,
      preserveSelection = false,
      preserveDrafts = false,
      notifyOnError = true
    } = options;

    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await api.get('/tramites/alta/personas-pendientes-c3');
      const data = response.data.data || [];
      const validIds = new Set(data.map((persona) => String(persona.id)));

      setPersonas(data);

      if (preserveSelection) {
        setSeleccionadas((prev) => {
          const next = new Set();
          prev.forEach((id) => {
            if (validIds.has(String(id))) {
              next.add(id);
            }
          });
          return next;
        });
      } else {
        setSeleccionadas(new Set());
      }

      if (preserveDrafts) {
        setDictamenes((prev) => {
          const next = {};
          Object.entries(prev).forEach(([id, value]) => {
            if (validIds.has(String(id))) {
              next[id] = value;
            }
          });
          return next;
        });

        setObservaciones((prev) => {
          const next = {};
          Object.entries(prev).forEach(([id, value]) => {
            if (validIds.has(String(id))) {
              next[id] = value;
            }
          });
          return next;
        });
      } else {
        setDictamenes({});
        setObservaciones({});
      }
    } catch (error) {
      console.error('Error:', error);
      if (notifyOnError) {
        showNotification('Error al cargar personas: ' + (error.response?.data?.message || error.message), 'error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [showNotification]);

  useEffect(() => {
    cargarPersonas();
  }, [cargarPersonas]);

  useEffect(() => {
    let disposed = false;

    const refrescarEnVivo = async () => {
      if (disposed || document.hidden || guardando) {
        return;
      }

      await cargarPersonas({
        silent: true,
        preserveSelection: true,
        preserveDrafts: true,
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
  }, [cargarPersonas, guardando]);

  // Listas unicas para los selects de filtros
  const regionesUnicas = useMemo(() => {
    const set = new Set(personas.map(p => p.region_nombre).filter(Boolean));
    return [...set].sort();
  }, [personas]);

  const puestosUnicos = useMemo(() => {
    const set = new Set(personas.map(p => p.puesto_nombre).filter(Boolean));
    return [...set].sort();
  }, [personas]);

  // Filtrar personas
  const personasFiltradas = useMemo(() => {
    let resultado = [...personas];

    // Busqueda por texto
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      resultado = resultado.filter(p =>
        (p.nombre_completo || '').toLowerCase().includes(term) ||
        (p.numero_solicitud || '').toLowerCase().includes(term) ||
        (p.municipio_nombre || '').toLowerCase().includes(term)
      );
    }

    // Filtro por dictamen
    if (filtros.dictamen) {
      resultado = resultado.filter(p => {
        const dictamenLocal = dictamenes[p.id];
        const dictamenActual = dictamenLocal || p.dictamen_c3 || 'EN PROCESO';
        return dictamenActual.toUpperCase() === filtros.dictamen.toUpperCase();
      });
    }

    // Filtro por region
    if (filtros.region) {
      resultado = resultado.filter(p =>
        (p.region_nombre || '') === filtros.region
      );
    }

    // Filtro por puesto
    if (filtros.puesto) {
      resultado = resultado.filter(p =>
        (p.puesto_nombre || '') === filtros.puesto
      );
    }

    return resultado;
  }, [personas, busqueda, filtros, dictamenes]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtros]);

  const totalPaginas = Math.ceil(personasFiltradas.length / POR_PAGINA);
  const personasPaginadas = personasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  useEffect(() => {
    if (personasPaginadas.length === 0) {
      setPersonaSeleccionadaId(null);
      return;
    }

    const existeSeleccion = personasPaginadas.some((persona) => persona.id === personaSeleccionadaId);
    if (!existeSeleccion) {
      setPersonaSeleccionadaId(personasPaginadas[0].id);
    }
  }, [personasPaginadas, personaSeleccionadaId]);

  const personaDetalleActiva = useMemo(() => {
    if (!detalleModal.open || !detalleModal.personaId) return null;
    return personasFiltradas.find((persona) => persona.id === detalleModal.personaId) || null;
  }, [detalleModal, personasFiltradas]);

  const handleFiltrar = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ dictamen: '', region: '', puesto: '' });
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSeleccionarTodas = () => {
    const todosSeleccionados = personasFiltradas.length > 0
      && personasFiltradas.every((persona) => seleccionadas.has(persona.id));

    if (todosSeleccionados) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(personasFiltradas.map(p => p.id)));
    }
  };

  const handleDictamenChange = (personaId, value) => {
    setDictamenes(prev => ({ ...prev, [personaId]: value }));
  };

  const handleObservacionChange = (personaId, value) => {
    setObservaciones(prev => ({ ...prev, [personaId]: value }));
  };

  const aplicarDictamenLote = (dictamen) => {
    const updates = {};
    seleccionadas.forEach(id => { updates[id] = dictamen; });
    setDictamenes(prev => ({ ...prev, ...updates }));
  };

  const handleGuardarDictamenes = async () => {
    const personasConDictamen = Object.entries(dictamenes).filter(
      ([_, dictamen]) => dictamen && dictamen !== ''
    );

    if (personasConDictamen.length === 0) {
      showNotification('No hay dictamenes para guardar.', 'error');
      return;
    }

    setConfirmModal({
      open: true,
      total: personasConDictamen.length,
      payload: personasConDictamen
    });
  };

  const cerrarConfirmModal = () => {
    if (guardando) return;
    setConfirmModal({ open: false, total: 0, payload: [] });
  };

  const confirmarGuardarDictamenes = async () => {
    const personasConDictamen = Array.isArray(confirmModal.payload) ? confirmModal.payload : [];
    if (personasConDictamen.length === 0) {
      cerrarConfirmModal();
      return;
    }

    setGuardando(true);
    let exitosos = 0;
    let errores = 0;

    for (const [personaId, estatus] of personasConDictamen) {
      try {
        await api.post(`/tramites/alta/persona/${personaId}/dictamen-c3`, {
          estatus,
          observaciones_c3: observaciones[personaId] || ''
        });
        exitosos++;
      } catch (error) {
        errores++;
      }
    }

    setGuardando(false);
    setConfirmModal({ open: false, total: 0, payload: [] });

    if (exitosos > 0) {
      showNotification(
        `${exitosos} dictamen(es) guardado(s)${errores > 0 ? `, ${errores} con error` : ''}`,
        exitosos === personasConDictamen.length ? 'success' : 'warning'
      );
    } else {
      showNotification('No se pudo guardar ningun dictamen', 'error');
    }

    await cargarPersonas();
  };

  const abrirDetalle = (personaId) => {
    setDetalleModal({ open: true, personaId });
  };

  const cerrarDetalle = () => {
    setDetalleModal({ open: false, personaId: null });
  };

  const dictamenesActivos = Object.values(dictamenes).filter(d => d && d !== '').length;
  const seleccionadasCount = seleccionadas.size;
  const todasSeleccionadas = personasFiltradas.length > 0
    && personasFiltradas.every((persona) => seleccionadas.has(persona.id));
  const observacionDetalle = personaDetalleActiva
    ? (observaciones[personaDetalleActiva.id] ?? personaDetalleActiva.observaciones_c3 ?? '')
    : '';

  if (loading) {
    return (
      <main className="rc3-container c3v-container">
        <div className="c3-loading">
          <i className='bx bx-loader-alt bx-spin'></i>
          <p>Cargando personas pendientes...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="rc3-container c3v-container">
      <div className="c3v-toolbar">
        <div className="c3v-toolbar-row c3v-toolbar-row-main">
          <div className="c3v-search-wrap">
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Buscar por nombre, solicitud o municipio"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <button
              type="button"
              className={`c3v-search-filter-btn ${mostrarFiltros ? 'is-active' : ''}`}
              aria-label="Mostrar filtros"
              onClick={() => setMostrarFiltros((prev) => !prev)}
            >
              <i className='bx bx-slider-alt'></i>
            </button>

            {busqueda && (
              <button
                type="button"
                className="c3v-search-clear"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda('')}
              >
                <i className='bx bx-x'></i>
              </button>
            )}
          </div>

          <button className="rc3-refresh-btn-small" onClick={cargarPersonas} title="Refrescar">
            <i className='bx bx-refresh'></i>
          </button>
        </div>

        <div className="c3v-toolbar-row c3v-toolbar-row-actions">
          <label className="c3v-select-all">
            <input
              type="checkbox"
              checked={todasSeleccionadas}
              onChange={toggleSeleccionarTodas}
            />
            <span>Seleccionar todas</span>
          </label>

          {seleccionadasCount > 0 && (
            <div className="c3v-batch">
              <span className="c3v-selected-count">
                <i className='bx bx-check-square'></i> {seleccionadasCount} seleccionada(s)
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) aplicarDictamenLote(e.target.value);
                  e.target.value = '';
                }}
                className="c3v-batch-select"
              >
                <option value="">Dictamen en lote...</option>
                <option value="ALTA OK">ALTA OK</option>
                <option value="NO PUEDE SER DADO DE ALTA">No puede ser dado de alta</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          )}

          {dictamenesActivos > 0 && (
            <button className="c3v-save-btn" onClick={handleGuardarDictamenes} disabled={guardando}>
              <i className='bx bx-save'></i>
              {guardando ? 'Guardando...' : `Guardar ${dictamenesActivos} dictamen(es)`}
            </button>
          )}

          <span className="c3v-total">Pendientes: {personasFiltradas.length}</span>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="rc3-filtros-panel c3v-filtros-panel">
          <div className="rc3-filtros-grid">
            <div className="rc3-filtro-group">
              <label>Dictamen</label>
              <select
                value={filtros.dictamen}
                onChange={(e) => handleFiltrar({ ...filtros, dictamen: e.target.value })}
              >
                <option value="">Todos los dictamenes</option>
                <option value="EN PROCESO">En proceso</option>
                <option value="ALTA OK">Alta OK</option>
                <option value="NO PUEDE SER DADO DE ALTA">No puede ser dado de alta</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>

            <div className="rc3-filtro-group">
              <label>Region</label>
              <select
                value={filtros.region}
                onChange={(e) => handleFiltrar({ ...filtros, region: e.target.value })}
              >
                <option value="">Todas las regiones</option>
                {regionesUnicas.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="rc3-filtro-group">
              <label>Puesto</label>
              <select
                value={filtros.puesto}
                onChange={(e) => handleFiltrar({ ...filtros, puesto: e.target.value })}
              >
                <option value="">Todos los puestos</option>
                {puestosUnicos.map((puesto) => (
                  <option key={puesto} value={puesto}>{puesto}</option>
                ))}
              </select>
            </div>

            <div className="rc3-filtro-actions">
              <button className="rc3-filtro-aplicar" onClick={() => setMostrarFiltros(false)}>Aplicar</button>
              <button className="rc3-filtro-limpiar" onClick={handleLimpiarFiltros}>Limpiar</button>
            </div>
          </div>
        </div>
      )}

      <section className="rc3-mail-list-panel rc3-mail-list-panel-full rc3-mail-list-standalone">
        <header className="rc3-mail-list-header rc3-mail-list-header-minimal">
          <span className="rc3-mail-table-title">Solicitudes pendientes</span>
          <div className="rc3-mail-range">{buildRangeLabel(pagina, personasFiltradas.length)}</div>
        </header>

        <div className="rc3-mail-list">
          {personasPaginadas.map((persona) => {
            const filaActiva = personaSeleccionadaId === persona.id;
            const dictamenActual = dictamenes[persona.id] || '';
            const remitente = persona.region_nombre || '--';
            const origen = persona.es_tramite_dependencia
              ? (persona.dependencia_nombre || '--')
              : 'C5';
            const resumen = `${persona.proceso_movimiento || 'ALTA'} - ${persona.puesto_nombre || '--'} - Oficio: ${persona.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : '--'}`;

            return (
              <div
                key={persona.id}
                role="button"
                tabIndex={0}
                className={`rc3-mail-row rc3-mail-row-pend c3v-mail-row ${filaActiva ? ' is-active' : ''}`}
                onClick={() => {
                  setPersonaSeleccionadaId(persona.id);
                  abrirDetalle(persona.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPersonaSeleccionadaId(persona.id);
                    abrirDetalle(persona.id);
                  }
                }}
              >
                <span className="rc3-mail-row-flag c3v-mail-row-flag" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={seleccionadas.has(persona.id)}
                    onChange={() => toggleSeleccion(persona.id)}
                    aria-label={`Seleccionar ${persona.nombre_completo || 'persona'}`}
                  />
                </span>

                <span className="rc3-mail-row-from" title={remitente}>{remitente}</span>

                <span className="rc3-mail-row-main">
                  <span className="rc3-mail-row-subject">{persona.nombre_completo || '--'}</span>
                  <span className="rc3-mail-row-snippet" title={resumen}>{resumen}</span>
                </span>

                <span className="rc3-mail-row-tags c3v-row-tags">
                  <span className="c3v-row-tag-text">{persona.municipio_nombre || '--'}</span>
                  <span className={`c3v-row-origin-text ${persona.es_tramite_dependencia ? 'is-dep' : 'is-c5'}`}>{origen}</span>
                </span>

                <span className="rc3-mail-row-action c3v-row-action" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={dictamenActual}
                    onChange={(e) => handleDictamenChange(persona.id, e.target.value)}
                    className={`c3v-dictamen-select ${getDictamenClass(dictamenActual)}`}
                  >
                    {DICTAMEN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </span>

                <span className="rc3-mail-row-date">{formatFechaCorreo(persona.fecha_solicitud)}</span>
              </div>
            );
          })}

          {personasFiltradas.length === 0 && (
            <div className="rc3-empty rc3-empty-mail">
              <i className='bx bx-envelope-open'></i>
              <p>No hay personas pendientes de dictamen</p>
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

      {confirmModal.open && typeof document !== 'undefined' && createPortal(
        <div
          className="c3v-confirm-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cerrarConfirmModal();
            }
          }}
        >
          <div className="c3v-confirm-card" role="dialog" aria-modal="true" aria-labelledby="c3v-confirm-title">
            <div className="c3v-confirm-head">
              <h3 id="c3v-confirm-title">Confirmar dictamenes</h3>
              <button
                type="button"
                className="c3v-confirm-close"
                onClick={cerrarConfirmModal}
                aria-label="Cerrar confirmacion"
                disabled={guardando}
              >
                <i className='bx bx-x'></i>
              </button>
            </div>

            <div className="c3v-confirm-body">
              <p>
                Se guardaran <strong>{confirmModal.total}</strong> dictamen(es) de forma masiva.
              </p>
              <p className="c3v-confirm-helper">
                Esta accion aplicara los cambios seleccionados y actualizara el historial correspondiente.
              </p>
            </div>

            <div className="c3v-confirm-actions">
              <button
                type="button"
                className="c3v-confirm-btn c3v-confirm-btn-secondary"
                onClick={cerrarConfirmModal}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="c3v-confirm-btn c3v-confirm-btn-primary"
                onClick={confirmarGuardarDictamenes}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Confirmar y guardar'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {detalleModal.open && personaDetalleActiva && typeof document !== 'undefined' && createPortal(
        <div className="rc3-detail-modal-backdrop c3v-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) {
            cerrarDetalle();
          }
        }}>
          <div className="rc3-detail-modal c3v-detail-modal" role="dialog" aria-modal="true" aria-labelledby="c3-detail-title">
            <button type="button" className="rc3-detail-modal-close c3v-detail-modal-close" onClick={cerrarDetalle} aria-label="Cerrar detalle">
              <i className='bx bx-x'></i>
            </button>

            <div className="rc3-mail-detail c3v-mail-detail">
              <header className="rc3-mail-detail-header c3v-mail-detail-header">
                <div className="rc3-mail-detail-main c3v-mail-detail-main">
                  <h3 id="c3-detail-title">{personaDetalleActiva.nombre_completo || 'Sin nombre'}</h3>
                  <p className="c3v-mail-detail-meta">
                    Fecha de solicitud: <strong>{formatFechaDetalle(personaDetalleActiva.fecha_solicitud)}</strong>
                  </p>
                </div>
              </header>

              <div className="rc3-mail-actions-bar c3v-mail-actions-bar">
                <button className="rc3-mail-secondary-btn" onClick={cargarPersonas}>Actualizar</button>
              </div>

              <div className="rc3-mail-detail-grid c3v-mail-detail-grid">
                <article className="rc3-mail-detail-card c3v-mail-detail-card">
                  <h4>Datos del tramite</h4>
                  <div className="rc3-mail-kv"><span>Region / Dependencia</span><strong>{personaDetalleActiva.region_nombre || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Corporacion / Municipio</span><strong>{personaDetalleActiva.municipio_nombre || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Tipo de Movimiento</span><strong>{personaDetalleActiva.proceso_movimiento || 'ALTA'}</strong></div>
                  <div className="rc3-mail-kv"><span>Fecha solicitud</span><strong>{formatFechaDetalle(personaDetalleActiva.fecha_solicitud)}</strong></div>
                </article>

                <article className="rc3-mail-detail-card c3v-mail-detail-card">
                  <h4>Datos del elemento</h4>
                  <div className="rc3-mail-kv"><span>Nombre del Elemento</span><strong>{personaDetalleActiva.nombre_completo || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>No. Oficio C3</span><strong>{personaDetalleActiva.numero_oficio_c3 ? String(personaDetalleActiva.numero_oficio_c3).toUpperCase() : '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Puesto Validado</span><strong>{personaDetalleActiva.puesto_nombre || '--'}</strong></div>
                  <div className="rc3-mail-kv"><span>Fecha Nacimiento</span><strong>{formatFechaSimple(personaDetalleActiva.fecha_nacimiento)}</strong></div>
                </article>
              </div>

              <section className="rc3-mail-observaciones c3v-mail-observaciones">
                <h4>Observaciones C3</h4>
                <textarea
                  className="c3v-modal-obs-textarea"
                  value={observacionDetalle}
                  onChange={(e) => handleObservacionChange(personaDetalleActiva.id, e.target.value)}
                  rows={4}
                  placeholder="Escriba sus observaciones..."
                />
              </section>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}