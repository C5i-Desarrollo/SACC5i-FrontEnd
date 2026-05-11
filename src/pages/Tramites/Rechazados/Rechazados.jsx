/**
 * Histórico de Trámites No Procedentes
 * Tabla general de personas rechazadas en cualquier etapa del proceso
 */
import { useState } from 'react';
import { useEffect } from 'react';
import { useRechazados } from '../../../hooks/rechazados';
import RechazadoRow from './components/RechazadoRow';
import Paginacion from './components/Paginacion';
import OficioModal from './components/OficioModal';
import { MdCancel } from 'react-icons/md';
import './styles/Rechazados.css';

export default function Rechazados({
  setPageTitle,
  analistaId = null,
  readOnly = false,
  requireAnalista = false
}) {
  const hasAnalistaSeleccionado = Boolean(Number(analistaId));

  const {
    personas,
    paginacion,
    filtros,
    loading,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    actualizarFiltro,
    editarMotivo,
    obtenerOficio
  } = useRechazados({
    analistaId,
    enabled: !requireAnalista || hasAnalistaSeleccionado
  });

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Trámites No Procedentes",
        subtitulo: "Registro de rechazos en el sistema",
        icon: <MdCancel className="nav-icon-highlight" />
      });
    }

    // Limpiar al salir
    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);
  
  const [showFiltros, setShowFiltros] = useState(false);
  const [oficioData, setOficioData] = useState(null);
  const [generandoOficio, setGenerandoOficio] = useState(null);

  const handleGenerarOficio = async (personaId) => {
    if (readOnly) return;

    setGenerandoOficio(personaId);
    const data = await obtenerOficio(personaId);
    setGenerandoOficio(null);
    if (data) setOficioData(data);
  };

  const handleBusqueda = (e) => {
    actualizarFiltro('busqueda', e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') aplicarFiltros();
  };

  return (
    <main className="rechazados-container">
      {/* Header */}
      {/*<div className="rechazados-header">
        <h1>Histórico de Trámites No Procedentes</h1>
        <p>Registro de rechazos en el sistema</p>
      </div>
      */}

      {/* Toolbar */}
      <div className="rechazados-toolbar">
        <button
          className={`rechazados-filtros-btn ${showFiltros ? 'active' : ''}`}
          onClick={() => setShowFiltros(!showFiltros)}
        >
          <i className='bx bx-filter-alt'></i>
          Filtros
        </button>

        <div className="rechazados-search">
          <i className='bx bx-search'></i>
          <input
            type="text"
            placeholder="Buscar por ..."
            value={filtros.busqueda}
            onChange={handleBusqueda}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="rechazados-filtros-panel">
          <div className="rechazados-filtro-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => actualizarFiltro('fecha_inicio', e.target.value)}
            />
          </div>
          <div className="rechazados-filtro-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => actualizarFiltro('fecha_fin', e.target.value)}
            />
          </div>
          <div className="rechazados-filtro-group">
            <label>Etapa de Rechazo</label>
            <select
              value={filtros.etapa_rechazo}
              onChange={(e) => actualizarFiltro('etapa_rechazo', e.target.value)}
            >
              <option value="">Todas las etapas</option>
              <option value="competencia">Filtro de Competencia</option>
              <option value="c3">Validación C3</option>
              <option value="revision">Revisión de Requisitos</option>
              <option value="cuip">Validación CUIP</option>
              <option value="cita">Cita Biométrica</option>
              <option value="c5">Validación C5</option>
            </select>
          </div>
          <div className="rechazados-filtros-actions">
            <button className="rechazados-btn-aplicar" onClick={aplicarFiltros}>Aplicar</button>
            <button className="rechazados-btn-limpiar" onClick={limpiarFiltros}>Limpiar</button>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="rechazados-loading">
          <i className='bx bx-loader-alt bx-spin' style={{ color: '#6c1d45' }}></i>
          <p>Cargando historial...</p>
        </div>
      ) : personas.length === 0 ? (
        <div className="rechazados-empty">
          <i className='bx bx-check-circle' style={{ color: '#28a745' }}></i>
          <p>No se encontraron personas rechazadas</p>
        </div>
      ) : (
        <div className="rechazados-card">
          <div className="rechazados-table-scroll">
            <table className="rechazados-table">
              <thead>
                <tr>
                  <th>Nombre del elemento</th>
                  <th>Etapa de rechazo</th>
                  <th>Motivo específico</th>
                  <th>Fecha de rechazo</th>
                  <th>Documentación</th>
                </tr>
              </thead>
              <tbody>
                {personas.map(persona => (
                  <RechazadoRow
                    key={persona.id}
                    persona={persona}
                    readOnly={readOnly}
                    showOficioAction={!readOnly}
                    onEditarMotivo={editarMotivo}
                    onGenerarOficio={handleGenerarOficio}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            paginacion={paginacion}
            onCambiarPagina={cambiarPagina}
          />
        </div>
      )}

      {/* Modal de oficio */}
      {oficioData && (
        <OficioModal
          oficio={oficioData}
          onClose={() => setOficioData(null)}
        />
      )}
    </main>
  );
}
