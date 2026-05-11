import { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_LABELS } from '../../../constants/roles';
import '../styles/DashboardWelcome.css';

/**
 * DashboardWelcome — Tarjeta de bienvenida con info del usuario y fecha actual
 */
export default function DashboardWelcome({
  summary,
  tips = [],
  notices = [],
  loading = false,
  lastUpdated = '',
  onRefresh
}) {
  const { user } = useAuth();

  const fecha = useMemo(() => {
    const hoy = new Date();
    const dia  = hoy.getDate();
    const mes  = hoy.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const dow  = hoy.toLocaleDateString('es-MX', { weekday: 'long' });
    return { dia, mes, dow };
  }, []);

  const initials = useMemo(() => {
    if (!user) return '';
    const nombre   = user.nombre?.charAt(0) || '';
    const apellido = user.apellido_paterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || user.username?.charAt(0).toUpperCase() || '';
  }, [user]);

  const rolLabel = ROLE_LABELS[user?.rol] || user?.rol || 'Usuario';

  const tipDelTurno = useMemo(() => {
    if (tips.length === 0) return 'Mantén actualizados tus registros para asegurar trazabilidad operativa.';
    return tips[0];
  }, [tips]);

  const avisoPrincipal = useMemo(() => {
    if (notices.length === 0) return 'Sin alertas prioritarias por el momento.';
    return notices[0];
  }, [notices]);

  return (
    <section className="dbw-card">
      <div className="dbw-card-pattern" />

      <div className="dbw-grid">
        <div className="dbw-left">
          <div className="dbw-avatar" aria-label="Perfil de usuario">
            {initials ? (
              <span className="dbw-avatar-text">{initials}</span>
            ) : (
              <i className="bx bxs-user dbw-avatar-icon" aria-hidden="true" />
            )}
          </div>
          <div className="dbw-greeting">
            <strong>{summary?.title || 'Centro de Control Operativo'}</strong>
            <h2>{user?.nombre_completo || user?.nombre || 'Usuario'}</h2>
            <p className="dbw-subtitle">{summary?.subtitle || 'Supervisión integral de indicadores y acciones prioritarias.'}</p>

            <div className="dbw-meta">
              <span className="dbw-role-badge">
                <i className="bx bxs-shield-alt-2" />
                {summary?.roleLabel || rolLabel}
              </span>
              {user?.dependencia_nombre && (
                <span className="dbw-dep">· {user.dependencia_nombre}</span>
              )}
            </div>
          </div>
        </div>

        <div className="dbw-right">
          <div className="dbw-date-card">
            <div className="dbw-date-day">{fecha.dia}</div>
            <div className="dbw-date-rest">{fecha.dow}, {fecha.mes}</div>
          </div>

          <button
            type="button"
            className="dbw-refresh-btn"
            onClick={() => onRefresh?.()}
            disabled={loading}
          >
            <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-refresh'}`}></i>
            <span>{loading ? 'Actualizando...' : 'Actualizar panel'}</span>
          </button>

          <span className="dbw-system-label">{lastUpdated ? `Actualizado: ${lastUpdated}` : 'Sincronizando métricas...'}</span>
        </div>
      </div>

      <div className="dbw-footer-strip">
        <div className="dbw-tip-box">
          <i className="bx bx-bulb"></i>
          <div>
            <span className="dbw-mini-title">Tip del turno</span>
            <p>{tipDelTurno}</p>
          </div>
        </div>

        <div className="dbw-tip-box dbw-tip-box-notice">
          <i className="bx bx-bell"></i>
          <div>
            <span className="dbw-mini-title">Aviso operativo</span>
            <p>{avisoPrincipal}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
