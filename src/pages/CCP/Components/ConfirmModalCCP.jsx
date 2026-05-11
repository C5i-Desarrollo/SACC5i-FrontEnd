import '../styles/ConfirmModalCCP.css';

export default function ConfirmModalCCP({ visible, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <div className="ccp-modal-overlay" onClick={onCancel}>
      <div className="ccp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ccp-modal-icon"><i className="bx bx-save"></i></div>
        <h3 className="ccp-modal-title">Guardar cambios en el formato</h3>
        <p className="ccp-modal-text">
          ¿Deseas guardar los cambios realizados en los campos fijos del formato de oficio?
        </p>
        <div className="ccp-modal-actions">
          <button className="ccp-modal-btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="ccp-modal-btn-confirm" onClick={onConfirm}>
            <i className="bx bx-check"></i> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
