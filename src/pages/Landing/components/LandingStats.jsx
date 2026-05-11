import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingStats.css';

const STATS = [
  {
    value: '100%',
    label: 'Trazabilidad',
    desc: 'Historial completo de cada trámite y acción tomada',
  },
  {
    value: 'CUIP',
    label: 'Registro Nacional',
    desc: 'Integración directa con el sistema C3 a nivel nacional',
  },
  {
    value: '24/7',
    label: 'Disponibilidad',
    desc: 'Plataforma disponible en todo momento para el servicio',
  },
];

export default function LandingStats() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="lp-stats" ref={sectionRef}>
      <div className="lp-stats-inner">

        {/* Left */}
        <div className={`lp-stats-left${visible ? ' lp-in-view-item' : ''}`}>
          <span className="lp-section-label lp-stats-label-light">
            Infraestructura Confiable
          </span>
          <h2 className="lp-stats-title">
            Diseñado a la{' '}
            <span className="lp-stats-accent">medida</span>
          </h2>
          <p className="lp-stats-desc">
            Una plataforma construida bajo los más altos estándares de
            seguridad, transparencia y eficiencia para el servicio público
            del Estado de Puebla.
          </p>
          <button
            className="lp-btn-primary lp-stats-cta"
            onClick={() => navigate('/login')}
          >
            Acceder al Sistema
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
        </div>

        {/* Right */}
        <div className="lp-stats-right">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`lp-stat-card${visible ? ' lp-in-view-item' : ''}`}
              style={{ transitionDelay: visible ? `${i * 0.1}s` : '0s' }}
            >
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
              <div className="lp-stat-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className="lp-footer-bar">
        <span>© 2026 · Complejo Metropolitano de Seguirdad Publica del estado de Puebla.</span>
        <span>Sistema de Control Interno - Registro de Personal de Seguridad Publica</span>
      </div>
    </section>
  );
}
