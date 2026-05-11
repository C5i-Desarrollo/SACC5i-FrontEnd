import { useState } from 'react';
import '../styles/EnProcesoToolbar.css';

export default function EnProcesoToolbar({ busqueda, onBusquedaChange, onRefresh, total, onFiltrar, onLimpiar }) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [dependencia, setDependencia] = useState('');
  const [estatus, setEstatus] = useState('');

  const handleAplicar = () => {
    if (onFiltrar) {
      onFiltrar({ dependencia, estatus });
    }
  };

  const handleLimpiar = () => {
    setDependencia('');
    setEstatus('');
    if (onLimpiar) onLimpiar();
  };

  return (
    <div className="ep-toolbar-wrapper">
      <div className="ep-toolbar">
        <button 
          className={`ep-filtros-btn ${mostrarFiltros ? 'ep-filtros-btn-active' : ''}`}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <i className='bx bx-filter-alt'></i> Filtros
        </button>

        <div className="ep-search-box">
          <i className='bx bx-search'></i>
          <input
            type="text"
            placeholder="Buscar por ..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>

        <button className="ep-refresh-btn" onClick={onRefresh} title="Refrescar">
          <i className='bx bx-refresh'></i>
        </button>

        <span className="ep-total">Tramite: {total}</span>
      </div>

      {mostrarFiltros && (
        <div className="ep-filtros-panel">
          <div className="ep-filtros-grid">
            <div className="ep-filtro-group">
              <label>Dependencia / Motivo</label>
              <select value={dependencia} onChange={(e) => setDependencia(e.target.value)}>
                <option value="">Todas las dependencias</option>
                <option value="rnpsp">Consulta en RNPSP</option>
                <option value="suic">Consulta en SUIC</option>
                <option value="sim">Consulta en SIM</option>
              </select>
            </div>
            <div className="ep-filtro-group">
              <label>Estatus del Proceso</label>
              <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
                <option value="">Todos los estatus</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
              </select>
            </div>
            <div className="ep-filtro-actions">
              <button className="ep-filtro-aplicar" onClick={handleAplicar}>Aplicar</button>
              <button className="ep-filtro-limpiar" onClick={handleLimpiar}>Limpiar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}