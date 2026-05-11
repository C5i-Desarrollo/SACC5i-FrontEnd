import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './ui/components/LoadingScreen';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando acceso..." size="medium" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos, verificar test
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.rol)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
