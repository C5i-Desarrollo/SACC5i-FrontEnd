/**
 * Configuración de rutas con lazy loading
 */
import { lazy } from 'react';

// Lazy loading de páginas
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Usuarios = lazy(() => import('../pages/Usuarios/Usuarios'));
const EditarPerfil = lazy(() => import('../pages/Perfil/EditarPerfil'));

// Trámites
const Alta = lazy(() => import('../pages/Tramites/Alta/Alta'));
const Baja = lazy(() => import('../pages/Tramites/Baja/Baja'));
const Consulta = lazy(() => import('../pages/Tramites/Consulta/Consulta'));

// C3
const PersonasPendientesC3 = lazy(() => import('../pages/C3/PersonasPendientesC3/PersonasPendientesC3'));

// Rechazados
const Rechazados = lazy(() => import('../pages/Tramites/Rechazados/Rechazados'));

// Dependencias
const TramitesDependencia = lazy(() => import('../pages/Dependencias/TramitesDependencia'));

//test
const TestMunicipio = lazy(() => import('../pages/TestMunicipio/TestMunicipio'));
const TestCargaDocumentos = lazy(() => import('../pages/TestCargaDocumentos/TestCargaDocumentos'));
const TestRevisionC5 = lazy(() => import('../pages/TestRevisionC5/TestRevisionC5'));

//listados
const ListadoNominal = lazy(() => import('../pages/ListadoNominal/ListadoNominal'));

const RepositorioMunicipios = lazy(() => import('../pages/RepositorioMunicipios/RepositorioMunicipios'));

/**
 * Configuración de rutas protegidas
 * Cada ruta define:
 * - path: URL de la ruta
 * - element: Componente a renderizar (lazy loaded)
 * - permission: Permiso requerido (opcional)
 * - title: Título de la página
 */
export const protectedRoutes = [
  {
    path: 'dashboard',
    element: Dashboard,
    permission: 'VIEW_DASHBOARD',
    title: 'Dashboard'
  },
  {
    path: 'usuarios',
    element: Usuarios,
    permission: 'VIEW_USUARIOS',
    title: 'Gestión de Usuarios'
  },
  {
    path: 'perfil',
    element: EditarPerfil,
    permission: 'VIEW_PERFIL',
    title: 'Mi Perfil'
  },

  // Trámites - Alta
  {
    path: 'tramites/alta',
    element: Alta,
    permission: 'VIEW_ALTA',
    title: 'Alta de Personal'
  },

  // Trámites - Baja
  {
    path: 'tramites/baja',
    element: Baja,
    permission: 'VIEW_BAJA',
    title: 'Baja de Personal'
  },

  // Trámites - Consulta
  {
    path: 'tramites/consulta',
    element: Consulta,
    permission: 'VIEW_CONSULTA',
    title: 'Consulta de Trámites'
  },

  // C3
  {
    path: 'c3/pendientes',
    element: PersonasPendientesC3,
    permission: 'VIEW_PENDIENTES_C3',
    title: 'Personas Pendientes C3'
  },

  // Dependencias
  {
    path: 'dependencia/tramites',
    element: TramitesDependencia,
    permission: 'VIEW_TRAMITES_DEPENDENCIA',
    title: 'Mis Trámites'
  },

  // Ruta de prueba para filtrado por municipio
  {
    path: 'test-municipio', // <-- Cambiado de 'test/municipio' a 'test-municipio'
    element: TestMunicipio,
    permission: 'VIEW_DASHBOARD', // <-- Cambiado a 'VIEW_DASHBOARD' para que el Admin/Dirección puedan entrar sin problemas de permisos
    title: 'Filtrado Municipio'
  },

  // Municipio - carga documentos
  {
    path: 'municipio/carga-documentos',
    element: TestCargaDocumentos,
    permission: 'VIEW_DASHBOARD',
    title: 'Carga de Documentos'
  },
  // Municipio - revisión documentos
  {
    path: 'municipio/revision-documentos',
    element: TestRevisionC5,
    permission: 'VIEW_DASHBOARD',
    title: 'Revisión de Documentos'
  },

  {
    path: 'revision-municipios',
    element: TestRevisionC5,
    permission: 'VIEW_DASHBOARD',
    title: 'Revisión C5'
  },

  {
    path: 'listado-nominal',
    element: ListadoNominal,
    permission: 'VIEW_DASHBOARD',
    title: 'Listado Nominal'
  },

  {
    path: 'repositorio-municipios',
    element: RepositorioMunicipios,
    permission: 'VIEW_DASHBOARD',
    title: 'Repositorio de Respaldos'
  }

];

/**
 * Mapeo de secciones del menú viejo a rutas nuevas
 * Para compatibilidad con el sistema existente
 */
export const sectionToRoute = {
  Dashboard: '/dashboard',
  PanelDireccion: '/dashboard/direccion',
  Usuarios: '/dashboard/usuarios',
  Perfil: '/dashboard/perfil',
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
  TestMunicipio: '/dashboard/test-municipio',
  CargarDocumentos: '/dashboard/municipio/carga-documentos',
  RevisionMunicipios: '/dashboard/revision-municipios',
  TestCargaDocumentos: '/dashboard/municipio/carga-documentos',
  TestRevisionC5: '/dashboard/revision-municipios',
  ListadoNominal: '/dashboard/listado-nominal',
  RepositorioMunicipios: '/dashboard/repositorio-municipios'
};

/**
 * Obtener ruta desde nombre de sección
 */
export const getRouteFromSection = (section) => {
  return sectionToRoute[section] || '/dashboard';
};
