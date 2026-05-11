import { useNavigate } from 'react-router-dom';
import '../styles/LandingHero.css';

const MODULES = [
  { icon: 'bx bx-user-plus', label: 'Alta' },
  { icon: 'bx bx-user-minus', label: 'Baja' },
  { icon: 'bx bx-search', label: 'Consulta' },
  { icon: 'bx bx-copy', label: 'CCP' }
];

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="lp-hero">
      <div className="lp-hero-orb lp-hero-orb-1" />
      <div className="lp-hero-orb lp-hero-orb-2" />
      <div className="lp-hero-orb lp-hero-orb-3" />
      <div className="lp-hero-grid" />

      <nav className="lp-topbar">
        <div className="lp-topbar-brand">
          <img
            src="/img/icono1.svg"
            alt="RPSP"
            className="lp-topbar-logo"
          />
          <span className="lp-topbar-name">
            Registro de <span> Personal de Seguridad Pública </span>
          </span>
        </div>
        <button
          className="lp-topbar-login"
          onClick={() => navigate('/login')}
        >
          <i className="bx bx-log-in" />
          Iniciar Sesión
        </button>
      </nav>

      <div className="lp-hero-row">
        <div className="lp-hero-content">
          <span className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Sistema Institucional · RPSP
          </span>

          <h1 className="lp-hero-title">
            <span className="lp-hero-title-line">Registro de Personal</span>
            <span className="lp-hero-title-line lp-title-accent">de Seguridad Pública</span>
          </h1>

          <div className="lp-hero-actions">
            <button
              className="lp-btn-primary"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
              <svg viewBox="0 0 24 24" className="lp-btn-arrow">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
            <button
              className="lp-btn-ghost"
              onClick={() =>
                document
                  .getElementById('lp-features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Conocer más
            </button>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-visual-ring" />
          <div className="lp-visual-ring-2" />

          <article className="lp-showcase-card">
            <header className="lp-showcase-head">
              <span className="lp-showcase-tag">Panel Institucional</span>
              <strong>Operación RPSP</strong>
            </header>

            <div className="lp-showcase-kpis">
              <div>
                <p>Disponibilidad</p>
                <strong>99.9%</strong>
              </div>
              <div>
                <p>Estado</p>
                <strong className="lp-kpi-live">En línea</strong>
              </div>
            </div>

            <div className="lp-showcase-modules">
              {MODULES.map((module) => (
                <div key={module.label} className="lp-module-chip">
                  <i className={module.icon} />
                  <span>{module.label}</span>
                </div>
              ))}
            </div>

            <div className="lp-showcase-footer">
              <span>Flujo operativo coordinado</span>
              <i className="bx bx-right-arrow-alt" />
            </div>
          </article>
        </div>
      </div>

      <div className="lp-scroll-indicator">
        <div className="lp-scroll-mouse" />
        <span>Desplaza para explorar</span>
      </div>
    </section>
  );
}
