import { useState } from 'react';
import { createPortal } from 'react-dom';

function formatFecha(value) {
  if (!value) return '—';
  const base = String(value).includes('T') ? value : `${value}T12:00:00`;
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export default function ContinuarProcesoCita({
  cita,
  onClose,
  onFinalizar,
  onCancelarNoAsistio,
  onAbrirReagenda,
  loading
}) {
  const [asistio, setAsistio] = useState(null);
  const [suimResultado, setSuimResultado] = useState('');
  const [justificacionMenores, setJustificacionMenores] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [cuipCapturado, setCuipCapturado] = useState('');
  const [error, setError] = useState('');

  const requiereJustificacion = suimResultado === 'antecedentes_menores';
  const justificacionValida = justificacionMenores.trim().length >= 15;
  const puedeCerrarPaso2 = asistio === true && (
    suimResultado === 'sin_antecedentes' ||
    suimResultado === 'antecedentes_graves' ||
    (requiereJustificacion && justificacionValida)
  );

  const textoAccionPrincipal = suimResultado === 'antecedentes_graves'
    ? 'RECHAZAR TRÁMITE'
    : 'FINALIZAR TRÁMITE';

  const fechaFinalizacion = formatFecha(cita?.fecha_cita_local || cita?.fecha_cita || new Date().toISOString());

  const handleFinalizar = async () => {
    if (asistio !== true) return;

    if (!puedeCerrarPaso2) {
      setError('Completa la evaluación SIM para continuar.');
      return;
    }

    if (suimResultado === 'antecedentes_graves') {
      await onFinalizar({
        asistio: true,
        suim_resultado: suimResultado,
        justificacion: 'Rechazo por antecedentes graves en SIM',
        sim_sin_antecedentes: false
      });
      return;
    }

    setError('');
    setMostrarConfirmacion(true);
  };

  const handleConfirmarFinalizacion = async () => {
    const cuip = cuipCapturado.trim();
    if (!cuip) {
      setError('Debes capturar el CUIP para continuar.');
      return;
    }

    await onFinalizar({
      asistio: true,
      suim_resultado: suimResultado,
      justificacion: requiereJustificacion ? justificacionMenores.trim() : null,
      cuip_capturado: cuip,
      sim_sin_antecedentes: suimResultado === 'sin_antecedentes'
    });
  };

  const modalContent = (
    <div className="hc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hc-modal hc-modal-proceso" role="dialog" aria-modal="true">
        <div className="hc-modal-header">
          <h3>Validación de Cita y Filtro Final</h3>
          <button type="button" className="hc-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="hc-modal-body">
          {!mostrarConfirmacion ? (
            <>
              <div className="hc-proceso-hero">
                <div className="hc-proceso-hero-icon"><i className="bx bx-shield-quarter"></i></div>
                <div>
                  <h4>Control final del trámite</h4>
                  <p>Verifica asistencia y evalúa el resultado SIM antes de cerrar el expediente.</p>
                </div>
              </div>

              <div className="hc-persona-resumen-grid">
                <div className="hc-persona-resumen-item">
                  <span>Solicitante</span>
                  <strong>{cita?.nombre_completo || '—'}</strong>
                </div>
                <div className="hc-persona-resumen-item">
                  <span>Puesto asignado</span>
                  <strong>{cita?.puesto_nombre || '—'}</strong>
                </div>
                <div className="hc-persona-resumen-item">
                  <span>Folio de cita</span>
                  <strong>{cita?.folio_cita || '—'}</strong>
                </div>
              </div>

              <section className="hc-step-card">
                <h4>Paso 1: Verificación de Asistencia</h4>
                <p>¿El solicitante asistió físicamente a la cita?</p>
                <div className="hc-step-actions hc-step-actions-right">
                  <button
                    type="button"
                    className={`hc-btn hc-btn-step ${asistio === true ? 'hc-btn-success' : 'hc-btn-gray'}`}
                    onClick={() => {
                      setAsistio(true);
                      setError('');
                    }}
                  >
                    Sí asistió
                  </button>
                  <button
                    type="button"
                    className={`hc-btn hc-btn-step ${asistio === false ? 'hc-btn-danger' : 'hc-btn-gray'}`}
                    onClick={() => {
                      setAsistio(false);
                      setSuimResultado('');
                      setError('');
                    }}
                  >
                    No asistió
                  </button>

                  <button
                    type="button"
                    className="hc-btn hc-btn-step hc-btn-guinda"
                    onClick={onAbrirReagenda}
                    disabled={loading}
                  >
                    <i className="bx bx-refresh"></i> Reagendar cita
                  </button>
                </div>
              </section>

              <section className="hc-step-card">
                <h4>Paso 2: Consulta SIM</h4>
                <p>Selecciona uno de los escenarios para determinar el cierre del trámite.</p>
                <div className="hc-suim-grid">
                  <button
                    type="button"
                    className={`hc-suim-option ${suimResultado === 'sin_antecedentes' ? 'hc-suim-option-active hc-suim-option-ok' : ''}`}
                    onClick={() => {
                      setSuimResultado('sin_antecedentes');
                      setError('');
                    }}
                    disabled={asistio !== true}
                  >
                    <i className="bx bx-check-shield"></i>
                    <span>Sin antecedentes</span>
                    <small>Permite finalizar trámite</small>
                  </button>

                  <button
                    type="button"
                    className={`hc-suim-option ${suimResultado === 'antecedentes_graves' ? 'hc-suim-option-active hc-suim-option-danger' : ''}`}
                    onClick={() => {
                      setSuimResultado('antecedentes_graves');
                      setError('');
                    }}
                    disabled={asistio !== true}
                  >
                    <i className="bx bx-error-circle"></i>
                    <span>Antecedentes graves</span>
                    <small>Rechaza el trámite automáticamente</small>
                  </button>

                  <button
                    type="button"
                    className={`hc-suim-option ${suimResultado === 'antecedentes_menores' ? 'hc-suim-option-active hc-suim-option-warn' : ''}`}
                    onClick={() => {
                      setSuimResultado('antecedentes_menores');
                      setError('');
                    }}
                    disabled={asistio !== true}
                  >
                    <i className="bx bx-info-circle"></i>
                    <span>Antecedentes menores</span>
                    <small>Permite continuar con justificación</small>
                  </button>
                </div>

                {requiereJustificacion && (
                  <div className="hc-field hc-justify-field">
                    <label>Justificación obligatoria *</label>
                    <textarea
                      rows={4}
                      placeholder="Describe por qué procede el trámite pese a los antecedentes menores..."
                      value={justificacionMenores}
                      onChange={(e) => setJustificacionMenores(e.target.value)}
                    />
                    <small>Mínimo 15 caracteres.</small>
                  </div>
                )}
              </section>

              {error && <p className="hc-form-error">{error}</p>}
            </>
          ) : (
            <div className="hc-confirmacion-final">
              <div className="hc-confirmacion-simple">
                <div className="hc-confirmacion-icono"><i className="bx bx-check-circle"></i></div>
                <div className="hc-confirmacion-title-wrap">
                  <h4>Resumen final del trámite</h4>
                  <p>Verifica datos y registra el CUIP para continuar con biometrías.</p>
                </div>
              </div>

              <div className="hc-confirmacion-datos hc-confirmacion-datos-lg">
                <div><span>Solicitante</span><strong>{cita?.nombre_completo || '—'}</strong></div>
                <div><span>Puesto Asignado</span><strong>{cita?.puesto_nombre || '—'}</strong></div>
                <div><span>Fecha de Finalización</span><strong>{fechaFinalizacion}</strong></div>
              </div>

              <div className="hc-captura-cuip hc-captura-cuip-lg">
                <label htmlFor="cuipCapturado">Capturar CUIP *</label>
                <div className="hc-captura-cuip-input-wrap">
                  <i className="bx bx-id-card"></i>
                  <input
                    id="cuipCapturado"
                    type="text"
                    value={cuipCapturado}
                    onChange={(e) => setCuipCapturado(e.target.value)}
                    placeholder="Escriba el CUIP"
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && <p className="hc-form-error">{error}</p>}
            </div>
          )}
        </div>

        <div className={`hc-modal-footer${mostrarConfirmacion ? ' hc-modal-footer-center' : ''}`}>
          {!mostrarConfirmacion ? (
            <>
              <button type="button" className="hc-btn hc-btn-md hc-btn-gray" onClick={onClose} disabled={loading}>Cerrar</button>
              {asistio === false ? (
                <div className="hc-footer-inline-actions">
                  <button
                    type="button"
                    className="hc-btn hc-btn-md hc-btn-danger"
                    disabled={loading}
                    onClick={() => setConfirmarCancelar(true)}
                  >
                    CANCELAR CITA
                  </button>
                  <button
                    type="button"
                    className="hc-btn hc-btn-md hc-btn-reagendar"
                    disabled={loading}
                    onClick={onAbrirReagenda}
                  >
                    REAGENDAR CITA
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="hc-btn hc-btn-md hc-btn-guinda"
                  disabled={!puedeCerrarPaso2 || loading}
                  onClick={handleFinalizar}
                >
                  {textoAccionPrincipal}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="hc-btn hc-btn-lg hc-btn-gray"
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setError('');
                }}
                disabled={loading}
              >
                Volver
              </button>
              <button
                type="button"
                className="hc-btn hc-btn-md hc-btn-success hc-btn-continuar"
                onClick={handleConfirmarFinalizacion}
                disabled={loading}
              >
                Continuar
              </button>
            </>
          )}
        </div>

        {confirmarCancelar && (
          <div className="hc-confirm-overlay" role="dialog" aria-modal="true">
            <div className="hc-confirm-box">
              <h4>¿Deseas cancelar la cita?</h4>
              <p>La persona se enviará a rechazados y se registrará la inasistencia.</p>
              <div className="hc-confirm-actions">
                <button
                  type="button"
                  className="hc-btn hc-btn-md hc-btn-gray"
                  onClick={() => setConfirmarCancelar(false)}
                  disabled={loading}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="hc-btn hc-btn-md hc-btn-danger"
                  onClick={async () => {
                    setConfirmarCancelar(false);
                    await onCancelarNoAsistio();
                  }}
                  disabled={loading}
                >
                  Sí, cancelar cita
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
