import { MdInfoOutline } from 'react-icons/md';

export default function BajaConfirmModal({
  visible,
  registroSeleccionado,
  tipoSeleccionado,
  motivoSeleccionado,
  numeroOficioMunicipio,
  fechaBaja,
  formatDate,
  savingBaja,
  onCancel,
  onConfirm
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="baja-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirmar registro de baja">
      <div className="baja-modal-card">
        <div className="baja-modal-header">
          <h4>Confirmar registro de baja</h4>
        </div>
        <div className="baja-modal-body">
          <p>
            Esta accion marcara al elemento como dado de baja y dejara de aparecer en finalizados disponibles.
          </p>
          <div className="baja-modal-resumen">
            <span><MdInfoOutline /> {registroSeleccionado?.nombre_elemento || 'Sin persona seleccionada'}</span>
            <span><strong>Tipo:</strong> {tipoSeleccionado || '---'}</span>
            <span><strong>Motivo:</strong> {motivoSeleccionado || '---'}</span>
            <span><strong>No. oficio municipio:</strong> {numeroOficioMunicipio || '---'}</span>
            <span><strong>Fecha:</strong> {formatDate(fechaBaja)}</span>
          </div>
        </div>
        <div className="baja-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={savingBaja}>
            Cancelar
          </button>
          <button type="button" className="btn-process" onClick={onConfirm} disabled={savingBaja}>
            {savingBaja ? 'Registrando...' : 'Confirmar baja'}
          </button>
        </div>
      </div>
    </div>
  );
}
