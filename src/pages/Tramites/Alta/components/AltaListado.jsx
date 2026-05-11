import { useEffect, useState, useMemo } from 'react';
import LoadingScreen from '../../../../components/ui/components/LoadingScreen';
import '../styles/AltaListado.css';

const ITEMS_PER_PAGE = 10;

export default function AltaListado({ 
  solicitudes, 
  loading, 
  onNuevaSolicitud, 
  onVerSolicitud,
  onRefresh,
  regionNombre,
  regionId,
  searchTerm,
  onSearchChange,
  hideLocalSearch = false,
  hideToolbarActions = false,
  showFiltersExternal,
  onShowFiltersExternalChange
}) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaInterna, setBusquedaInterna] = useState('');
  const [mostrarFiltrosLocal, setMostrarFiltrosLocal] = useState(false);
  const [filtroFase, setFiltroFase] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');

  const usaBusquedaGlobal = hideLocalSearch && typeof searchTerm === 'string';
  const busquedaActiva = usaBusquedaGlobal ? searchTerm : busquedaInterna;
  const usaFiltrosExternos = typeof showFiltersExternal === 'boolean' && typeof onShowFiltersExternalChange === 'function';
  const mostrarFiltros = usaFiltrosExternos ? showFiltersExternal : mostrarFiltrosLocal;

  const solicitudesConPersonas = useMemo(
    () => solicitudes.filter((s) => {
      const tienePersonas = Number(s.total_personas || 0) > 0;
      const enviadoOCerrado = !['datos_solicitud', 'validacion_personal'].includes(s.fase_actual);
      return tienePersonas && enviadoOCerrado;
    }),
    [solicitudes]
  );

  // Listas unicas para filtros
  const municipiosUnicos = useMemo(() => {
    const set = new Set(solicitudesConPersonas.map(s => s.municipio_nombre).filter(Boolean));
    return [...set].sort();
  }, [solicitudesConPersonas]);

  const fasesUnicas = useMemo(() => {
    const set = new Set(solicitudesConPersonas.map(s => s.fase_actual).filter(Boolean));
    return [...set].sort();
  }, [solicitudesConPersonas]);

  // Filtrar solicitudes
  const solicitudesFiltradas = useMemo(() => {
    let resultado = [...solicitudesConPersonas];

    if (busquedaActiva.trim()) {
      const term = busquedaActiva.toLowerCase().trim();
      resultado = resultado.filter(s =>
        (s.numero_solicitud || '').toLowerCase().includes(term) ||
        (s.municipio_nombre || '').toLowerCase().includes(term)
      );
    }

    if (filtroFase) {
      resultado = resultado.filter(s => s.fase_actual === filtroFase);
    }

    if (filtroMunicipio) {
      resultado = resultado.filter(s => s.municipio_nombre === filtroMunicipio);
    }

    return resultado;
  }, [solicitudesConPersonas, busquedaActiva, filtroFase, filtroMunicipio]);

  const stats = useMemo(() => {
    const enValidacion = solicitudesFiltradas.filter((s) =>
      ['validacion_personal', 'enviado_c3', 'revision_requisitos', 'rechazado_c3'].includes(s.fase_actual)
    ).length;
    const entrantes = solicitudesFiltradas.filter((s) =>
      ['validado_c3', 'dictaminado_c3', 'finalizado'].includes(s.fase_actual)
    ).length;

    return {
      totalSolicitudes: solicitudesFiltradas.length,
      enValidacion,
      entrantes
    };
  }, [solicitudesFiltradas]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaActiva, filtroFase, filtroMunicipio]);

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else window.location.reload();
  };

  const handleLimpiar = () => {
    if (usaBusquedaGlobal) {
      if (onSearchChange) onSearchChange('');
    } else {
      setBusquedaInterna('');
    }

    if (usaFiltrosExternos) {
      onShowFiltersExternalChange(false);
    } else {
      setMostrarFiltrosLocal(false);
    }

    setFiltroFase('');
    setFiltroMunicipio('');
  };

  const getFaseTexto = (fase) => {
    const faseMap = {
      'datos_solicitud': 'Datos Solicitud',
      'validacion_personal': 'Validacion',
      'enviado_c3': 'Enviado C3',
      'dictaminado_c3': 'Dictaminado C3',
      'validado_c3': 'Validado C3',
      'rechazado_c3': 'Rechazado C3',
      'revision_requisitos': 'Revision Requisitos',
      'rechazado_no_corresponde': 'No Corresponde',
      'rechazado': 'Rechazado',
      'finalizado': 'Finalizado'
    };
    return faseMap[fase] || fase;
  };

  const getNumeroSolicitudCorto = (numeroSolicitud) => {
    if (!numeroSolicitud && numeroSolicitud !== 0) return 'N/A';

    const texto = String(numeroSolicitud).trim();
    if (!texto) return 'N/A';
    if (/^\d+$/.test(texto)) return String(parseInt(texto, 10));

    const match = texto.match(/(\d+)$/);
    return match ? String(parseInt(match[1], 10)) : texto;
  };

  if (loading) {
    return <LoadingScreen message="Cargando solicitudes..." />;
  }

  if (solicitudesConPersonas.length === 0) {
    return (
      <div className="al-empty-state">
        <i className='bx bx-folder-open'></i>
        <p>No hay solicitudes con personas registradas</p>
        <button className="al-btn-primary" onClick={onNuevaSolicitud}>
          Crear primera solicitud
        </button>
      </div>
    );
  }

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / ITEMS_PER_PAGE);
  const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
  const solicitudesPaginadas = solicitudesFiltradas.slice(inicio, inicio + ITEMS_PER_PAGE);

  const getPaginasVisibles = () => {
    const paginas = [];
    const maxVisible = 5;

    if (totalPaginas <= maxVisible) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      paginas.push(1);
      if (paginaActual > 3) paginas.push('...');

      const start = Math.max(2, paginaActual - 1);
      const end = Math.min(totalPaginas - 1, paginaActual + 1);
      for (let i = start; i <= end; i++) paginas.push(i);

      if (paginaActual < totalPaginas - 2) paginas.push('...');
      paginas.push(totalPaginas);
    }

    return paginas;
  };

  return (
    <div className="al-container">
      <header className="al-overview">
        <div className="al-kpis">
          <article className="al-kpi-card al-kpi-region">
            <div className="al-kpi-icon"><i className='bx bx-map'></i></div>
            <div className="al-kpi-body">
              <span>Region</span>
              <strong>{regionNombre || (regionId ? `Region ${regionId}` : 'Sin region')}</strong>
            </div>
          </article>
          <article className="al-kpi-card al-kpi-municipios">
            <div className="al-kpi-icon"><i className='bx bx-buildings'></i></div>
            <div className="al-kpi-body">
              <span>Solicitudes</span>
              <strong>{stats.totalSolicitudes}</strong>
            </div>
          </article>
          <article className="al-kpi-card al-kpi-validacion">
            <div className="al-kpi-icon"><i className='bx bx-check-shield'></i></div>
            <div className="al-kpi-body">
              <span>En validacion</span>
              <strong>{stats.enValidacion}</strong>
            </div>
          </article>
          <article className="al-kpi-card al-kpi-c3">
            <div className="al-kpi-icon"><i className='bx bx-transfer-alt'></i></div>
            <div className="al-kpi-body">
              <span>Recibidas  C3</span>
              <strong>{stats.entrantes}</strong>
            </div>
          </article>
        </div>
      </header>

      {(!hideLocalSearch || !hideToolbarActions) && (
      <div className={`al-toolbar ${hideLocalSearch ? 'al-toolbar-only-actions' : ''}`}>
        {!hideLocalSearch && (
          <div className="al-search-box">
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Buscar por numero de solicitud o municipio"
              value={busquedaActiva}
              onChange={(e) => {
                if (usaBusquedaGlobal) {
                  if (onSearchChange) onSearchChange(e.target.value);
                } else {
                  setBusquedaInterna(e.target.value);
                }
              }}
            />
            {busquedaActiva && (
              <button
                type="button"
                className="al-search-clear"
                aria-label="Limpiar busqueda"
                onClick={() => {
                  if (usaBusquedaGlobal) {
                    if (onSearchChange) onSearchChange('');
                  } else {
                    setBusquedaInterna('');
                  }
                }}
              >
                <i className='bx bx-x'></i>
              </button>
            )}
          </div>
        )}

        {!hideToolbarActions && (
          <div className="al-toolbar-actions">
            <button
              className={`al-filtros-btn ${mostrarFiltros ? 'al-filtros-btn-active' : ''}`}
              onClick={() => {
                if (usaFiltrosExternos) {
                  onShowFiltersExternalChange(!mostrarFiltros);
                } else {
                  setMostrarFiltrosLocal(!mostrarFiltros);
                }
              }}
            >
              <i className='bx bx-slider-alt'></i>
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>

            <button className="al-refresh-btn" onClick={handleRefresh} title="Refrescar listado">
              <i className='bx bx-refresh'></i>
              Actualizar
            </button>
          </div>
        )}
      </div>
      )}

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="al-filtros-panel">
          <div className="al-filtros-grid">
            <div className="al-filtro-group">
              <label>Estatus del tramite</label>
              <select value={filtroFase} onChange={(e) => setFiltroFase(e.target.value)}>
                <option value="">Todas las fases</option>
                {fasesUnicas.map(f => (
                  <option key={f} value={f}>{getFaseTexto(f)}</option>
                ))}
              </select>
            </div>
            <div className="al-filtro-group">
              <label>Municipio</label>
              <select value={filtroMunicipio} onChange={(e) => setFiltroMunicipio(e.target.value)}>
                <option value="">Todos los municipios</option>
                {municipiosUnicos.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="al-filtro-actions">
              <button
                className="al-filtro-aplicar"
                onClick={() => {
                  if (usaFiltrosExternos) {
                    onShowFiltersExternalChange(false);
                  } else {
                    setMostrarFiltrosLocal(false);
                  }
                }}
              >
                Aplicar
              </button>
              <button className="al-filtro-limpiar" onClick={handleLimpiar}>Limpiar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="al-table-wrapper">
        <table className="al-table">
          <thead>
            <tr>
              <th>Numero Solicitud</th>
              <th>Origen</th>
              <th>Municipio</th>
              <th>Fecha Solicitud</th>
              <th>Total Personas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesPaginadas.map(solicitud => (
              <tr key={solicitud.id}>
                <td>{getNumeroSolicitudCorto(solicitud.numero_solicitud)}</td>
                <td>
                  {solicitud.es_tramite_dependencia
                    ? <span className="al-badge al-badge-dependencia" title={solicitud.dependencia_nombre}>
                        <i className='bx bx-buildings'></i> {solicitud.dependencia_nombre || 'Dependencia'}
                      </span>
                    : <span className="al-badge al-badge-municipio">
                        <i className='bx bx-map-pin'></i> Municipio
                      </span>
                  }
                </td>
                <td>{solicitud.municipio_nombre || 'N/A'}</td>
                <td>{solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString() : 'N/A'}</td>
                <td className="text-center">{solicitud.total_personas || 0}</td>
                <td>
                  <button 
                    className="al-btn-detalle"
                    onClick={() => onVerSolicitud(solicitud.id)}
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="al-paginacion">
          <button
            className="al-pag-btn"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual(paginaActual - 1)}
          >
            &larr; Anterior
          </button>

          {getPaginasVisibles().map((pagina, index) =>
            pagina === '...' ? (
              <span key={`dots-${index}`} className="al-pag-dots">...</span>
            ) : (
              <button
                key={pagina}
                className={`al-pag-btn ${paginaActual === pagina ? 'al-pag-active' : ''}`}
                onClick={() => setPaginaActual(pagina)}
              >
                {pagina}
              </button>
            )
          )}

          <button
            className="al-pag-btn"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual(paginaActual + 1)}
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </div>
  );
}