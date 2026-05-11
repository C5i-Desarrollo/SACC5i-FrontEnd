import { memo } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardWelcome  from './components/DashboardWelcome';
import DashboardStats    from './components/DashboardStats';
import DashboardAcciones from './components/DashboardAcciones';
import './styles/Dashboard.css';

/**
 * Dashboard — Página principal post-login
 * Orquesta los bloques de bienvenida, estadísticas y accesos rápidos
 */
function Dashboard() {
  const {
    stats,
    summary,
    tips,
    notices,
    loading,
    error,
    lastUpdated,
    refreshDashboard
  } = useDashboard();

  return (
    <div className="db-page">
      <DashboardWelcome
        summary={summary}
        tips={tips}
        notices={notices}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refreshDashboard}
      />

      {error && (
        <div className="db-error-banner" role="alert">
          <div className="db-error-main">
            <i className="bx bxs-error-circle"></i>
            <span>{error}</span>
          </div>
          <button type="button" className="db-error-retry" onClick={() => refreshDashboard()}>
            <i className="bx bx-refresh"></i>
            Reintentar
          </button>
        </div>
      )}

      <DashboardStats stats={stats} loading={loading} />
      <DashboardAcciones tips={tips} notices={notices} />
    </div>
  );
}

export default memo(Dashboard);

