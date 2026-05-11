import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../constants/roles';
import { sectionToRoute } from '../../../routes/routesConfig';
import '../styles/DashboardStats.css';

const COLOR_MAP = ['guinda', 'dorado', 'pizarra', 'gris'];
const numberFormatter = new Intl.NumberFormat('es-MX');

function CountUpValue({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Number(value) || 0);
    if (target === 0) {
      setDisplayValue(0);
      return undefined;
    }

    const duration = 700;
    const start = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return numberFormatter.format(displayValue);
}

/**
 * DashboardStats — Fila de tarjetas KPI
 * Recibe `stats` del hook useDashboard
 */
export default function DashboardStats({ stats = [], loading = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminRole = user?.rol === ROLES.ADMIN || user?.rol === ROLES.SUPER_ADMIN;
  const isAnalista = user?.rol === ROLES.ANALISTA;
  const isValidadorC3 = user?.rol === ROLES.VALIDADOR_C3;
  const isOperadorCcp = user?.rol === ROLES.OPERADOR_CCP;

  const maxValue = useMemo(() => {
    const numericValues = stats.map((item) => Number(item.value) || 0);
    return Math.max(1, ...numericValues);
  }, [stats]);

  const totalUsuarios = useMemo(() => {
    const item = stats.find((stat) => stat.key === 'users_total');
    return Number(item?.value) || 0;
  }, [stats]);

  const adminVisual = useMemo(() => {
    const byKey = Object.fromEntries(stats.map((item) => [item.key, item]));

    const cards = ['users_active', 'users_inactive', 'users_password_pending', 'ccp_total']
      .map((key) => byKey[key])
      .filter(Boolean);

    return {
      cards,
      hasUsuariosRoute: Boolean(sectionToRoute.Usuarios)
    };
  }, [stats]);

  const ccpVisual = useMemo(() => {
    if (!isOperadorCcp) return { cards: [], pendingMetric: null };

    const pendingMetric = stats.find((item) => item.key === 'ccp_pending') || null;
    const cards = stats.filter((item) => item.key !== 'ccp_pending');

    return {
      cards,
      pendingMetric,
      pendingValue: Number(pendingMetric?.value) || 0
    };
  }, [stats, isOperadorCcp]);

  const analistaVisual = useMemo(() => {
    if (!isAnalista) return { cards: [], doneMetric: null, doneValue: 0 };

    const byKey = Object.fromEntries(stats.map((item) => [item.key, item]));
    const doneMetric = byKey.sol_done || null;

    const cards = ['sol_total', 'sol_process', 'sol_rejected']
      .map((key) => byKey[key])
      .filter(Boolean);

    return {
      cards,
      doneMetric,
      doneValue: Number(doneMetric?.value) || 0
    };
  }, [stats, isAnalista]);

  const c3Visual = useMemo(() => {
    if (!isValidadorC3) return { cards: [], pendingMetric: null, pendingValue: 0 };

    const byKey = Object.fromEntries(stats.map((item) => [item.key, item]));
    const pendingMetric = byKey.c3_pending || null;

    const cards = ['c3_processed', 'c3_ok', 'c3_rej']
      .map((key) => byKey[key])
      .filter(Boolean);

    return {
      cards,
      pendingMetric,
      pendingValue: Number(pendingMetric?.value) || 0
    };
  }, [stats, isValidadorC3]);

  const totalMetricas = useMemo(
    () => stats.reduce((acc, item) => acc + (Number(item.value) || 0), 0),
    [stats]
  );

  const topMetricas = useMemo(
    () => [...stats].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)).slice(0, 3),
    [stats]
  );

  const handleMetricClick = (metric) => {
    if (!metric?.section) return;
    const route = sectionToRoute[metric.section];
    if (route) navigate(route);
  };

  if (loading) {
    return (
      <div className="dbs-loading-board">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="dbs-loading-row">
            <div className="dbs-loading-pill" />
            <div className="dbs-loading-line" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats.length) {
    return (
      <div className="dbs-empty">
        <i className="bx bx-bar-chart-alt-2"></i>
        <span>No hay métricas disponibles para este perfil.</span>
      </div>
    );
  }

  if (isAdminRole) {
    const TotalElement = adminVisual.hasUsuariosRoute ? 'button' : 'div';

    return (
      <section className="dbs-layout dbs-layout-admin">
        <div className="dbs-admin-panel">
          <div className="dbs-admin-head">
            <h3>Panorama de Administración</h3>
            <span>Estado actual de usuarios y control documental</span>
          </div>

          <div className="dbs-admin-matrix">
            <TotalElement
              type={adminVisual.hasUsuariosRoute ? 'button' : undefined}
              className={`dbs-admin-total ${adminVisual.hasUsuariosRoute ? 'is-link' : ''}`}
              onClick={adminVisual.hasUsuariosRoute ? () => navigate(sectionToRoute.Usuarios) : undefined}
              title={adminVisual.hasUsuariosRoute ? 'Ir a Gestión de Usuarios' : 'Total de usuarios'}
            >
              <span className="dbs-admin-total-label">Total de usuarios</span>
              <strong className="dbs-admin-total-value">{numberFormatter.format(totalUsuarios)}</strong>
              <small className="dbs-admin-total-sub">Usuarios registrados en el sistema</small>
            </TotalElement>

            <div className="dbs-admin-grid">
              {adminVisual.cards.map((stat, index) => {
                const color = stat.color || COLOR_MAP[index % COLOR_MAP.length];
                const numericValue = Number(stat.value) || 0;
                const isNavigable = Boolean(stat.section && sectionToRoute[stat.section]);
                const Element = isNavigable ? 'button' : 'div';

                return (
                  <Element
                    key={stat.key || stat.label}
                    type={isNavigable ? 'button' : undefined}
                    className={`dbs-admin-card dbs-admin-card-${color} ${isNavigable ? 'is-link' : ''}`}
                    onClick={isNavigable ? () => handleMetricClick(stat) : undefined}
                    title={isNavigable ? 'Ir a la sección' : stat.label}
                  >
                    <span className={`dbs-admin-card-icon dbs-admin-card-icon-${color}`}>
                      <i className={`bx ${stat.icon}`}></i>
                    </span>

                    <strong className="dbs-admin-card-value">{numberFormatter.format(numericValue)}</strong>
                    <span className="dbs-admin-card-label">{stat.label}</span>
                    <small className="dbs-admin-card-desc">{stat.description || 'Indicador institucional.'}</small>
                  </Element>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isOperadorCcp) {
    return (
      <section className="dbs-layout dbs-layout-ccp">
        <div className="dbs-ccp-panel">
          <div className="dbs-ccp-head">
            <h3>Control Operativo CCP</h3>
            <span>Indicadores clave del módulo de copias de conocimiento</span>
          </div>

          <div className="dbs-ccp-grid">
            {ccpVisual.cards.map((stat, index) => {
              const color = stat.color || COLOR_MAP[index % COLOR_MAP.length];
              const isNavigable = Boolean(stat.section && sectionToRoute[stat.section]);
              const Element = isNavigable ? 'button' : 'div';

              return (
                <Element
                  key={stat.key || stat.label}
                  type={isNavigable ? 'button' : undefined}
                  className={`dbs-ccp-card dbs-ccp-card-${color} ${isNavigable ? 'is-link' : ''}`}
                  onClick={isNavigable ? () => handleMetricClick(stat) : undefined}
                  title={isNavigable ? 'Ir a la sección' : stat.label}
                >
                  <span className={`dbs-ccp-icon dbs-ccp-icon-${color}`}>
                    <i className={`bx ${stat.icon}`}></i>
                  </span>

                  <strong className="dbs-ccp-value"><CountUpValue value={stat.value} /></strong>
                  <span className="dbs-ccp-label">{stat.label}</span>
                  <small className="dbs-ccp-desc">{stat.description || 'Indicador operacional.'}</small>
                </Element>
              );
            })}
          </div>
        </div>

        <aside className="dbs-ccp-focus">
          <span className="dbs-ccp-focus-label">Pendientes por depurar</span>
          <strong className="dbs-ccp-focus-value"><CountUpValue value={ccpVisual.pendingValue} /></strong>
          <small className="dbs-ccp-focus-sub">Registros vigentes por gestionar</small>
          {ccpVisual.pendingMetric?.section && sectionToRoute[ccpVisual.pendingMetric.section] && (
            <button
              type="button"
              className="dbs-ccp-focus-btn"
              onClick={() => handleMetricClick(ccpVisual.pendingMetric)}
            >
              Ir al módulo CCP
            </button>
          )}
        </aside>
      </section>
    );
  }

  if (isValidadorC3) {
    return (
      <section className="dbs-layout dbs-layout-c3">
        <div className="dbs-ccp-panel dbs-c3-panel">
          <div className="dbs-ccp-head">
            <h3>Centro de Dictamen C3</h3>
            <span>Control de resultados y calidad de resolución técnica</span>
          </div>

          <div className="dbs-ccp-grid">
            {c3Visual.cards.map((stat, index) => {
              const color = stat.color || COLOR_MAP[index % COLOR_MAP.length];
              const isNavigable = Boolean(stat.section && sectionToRoute[stat.section]);
              const Element = isNavigable ? 'button' : 'div';

              return (
                <Element
                  key={stat.key || stat.label}
                  type={isNavigable ? 'button' : undefined}
                  className={`dbs-ccp-card dbs-ccp-card-${color} ${isNavigable ? 'is-link' : ''}`}
                  onClick={isNavigable ? () => handleMetricClick(stat) : undefined}
                  title={isNavigable ? 'Ir a la sección' : stat.label}
                >
                  <span className={`dbs-ccp-icon dbs-ccp-icon-${color}`}>
                    <i className={`bx ${stat.icon}`}></i>
                  </span>

                  <strong className="dbs-ccp-value"><CountUpValue value={stat.value} /></strong>
                  <span className="dbs-ccp-label">{stat.label}</span>
                  <small className="dbs-ccp-desc">{stat.description || 'Indicador operacional.'}</small>
                </Element>
              );
            })}
          </div>
        </div>

        <aside className="dbs-ccp-focus dbs-c3-focus">
          <span className="dbs-ccp-focus-label">Pendientes por dictamen</span>
          <strong className="dbs-ccp-focus-value"><CountUpValue value={c3Visual.pendingValue} /></strong>
          <small className="dbs-ccp-focus-sub">Personas listas para evaluar</small>
          {c3Visual.pendingMetric?.section && sectionToRoute[c3Visual.pendingMetric.section] && (
            <button
              type="button"
              className="dbs-ccp-focus-btn"
              onClick={() => handleMetricClick(c3Visual.pendingMetric)}
            >
              Ir a Pendientes C3
            </button>
          )}
        </aside>
      </section>
    );
  }

  if (isAnalista) {
    return (
      <section className="dbs-layout dbs-layout-analista">
        <div className="dbs-ccp-panel dbs-analista-panel">
          <div className="dbs-ccp-head">
            <h3>Pulso operativo del analista</h3>
            <span>Seguimiento de carga activa y resultados de altas</span>
          </div>

          <div className="dbs-ccp-grid">
            {analistaVisual.cards.map((stat, index) => {
              const color = stat.color || COLOR_MAP[index % COLOR_MAP.length];
              const isNavigable = Boolean(stat.section && sectionToRoute[stat.section]);
              const Element = isNavigable ? 'button' : 'div';

              return (
                <Element
                  key={stat.key || stat.label}
                  type={isNavigable ? 'button' : undefined}
                  className={`dbs-ccp-card dbs-ccp-card-${color} ${isNavigable ? 'is-link' : ''}`}
                  onClick={isNavigable ? () => handleMetricClick(stat) : undefined}
                  title={isNavigable ? 'Ir a la sección' : stat.label}
                >
                  <span className={`dbs-ccp-icon dbs-ccp-icon-${color}`}>
                    <i className={`bx ${stat.icon}`}></i>
                  </span>

                  <strong className="dbs-ccp-value"><CountUpValue value={stat.value} /></strong>
                  <span className="dbs-ccp-label">{stat.label}</span>
                  <small className="dbs-ccp-desc">{stat.description || 'Indicador operacional.'}</small>
                </Element>
              );
            })}
          </div>
        </div>

        <aside className="dbs-ccp-focus dbs-analista-focus">
          <span className="dbs-ccp-focus-label">Altas registradas</span>
          <strong className="dbs-ccp-focus-value"><CountUpValue value={analistaVisual.doneValue} /></strong>
          <small className="dbs-ccp-focus-sub">Equivalente a trámites finalizados</small>
          {analistaVisual.doneMetric?.section && sectionToRoute[analistaVisual.doneMetric.section] && (
            <button
              type="button"
              className="dbs-ccp-focus-btn"
              onClick={() => handleMetricClick(analistaVisual.doneMetric)}
            >
              Ir a Finalizados
            </button>
          )}
        </aside>
      </section>
    );
  }

  return (
    <section className="dbs-layout">
      <div className="dbs-lines-panel">
        <h3 className="dbs-panel-title">Pulso operativo</h3>

        <div className="dbs-lines">
          {stats.map((stat, index) => {
            const color = stat.color || COLOR_MAP[index % COLOR_MAP.length];
            const numericValue = Number(stat.value) || 0;
            const percent = Math.max(6, Math.round((numericValue / maxValue) * 100));
            const isNavigable = Boolean(stat.section && sectionToRoute[stat.section]);

            const Element = isNavigable ? 'button' : 'div';

            return (
              <Element
                key={stat.key || stat.label}
                type={isNavigable ? 'button' : undefined}
                className={`dbs-line dbs-line-${color} ${isNavigable ? 'is-link' : ''}`}
                onClick={isNavigable ? () => handleMetricClick(stat) : undefined}
                title={isNavigable ? 'Ir a la sección' : stat.label}
              >
                <div className="dbs-line-left">
                  <span className={`dbs-line-icon dbs-line-icon-${color}`}>
                    <i className={`bx ${stat.icon}`}></i>
                  </span>

                  <div className="dbs-line-copy">
                    <strong>{stat.label}</strong>
                    <small>{stat.description || 'Indicador institucional sincronizado.'}</small>
                  </div>
                </div>

                <div className="dbs-line-right">
                  <span className="dbs-line-value">{numberFormatter.format(numericValue)}</span>
                  <div className="dbs-meter-track">
                    <span className={`dbs-meter-fill dbs-meter-fill-${color}`} style={{ width: `${percent}%` }}></span>
                  </div>
                </div>
              </Element>
            );
          })}
        </div>
      </div>

      <aside className="dbs-insight-panel">
        <div className="dbs-insight-orbit">
          <span className="dbs-insight-label">Volumen total</span>
          <strong>{numberFormatter.format(totalMetricas)}</strong>
          <small>Σ de indicadores visibles</small>
        </div>

        <div className="dbs-top-list">
          <span className="dbs-top-title">Métricas destacadas</span>
          {topMetricas.map((item) => {
            const tone = item.color || 'guinda';
            return (
              <div key={`top-${item.key || item.label}`} className="dbs-top-item">
                <span className={`dbs-top-dot dbs-top-dot-${tone}`}></span>
                <span className="dbs-top-text">{item.label}</span>
                <span className="dbs-top-value">{numberFormatter.format(Number(item.value) || 0)}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
