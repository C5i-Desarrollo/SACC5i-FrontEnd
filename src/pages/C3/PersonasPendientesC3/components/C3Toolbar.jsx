import { useState } from 'react';
import '../styles/C3Toolbar.css';

export default function C3Toolbar({
  busqueda,
  onBusquedaChange,
  seleccionadasCount,
  onAplicarDictamenLote,
  dictamenesActivos,
  onGuardarDictamenes,
  guardando,
  totalPersonas,
  onToggleSeleccionarTodas,
  todasSeleccionadas,
  onFiltrar,
  onLimpiarFiltros,
  regiones = [],
  puestos = []
}) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroDictamen, setFiltroDictamen] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('');
  const [filtroPuesto, setFiltroPuesto] = useState('');

  const handleAplicar = () => {
    if (onFiltrar) {
      onFiltrar({ dictamen: filtroDictamen, region: filtroRegion, puesto: filtroPuesto });
    }
  };

  const handleLimpiar = () => {
    setFiltroDictamen('');
    setFiltroRegion('');
    setFiltroPuesto('');
    if (onLimpiarFiltros) onLimpiarFiltros();
  };

  return (
    <div className="c3t-wrapper">
      {/* Toolbar principal */}
      <div className="c3t-bar">
        <div className="c3t-left">
          <button
            className={`c3t-filtros-btn ${mostrarFiltros ? 'c3t-filtros-btn-active' : ''}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <i className='bx bx-filter-alt'></i> Filtros
          </button>

          <div className="c3t-search-box">
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Buscar por nombre o solicitud..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
            />
          </div>
        </div>

        <div className="c3t-right">
          {seleccionadasCount > 0 && (
            <div className="c3t-batch">
              <span className="c3t-selected-count">
                <i className='bx bx-check-square'></i> {seleccionadasCount} seleccionada(s)
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) onAplicarDictamenLote(e.target.value);
                  e.target.value = '';
                }}
                className="c3t-batch-select"
              >
                <option value="">Dictamen en lote...</option>
                <option value="ALTA OK">ALTA OK</option>
                <option value="NO PUEDE SER DADO DE ALTA">No puede ser dado de alta</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          )}

          {dictamenesActivos > 0 && (
            <button className="c3t-btn-guardar" onClick={onGuardarDictamenes} disabled={guardando}>
              <i className='bx bx-save'></i>
              {guardando ? 'Guardando...' : `Guardar ${dictamenesActivos} dictamen(es)`}
            </button>
          )}

          <span className="c3t-total">Pendientes: {totalPersonas}</span>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {mostrarFiltros && (
        <div className="c3t-filtros-panel">
          <div className="c3t-filtros-grid">
            <div className="c3t-filtro-group">
              <label>Dictamen</label>
              <select value={filtroDictamen} onChange={(e) => setFiltroDictamen(e.target.value)}>
                <option value="">Todos los dictamenes</option>
                <option value="EN PROCESO">En proceso</option>
                <option value="ALTA OK">Alta OK</option>
                <option value="NO PUEDE SER DADO DE ALTA">No puede ser dado de alta</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div className="c3t-filtro-group">
              <label>Puesto</label>
              <select value={filtroPuesto} onChange={(e) => setFiltroPuesto(e.target.value)}>
                <option value="">Todos los puestos</option>
                {puestos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="c3t-filtro-actions">
              <button className="c3t-filtro-aplicar" onClick={handleAplicar}>Aplicar</button>
              <button className="c3t-filtro-limpiar" onClick={handleLimpiar}>Limpiar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}