import '../styles/HistorialRow.css';

/**
 * Fila individual del historial C3
 * Muestra un trámite dictaminado con sus estadísticas de personas
 */
export default function HistorialRow({ tramite }) {
  const fase = tramite.fase_actual;
  const stats = tramite.personas_stats || {};

  const getFaseBadge = () => {
    const faseStr = String(fase || '').toLowerCase();

    const map = {
      'dictaminado_c3':         { text: 'Dictaminado',   cls: 'hist-badge-dictaminado' },
      'validado_c3':            { text: 'Validado C3',   cls: 'hist-badge-validado' },
      'rechazado_c3':           { text: 'Rechazado C3',  cls: 'hist-badge-rechazado' },
      'rechazado':              { text: 'Rechazado',     cls: 'hist-badge-rechazado' },
      'rechazado_no_corresponde': { text: 'No corresponde', cls: 'hist-badge-rechazado' },
    };

    if (map[fase]) return map[fase];

    // Nuevos estados dinámicos
    if (faseStr.includes('rechazado en cita') || faseStr.includes('cita cancelada')) return { text: 'Rechazado en Cita', cls: 'hist-badge-rechazado' };
    if (faseStr.includes('rechazado')) return { text: fase, cls: 'hist-badge-rechazado' };
    if (faseStr.includes('finalizado') || faseStr.includes('completa')) return { text: 'Finalizado', cls: 'hist-badge-dictaminado' };
    if (faseStr.includes('cita')) return { text: 'Cita Programada', cls: 'hist-badge-validado' };
    if (faseStr.includes('proceso') || faseStr.includes('revisión')) return { text: 'En Revisión', cls: 'hist-badge-pendiente' };
    if (faseStr.includes('aprobado') || faseStr.includes('validado')) return { text: 'Aprobado', cls: 'hist-badge-validado' };

    return { text: fase || 'Pendiente', cls: 'hist-badge-pendiente' };
  };

  const badge = getFaseBadge();

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatHora = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <tr className="hist-row">
      <td>
        <div className="hist-solicitud-cell">
          <strong>{tramite.numero_solicitud || '—'}</strong>
          <small>{tramite.tipo_oficio_nombre || ''}</small>
        </div>
      </td>
      <td>{tramite.municipio_nombre || '—'}</td>
      <td>{tramite.region_nombre || '—'}</td>
      <td>
        <span className={`hist-badge ${badge.cls}`}>
          {badge.text}
        </span>
      </td>
      <td>
        <div className="hist-stats-cell">
          <span className="hist-stat hist-stat-total" title="Total personas">
            <i className='bx bx-group'></i> {stats.total || 0}
          </span>
          {(stats.aprobados_c3 > 0) && (
            <span className="hist-stat hist-stat-ok" title="Aprobados">
              <i className='bx bx-check'></i> {stats.aprobados_c3}
            </span>
          )}
          {(stats.rechazados_c3 > 0) && (
            <span className="hist-stat hist-stat-rej" title="Rechazados/Pendientes">
              <i className='bx bx-x'></i> {stats.rechazados_c3}
            </span>
          )}
        </div>
      </td>
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
          <span>{formatFecha(tramite.updated_at)}</span>
          <small>{formatHora(tramite.updated_at)}</small>
        </div>
      </td>
    </tr>
  );
}