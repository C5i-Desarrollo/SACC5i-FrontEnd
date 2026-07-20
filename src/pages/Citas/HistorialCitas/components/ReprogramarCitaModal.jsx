import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { compareIsoDates, getTodayIsoDate, isValidIsoDate } from '../../../../utils/dateValidation';

function toDateInputValue(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string' && fecha.length >= 10) return fecha.slice(0, 10);
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toTimeInputValue(hora) {
  if (!hora) return '';
  if (typeof hora === 'string' && hora.length >= 5) return hora.slice(0, 5);
  const d = new Date(hora);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ReprogramarCitaModal({
  cita,
  mode,
  onClose,
  onReprogramar,
  onCancelarDefinitivo,
  loading
}) {
  const hoyIso = useMemo(() => getTodayIsoDate(), []);
  const fechaInicial = useMemo(() => toDateInputValue(cita?.fecha_cita_local || cita?.fecha_cita), [cita]);
  const horaInicial = useMemo(() => toTimeInputValue(cita?.hora_cita_local || cita?.fecha_cita), [cita]);

  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial || '09:00');
  const [justificacion, setJustificacion] = useState('');
  // ── NUEVO ESTADO PARA EL CORREO ──
  const [correo, setCorreo] = useState(cita?.correo_destinatario || '');
  const [error, setError] = useState('');

  const title = mode === 'cancelar' ? 'Cancelar / Reagendar cita' : 'Reagendar cita';

  const handleConfirmar = () => {
    if (!fecha || !hora) {
      setError('Debes seleccionar fecha y hora');
      return;
    }

    if (!isValidIsoDate(fecha)) {
      setError('La fecha seleccionada no es valida');
      return;
    }

    if (compareIsoDates(fecha, hoyIso) === -1) {
      setError('La nueva cita no puede programarse en una fecha pasada');
      return;
    }

    if (!justificacion || justificacion.trim().length < 10) {
      setError('La justificación debe tener al menos 10 caracteres');
      return;
    }

    if (correo && !correo.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    onReprogramar({
      fecha_cita: `${fecha}T${hora}:00`,
      justificacion: justificacion.trim(),
      // ── ENVIAMOS EL CORREO SI LO MODIFICARON ──
      nuevo_correo: correo.trim()
    });
  };

  const modalContent = (
    <div className="hc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hc-modal hc-modal-reagenda" role="dialog" aria-modal="true">
        <div className="hc-modal-header hc-modal-header-guinda">
          <h3>{title}</h3>
          <button type="button" className="hc-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="hc-modal-body">
          <div className="hc-persona-card">
            <div className="hc-persona-icon"><i className="bx bx-user-circle"></i></div>
            <div>
              <p className="hc-modal-subtitle">Solicitante: <strong>{cita?.nombre_completo}</strong></p>
              <small>Folio: {cita?.folio_cita || '—'}</small>
            </div>
          </div>

          <div className="hc-form-grid">
            <div className="hc-field">
              <label>Fecha anterior</label>
              <input type="text" value={`${fechaInicial || '—'} ${horaInicial || ''}`.trim()} disabled />
            </div>
          </div>

          <div className="hc-form-grid hc-form-grid-2">
            <div className="hc-field">
              <label>Nueva fecha *</label>
              <input type="date" value={fecha} min={hoyIso} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="hc-field">
              <label>Nueva hora *</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          {/* ── NUEVO CAMPO DE CORREO ── */}
          <div className="hc-field">
            <label>Correo de notificación (opcional)</label>
            <input 
              type="email" 
              value={correo} 
              onChange={(e) => setCorreo(e.target.value)} 
              placeholder="anótalo aquí si necesitas corregirlo..." 
            />
            <small>Si cambió o rebotó el anterior, ingresa el correo correcto aquí para reenviar el acuse.</small>
          </div>

          <div className="hc-field">
            <label>Justificación del cambio *</label>
            <textarea
              rows={3}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Ejemplo: Se reagenda por incidencia de asistencia o error en correo"
            />
            <small>Mínimo 10 caracteres</small>
          </div>

          <div className="hc-preview-mini">
            <strong>Vista previa de nueva programación</strong>
            <p>Fecha: {fecha || '—'} · Hora: {hora || '—'} {correo ? `· Correo: ${correo}` : ''}</p>
          </div>

          {error && <p className="hc-form-error">{error}</p>}
        </div>

        <div className="hc-modal-footer">
          <button type="button" className="hc-btn hc-btn-gray" onClick={onClose} disabled={loading}>Cancelar</button>
          {mode === 'cancelar' && (
            <button
              type="button"
              className="hc-btn hc-btn-danger"
              onClick={() => onCancelarDefinitivo(justificacion || 'Cancelación manual')}
              disabled={loading}
            >
              CANCELAR CITA
            </button>
          )}
          <button type="button" className="hc-btn hc-btn-guinda" onClick={handleConfirmar} disabled={loading}>
            CONFIRMAR NUEVA CITA
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}