import { useState, useMemo } from 'react';
import '../styles/PendientesRevisionTabla.css';
/**
 * PendientesRevisionTabla - Lista de personas pendientes y en proceso de revisión
 * Permite seleccionar una persona para iniciar o continuar su revisión.
 */
export default function PendientesRevisionTabla({ pendientes, enProceso, onSeleccionar, onRefrescar, loading }) {
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

  const getFaseBadge = (persona) => {
    const fase = persona.fase_revision;
    const map = {
      pendiente: { text: 'PENDIENTE', cls: 'rev-badge-pendiente' },
      en_proceso: { text: 'EN PROCESO', cls: 'rev-badge-proceso' },
      antecedentes: { text: 'ANTECEDENTES', cls: 'rev-badge-proceso' },
      documentos: { text: 'DOCUMENTOS', cls: 'rev-badge-docs' }
    };
    return map[fase] || { text: fase, cls: 'rev-badge-pendiente' };
  };

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-MX') : '—';



  return (
    <div className="rev-pendientes-container">
      {/* Tabs removed: Only Pendientes shown */}
      <div className="rev-pend-tabs">
        <button
          className="rev-pend-tab activo"
          disabled
        >
          <i className='bx bx-time-five'></i>
          Pendientes <span className="rev-pend-count">{pendientes.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="rev-pend-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, folio o municipio..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          className="rev-pend-search"
        />
        <button className="rev-pend-refresh" onClick={onRefrescar} title="Refrescar">
          <i className='bx bx-refresh'></i>
        </button>
        <span className="rev-pend-total">
          {filtradas.length} persona{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="rev-pend-loading">
          <i className='bx bx-loader-alt bx-spin'></i> Cargando...
        </div>
      ) : paginadas.length === 0 ? (
        <div className="rev-pend-empty">
          <i className='bx bx-inbox'></i>
          <p>No hay personas pendientes de revisión</p>
        </div>
      ) : (
        <div className="rev-pend-table-wrap">
          <table className="rev-pend-table">
            <thead>
              <tr>
                <th>Nombre del Elemento</th>
                <th>No. Solicitud</th>
                <th>Municipio</th>
                <th>Dependencia</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map(persona => {
                const badge = getFaseBadge(persona);
                return (
                  <tr key={persona.id}>
                    <td>
                      <div className="rev-pend-nombre">
                        <strong>{persona.nombre_completo}</strong>
                        <small>{persona.puesto_nombre || '—'}</small>
                      </div>
                    </td>
                    <td>{persona.numero_solicitud || '—'}</td>
                    <td>{persona.municipio_nombre || '—'}</td>
                    <td>{persona.dependencia_nombre || '—'}</td>
                    <td>{formatFecha(persona.fecha_solicitud || persona.fecha_inicio_revision)}</td>
                    <td>
                      <span className={`rev-pend-badge ${badge.cls}`}>{badge.text}</span>
                    </td>
                    <td>
                      <button
                        className="rev-pend-btn-accion"
                        onClick={() => onSeleccionar(persona)}
                      >
                        {persona.fase_revision === 'pendiente' ? 'Iniciar Revisión' : 'Continuar'} <i className='bx bx-right-arrow-alt'></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="rev-pend-paginacion">
          <button
            className="rev-pend-pag-btn"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >← Anterior</button>
          <span className="rev-pend-pag-info">Página {pagina} de {totalPaginas}</span>
          <button
            className="rev-pend-pag-btn"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >Siguiente →</button>
        </div>
      )}
    </div>
  );
}
