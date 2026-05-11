import { MdLocationCity, MdManageSearch, MdSearch } from 'react-icons/md';

export default function ConsultaMunicipiosSection({
  busquedaMunicipiosInput,
  onBusquedaChange,
  loadingMunicipios,
  municipios,
  municipioActivo,
  paginacionMunicipios,
  onPaginaAnterior,
  onPaginaSiguiente,
  onVerMunicipio
}) {
  return (
    <section className="consulta-card consulta-grid-main">
      <div className="consulta-card-header">
        <div className="consulta-card-header-top">
          <div className="consulta-card-title">
            <span className="consulta-card-title-icon" aria-hidden="true">
              <MdLocationCity />
            </span>
            <h3>Municipios con personas finalizadas</h3>
          </div>
        </div>
        <p>Seleccione un municipio para consultar su listado; si vuelve a presionar el mismo boton se deselecciona.</p>
      </div>

      <div className="consulta-toolbar-row">
        <div className="consulta-search-box">
          <MdSearch className="consulta-search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar municipio"
            value={busquedaMunicipiosInput}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
      </div>

      <div className="consulta-table-wrap">
        {loadingMunicipios ? (
          <div className="consulta-state"><i className='bx bx-loader-alt bx-spin'></i> Cargando municipios...</div>
        ) : municipios.length === 0 ? (
          <div className="consulta-state">No hay municipios con registros finalizados.</div>
        ) : (
          <table className="consulta-table consulta-table-municipios">
            <thead>
              <tr>
                <th>No.</th>
                <th>Municipio</th>
                <th>Personas finalizadas</th>
                <th>Consulta</th>
              </tr>
            </thead>
            <tbody>
              {municipios.map((item, index) => {
                const isActive = Number(municipioActivo?.municipio_id) === Number(item.municipio_id);

                return (
                  <tr
                    key={`${item.municipio_id}-${index}`}
                    className={isActive ? 'is-selected' : ''}
                  >
                    <td>{index + 1 + ((paginacionMunicipios.pagina || 1) - 1) * (paginacionMunicipios.limit || 10)}</td>
                    <td>{item.municipio_nombre || 'Sin municipio'}</td>
                    <td>{item.total_personas || 0}</td>
                    <td>
                      <button
                        type="button"
                        className={`consulta-btn-action ${isActive ? 'is-active' : ''}`}
                        onClick={() => onVerMunicipio(item)}
                        aria-pressed={isActive}
                      >
                        <MdManageSearch /> {isActive ? 'Quitar seleccion' : 'Consulta'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="consulta-pagination">
        <button type="button" onClick={onPaginaAnterior} disabled={(paginacionMunicipios.pagina || 1) <= 1}>
          Anterior
        </button>
        <span>Pagina {paginacionMunicipios.pagina || 1} de {paginacionMunicipios.totalPaginas || 1}</span>
        <button
          type="button"
          onClick={onPaginaSiguiente}
          disabled={(paginacionMunicipios.pagina || 1) >= (paginacionMunicipios.totalPaginas || 1)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
