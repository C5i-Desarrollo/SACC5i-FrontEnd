import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiTrash2, FiX, FiUser } from 'react-icons/fi';
import '../styles/PurgeAnalistaRecordsModal.css';

const CONFIRM_PHRASE = 'BORRAR REGISTROS';

export default function PurgeAnalistaRecordsModal({
  open,
  usuario,
  processing,
  onClose,
  onConfirm
}) {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmationText('');
    }
  }, [open, usuario?.id]);

  const canConfirm = useMemo(() => {
    return String(confirmationText || '').trim().toUpperCase() === CONFIRM_PHRASE;
  }, [confirmationText]);

  if (!open || !usuario) {
    return null;
  }

  const handleClose = () => {
    if (processing) return;
    onClose();
  };

  const modal = (
    <div className="parm-overlay" onClick={(event) => event.target === event.currentTarget && handleClose()}>
      <div className="parm-modal" role="dialog" aria-modal="true" aria-label="Confirmar borrado de registros de analista">
        <div className="parm-header">
          <div>
            <h3>
              <FiAlertTriangle size={18} /> Confirmar borrado de registros
            </h3>
            <p>Esta accion eliminara todos los registros operativos asociados al analista.</p>
          </div>
          <button type="button" className="parm-close" onClick={handleClose} disabled={processing} aria-label="Cerrar modal">
            <FiX size={18} />
          </button>
        </div>

        <div className="parm-body">
          <div className="parm-user">
            <FiUser size={15} />
            <strong>{usuario?.nombre_completo || 'Analista'}</strong>
            <span>@{usuario?.usuario || 'sin_usuario'}</span>
          </div>

          <ul className="parm-list">
            <li>Se eliminaran tramites de alta vinculados a este analista.</li>
            <li>Se eliminaran personas, historial, citas y finalizados asociados a esos tramites.</li>
            <li>Se eliminaran tambien los municipios asignados en su dashboard de analista.</li>
            <li>Esta operacion no elimina la cuenta del usuario.</li>
          </ul>

          <label className="parm-label" htmlFor="purge-analista-confirm-input">
            Escribe <strong>{CONFIRM_PHRASE}</strong> para continuar:
          </label>
          <input
            id="purge-analista-confirm-input"
            type="text"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={CONFIRM_PHRASE}
            disabled={processing}
            autoComplete="off"
          />
        </div>

        <div className="parm-footer">
          <button type="button" className="parm-btn parm-btn-secondary" onClick={handleClose} disabled={processing}>
            Cancelar
          </button>
          <button
            type="button"
            className="parm-btn parm-btn-danger"
            onClick={onConfirm}
            disabled={!canConfirm || processing}
          >
            <FiTrash2 size={15} /> {processing ? 'Borrando...' : 'Borrar registros'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
