import { useState } from 'react';
import '../styles/AvisoAntecedentes.css';

/**
 * AvisoAntecedentes - Modal de advertencia cuando hay antecedentes.
 * Se muestra cuando RNPSP y/o SUIC detectan antecedentes.
 * Requiere justificación obligatoria por cada sistema con antecedentes.
 *
 * Props:
 *   sistemas  - array con los sistemas que tienen antecedentes: ['rnpsp'] | ['suic'] | ['rnpsp','suic']
 *   onConfirmar(justificaciones) - llama con { justificacion_rnpsp?, justificacion_antecedentes? }
 */
export default function AvisoAntecedentes({ sistemas = ['suic'], onConfirmar, onCancelar, submitting }) {
  const necesitaRnpsp = sistemas.includes('rnpsp');
  const necesitaSuic  = sistemas.includes('suic');

  const [justRnpsp, setJustRnpsp] = useState('');
  const [justSuic,  setJustSuic]  = useState('');

  const canConfirm =
    (!necesitaRnpsp || justRnpsp.trim()) &&
    (!necesitaSuic  || justSuic.trim());

  const handleConfirmar = () => {
    if (!canConfirm) return;
    const result = {};
    if (necesitaRnpsp) result.justificacion_rnpsp         = justRnpsp.trim();
    if (necesitaSuic)  result.justificacion_antecedentes  = justSuic.trim();
    onConfirmar(result);
  };

  const sistemasTexto =
    necesitaRnpsp && necesitaSuic ? 'RNPSP y SUIC'
    : necesitaRnpsp ? 'RNPSP'
    : 'SUIC';

  return (
    <div className="aviso-overlay">
      <div className="aviso-modal">
        {/* Icono de advertencia */}
        <div className="aviso-icono">
          <i className='bx bx-error-alt'></i>
        </div>

        {/* Título */}
        <h2 className="aviso-titulo">Aviso de Antecedentes</h2>

        {/* Descripción */}
        <p className="aviso-descripcion">
          La consulta en <strong>{sistemasTexto}</strong> detectó registros.
          Si estos no son de carácter grave, puede continuar con la validación bajo reserva.
          <br />
          ¿Desea proceder?
        </p>

        {/* Justificación RNPSP */}
        {necesitaRnpsp && (
          <div className="aviso-justificacion">
            <h4>Justificación — RNPSP</h4>
            <textarea
              placeholder="Escriba el motivo de la excepción para RNPSP..."
              value={justRnpsp}
              onChange={(e) => setJustRnpsp(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Justificación SUIC */}
        {necesitaSuic && (
          <div className="aviso-justificacion">
            <h4>Justificación — SUIC</h4>
            <textarea
              placeholder="Escriba el motivo de la excepción para SUIC..."
              value={justSuic}
              onChange={(e) => setJustSuic(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <div className="aviso-nota">
          <i className='bx bx-lock-alt'></i>
          <span>Esta acción quedará registrada en la bitácora de seguridad.</span>
        </div>

        {/* Acciones */}
        <div className="aviso-acciones">
          <button className="aviso-btn-cancelar" onClick={onCancelar} disabled={submitting}>
            <i className='bx bx-x-circle'></i> CANCELAR
          </button>
          <button
            className="aviso-btn-confirmar"
            onClick={handleConfirmar}
            disabled={!canConfirm || submitting}
          >
            {submitting ? 'Procesando...' : 'CONFIRMAR'} <i className='bx bx-right-arrow-alt'></i>
          </button>
        </div>
      </div>
    </div>
  );
}
