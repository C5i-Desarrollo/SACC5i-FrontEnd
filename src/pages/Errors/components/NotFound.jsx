import { Link } from 'react-router-dom';
import '../styles/ErrorPage.css';

export default function NotFound() {
  return (
    <main className="error-screen error-screen-404">
      <div className="error-orb error-orb-left" aria-hidden="true"></div>
      <div className="error-orb error-orb-right" aria-hidden="true"></div>

      <section className="error-content">
        <div className="error-face-wrap" aria-hidden="true">
          <span className="error-face">:(</span>
          <span className="error-oops">Oops...</span>
        </div>

        <p className="error-eyebrow">Error de navegacion</p>
        <p className="error-code">404</p>
        <h1 className="error-title">No encontramos esta ruta</h1>
        <p className="error-description">
          La direccion que intentaste abrir no existe o fue movida.
        </p>

        <div className="error-actions">
          <Link to="/" className="error-btn error-btn-primary">
            Ir al inicio
          </Link>
          <Link to="/dashboard" className="error-btn error-btn-secondary">
            Abrir dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}