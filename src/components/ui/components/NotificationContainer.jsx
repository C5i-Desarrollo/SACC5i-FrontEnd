/**
 * Componente de notificaciones toast
 */
import { useNotification } from '../../../context/NotificationContext';
import '../styles/NotificationContainer.css';

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onClose }) => {
  const { type, message } = notification;
  const isDismissible = notification.dismissible !== false;

  const icons = {
    success: 'bx-check-circle',
    error: 'bx-error-circle',
    warning: 'bx-error',
    info: 'bx-info-circle'
  };

  return (
    <div className={`notification notification-${type}`}>
      <i className={`bx ${icons[type]} notification-icon`}></i>
      <span className="notification-message">{message}</span>
      {isDismissible && (
        <button
          className="notification-close"
          onClick={onClose}
          aria-label="Cerrar notificacion"
        >
          <i className='bx bx-x'></i>
        </button>
      )}
    </div>
  );
};