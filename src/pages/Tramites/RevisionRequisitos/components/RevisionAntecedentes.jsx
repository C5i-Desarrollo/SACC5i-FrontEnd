import { useState } from 'react';
import '../styles/RevisionAntecedentes.css';

/**
 * RevisionAntecedentes - Sección de verificación de antecedentes
 * Muestra consultas RNPSP y SUIC con sus resultados
 * + Botones de rechazar / siguiente
 */
export default function RevisionAntecedentes({ persona, onGuardar, onRechazar, onCompletar, submitting, motivosRechazoDocs = [] }) {
  // Normalizar: si el valor guardado es 'pendiente' (legacy), tratar como sin_antecedentes
  const normalizar = (valor) => {
    if (!valor || valor === 'pendiente') return 'sin_antecedentes';
    return valor;
  };

  const [rnpsp, setRnpsp] = useState(normalizar(persona.resultado_rnpsp));
  const [suic, setSuic] = useState(normalizar(persona.resultado_suic));

  // yaRegistrados: solo si fue guardado con un valor válido (no pendiente ni vacío)
  const yaRegistrados = !!persona.resultado_rnpsp && persona.resultado_rnpsp !== 'pendiente';

  /**
   * Enviar antecedentes al backend
   */
  const handleGuardar = () => {
    onGuardar({
      resultado_rnpsp: rnpsp,
      resultado_suic: suic
    });
  };

  /**
   * Obtener label del resultado 
   */
  const getResultadoDisplay = (resultado) => {
    if (resultado === 'sin_antecedentes') return { text: '✓ SIN ANTECEDENTES', className: 'rev-resultado-ok' };
    if (resultado === 'con_antecedentes') return { text: '⚠ CON ANTECEDENTES', className: 'rev-resultado-alerta' };
    return { text: 'Pendiente', className: 'rev-resultado-pendiente' };
  };

  const rnpspDisplay = getResultadoDisplay(yaRegistrados ? persona.resultado_rnpsp : rnpsp);
  const suicDisplay = getResultadoDisplay(yaRegistrados ? persona.resultado_suic : suic);

  return (
    <div className="rev-antecedentes">
      {/* Header */}
      <div className="rev-antecedentes-header">
        <i className='bx bx-file'></i>
        <h3>Antecedentes y Documentos Básicos</h3>
      </div>

      {/* RNPSP */}
      <div className={`rev-consulta-card ${rnpspDisplay.className}`}>
        <div className="rev-consulta-info">
          <div className="rev-consulta-icon">
            <i className='bx bx-user-check'></i>
          </div>
          <div>
            <h4>RNPSP</h4>
            <p>Registro Nacional de Personal de Seguridad</p>
          </div>
          {!yaRegistrados && (
            <label className="rev-toggle">
              <input
                type="checkbox"
                checked={rnpsp === 'sin_antecedentes'}
                onChange={(e) => setRnpsp(e.target.checked ? 'sin_antecedentes' : 'con_antecedentes')}
              />
              <span className="rev-toggle-slider"></span>
            </label>
          )}
        </div>
        <div className={`rev-consulta-resultado ${rnpspDisplay.className}`}>
          {rnpspDisplay.text}
        </div>
      </div>

      {/* SUIC */}
      <div className={`rev-consulta-card ${suicDisplay.className}`}>
        <div className="rev-consulta-info">
          <div className="rev-consulta-icon">
            <i className='bx bx-shield-quarter'></i>
          </div>
          <div>
            <h4>Consulta en SUIC</h4>
            <p>Sistema Único de Información Criminal</p>
          </div>
          {!yaRegistrados && (
            <label className="rev-toggle">
              <input
                type="checkbox"
                checked={suic === 'sin_antecedentes'}
                onChange={(e) => setSuic(e.target.checked ? 'sin_antecedentes' : 'con_antecedentes')}
              />
              <span className="rev-toggle-slider"></span>
            </label>
          )}
        </div>
        <div className={`rev-consulta-resultado ${suicDisplay.className}`}>
          {suicDisplay.text}
        </div>
      </div>

      {/* Justificaciones previas (si ya fueron registradas) */}
      {!!persona.tiene_antecedentes && (
        <>
          {persona.justificacion_rnpsp && (
            <div className="rev-justificacion-previa">
              <i className='bx bx-info-circle'></i>
              <div>
                <strong>Justificación RNPSP registrada:</strong>
                <p>{persona.justificacion_rnpsp}</p>
              </div>
            </div>
          )}
          {persona.justificacion_antecedentes && (
            <div className="rev-justificacion-previa">
              <i className='bx bx-info-circle'></i>
              <div>
                <strong>Justificación SUIC registrada:</strong>
                <p>{persona.justificacion_antecedentes}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Botón guardar antecedentes (solo si no registrados) */}
      {!yaRegistrados && (
        <button
          className="rev-btn-guardar-antecedentes"
          onClick={handleGuardar}
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Registrar antecedentes'}
        </button>
      )}

      {/* Acciones */}
      <div className="rev-acciones">
        {/* Rechazar */}
        <button className="rev-btn-rechazar" onClick={onRechazar}>
          <i className='bx bx-x-circle'></i> RECHAZAR
        </button>

        {/* Siguiente: CUIP — solo si TODOS los docs están validados */}
        <button
          className="rev-btn-siguiente"
          onClick={onCompletar}
          disabled={
            submitting ||
            !yaRegistrados ||
            !persona.documentos_validados?.length ||
            !persona.documentos_validados.every(d => d.validado)
          }
        >
          SIGUIENTE:CUIP <i className='bx bx-right-arrow-alt'></i>
        </button>
      </div>

      {motivosRechazoDocs.length > 0 && (
        <div className="rev-sugerencia-rechazo">
          <i className='bx bx-error-circle'></i>
          <div className="rev-sugerencia-rechazo-lista">
            {motivosRechazoDocs.map((motivo) => (
              <span key={motivo}>{motivo}</span>
            ))}
          </div>
        </div>
      )}

      {/* Nota CUIP */}
      <div className="rev-nota-cuip">
        <i className='bx bx-error-circle'></i>
        <div>
          <strong>Nota:</strong> Para la Cédula Única de Identificación Personal (CUIP) 
          el llenado a tinta negra verificado. Revise cada sección para 
          confirmar que los datos coinciden con los documentos originales.
        </div>
      </div>
    </div>
  );
}
