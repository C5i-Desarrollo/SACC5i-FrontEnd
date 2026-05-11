/**
 * HistorialC3 — Historial de trámites procesados por C3
 * Muestra todos los trámites que el validador C3 ha dictaminado
 * con filtros, estadísticas y tabla detallada :).
 */
import { useEffect, useState } from 'react';
import { MdHistory } from 'react-icons/md';
import { useHistorialC3 } from '../../../hooks/historial';
import HistorialStats from './components/HistorialStats';
import HistorialFiltros from './components/HistorialFiltros';
import './styles/HistorialC3.css';
import './styles/HistorialRow.css';

export default function HistorialC3({ setPageTitle }) {
  const {
    tramites,
    loading,
    filtros,
    stats,
    cargarHistorial,
    aplicarFiltros,
    limpiarFiltros,
    actualizarFiltro
  } = useHistorialC3();

  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    if (!setPageTitle) return undefined;

    setPageTitle({
      titulo: 'Historial de Dictamenes C3',
      icon: <MdHistory className="nav-icon-highlight" />
    });

    return () => setPageTitle(null);
  }, [setPageTitle]);

  const handleBusqueda = (valor) => {
    actualizarFiltro('busqueda', valor);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') aplicarFiltros();
  };

  return (
    <div className="hist-container">
      {/* Filtros y búsqueda */}
      <HistorialFiltros
        filtros={filtros}
        showFiltros={showFiltros}
        onToggle={() => setShowFiltros(!showFiltros)}
        onRefrescar={cargarHistorial}
        onActualizar={actualizarFiltro}
        onAplicar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        onBusqueda={handleBusqueda}
        onKeyDown={handleKeyDown}
      />

      {/* Estadísticas */}
      <HistorialStats stats={stats} />

      {/* Contenido */}
      {loading ? (
        <div className="hist-loading">
          <i className='bx bx-loader-alt bx-spin'></i>
          <p>Cargando historial...</p>
        </div>
      ) : tramites.length === 0 ? (
        <div className="hist-empty">
          <i className='bx bx-history'></i>
          <p>No hay trámites procesados aún</p>
          <small>Los trámites dictaminados aparecerán aquí</small>
        </div>
      ) : (
        <div className="hist-card">
          <table className="hist-table">
            <thead>
              <tr>
                <th>No. Solicitud</th>
                <th>Municipio</th>
                <th>Región</th>
                <th>Resultado</th>
                <th>Nombre Persona</th>
                <th>Puesto</th>
                <th>Analista C5</th>
                <th>Validador C3</th>
                <th>Fecha Dictamen</th>
              </tr>
            </thead>
            <tbody>
              {tramites.flatMap(tramite =>
                (tramite.personas || []).map(persona => (
                  <tr key={tramite.id + '-' + persona.id} className="hist-row">
                    <td>
                      <div className="hist-solicitud-cell">
                        <strong>{tramite.numero_solicitud || '—'}</strong>
                        <small>{tramite.tipo_oficio_nombre || ''}</small>
                      </div>
                    </td>
                    <td>{tramite.municipio_nombre || '—'}</td>
                    <td>{tramite.region_nombre || '—'}</td>
                    <td>
                      <span className={`hist-badge ${
                        persona.fase_c3 === 'rechazado_c3' || persona.rechazado ? 'hist-badge-rechazado' :
                        persona.fase_c3 === 'validado_c3' || persona.validado ? 'hist-badge-validado' :
                        persona.fase_c3 === 'dictaminado_c3' ? 'hist-badge-dictaminado' :
                        'hist-badge-pendiente'
                      }`}>
                        {persona.fase_c3 === 'rechazado_c3' || persona.rechazado ? 'Rechazado C3' :
                          persona.fase_c3 === 'validado_c3' || persona.validado ? 'Validado C3' :
                          persona.fase_c3 === 'dictaminado_c3' ? 'Dictaminado' :
                          persona.fase_c3 || (persona.validado ? 'Validado C3' : persona.rechazado ? 'Rechazado C3' : '—')}
                      </span>
                    </td>
                    <td>{
                      persona.nombre_completo
                        || [persona.nombre, persona.apellido_paterno, persona.apellido_materno].filter(Boolean).join(' ')
                        || '—'
                    }</td>
                    <td>{persona.puesto_nombre || '—'}</td>
                    <td>
                      <div className="hist-analista-cell">
                        <span>{tramite.analista_nombre || '—'}</span>
                        {tramite.analista_extension && (
                          <small>Ext. {tramite.analista_extension}</small>
                        )}
                      </div>
                    </td>
                    <td>{tramite.validador_c3_nombre || '—'}</td>
                    <td>
                      <div className="hist-fecha-cell">
                        <span>{persona.updated_at ? new Date(persona.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                        <small>{persona.updated_at ? new Date(persona.updated_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
