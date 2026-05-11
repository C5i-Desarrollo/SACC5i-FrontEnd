/**
 * Componente de loading reutilizable
 */
import '../styles/LoadingScreen.css';

const VALID_SIZES = new Set(['small', 'medium', 'large']);

export default function LoadingScreen({
  message = 'Cargando...',
  size = 'large',
  fullScreen = false
}) {
  const normalizedSize = VALID_SIZES.has(size) ? size : 'large';

  return (
    <div
      className={`loading-screen loading-screen-${normalizedSize} ${fullScreen ? 'loading-screen-full' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-spinner" aria-hidden="true"></span>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}