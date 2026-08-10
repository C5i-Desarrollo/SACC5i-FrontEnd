import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { NotificationContainer } from './components/ui/components/NotificationContainer';
import { useState, useEffect, useCallback, useRef } from 'react';
import Login from './pages/Login/Login';
import WelcomeScreen from './pages/WelcomeScreen/WelcomeScreen';
import LandingPage from './pages/Landing/LandingPage';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Navbar from './components/layout/Navbar/Navbar';
import MainContent from './components/layout/MainContent/MainContent';
import LoadingScreen from './components/ui/components/LoadingScreen';
import AppErrorBoundary from './components/errors/AppErrorBoundary';
import { ProtectedRouter } from './routes/ProtectedRouter';
import NotFound from './pages/Errors/components/NotFound';
import ServerError from './pages/Errors/components/ServerError';
import TestMunicipio from './pages/TestMunicipio/TestMunicipio';
import TestCargaDocumentos from "./pages/TestCargaDocumentos/TestCargaDocumentos";
//import HistorialDocumentos from "./pages/TestCargaDocumentos/HistorialDocumentos";

import './index.css';

const UNSAVED_ALTA_MESSAGE = 'Tienes cambios sin guardar en la solicitud de alta. Si sales ahora, se perderan. Deseas continuar?';
const PASSWORD_SECURITY_NOTIFICATION_ID = 'password-security-required';

function PasswordSecurityToastBridge() {
  const { user } = useAuth();
  const { showNotification, removeNotification, removeFromHistory } = useNotification();

  useEffect(() => {
    const requiresPasswordChange = Boolean(user) && !user?.password_changed;
    const isTemporarySession = Boolean(user?.sesion_temporal);
    const shouldShowSecurityToast = requiresPasswordChange || isTemporarySession;

    if (!shouldShowSecurityToast) {
      removeNotification(PASSWORD_SECURITY_NOTIFICATION_ID);
      removeFromHistory(PASSWORD_SECURITY_NOTIFICATION_ID);
      return;
    }

    const message = isTemporarySession
      ? 'Iniciaste sesion con una contrasena temporal. El titular debe cambiar la contrasena de inmediato.'
      : 'Importante: debes cambiar tu contraseña restablecida para continuar de forma segura.';

    showNotification(message, 'warning', 0, {
      id: PASSWORD_SECURITY_NOTIFICATION_ID
    });
  }, [user, showNotification, removeNotification, removeFromHistory]);

  return null;
}

function DashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isSidebarAnimating, setIsSidebarAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [selectedAnalista, setSelectedAnalista] = useState(null);
  const [altaUnsavedState, setAltaUnsavedState] = useState({
    hasUnsavedChanges: false,
    message: UNSAVED_ALTA_MESSAGE
  });
  const [showUnsavedExitModal, setShowUnsavedExitModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState('');
  const lastPathRef = useRef(location.pathname);
  const ignoreNextPopstateRef = useRef(false);
  const isDireccion = user?.rol === 'direccion' || user?.rol === "coordinador";
  const isDashboardSection = activeSection === 'Dashboard';

  // 1. AÑADIMOS EL ESTADO PARA EL TÍTULO DEL NAVBAR AQUÍ
  const [pageTitle, setPageTitle] = useState(null);

const getDefaultNavbarTitle = (section) => {
  switch (section) {
    case 'TestMunicipio':
      return {
        titulo: 'Filtrado por Municipio',
        icon: <i className="bx bx-filter-alt nav-icon-highlight"></i>
      };

    case 'EnProceso':
      return {
        titulo: 'En Proceso',
        icon: <i className="bx bx-loader-circle nav-icon-highlight"></i>
      };

    case 'HistorialCitas':
      return {
        titulo: 'Citas',
        icon: <i className="bx bx-calendar nav-icon-highlight"></i>
      };

    case 'Baja':
      return {
        titulo: 'Baja de Personal',
        icon: <i className="bx bxs-user-minus nav-icon-highlight"></i>
      };

    case 'Finalizados':
      return {
        titulo: 'Finalizados',
        icon: <i className="bx bxs-calendar-check nav-icon-highlight"></i>
      };

    case 'RechazosC3':
      return {
        titulo: 'Trámites No Procedentes',
        icon: <i className="bx bxs-x-circle nav-icon-highlight"></i>
      };

    case 'Alta':
      return {
        titulo: 'Trámites de Alta',
        icon: <i className="bx bx-user-plus nav-icon-highlight"></i>
      };

    case 'Consulta':
      return {
        titulo: 'Consulta de Trámites',
        icon: <i className="bx bx-search nav-icon-highlight"></i>
      };

    case 'ListadoNominal':
      return {
        titulo: 'Listado Nominal',
        icon: <i className="bx bx-list-ul nav-icon-highlight"></i>
      };

    case 'PersonalActivo':
      return {
        titulo: 'Personal Activo',
        icon: <i className="bx bx-id-card nav-icon-highlight"></i>
      };

    case 'Dashboard':
    default:
      return {
        titulo: 'Dashboard',
        icon: <i className="bx bx-grid-alt nav-icon-highlight"></i>
      };
  }
};
const navbarTitle =
  activeSection === 'TestMunicipio'
    ? getDefaultNavbarTitle('TestMunicipio')
    : pageTitle || getDefaultNavbarTitle(activeSection);

  const sectionToPath = {
    Dashboard: '/dashboard',
    PanelDireccion: '/dashboard/direccion',
    Usuarios: '/dashboard/usuarios',
    Alta: '/dashboard/alta',
    Baja: '/dashboard/baja',
    EnProceso: '/dashboard/en-proceso',
    RevisionRequisitos: '/dashboard/revision-requisitos',
    ValidacionCUIP: '/dashboard/validacion-cuip',
    RechazosC3: '/dashboard/rechazos-c3',
    HistorialCitas: '/dashboard/citas/historial',
    Finalizados: '/dashboard/finalizados',
    CopiasConocimiento: '/dashboard/ccp',
    HistorialOperadorCCP: '/dashboard/ccp/historial',
    RepositorioDigital: '/dashboard/repositorio-digital',
    Consulta: '/dashboard/consulta',
    PersonasPendientesC3: '/dashboard/c3/pendientes',
    HistorialC3: '/dashboard/c3/historial',
    TramitesDependencia: '/dashboard/dependencia/tramites',
    ConsultaDependencia: '/dashboard/dependencia/consulta',
    Perfil: '/dashboard/perfil',
    TestMunicipio: '/dashboard/test-municipio',
    TestCargaDocumentos: '/dashboard/municipio/carga-documentos',
    TestRevisionC5: '/dashboard/revision-municipios',
    ListadoNominal: '/dashboard/listado-nominal',
    RepositorioMunicipios: '/dashboard/repositorio-municipios'
  };

  const pathToSection = Object.entries(sectionToPath).reduce((acc, [section, path]) => {
    acc[path] = section;
    return acc;
  }, {});

  const normalizePath = useCallback((path) => {
    if (!path) return '/';
    return path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
  }, []);

  const normalizedPathname = normalizePath(location.pathname);

  const isAltaPath = useCallback((path) => {
    return path === '/dashboard/alta' || path.startsWith('/dashboard/alta/');
  }, []);

  const requestNavigationIfAllowed = useCallback((nextPath) => {
    const leavingAlta = isAltaPath(normalizedPathname) && !isAltaPath(nextPath);

    if (altaUnsavedState.hasUnsavedChanges && leavingAlta) {
      setPendingNavigationPath(nextPath);
      setShowUnsavedExitModal(true);
      return;
    }

    navigate(nextPath);
  }, [altaUnsavedState.hasUnsavedChanges, isAltaPath, navigate, normalizedPathname]);

  const getSectionFromPath = (pathname) => {
    const cleanPath = pathname !== '/' && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

    if (cleanPath === '/dashboard') {
      return isDireccion ? 'TestMunicipio' : 'Dashboard';
    }

    const mappedSection = pathToSection[cleanPath];

    if (mappedSection) {
      if (isDireccion && mappedSection === 'PanelDireccion') return 'EnProceso';
      return mappedSection;
    }

    return cleanPath.startsWith('/dashboard') ? 'Dashboard' : null;
  };

  const handleSectionChange = useCallback((section) => {
    const nextPath = sectionToPath[section] || '/dashboard';
    if (location.pathname !== nextPath) {
      requestNavigationIfAllowed(nextPath);
    }
  }, [location.pathname, requestNavigationIfAllowed]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarAnimating(true);
    setIsSidebarHidden((prev) => !prev);
  }, []);

  useEffect(() => {
    const sectionFromPath = getSectionFromPath(location.pathname);
    if (sectionFromPath && sectionFromPath !== activeSection) {
      setActiveSection(sectionFromPath);
    }
  }, [location.pathname, activeSection, isDireccion]);

  useEffect(() => {
    if (!isDireccion && selectedAnalista) {
      setSelectedAnalista(null);
    }
  }, [isDireccion, selectedAnalista]);

  // useEffect(() => {
  //   setPageTitle(null);
  // }, [activeSection]);

  useEffect(() => {
    if (!isSidebarAnimating) return undefined;

    const timerId = window.setTimeout(() => {
      setIsSidebarAnimating(false);
    }, 170);

    return () => window.clearTimeout(timerId);
  }, [isSidebarAnimating]);

  // Escuchar evento de navegación cruzada (EnProceso/RecibidosC3 → RevisionRequisitos)
  useEffect(() => {
    const handleNavegar = () => handleSectionChange('RevisionRequisitos');
    window.addEventListener('navegarRevision', handleNavegar);
    return () => window.removeEventListener('navegarRevision', handleNavegar);
  }, [handleSectionChange]);

  // Escuchar evento de navegación cruzada (RevisionRequisitos → ValidacionCUIP)
  useEffect(() => {
    const handleCUIP = () => handleSectionChange('ValidacionCUIP');
    window.addEventListener('navegarCUIP', handleCUIP);
    return () => window.removeEventListener('navegarCUIP', handleCUIP);
  }, [handleSectionChange]);

  // Escuchar evento de navegación cruzada → RechazosC3
  useEffect(() => {
    const handleRechazos = () => handleSectionChange('RechazosC3');
    window.addEventListener('navegarRechazos', handleRechazos);
    return () => window.removeEventListener('navegarRechazos', handleRechazos);
  }, [handleSectionChange]);

  // Escuchar evento de navegación cruzada → EnProceso (Bandeja Única)
  useEffect(() => {
    const handleEnProceso = () => handleSectionChange('EnProceso');
    window.addEventListener('navegarEnProceso', handleEnProceso);
    return () => window.removeEventListener('navegarEnProceso', handleEnProceso);
  }, [handleSectionChange]);

  useEffect(() => {
    const handleRepositorio = () => handleSectionChange('RepositorioDigital');
    window.addEventListener('navegarRepositorioDigital', handleRepositorio);
    return () => window.removeEventListener('navegarRepositorioDigital', handleRepositorio);
  }, [handleSectionChange]);

  useEffect(() => {
    const handleAltaUnsavedChange = (event) => {
      const detail = event?.detail || {};
      setAltaUnsavedState({
        hasUnsavedChanges: Boolean(detail.hasUnsavedChanges),
        message: detail.message || UNSAVED_ALTA_MESSAGE
      });
    };

    window.addEventListener('alta-unsaved-change', handleAltaUnsavedChange);
    return () => window.removeEventListener('alta-unsaved-change', handleAltaUnsavedChange);
  }, []);

  useEffect(() => {
    lastPathRef.current = normalizedPathname;
  }, [normalizedPathname]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextPopstateRef.current) {
        ignoreNextPopstateRef.current = false;
        return;
      }

      const previousPath = lastPathRef.current;
      const nextPathname = normalizePath(window.location.pathname);
      const leavingAltaByBrowser =
        altaUnsavedState.hasUnsavedChanges
        && isAltaPath(previousPath)
        && !isAltaPath(nextPathname);

      if (!leavingAltaByBrowser) {
        return;
      }

      const targetPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      ignoreNextPopstateRef.current = true;
      window.history.go(1);
      setPendingNavigationPath(targetPath || nextPathname);
      setShowUnsavedExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [altaUnsavedState.hasUnsavedChanges, isAltaPath, normalizePath]);

  useEffect(() => {
    if (!altaUnsavedState.hasUnsavedChanges || !isAltaPath(normalizedPathname)) {
      setShowUnsavedExitModal(false);
      setPendingNavigationPath('');
    }
  }, [altaUnsavedState.hasUnsavedChanges, isAltaPath, normalizedPathname]);

  const handleCancelUnsavedExit = () => {
    setShowUnsavedExitModal(false);
    setPendingNavigationPath('');
  };

  const handleConfirmUnsavedExit = () => {
    if (!pendingNavigationPath) {
      handleCancelUnsavedExit();
      return;
    }

    const destination = pendingNavigationPath;
    setShowUnsavedExitModal(false);
    setPendingNavigationPath('');
    navigate(destination);
  };

  if (loading) {
    return <LoadingScreen fullScreen message="Estamos preparando tu sesion..." size="large" />;
  }

  if (!user) return <Navigate to="/" replace />;

  const isUnknownDashboardPath = normalizedPathname.startsWith('/dashboard')
    && normalizedPathname !== '/dashboard'
    && !pathToSection[normalizedPathname];

  if (isUnknownDashboardPath) {
    return <NotFound />;
  }

  return (
    <div className={`container ${isSidebarAnimating ? 'sidebar-animating' : ''} ${isDashboardSection ? 'dashboard-active' : ''}`}>
      <Sidebar
        isHidden={isSidebarHidden}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <section id="content">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onSectionChange={handleSectionChange}
          isSidebarHidden={isSidebarHidden}
          isDireccion={isDireccion}
          selectedAnalista={selectedAnalista}
          onChangeAnalista={() => setSelectedAnalista(null)}
          pageTitle={navbarTitle}
        />
        <MainContent
          activeSection={activeSection}
          isDireccion={isDireccion}
          selectedAnalista={selectedAnalista}
          onSelectedAnalistaChange={setSelectedAnalista}
          onSectionChange={handleSectionChange}
          setPageTitle={setPageTitle} /* 3. LE PASAMOS LA FUNCIÓN AL CONTENIDO PARA QUE ALTA PUEDA ENVIAR SU TÍTULO */
        />
      </section>

      {showUnsavedExitModal && (
        <div className="alta-confirm-overlay" role="dialog" aria-modal="true" aria-label="Cambios pendientes">
          <div className="alta-confirm-card">
            <div className="alta-confirm-head">
              <h4>Cambios pendientes sin guardar</h4>
            </div>
            <div className="alta-confirm-body">
              <p>{altaUnsavedState.message || UNSAVED_ALTA_MESSAGE}</p>
            </div>
            <div className="alta-confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancelUnsavedExit}>
                Permanecer
              </button>
              <button type="button" className="btn alta-confirm-danger" onClick={handleConfirmUnsavedExit}>
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <PasswordSecurityToastBridge />
            <NotificationContainer />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/dashboard/*" element={<DashboardLayout />} />
              <Route path="/error/500" element={<ServerError />} />

              <Route path="/dashboard/carga-documentos" element={<TestCargaDocumentos />} />
              {/* <Route path="/dashboard/historial-documentos" element={<HistorialDocumentos />} /> */}

              {/* AQUÍ: Monta ProtectedRouter para todas las rutas protegidas */}
              <Route path="/*" element={<ProtectedRouter />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default App;