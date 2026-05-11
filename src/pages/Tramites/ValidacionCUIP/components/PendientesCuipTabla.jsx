import { useState, useMemo } from 'react';
import '../styles/PendientesCuipTabla.css';
/**
 * PendientesCuipTabla — Lista de personas pendientes y en proceso de validación CUIP
 */
export default function PendientesCuipTabla({ pendientes, enProceso, onSeleccionar, onRefrescar, loading }) {
  const [busqueda, setBusqueda] = useState('');

  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 10;

  // Only show pendientes, ignore enProceso
  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return pendientes;
    const term = busqueda.toLowerCase();
    return pendientes.filter(p =>
      (p.nombre_completo || '').toLowerCase().includes(term) ||
      (p.numero_solicitud || '').toLowerCase().includes(term) ||
      (p.municipio_nombre || '').toLowerCase().includes(term)
    );
  }, [pendientes, busqueda]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-MX') : '—';



  return (
    <div className="cuip-pend-container">
      {/* Tabs removed: Only Pendientes shown */}
      <div className="cuip-pend-tabs">
        <button
          className="cuip-pend-tab activo"
          disabled
        >
          <i className='bx bx-time-five'></i>
          Pendientes <span className="cuip-pend-count">{pendientes.length}</span>
        </button>
      </div>

      <div className="cuip-pend-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, folio o municipio..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          className="cuip-pend-search"
        />
        <button className="cuip-pend-refresh" onClick={onRefrescar} title="Refrescar">
          <i className='bx bx-refresh'></i>
        </button>
        <span className="cuip-pend-total">
          {filtradas.length} persona{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="cuip-pend-loading">
          <i className='bx bx-loader-alt bx-spin'></i> Cargando...
        </div>
      ) : paginadas.length === 0 ? (
        <div className="cuip-pend-empty">
          <i className='bx bx-inbox'></i>
          <p>No hay personas pendientes de validación CUIP</p>
        </div>
      ) : (
        <div className="cuip-pend-table-wrap">
          <table className="cuip-pend-table">
            <thead>
              <tr>
                <th>Nombre del Elemento</th>
                <th>No. Solicitud</th>
                <th>Municipio</th>
                <th>Dependencia</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map(persona => (
                <tr key={persona.id}>
                  <td>
                    <div className="cuip-pend-nombre">
                      <strong>{persona.nombre_completo}</strong>
                      <small>{persona.puesto_nombre || '—'}</small>
                    </div>
                  </td>
                  <td>{persona.numero_solicitud || '—'}</td>
                  <td>{persona.municipio_nombre || '—'}</td>
                  <td>{persona.dependencia_nombre || '—'}</td>
                  <td>{formatFecha(persona.fecha_solicitud || persona.fecha_inicio_cuip)}</td>
                  <td>
                    <button
                      className="cuip-pend-btn-accion"
                      onClick={() => onSeleccionar(persona)}
                    >
                      {persona.fase_cuip === 'pendiente' ? 'Iniciar CUIP' : 'Continuar'} <i className='bx bx-right-arrow-alt'></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="cuip-pend-paginacion">
          <button
            className="cuip-pend-pag-btn"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >← Anterior</button>
          <span className="cuip-pend-pag-info">Página {pagina} de {totalPaginas}</span>
          <button
            className="cuip-pend-pag-btn"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >Siguiente →</button>
        </div>
      )}
    </div>
  );
}
