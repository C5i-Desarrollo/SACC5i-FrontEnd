import '../styles/HistorialFiltros.css';
/**
 * Panel de filtros del historial C3
 */
export default function HistorialFiltros({
  filtros,
  showFiltros,
  onToggle,
  onRefrescar,
  onActualizar,
  onAplicar,
  onLimpiar,
  onBusqueda,
  onKeyDown
}) {
  return (
    <>
      {/* Toolbar */}
      <div className="hist-toolbar">
        <div className="hist-toolbar-row hist-toolbar-row-main">
          <div className="hist-search-wrap">
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Buscar por nombre, solicitud o municipio"
              value={filtros.busqueda}
              onChange={(e) => onBusqueda(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <button
              type="button"
              className={`hist-search-filter-btn ${showFiltros ? 'is-active' : ''}`}
              aria-label="Mostrar filtros"
              onClick={onToggle}
            >
              <i className='bx bx-slider-alt'></i>
            </button>

            {filtros.busqueda && (
              <button
                type="button"
                className="hist-search-clear"
                aria-label="Limpiar búsqueda"
                onClick={() => onBusqueda('')}
              >
                <i className='bx bx-x'></i>
              </button>
            )}
          </div>

          <button className="hist-refresh-btn-small" onClick={onRefrescar} title="Refrescar">
            <i className='bx bx-refresh'></i>
          </button>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFiltros && (
        <div className="hist-filtros-panel">
          <div className="hist-filtro-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => onActualizar('fecha_inicio', e.target.value)}
            />
          </div>
          <div className="hist-filtro-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => onActualizar('fecha_fin', e.target.value)}
            />
          </div>
          <div className="hist-filtro-group">
            <label>Resultado</label>
            <select
              value={filtros.dictamen}
              onChange={(e) => onActualizar('dictamen', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="dictaminado_c3">Dictaminado</option>
              <option value="validado_c3">Validado C3</option>
              <option value="rechazado_c3">Rechazado C3</option>
              <option value="rechazado">Rechazado</option>
              <option value="rechazado_no_corresponde">No Corresponde</option>
            </select>
          </div>
          <div className="hist-filtros-actions">
            <button className="hist-btn-aplicar" onClick={onAplicar}>Aplicar</button>
            <button className="hist-btn-limpiar" onClick={onLimpiar}>Limpiar</button>
          </div>
        </div>
      )}
    </>
  );
}
