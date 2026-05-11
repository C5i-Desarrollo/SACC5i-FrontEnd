import { useRef, useEffect, useState } from 'react';
import '../styles/LandingFeatures.css';

const FEATURES = [
  {
    icon: 'bx bx-clipboard',
    title: 'Trámites de Alta',
    description:
      'Gestión integral de solicitudes de alta. Seguimiento en tiempo real, historial completo y notificaciones automáticas.',
    badge: 'Gestión',
  },
  {
    icon: 'bx bx-search-alt',
    title: 'Busquedas Inteligentes',
    description:
      'Busqueda documental exhaustiva. Encuentra lo que necesites en segundos',
    badge: 'Validación',
  },
  {
    icon: 'bx bx-fingerprint',
    title: 'Seguridad',
    description:
      'Capas de seguiridad integradas, manteniendo la información en total seguridad.',
    badge: 'Identidad',
  },
  {
    icon: 'bx bx-building-house',
    title: 'Validacion en tiempo real',
    description:
      'Envia, valida, rechaza consulta todo rapido y eficiente.',
    badge: 'Certificación',
  },
  {
    icon: 'bx bx-group',
    title: 'Gestión de Personal',
    description:
      'Control centralizado de expedientes por analista, municipio y dependencia. Historial detallado por persona.',
    badge: 'Personal',
  },
  {
    icon: 'bx bx-bar-chart-alt-2',
    title: 'Consulta',
    description:
      'Consulta cualquier estatus de un elemento, reportes con grafiacas y estadisticas',
    badge: 'Reportes',
  },
];

export default function LandingFeatures() {
  const gridRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="lp-features" id="lp-features">
      <div className="lp-features-inner">

        {/* Header */}
        <div className="lp-section-header">
          <span className="lp-section-label">Capacidades del Sistema</span>
          <h2 className="lp-section-title">
            Todo lo que necesitas<br />en un solo lugar
          </h2>
          <p className="lp-section-desc">
            El sistema integra todos los procesos del ciclo de vida del registro 
            de seguridad pública en una plataforma institucional unificada.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className={`lp-features-grid${visible ? ' lp-in-view' : ''}`}
        >
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feature-top">
                <div className="lp-feature-icon-wrap">
                  <i className={f.icon} />
                </div>
                <span className="lp-feature-badge">{f.badge}</span>
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
