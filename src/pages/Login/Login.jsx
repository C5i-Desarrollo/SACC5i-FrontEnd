import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading, welcomePending } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const storedError = sessionStorage.getItem('login_error');
    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem('login_error');
    }
  }, []);

  // Redirect already-authenticated users away from login (after all hooks)
  if (authLoading) return null;
  if (user) return <Navigate to={welcomePending ? '/welcome' : '/dashboard'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/welcome', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      sessionStorage.setItem('login_error', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lgn-root">

      {/* BG decorations */}
      <div className="lgn-orb lgn-orb-1" />
      <div className="lgn-orb lgn-orb-2" />
      <div className="lgn-orb lgn-orb-3" />
      <div className="lgn-grid" />

      {/* Topbar */}
      <nav className="lgn-topbar">
        <div className="lgn-brand">
          <img src="/img/icono1.svg" alt="RPSP" className="lgn-brand-logo" />
          <span className="lgn-brand-name">
            RPSP
          </span>
        </div>
        <button className="lgn-back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" width="13" height="13">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Inicio
        </button>
      </nav>

      {/* Card */}
      <main className="lgn-center">
        <div className="lgn-card">

          {/* Logo */}
          <div className="lgn-logo-wrap">
            <img src="/img/icono1.svg" alt="Logo RPSP" className="lgn-logo" />
          </div>



          {/* Title */}
          <h1 className="lgn-title">
            Acceso al <span className="lgn-title-accent">Sistema</span>
          </h1>
          <p className="lgn-subtitle">Ingresa tus credenciales institucionales para continuar</p>

          {/* Error */}
          {error && (
            <div className="lgn-error">
              <svg viewBox="0 0 24 24" className="lgn-error-icon">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="16.5" r="1" fill="currentColor" />
              </svg>
              <p>{error}</p>
              <button type="button" className="lgn-error-close" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="lgn-form">
            <div className="lgn-field">
              <label className="lgn-label">Usuario</label>
              <input
                className="lgn-input"
                type="text"
                placeholder="ej. juan.perez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="lgn-field">
              <label className="lgn-label">Contraseña</label>
              <div className="lgn-pwd-wrap">
                <input
                  className="lgn-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lgn-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar / Ocultar contraseña"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M2 12s4-6 10-6 10 6 10 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="lgn-form-aux">
              <a
                href="#"
                className="lgn-forgot"
                onClick={(e) => {
                  e.preventDefault();
                  showNotification('Si olvidaste tu contrasena, contacta al administrador para que la restablezca.', 'info', 7000);
                }}
              >
                ¿Olvidaste tu contraseña? Contacta al administrador.
              </a>
            </div>

            <button type="submit" className="lgn-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin" />
                  Validando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <svg viewBox="0 0 24 24" className="lgn-submit-arrow">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Support */}
          <div className="lgn-support">
            <i className="bx bx-headphone" />
            Soporte Técnico: Ext. 1000
          </div>
        </div>
      </main>
    </div>
  );
}

