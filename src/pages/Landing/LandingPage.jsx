import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LandingHero from './components/LandingHero';
import LandingFeatures from './components/LandingFeatures';
import LandingStats from './components/LandingStats';
import './styles/Landing.css';

/**
 * LandingPage — Pantalla inicial pública
 * Redirige al dashboard si el usuario ya tiene sesión activa.
 */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Mientras verifica sesión no muestra nada (evita flash)
  if (loading) return null;

  return (
    <div className="lp-root">
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
    </div>
  );
}
