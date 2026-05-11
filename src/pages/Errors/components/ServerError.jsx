import { Link } from 'react-router-dom';
import '../styles/ErrorPage.css';

export default function ServerError({ onRetry, detail = '' }) {
  const handleRetry = () => {
    if (typeof onRetry === 'function') {
      onRetry();
      return;
    }

    window.location.reload();
  };

  return (
    <main className="error-screen error-screen-500">
      <div className="error-orb error-orb-left" aria-hidden="true"></div>
      <div className="error-orb error-orb-right" aria-hidden="true"></div>

      <section className="error-content">
        <div className="error-face-wrap" aria-hidden="true">
          <span className="error-face">:'(</span>
          <span className="error-oops">Ups...</span>
        </div>

        <p className="error-eyebrow">Error del sistema</p>

        <p className="error-code">500</p>
        <h1 className="error-title">Ocurrio un problema inesperado</h1>
        <p className="error-description">
          La plataforma encontro un fallo temporal. Puedes intentar de nuevo o volver al inicio.
        </p>

        {detail ? <p className="error-detail">Detalle tecnico: {detail}</p> : null}

        <div className="error-actions">
          <button type="button" className="error-btn error-btn-primary" onClick={handleRetry}>
            Reintentar
          </button>

          <Link to="/" className="error-btn error-btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}