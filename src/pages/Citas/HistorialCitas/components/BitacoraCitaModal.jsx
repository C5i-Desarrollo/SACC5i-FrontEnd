import { createPortal } from 'react-dom';

function formatFechaHora(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', ' |');
}

export default function BitacoraCitaModal({ cita, eventos, onClose }) {
  const statusLabel = cita?.estado === 'completada'
    ? 'CONCLUIDO / ASISTIÓ'
    : cita?.estado === 'cancelada'
      ? 'NO ASISTIÓ / RECHAZADO'
      : cita?.estado === 'reprogramada'
        ? 'REAGENDADA'
        : 'PROGRAMADA';

  const getEventoVisual = (ev) => {
    const nombre = String(ev?.evento || '').toLowerCase();
    if (nombre.includes('finaliz') || nombre.includes('acuse')) {
      return { tone: 'gold', icon: 'bx-star' };
    }
    if (nombre.includes('checkin') || nombre.includes('asisten')) {
      return { tone: 'green', icon: 'bx-check-shield' };
    }
    if (nombre.includes('programada') || nombre.includes('reprogram')) {
      return { tone: 'blue', icon: 'bx-calendar' };
    }
    if (nombre.includes('cancel') || nombre.includes('rechaz')) {
      return { tone: 'red', icon: 'bx-x-circle' };
    }
    return { tone: 'gray', icon: 'bx-time-five' };
  };

  const getFechasReprogramacion = (ev) => {
    const nombre = String(ev?.evento || '').toLowerCase();
    if (!nombre.includes('reprogram')) return null;

    const fechaAnterior = ev?.metadata?.fecha_anterior ? formatFechaHora(ev.metadata.fecha_anterior) : null;
    const fechaNueva = ev?.metadata?.fecha_nueva ? formatFechaHora(ev.metadata.fecha_nueva) : null;

    if (!fechaAnterior && !fechaNueva) return null;

    return {
      fechaAnterior: fechaAnterior || '—',
      fechaNueva: fechaNueva || '—'
    };
  };

  const modalContent = (
    <div className="hc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hc-modal hc-modal-bitacora" role="dialog" aria-modal="true">
        <div className="hc-modal-header hc-bitacora-header">
          <div>
            <h3>Bitácora de Seguimiento y Asistencia</h3>
            <p className="hc-modal-subtitle hc-bitacora-subtitle">
              Expediente: <strong>{cita?.nombre_completo}</strong> (Folio {cita?.folio_cita})
            </p>
          </div>

          <span className="hc-bitacora-badge">
            <i className="bx bx-check-circle"></i> {statusLabel}
          </span>

          <button type="button" className="hc-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="hc-modal-body">
          <div className="hc-timeline">
            {eventos.length === 0 ? (
              <p className="hc-empty-timeline">Sin movimientos registrados</p>
            ) : (
              eventos.map((ev, idx) => {
                const visual = getEventoVisual(ev);
                const fechasReprogramacion = getFechasReprogramacion(ev);
                return (
                <div className="hc-timeline-item" key={ev.id}>
                  <div className={`hc-timeline-dot hc-timeline-dot-${visual.tone}`}>
                    <i className={`bx ${visual.icon}`}></i>
                  </div>
                  <div className="hc-timeline-content">
                    <small>{formatFechaHora(ev.created_at)}</small>
                    <h4>{ev.titulo}</h4>
                    {ev.detalle && <p>{ev.detalle}</p>}
                    {fechasReprogramacion && (
                      <div className="hc-reprogramacion-fechas">
                        <span><strong>Fecha anterior:</strong> {fechasReprogramacion.fechaAnterior}</span>
                        <span><strong>Nueva fecha:</strong> {fechasReprogramacion.fechaNueva}</span>
                      </div>
                    )}
                    {ev.usuario_nombre && <span className="hc-timeline-operador">Operador: {ev.usuario_nombre}</span>}
                  </div>
                  {idx !== eventos.length - 1 && <div className="hc-timeline-line" />}
                </div>
              );})
            )}
          </div>
        </div>

        <div className="hc-modal-footer">
          <button type="button" className="hc-btn hc-btn-gray" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
