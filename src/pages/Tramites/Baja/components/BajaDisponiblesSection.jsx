import { MdFilterList, MdSearch, MdSupervisorAccount } from 'react-icons/md';

export default function BajaDisponiblesSection({
  metricDisponibles,
  metricBajas,
  busquedaDisponiblesInput,
  onBusquedaDisponiblesChange,
  mostrarFiltrosDisponibles,
  onToggleFiltros,
  filtroMunicipioDisponible,
  onFiltroMunicipioChange,
  municipiosDisponibles,
  filtroCuipDisponible,
  onFiltroCuipChange,
  onLimpiarFiltros,
  loadingDisponibles,
  disponiblesFiltrados,
  registroSeleccionado,
  onSeleccionarRegistro,
  formatDate,
  paginacionDisponibles,
  onPaginaAnterior,
  onPaginaSiguiente
}) {
  return (
    <section className="baja-card baja-grid-main">
      <div className="baja-card-header">
        <div className="baja-header-copy">
          <h3>Elementos finalizados disponibles para baja</h3>
          <p>Busque por nombre, CUIP, municipio o numero de oficio. Seleccione una persona para registrar su baja.</p>
        </div>
        <div className="baja-header-kpis baja-header-kpis-compact">
          <article className="baja-metric-card metric-disponibles">
            <span className="baja-metric-icon" aria-hidden="true">
              <MdSupervisorAccount />
            </span>
            <div className="baja-metric-content">
              <small>Disponibles para baja</small>
              <strong>{metricDisponibles}</strong>
            </div>
          </article>
        </div>
      </div>

      <div className="baja-toolbar-row">
        <div className="baja-search-box">
          <MdSearch className="baja-search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar en finalizados por CUIP, nombre, municipio u oficio"
            value={busquedaDisponiblesInput}
            onChange={(e) => onBusquedaDisponiblesChange(e.target.value)}
          />
        </div>

        <div className="baja-toolbar-actions">
          <button
            type="button"
            className={`baja-filtros-btn ${mostrarFiltrosDisponibles ? 'active' : ''}`}
            onClick={onToggleFiltros}
          >
            <MdFilterList />
            {mostrarFiltrosDisponibles ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>
      </div>

      {mostrarFiltrosDisponibles && (
        <div className="baja-filtros-panel">
          <div className="baja-filtros-grid">
            <div className="baja-filtro-group">
              <label>Municipio</label>
              <select value={filtroMunicipioDisponible} onChange={(e) => onFiltroMunicipioChange(e.target.value)}>
                <option value="">Todos los municipios</option>
                {municipiosDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="baja-filtro-group">
              <label>CUIP</label>
              <select value={filtroCuipDisponible} onChange={(e) => onFiltroCuipChange(e.target.value)}>
                <option value="">Todos</option>
                <option value="con_cuip">Con CUIP</option>
                <option value="sin_cuip">Sin CUIP</option>
              </select>
            </div>
            <div className="baja-filtro-actions">
              <button type="button" onClick={onLimpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="baja-table-wrap">
        {loadingDisponibles ? (
          <div className="baja-state"><i className='bx bx-loader-alt bx-spin'></i> Cargando disponibles...</div>
        ) : disponiblesFiltrados.length === 0 ? (
          <div className="baja-state">No hay elementos finalizados disponibles para baja.</div>
        ) : (
          <table className="baja-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Municipio</th>
                <th>CUIP</th>
                <th>No. Oficio</th>
                <th>Fecha termino</th>
                <th>Seleccion</th>
              </tr>
            </thead>
            <tbody>
              {disponiblesFiltrados.map((item) => {
                const isSelected = registroSeleccionado?.id === item.id;
                return (
                  <tr key={item.id} className={isSelected ? 'is-selected' : ''}>
                    <td>{item.nombre_elemento || '---'}</td>
                    <td>{item.apellido_paterno || '---'}</td>
                    <td>{item.apellido_materno || '---'}</td>
                    <td>{item.municipio_nombre || '---'}</td>
                    <td>{item.cuip || '---'}</td>
                    <td>{item.numero_oficio || item.numero_oficio_c3 || '---'}</td>
                    <td>{formatDate(item.fecha_termino)}</td>
                    <td>
                      <button
                        type="button"
                        className={`baja-btn-select ${isSelected ? 'active' : ''}`}
                        onClick={() => onSeleccionarRegistro(item)}
                      >
                        {isSelected ? 'Seleccionado' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="baja-pagination">
        <button
          type="button"
          disabled={paginacionDisponibles.pagina <= 1}
          onClick={onPaginaAnterior}
        >
          Anterior
        </button>
        <span>Pagina {paginacionDisponibles.pagina || 1} de {paginacionDisponibles.totalPaginas || 1}</span>
        <button
          type="button"
          disabled={(paginacionDisponibles.pagina || 1) >= (paginacionDisponibles.totalPaginas || 1)}
          onClick={onPaginaSiguiente}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
