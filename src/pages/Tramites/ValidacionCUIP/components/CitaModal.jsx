import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { buildTextoNotificacionCita, copyTextToClipboard } from '../../../../services/citaNotificacionService';
import { compareIsoDates, getTodayIsoDate, isValidIsoDate, shiftIsoDate } from '../../../../utils/dateValidation';
import '../styles/CitaModal.css';

/**
 * CitaModal — Modal para programar la cita biométrica
 * Se abre al hacer clic en "Aprobar y generar cita" después de completar el CUIP.
 */
export default function CitaModal({ persona, onConfirmar, onCancelar, submitting }) {
  const { user } = useAuth();
  const todayIso = getTodayIsoDate();
  const fechaMin = shiftIsoDate(todayIso, 1);

  const [paso, setPaso] = useState(1);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [lugar, setLugar] = useState('RPSP — Area de Toma de Datos Biometricos');
  const [notas, setNotas] = useState('');
  const [emailOverride, setEmailOverride] = useState('');
  const [errores, setErrores] = useState({});
  const [copying, setCopying] = useState(false);

  const correoPausado = true;

  const nombreCompleto = persona?.nombre_completo ||
    `${persona?.nombre || ''} ${persona?.apellido_paterno || ''}`.trim();

  const analistaNombre = user?.nombre_completo || 'Analista';
  const analistaEmail  = user?.email || '(correo institucional)';
  const emailDestino   = emailOverride.trim() || '(correo institucional del analista responsable)';

  const fechaFormateada = fecha
    ? new Date(`${fecha}T12:00:00`)
        .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .toUpperCase()
    : '—';
  const horaFormateada = hora ? `${hora} HRS` : '—';

  const validar = () => {
    const e = {};
    if (!fecha) {
      e.fecha = 'Selecciona una fecha para la cita';
    } else if (!isValidIsoDate(fecha)) {
      e.fecha = 'La fecha de cita no es valida';
    } else if (compareIsoDates(fecha, fechaMin) === -1) {
      e.fecha = `La fecha de cita debe ser igual o posterior a ${fechaMin}`;
    }

    if (!hora) e.hora = 'Selecciona un horario';
    if (!lugar.trim()) e.lugar = 'El lugar es obligatorio';
    if (emailOverride && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOverride)) {
      e.emailOverride = 'Correo de prueba inválido';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const irAPaso2 = () => { if (validar()) setPaso(2); };

  const handleConfirmar = () => {
    onConfirmar({
      fecha_cita: `${fecha}T${hora}:00`,
      lugar: lugar.trim(),
      notas: notas.trim() || undefined,
      email_override: emailOverride.trim() || undefined,
      enviar_notificacion: true
    });
  };

  const handleCopiarYGenerar = async () => {
    const texto = buildTextoNotificacionCita({
      analistaEmail,
      analistaNombre,
      destinatarioEmail: emailDestino,
      nombreCompleto,
      puestoNombre: persona?.puesto_nombre,
      fecha,
      hora,
      lugar
    });

    try {
      setCopying(true);
      await copyTextToClipboard(texto);
      onConfirmar({
        fecha_cita: `${fecha}T${hora}:00`,
        lugar: lugar.trim(),
        notas: notas.trim() || undefined,
        email_override: emailOverride.trim() || undefined,
        enviar_notificacion: false
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="cm-overlay" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className={`cm-modal${paso === 2 ? ' cm-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cm-title">

      {paso === 1 ? (
        <>
        {/* ── PASO 1: Formulario ── */}
        <div className="cm-header">
          <div className="cm-header-icon">
            <i className="bx bx-calendar-check"></i>
          </div>
          <div>
            <h2 id="cm-title" className="cm-title">Agendar Cita</h2>
            <p className="cm-subtitle">Programación de toma de datos biométricos</p>
          </div>
          <button className="cm-close" onClick={onCancelar} aria-label="Cerrar">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Persona info */}
        <div className="cm-persona-card">
          <i className="bx bx-user-circle cm-persona-icon"></i>
          <div>
            <p className="cm-persona-nombre">{nombreCompleto}</p>
            <p className="cm-persona-sub">
              {persona?.puesto_nombre || '—'}
              &nbsp;·&nbsp;
              Oficio C3: <strong>{persona?.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : 'N/A'}</strong>
            </p>
          </div>
        </div>

        <div className="cm-body">
          {/* Fecha + Hora */}
          <div className="cm-row">
            <div className="cm-field">
              <label className="cm-label">
                <i className="bx bx-calendar"></i> Fecha de la cita *
              </label>
              <input
                type="date"
                className={`cm-input ${errores.fecha ? 'cm-input-error' : ''}`}
                value={fecha}
                min={fechaMin}
                onChange={e => { setFecha(e.target.value); setErrores(p => ({ ...p, fecha: undefined })); }}
              />
              {errores.fecha && <span className="cm-error-msg">{errores.fecha}</span>}
            </div>

            <div className="cm-field">
              <label className="cm-label">
                <i className="bx bx-time"></i> Hora de la cita *
              </label>
              <input
                type="time"
                className={`cm-input ${errores.hora ? 'cm-input-error' : ''}`}
                value={hora}
                onChange={e => { setHora(e.target.value); setErrores(p => ({ ...p, hora: undefined })); }}
              />
              {errores.hora && <span className="cm-error-msg">{errores.hora}</span>}
            </div>
          </div>

          {/* Lugar */}
          <div className="cm-field">
            <label className="cm-label">
              <i className="bx bx-map-pin"></i> Lugar de la cita *
            </label>
            <input
              type="text"
              className={`cm-input ${errores.lugar ? 'cm-input-error' : ''}`}
              value={lugar}
              onChange={e => { setLugar(e.target.value); setErrores(p => ({ ...p, lugar: undefined })); }}
              placeholder="Ej. RPSP — Area de Toma de Datos Biometricos"
            />
            {errores.lugar && <span className="cm-error-msg">{errores.lugar}</span>}
          </div>

          {/* Notas opcionales */}
          <div className="cm-field">
            <label className="cm-label">
              <i className="bx bx-note"></i> Notas adicionales (opcional)
            </label>
            <textarea
              className="cm-textarea"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Indicaciones especiales, número de sala, etc."
            />
          </div>

          {/* Email de prueba */}
          <div className="cm-field cm-field-test">
            <label className="cm-label cm-label-test">
              <i className="bx bx-test-tube"></i> Correo de prueba 
              <span className="cm-badge-test">Solo pruebas</span>
            </label>
            <input
              type="email"
              className={`cm-input ${errores.emailOverride ? 'cm-input-error' : ''}`}
              value={emailOverride}
              onChange={e => { setEmailOverride(e.target.value); setErrores(p => ({ ...p, emailOverride: undefined })); }}
              placeholder="tu@correo.com — redirige el correo a esta dirección"
            />
            {errores.emailOverride && <span className="cm-error-msg">{errores.emailOverride}</span>}
            <p className="cm-hint">
              Si se especifica, el correo se enviará a esta dirección en lugar del analista registrado.
              Útil durante pruebas antes de pasar a producción.
            </p>
          </div>

          {/* Info notificación */}
          <div className="cm-info-notif">
            <i className="bx bx-envelope"></i>
            <p>
              Al confirmar, el sistema enviará automáticamente una <strong>notificación por correo</strong> al
              analista responsable con los detalles de la cita y el <strong>acuse en PDF adjunto</strong>.
            </p>
          </div>
        </div>

        {/* Acciones paso 1 */}
        <div className="cm-footer">
          <button className="cm-btn-cancelar" onClick={onCancelar} disabled={submitting}>
            Cancelar
          </button>
          <button className="cm-btn-preview" onClick={irAPaso2}>
            <i className="bx bx-envelope"></i> Vista previa
          </button>
        </div>
        </>
      ) : (
        <>
        {/* ── PASO 2: Preview del correo ── */}
        <div className="cm-header">
          <div className="cm-header-icon cm-header-icon-send">
            <i className="bx bx-send"></i>
          </div>
          <div>
            <h2 id="cm-title" className="cm-title">Agendar Cita</h2>
            <p className="cm-subtitle">Redacción de Notificación Oficial</p>
          </div>
          <button className="cm-close" onClick={onCancelar} aria-label="Cerrar">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="cm-preview-wrap">
          <div className="cm-preview-card">
            <h3 className="cm-preview-titulo">Agendar cita para la toma de datos biométricos</h3>

            <table className="cm-meta-table">
              <tbody>
                <tr>
                  <td className="cm-meta-lbl">De:</td>
                  <td className="cm-meta-val">{analistaEmail}</td>
                </tr>
                <tr>
                  <td className="cm-meta-lbl">Para:</td>
                  <td className="cm-meta-val">{nombreCompleto} &lt;{emailDestino}&gt;</td>
                </tr>
                <tr>
                  <td className="cm-meta-lbl">Asunto:</td>
                  <td className="cm-meta-val cm-meta-asunto">CITA PROGRAMADA - Toma de Datos Biométricos</td>
                </tr>
              </tbody>
            </table>

            <div className="cm-email-box">
              <div className="cm-email-gov">
                <div className="cm-email-gov-brand">
                  <span className="cm-email-gov-icon">🏛️</span>
                  <div>
                    <strong>GOBIERNO DEL ESTADO DE PUEBLA</strong>
                    <small>LA CAPITAL IMPARABLE</small>
                  </div>
                </div>
              </div>
              <div className="cm-email-content">
                <p>Estimado(a) <strong>{persona?.puesto_nombre || 'Presidente'} {nombreCompleto}</strong>,</p>
                <p>
                  Por medio de la presente se le notifica que su cita ha sido programada para el día{' '}
                  <strong>{fechaFormateada}</strong> a las <strong>{horaFormateada}</strong>.{' '}
                  Le solicitamos presentarse en las instalaciones del Centro de Control de Confianza C5 con los siguientes documentos:
                </p>
                <ul>
                  <li>Identificación oficial vigente</li>
                  <li>Comprobante de domicilio reciente</li>
                  <li>Acuse de cita adjunto (impreso)</li>
                </ul>
                <p>Atentamente,</p>
                <p><strong>{analistaNombre} — Analista</strong></p>
                <p className="cm-email-lugar">{lugar}</p>
              </div>
            </div>

            <div className="cm-attachment-section">
              <p className="cm-attachment-title">ARCHIVOS ADJUNTOS</p>
              <div className="cm-attachment-item">
                <div className="cm-att-icon"><i className="bx bxs-file-pdf"></i></div>
                <div className="cm-att-info">
                  <span className="cm-att-name">Acuse_Cita_Folio_[Auto].pdf</span>
                  <span className="cm-att-size">Se genera automáticamente</span>
                </div>
                <div className="cm-att-check"><i className="bx bx-check-circle"></i></div>
              </div>
            </div>
          </div>
        </div>

        <div className="cm-footer cm-footer-step2">
          <button className="cm-btn-back" onClick={() => setPaso(1)} disabled={submitting}>
            <i className="bx bx-arrow-back"></i> Atrás
          </button>
          <div className="cm-footer-actions">
          <button className="cm-btn-copy-generate" onClick={handleCopiarYGenerar} disabled={submitting || copying}>
            {submitting || copying
              ? <><i className="bx bx-loader-alt bx-spin"></i> Generando...</>
              : <><i className="bx bx-copy"></i> COPIAR Y GENERAR CITA</>
            }
          </button>
          <button
            className="cm-btn-send"
            onClick={handleConfirmar}
            disabled={submitting || correoPausado}
            title={correoPausado ? 'El envío de correo está pausado temporalmente' : ''}
          >
            {submitting
              ? <><i className="bx bx-loader-alt bx-spin"></i> Enviando...</>
              : <><i className="bx bx-send"></i> ENVIAR NOTIFICACIÓN {correoPausado ? '(PAUSADO)' : ''}</>
            }
          </button>
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
