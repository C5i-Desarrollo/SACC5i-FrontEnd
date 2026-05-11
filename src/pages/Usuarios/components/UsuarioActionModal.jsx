import { createPortal } from 'react-dom';
import { FiCheckCircle, FiKey, FiSlash, FiX } from 'react-icons/fi';
import '../styles/UsuarioActionModal.css';

const ACTION_CONFIG = {
  activate: {
    title: 'Activar usuario',
    description: 'La cuenta podra volver a iniciar sesion y operar normalmente.',
    confirmLabel: 'Si, activar usuario',
    tone: 'success',
    Icon: FiCheckCircle
  },
  deactivate: {
    title: 'Desactivar usuario',
    description: 'La cuenta no podra acceder al sistema hasta que sea activada de nuevo.',
    confirmLabel: 'Si, desactivar usuario',
    tone: 'danger',
    Icon: FiSlash
  },
  reset_password: {
    title: 'Resetear contraseña',
    description: 'La contraseña se restablecera al nombre de usuario. Se pedira cambio al siguiente login.',
    confirmLabel: 'Si, resetear contraseña',
    tone: 'warning',
    Icon: FiKey
  }
};

export default function UsuarioActionModal({
  open,
  actionType,
  usuario,
  processing,
  onClose,
  onConfirm
}) {
  if (!open || !usuario) return null;

  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.deactivate;
  const Icon = config.Icon;

  const handleClose = () => {
    if (processing) return;
    onClose();
  };

  const modal = (
    <div className="uam-overlay" onClick={(event) => event.target === event.currentTarget && handleClose()}>
      <div className="uam-modal" role="dialog" aria-modal="true" aria-label={config.title}>
        <div className="uam-header">
          <div className="uam-title-wrap">
            <h3>
              <Icon size={18} /> {config.title}
            </h3>
            <p>{config.description}</p>
          </div>

          <button
            type="button"
            className="uam-close"
            onClick={handleClose}
            disabled={processing}
            aria-label="Cerrar modal"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="uam-body">
          <div className="uam-user">
            <strong>{usuario.nombre_completo || 'Usuario'}</strong>
            <span>@{usuario.usuario || 'sin_usuario'}</span>
          </div>
          <small>
            ID: {usuario.id}
          </small>
        </div>

        <div className="uam-footer">
          <button type="button" className="uam-btn uam-btn-secondary" onClick={handleClose} disabled={processing}>
            Cancelar
          </button>
          <button
            type="button"
            className={`uam-btn uam-btn-${config.tone}`}
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? 'Procesando...' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
