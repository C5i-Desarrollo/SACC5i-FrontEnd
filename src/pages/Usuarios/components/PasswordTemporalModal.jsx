import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  FiX,
  FiClock,
  FiCopy,
  FiRefreshCw,
  FiTrash2,
  FiKey,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUser,
  FiUserCheck
} from 'react-icons/fi';
import '../styles/PasswordTemporalModal.css';

// CAMBIO: Ahora permite elegir exactamente 1, 3, 7, 10, 30 y 40 días
const DURACIONES = [1, 3, 7, 10, 30, 40];

const ACTION_TEXT = {
  generada: 'Contraseña temporal generada',
  revocada: 'Contraseña temporal revocada',
  usada: 'Acceso temporal utilizado',
  expirada: 'Contraseña temporal expirada'
};

const formatFechaHora = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', ' |');
};

const getEventoVisual = (accion) => {
  switch (String(accion || '').toLowerCase()) {
    case 'generada':
      return { tone: 'blue', icon: FiKey, label: ACTION_TEXT.generada };
    case 'usada':
      return { tone: 'green', icon: FiCheckCircle, label: ACTION_TEXT.usada };
    case 'revocada':
      return { tone: 'red', icon: FiXCircle, label: ACTION_TEXT.revocada };
    case 'expirada':
      return { tone: 'gray', icon: FiClock, label: ACTION_TEXT.expirada };
    default:
      return { tone: 'gray', icon: FiAlertCircle, label: 'Movimiento registrado' };
  }
};

export default function PasswordTemporalModal({
  open,
  usuario,
  estado,
  loading,
  processing,
  generatedPassword,
  onClose,
  onRefresh,
  onGenerate,
  onRevoke,
  onCopyPassword
}) {
  const [duracionDias, setDuracionDias] = useState('7');
  const [motivo, setMotivo] = useState('Cobertura por vacaciones');
  const [usuarioTemporal, setUsuarioTemporal] = useState(''); // CAMBIO: Guardar el nuevo usuario
  const [motivoRevocacion, setMotivoRevocacion] = useState('');

  const accesoActivo = estado?.acceso_activo || null;
  const bitacora = useMemo(() => estado?.bitacora || [], [estado]);

  useEffect(() => {
    if (!open) return;
    setDuracionDias('7');
    setMotivo('Cobertura por vacaciones');
    setUsuarioTemporal('');
    setMotivoRevocacion('');
  }, [open, usuario?.id]);

  if (!open || !usuario) return null;

  const handleGenerate = (event) => {
    event.preventDefault();
    if (!usuarioTemporal.trim()) {
      alert('Debes ingresar un nombre o usuario para la persona que lo ocupará temporalmente');
      return;
    }
    onGenerate({
      duracion_dias: Number(duracionDias),
      motivo: String(motivo || '').trim() || undefined,
      usuario_temporal: String(usuarioTemporal || '').trim()
    });
  };

  const handleRevoke = () => {
    onRevoke({
      motivo: String(motivoRevocacion || '').trim() || undefined
    });
  };

  const modalContent = (
    <div className="uptm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="uptm-modal" role="dialog" aria-modal="true" aria-label="Gestión de contraseña temporal">
        <div className="uptm-header">
          <div>
            <h3>Gestión de Contraseña Temporal</h3>
            <p className="uptm-subtitle">
              <FiUser size={14} />
              <strong>{usuario.nombre_completo}</strong>
              <span>@{usuario.usuario}</span>
            </p>
          </div>

          <span className={`uptm-status-badge ${accesoActivo ? 'active' : 'inactive'}`}>
            <FiShield size={13} /> {accesoActivo ? 'Temporal activa' : 'Sin temporal activa'}
          </span>

          <button type="button" className="uptm-close" onClick={onClose} aria-label="Cerrar modal">
            <FiX size={18} />
          </button>
        </div>

        <div className="uptm-body">
          <section className="uptm-card">
            <div className="uptm-card-title-row">
              <h4>Generar contraseña de delegación</h4>
              <button
                type="button"
                className="uptm-btn uptm-btn-light"
                onClick={onRefresh}
                disabled={loading || processing}
              >
                <FiRefreshCw size={14} /> Actualizar
              </button>
            </div>

            <form className="uptm-grid" onSubmit={handleGenerate}>
              <div className="uptm-field uptm-field-full">
                <label>Usuario / Nombre de la persona delegada *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiUserCheck style={{ position: 'absolute', left: '10px', color: '#666' }} />
                  <input
                    type="text"
                    style={{ paddingLeft: '32px', width: '100%' }}
                    value={usuarioTemporal}
                    onChange={(e) => setUsuarioTemporal(e.target.value)}
                    placeholder="Ej. Roberto Gómez - Cubre turno"
                    disabled={Boolean(accesoActivo) || loading || processing}
                    required
                  />
                </div>
              </div>

              <div className="uptm-field">
                <label>Duración (máximo 40 días)</label>
                <select
                  value={duracionDias}
                  onChange={(e) => setDuracionDias(e.target.value)}
                  disabled={Boolean(accesoActivo) || loading || processing}
                >
                  {DURACIONES.map((dias) => (
                    <option key={dias} value={dias}>
                      {dias} día{dias === 1 ? '' : 's'} {dias === 40 ? '(Límite máximo)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="uptm-field uptm-field-full">
                <label>Causa o motivo</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ej. Cobertura por vacaciones del titular"
                  disabled={Boolean(accesoActivo) || loading || processing}
                />
              </div>

              <div className="uptm-actions uptm-field-full">
                <button
                  type="submit"
                  className="uptm-btn uptm-btn-primary"
                  disabled={Boolean(accesoActivo) || loading || processing}
                >
                  <FiKey size={15} /> Generar contraseña temporal
                </button>
              </div>
            </form>

            {accesoActivo && (
              <p className="uptm-hint uptm-hint-warning">
                Ya existe una contraseña temporal activa. Debes revocarla para generar una nueva.
              </p>
            )}
          </section>

          {generatedPassword && (
            <section className="uptm-card uptm-secret-card">
              <h4>Contraseña temporal recién generada</h4>
              <p className="uptm-secret-help">
                Compártela por un canal seguro. Solo se mostrará completa en este momento.
              </p>
              <div className="uptm-secret-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <small style={{ color: '#666' }}>Usuario temporal: <strong>{accesoActivo?.usuario_temporal || usuarioTemporal}</strong></small>
                  <code>Contraseña: {generatedPassword}</code>
                </div>
                <button
                  type="button"
                  className="uptm-btn uptm-btn-copy"
                  onClick={() => onCopyPassword(`Usuario: ${accesoActivo?.usuario_temporal || usuarioTemporal} | Contraseña: ${generatedPassword}`)}
                >
                  <FiCopy size={15} /> Copiar
                </button>
              </div>
            </section>
          )}

          <section className="uptm-card">
            <h4>Estado actual</h4>
            {loading ? (
              <p className="uptm-empty">Cargando estado...</p>
            ) : accesoActivo ? (
              <>
                <div className="uptm-status-grid">
                  {accesoActivo.usuario_temporal && (
                    <div style={{ gridColumn: '1 / -1', background: '#f5f5f5', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #007bff' }}>
                      <span className="uptm-label">Persona delegada actualmente:</span>
                      <strong style={{ fontSize: '14px', color: '#333' }}>
                        <FiUserCheck style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        {accesoActivo.usuario_temporal}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="uptm-label">Creada por</span>
                    <strong>{accesoActivo.creado_por_nombre || 'Sistema'}</strong>
                  </div>
                  <div>
                    <span className="uptm-label">Creada</span>
                    <strong>{formatFechaHora(accesoActivo.created_at)}</strong>
                  </div>
                  <div>
                    <span className="uptm-label">Expira</span>
                    <strong>{formatFechaHora(accesoActivo.expires_at)}</strong>
                  </div>
                  <div>
                    <span className="uptm-label">Usos</span>
                    <strong>{accesoActivo.total_usos}</strong>
                  </div>
                </div>

                {accesoActivo.motivo && (
                  <p className="uptm-status-motivo">
                    <span>Motivo:</span> {accesoActivo.motivo}
                  </p>
                )}

                {!generatedPassword && (
                  <p className="uptm-secret-help">
                    Por seguridad, la contraseña temporal activa no se puede volver a mostrar en texto plano.
                    Si necesitas una nueva, revoca la actual y genera otra.
                  </p>
                )}

                <div className="uptm-field uptm-field-full uptm-revoke-field">
                  <label>Motivo de revocación (opcional)</label>
                  <input
                    type="text"
                    value={motivoRevocacion}
                    onChange={(e) => setMotivoRevocacion(e.target.value)}
                    placeholder="Ej. El titular regresó a sus funciones"
                    disabled={processing}
                  />
                </div>

                <div className="uptm-actions">
                  <button
                    type="button"
                    className="uptm-btn uptm-btn-danger"
                    onClick={handleRevoke}
                    disabled={processing}
                  >
                    <FiTrash2 size={15} /> Revocar contraseña temporal
                  </button>
                </div>
              </>
            ) : (
              <p className="uptm-empty">No hay contraseña temporal activa para este usuario.</p>
            )}
          </section>

          <section className="uptm-card uptm-card-bitacora">
            <h4>Bitácora de movimientos</h4>
            <div className="uptm-timeline">
              {bitacora.length === 0 ? (
                <p className="uptm-empty">Sin movimientos registrados.</p>
              ) : (
                bitacora.map((evento, idx) => {
                  const visual = getEventoVisual(evento.accion);
                  const Icon = visual.icon;

                  return (
                    <div className="uptm-timeline-item" key={evento.id}>
                      <div className={`uptm-timeline-dot tone-${visual.tone}`}>
                        <Icon size={15} />
                      </div>
                      <div className="uptm-timeline-content">
                        <small>{formatFechaHora(evento.created_at)}</small>
                        <h5>{visual.label}</h5>
                        <p>{evento.descripcion}</p>
                        {(evento.actor_nombre || evento.actor_rol) && (
                          <span className="uptm-actor-chip">
                            {evento.actor_nombre || 'Sistema'}
                            {evento.actor_rol ? ` (${evento.actor_rol})` : ''}
                          </span>
                        )}
                      </div>
                      {idx !== bitacora.length - 1 && <div className="uptm-timeline-line" />}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="uptm-footer">
          <button type="button" className="uptm-btn uptm-btn-light" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}