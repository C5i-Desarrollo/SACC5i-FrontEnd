import { useEffect, useState } from 'react';
import '../styles/RechazoRevisionModal.css';
/**
 * RechazoRevisionModal - Modal de rechazo de persona en revisión de requisitos.
 * Permite ingresar el motivo de rechazo y confirmar el envío a rechazados.
 */
export default function RechazoRevisionModal({ onConfirmar, onCerrar, submitting, motivoInicial = '' }) {
  const [motivo, setMotivo] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    setMotivo(motivoInicial || '');
  }, [motivoInicial]);

  const handleConfirmar = async () => {
    if (!motivo.trim()) return;
    setConfirmado(true);
    await onConfirmar(motivo.trim());
  };

  return (
    <div className="aviso-overlay" onClick={onCerrar}>
      <div className="rechazo-modal" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="rechazo-modal-close" onClick={onCerrar} disabled={submitting}>
          <i className='bx bx-x'></i>
        </button>

        {/* Icono */}
        <div className="rechazo-modal-icono">
          <i className='bx bx-file'></i>
        </div>

        {/* Título */}
        <h2 className="rechazo-modal-titulo">Trámite No Procedente / Rechazo</h2>
        <p className="rechazo-modal-descripcion">
          El expediente no cumple con los requisitos establecidos. Ingresa el motivo de rechazo.
        </p>

        {/* Campo de motivo */}
        <div className="rechazo-modal-motivos">
          <div className="rechazo-modal-motivos-header">
            <i className='bx bx-edit'></i>
            <strong>Motivo de rechazo</strong>
          </div>
          <textarea
            className="rechazo-modal-textarea"
            placeholder="Describe el motivo por el cual se rechaza el expediente..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            disabled={submitting || confirmado}
          />
        </div>

        {/* Botón confirmar */}
        <button
          className="rechazo-modal-btn"
          onClick={handleConfirmar}
          disabled={submitting || confirmado || !motivo.trim()}
        >
          {submitting ? 'Procesando...' : 'CONFIRMAR RECHAZO'}
        </button>
      </div>
    </div>
  );
}
