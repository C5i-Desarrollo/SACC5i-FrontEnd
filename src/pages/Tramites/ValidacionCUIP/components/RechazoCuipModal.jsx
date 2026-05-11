import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/RechazoCuipModal.css';

export default function RechazoCuipModal({
  open,
  persona,
  motivosSugeridos = [],
  motivoInicial = '',
  submitting,
  onCerrar,
  onConfirmar
}) {
  const [motivo, setMotivo] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMotivo(motivoInicial || '');
    setConfirmado(false);
  }, [open, motivoInicial, persona?.id]);

  const nombreCompleto = useMemo(() => {
    return (
      persona?.nombre_completo
      || [persona?.nombre, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ')
      || 'Persona sin nombre'
    );
  }, [persona]);

  if (!open || !persona) return null;

  const handleCerrar = () => {
    if (submitting) return;
    onCerrar();
  };

  const handleConfirmar = async () => {
    const motivoLimpio = String(motivo || '').trim();
    if (!motivoLimpio || submitting || confirmado) return;

    setConfirmado(true);
    try {
      await onConfirmar(motivoLimpio);
    } finally {
      setConfirmado(false);
    }
  };

  const modal = (
    <div className="cqr-overlay" onClick={(event) => event.target === event.currentTarget && handleCerrar()}>
      <div className="cqr-modal" role="dialog" aria-modal="true" aria-label="Rechazar persona en validacion CUIP">
        <button className="cqr-close" onClick={handleCerrar} disabled={submitting} aria-label="Cerrar modal">
          <i className='bx bx-x'></i>
        </button>

        <div className="cqr-icono">
          <i className='bx bx-user-x'></i>
        </div>

        <h2 className="cqr-titulo">Rechazar en validacion CUIP</h2>
        <p className="cqr-descripcion">
          Esta accion enviara a <strong>{nombreCompleto}</strong> al flujo de rechazados.
        </p>

        {motivosSugeridos.length > 0 && (
          <div className="cqr-motivos-card">
            <div className="cqr-motivos-header">
              <i className='bx bx-list-ul'></i>
              <strong>Campos observados durante la validacion</strong>
            </div>
            <ul className="cqr-motivos-lista">
              {motivosSugeridos.slice(0, 8).map((motivoItem) => (
                <li key={motivoItem}>{motivoItem}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="cqr-textarea-wrap">
          <label htmlFor="cqr-motivo">Motivo de rechazo</label>
          <textarea
            id="cqr-motivo"
            className="cqr-textarea"
            placeholder="Describe de forma clara por que se rechaza la validacion CUIP..."
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            rows={5}
            disabled={submitting || confirmado}
          />
        </div>

        <div className="cqr-actions">
          <button type="button" className="cqr-btn cqr-btn-cancelar" onClick={handleCerrar} disabled={submitting || confirmado}>
            Cancelar
          </button>
          <button
            type="button"
            className="cqr-btn cqr-btn-confirmar"
            onClick={handleConfirmar}
            disabled={submitting || confirmado || !String(motivo || '').trim()}
          >
            {submitting || confirmado ? 'Procesando...' : 'Confirmar rechazo'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}