import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheckCircle, FiCircle, FiMoreVertical, FiTrash2, FiX } from 'react-icons/fi';
import '../styles/NotificationCenter.css';

const notificationTypeConfig = {
  success: {
    icon: 'bx-check-circle',
    label: 'Exito'
  },
  error: {
    icon: 'bx-error-circle',
    label: 'Error'
  },
  warning: {
    icon: 'bx-error',
    label: 'Advertencia'
  },
  info: {
    icon: 'bx-info-circle',
    label: 'Informacion'
  }
};

const formatNotificationDate = (timestamp) => {
  if (!timestamp) return 'Ahora';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Ahora';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const NotificationCenter = ({
  notificationRef,
  showNotificationMenu,
  onToggleNotificationMenu,
  onCloseNotificationMenu,
  bellAnimationTick,
  unreadCount,
  totalCount,
  notificationHistory,
  activeNotificationMenuId,
  setActiveNotificationMenuId,
  markAllAsRead,
  markAllAsUnread,
  clearHistory,
  markAsRead,
  markAsUnread,
  removeNotification,
  removeFromHistory
}) => {
  const navigate = useNavigate();

  const hasNotifications = totalCount > 0;
  const canMarkAllAsRead = unreadCount > 0;
  const canMarkAllAsUnread = hasNotifications && unreadCount < totalCount;

  const handleToggleNotificationActions = (notificationId) => {
    setActiveNotificationMenuId((prev) => (prev === notificationId ? null : notificationId));
  };

  const handleDeleteNotification = (notificationId) => {
    removeFromHistory(notificationId);
    removeNotification(notificationId);
    setActiveNotificationMenuId(null);
  };

  const handleToggleReadNotification = (notification) => {
    if (notification.read) {
      markAsUnread(notification.id);
    } else {
      markAsRead(notification.id);
    }

    setActiveNotificationMenuId(null);
  };

  const handleVerDetalle = (notification) => {
    if (!notification?.url) return;

    markAsRead(notification.id);
    setActiveNotificationMenuId(null);
    onCloseNotificationMenu();

    navigate(notification.url);
  };

  const handleClearNotificationHistory = () => {
    clearHistory();
    setActiveNotificationMenuId(null);
  };

  return (
    <div className="navbar-notification" ref={notificationRef}>
      <button
        type="button"
        className={`navbar-notif-btn${showNotificationMenu ? ' is-open' : ''}`}
        onClick={onToggleNotificationMenu}
        aria-label="Abrir centro de notificaciones"
        aria-expanded={showNotificationMenu}
        title={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Sin notificaciones sin leer'}
      >
        <span
          key={`bell-${bellAnimationTick}`}
          className={`notif-bell-shell${showNotificationMenu ? ' is-open' : ''}`}
          style={bellAnimationTick > 0 ? { animation: 'bellRing 0.72s cubic-bezier(0.2, 0.7, 0.2, 1)' } : undefined}
        >
          <FiBell size={20} className="notif-bell-icon" />
        </span>

        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      <div
        className={`notif-dropdown notif-center-dropdown${showNotificationMenu ? ' show' : ''}`}
        role="dialog"
        aria-label="Centro de notificaciones"
      >
        <div className="notif-center-header">
          <div>
            <h4>Notificaciones</h4>
            <p>
              {hasNotifications
                ? `${totalCount} en bandeja - ${unreadCount} sin leer`
                : 'No hay notificaciones registradas'}
            </p>
          </div>

          <button
            type="button"
            className="notif-center-close"
            onClick={onCloseNotificationMenu}
            aria-label="Cerrar panel de notificaciones"
          >
            <FiX size={15} />
          </button>
        </div>

        <div className="notif-center-toolbar">
          <button
            type="button"
            className="notif-center-action"
            onClick={markAllAsRead}
            disabled={!canMarkAllAsRead}
          >
            Marcar todas leidas
          </button>

          <button
            type="button"
            className="notif-center-action"
            onClick={markAllAsUnread}
            disabled={!canMarkAllAsUnread}
          >
            Marcar todas no leidas
          </button>

          <button
            type="button"
            className="notif-center-action is-danger"
            onClick={handleClearNotificationHistory}
            disabled={!hasNotifications}
          >
            Vaciar todas
          </button>
        </div>

        <div className="notif-center-list">
          {!hasNotifications ? (
            <div className="notif-center-empty">
              <i className="bx bx-bell-off"></i>
              <p>Las notificaciones nuevas apareceran aqui.</p>
            </div>
          ) : (
            notificationHistory.map((notification) => {
              const notificationMeta = notificationTypeConfig[notification.type] || notificationTypeConfig.info;

              return (
                <article
                  key={notification.id}
                  className={`notif-item${notification.read ? ' is-read' : ''}${activeNotificationMenuId === notification.id ? ' is-menu-open' : ''}`}
                >
                  <div className={`notif-item-accent notif-${notification.type || 'info'}`}></div>
                  <i className={`bx ${notificationMeta.icon} notif-item-icon`}></i>

                  <div className="notif-item-main">
                    <div className="notif-item-meta">
                      <span className="notif-item-type">{notificationMeta.label}</span>
                      <span className="notif-item-time">{formatNotificationDate(notification.timestamp)}</span>
                    </div>

                    {notification.title && (
                      <strong className="notif-item-title">{notification.title}</strong>
                    )}

                    <p>{notification.message}</p>

                    {notification.url && (
                      <button
                        type="button"
                        className="notif-item-detail-btn"
                        onClick={() => handleVerDetalle(notification)}
                      >
                        Ver detalle
                      </button>
                    )}
                  </div>

                  <div className="notif-item-menu">
                    <button
                      type="button"
                      className="notif-item-menu-trigger"
                      onClick={() => handleToggleNotificationActions(notification.id)}
                      aria-label="Abrir acciones de notificacion"
                    >
                      <FiMoreVertical size={14} />
                    </button>

                    {activeNotificationMenuId === notification.id && (
                      <div className="notif-item-menu-dropdown">
                        <button
                          type="button"
                          className="notif-item-menu-option"
                          onClick={() => handleToggleReadNotification(notification)}
                        >
                          {notification.read ? <FiCircle size={13} /> : <FiCheckCircle size={13} />}
                          <span>{notification.read ? 'Marcar como no leida' : 'Marcar como leida'}</span>
                        </button>

                        <button
                          type="button"
                          className="notif-item-menu-option is-danger"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <FiTrash2 size={13} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;