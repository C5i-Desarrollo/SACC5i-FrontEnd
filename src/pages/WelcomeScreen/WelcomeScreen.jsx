import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const { user, loading, welcomePending, consumeWelcomePending } = useAuth();
  const navigate = useNavigate();
  const [animationFinished, setAnimationFinished] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

const getDisplayName = () => {
  const formatName = (text) => {
    if (!text) return 'Usuario';

    return text
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const rol = user?.rol?.toLowerCase();

  // Si es usuario municipio, mostramos el nombre del municipio.
  if (rol === 'municipio') {
    const municipio =
      user?.municipio_nombre ||
      user?.nombre_municipio ||
      user?.municipio ||
      user?.municipioNombre;

    if (municipio) {
      return formatName(municipio);
    }

    // Fallback por si en la BD viene como "Enlace Atzala"
    const nombreCompleto = user?.nombre_completo || user?.nombre || '';

    if (nombreCompleto.toLowerCase().startsWith('enlace ')) {
      return formatName(nombreCompleto.replace(/^enlace\s+/i, ''));
    }
  }

  // Para analistas/admin/etc. mostramos solo el primer nombre
  const name = user?.nombre_completo || user?.nombre || user?.usuario || 'Usuario';
  const firstWord = name.trim().split(' ')[0];

  return formatName(firstWord);
};

  useEffect(() => {
    if (!loading && user && welcomePending) {
      const timer = setTimeout(() => {
        setAnimationFinished(true);
        consumeWelcomePending();
        navigate('/dashboard', { replace: true });
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [loading, user, welcomePending, consumeWelcomePending, navigate]);

  if (loading) return null; 
  if (!user) return <Navigate to="/" />;
  if (!welcomePending) return <Navigate to="/dashboard" replace />;

  return (
    <div className={`welcome-screen ${animationFinished ? 'fade-out' : ''}`}>
      <div className="welcome-content">
        <div className="logo-container">
          <div className="glow-effect"></div>
          <img 
            src="/img/icono1.svg" 
            alt="Logo" 
            className="logo-animate" 
          />
        </div>

        <div className="text-container">
          <h1 className="main-title">
            {getGreeting()}, <br />
            <span className="user-name">{getDisplayName()}</span>
          </h1>
          <p className="sub-title">Preparando tu espacio de trabajo...</p>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;