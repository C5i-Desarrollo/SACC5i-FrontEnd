import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../constants/roles';
import { sectionToRoute } from '../../../routes/routesConfig';
import '../styles/DashboardAcciones.css';

/** Accesos rápidos definitidos por rol */
const ACCIONES = {
  [ROLES.SUPER_ADMIN]: [
    {
      icon: 'bxs-group',
      title: 'Gestión de Usuarios',
      desc: 'Alta, modificación y control de accesos del personal del sistema.',
      section: 'Usuarios',
      color: 'guinda',
    },
    {
      icon: 'bxs-file-plus',
      title: 'Alta de Personal',
      desc: 'Seguimiento integral del ciclo de alta y validación documental.',
      section: 'Alta',
      color: 'dorado',
    },
    {
      icon: 'bxs-search',
      title: 'Consulta General',
      desc: 'Búsqueda y consulta de trámites y solicitudes registradas.',
      section: 'Consulta',
      color: 'gris',
    },
    {
      icon: 'bxs-file',
      title: 'Copias de Conocimiento',
      desc: 'Control centralizado de oficios y exportación operativa CCP.',
      section: 'CopiasConocimiento',
      color: 'guinda',
    },
  ],
  [ROLES.ADMIN]: [
    {
      icon: 'bxs-group',
      title: 'Gestión de Usuarios',
      desc: 'Administración de cuentas y permisos del personal operativo.',
      section: 'Usuarios',
      color: 'guinda',
    },
    {
      icon: 'bxs-file-plus',
      title: 'Alta de Personal',
      desc: 'Gestión de trámites de ingreso y validación de expedientes.',
      section: 'Alta',
      color: 'dorado',
    },
    {
      icon: 'bxs-search',
      title: 'Consulta',
      desc: 'Búsqueda y seguimiento de solicitudes y trámites activos.',
      section: 'Consulta',
      color: 'pizarra',
    },
    {
      icon: 'bxs-file',
      title: 'Copias de Conocimiento',
      desc: 'Supervisión de registros CCP y control documental en tiempo real.',
      section: 'CopiasConocimiento',
      color: 'gris',
    },
  ],
  [ROLES.ANALISTA]: [
    {
      icon: 'bxs-file-plus',
      title: 'Nueva Solicitud de Alta',
      desc: 'Iniciar un nuevo trámite de ingreso de personal a la institución.',
      section: 'Alta',
      color: 'guinda',
    },
    {
      icon: 'bx-time-five',
      title: 'Bandeja en Proceso',
      desc: 'Gestión de expedientes en validación: Revisión de Requisitos y CUIP.',
      section: 'EnProceso',
      color: 'dorado',
    },
    {
      icon: 'bxs-x-circle',
      title: 'Rechazos',
      desc: 'Revisión y atención de dictámenes rechazados por el Centro C3.',
      section: 'RechazosC3',
      color: 'pizarra',
    },
    {
      icon: 'bxs-search',
      title: 'Consulta de Trámites',
      desc: 'Búsqueda de solicitudes y expedientes registrados en el sistema.',
      section: 'Consulta',
      color: 'gris',
    },
  ],
  [ROLES.VALIDADOR_C3]: [
    {
      icon: 'bxs-user-check',
      title: 'Personas Pendientes C3',
      desc: 'Revisión y emisión de dictámenes para personal enviado al C3.',
      section: 'PersonasPendientesC3',
      color: 'guinda',
    },
    {
      icon: 'bxs-time',
      title: 'Historial C3',
      desc: 'Consulta del historial de dictámenes emitidos por el Centro C3.',
      section: 'HistorialC3',
      color: 'dorado',
    },
  ],
  [ROLES.DIRECCION]: [
    {
      icon: 'bx-loader-circle',
      title: 'Bandeja En Proceso',
      desc: 'Vista ejecutiva de expedientes activos por analista seleccionado.',
      section: 'EnProceso',
      color: 'guinda',
    },
    {
      icon: 'bx-calendar-event',
      title: 'Citas Programadas',
      desc: 'Seguimiento de agenda y estatus de citas en curso.',
      section: 'HistorialCitas',
      color: 'dorado',
    },
    {
      icon: 'bx-badge-check',
      title: 'Finalizados',
      desc: 'Control de cierres y constancias emitidas.',
      section: 'Finalizados',
      color: 'pizarra',
    },
    {
      icon: 'bx-message-square-x',
      title: 'Rechazos',
      desc: 'Análisis de rechazos para toma de decisiones tácticas.',
      section: 'RechazosC3',
      color: 'gris',
    },
  ],
  [ROLES.DEPENDENCIA]: [
    {
      icon: 'bxs-folder-open',
      title: 'Mis Trámites',
      desc: 'Seguimiento de las solicitudes de alta registradas por la dependencia.',
      section: 'TramitesDependencia',
      color: 'guinda',
    },
    {
      icon: 'bxs-search',
      title: 'Consulta',
      desc: 'Búsqueda y revisión de expedientes del personal de la dependencia.',
      section: 'ConsultaDependencia',
      color: 'dorado',
    },
  ],
};

const AVISOS_POR_ROL = {
  [ROLES.SUPER_ADMIN]: 'Consolidar cierres semanales mejora trazabilidad institucional.',
  [ROLES.ADMIN]: 'Revisa permisos críticos antes de cambios de plantilla.',
  [ROLES.ANALISTA]: 'Prioriza expedientes en revisión con mayor antigüedad.',
  [ROLES.VALIDADOR_C3]: 'Dictámenes pendientes impactan el flujo completo de alta.',
  [ROLES.DIRECCION]: 'Selecciona analista para ver operación en detalle por responsable.',
  [ROLES.DEPENDENCIA]: 'Mantén documentos completos para reducir rechazos.',
  [ROLES.OPERADOR_CCP]: 'Respalda exportaciones al finalizar cada jornada.'
};

/**
 * DashboardAcciones — Grid de accesos directos según el rol del usuario
 */
export default function DashboardAcciones({ tips = [], notices = [] }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const acciones = ACCIONES[user?.rol] || [];

  if (!acciones.length) return null;

  const avisoRol = AVISOS_POR_ROL[user?.rol] || 'Sin avisos específicos para este perfil.';
  const tipSecundario = tips.length > 1 ? tips[1] : tips[0];
  const noticeSecundario = notices.length > 1 ? notices[1] : notices[0];

  const handleClick = (section) => {
    const route = sectionToRoute[section];
    if (route) navigate(route);
  };

  return (
    <div className="dba-section">
      <div className="dba-headline">
        <h3 className="dba-section-title">Accesos Estratégicos</h3>
        <span className="dba-headline-tag">Navegación del sistema</span>
      </div>

      <div className="dba-layout">
        <div className="dba-grid">
          {acciones.map((accion) => (
            <div
              key={accion.section}
              className={`dba-card dba-card-${accion.color}`}
              onClick={() => handleClick(accion.section)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(accion.section)}
            >
              <div className="dba-card-header">
                <div className={`dba-icon dba-icon-${accion.color}`}>
                  <i className={`bx ${accion.icon}`} />
                </div>
                <div className="dba-arrow">
                  <i className="bx bx-right-arrow-alt" />
                </div>
              </div>

              <div>
                <p className="dba-card-title">{accion.title}</p>
                <p className="dba-card-desc">{accion.desc}</p>
                <span className="dba-card-pill">Abrir módulo</span>
              </div>
            </div>
          ))}
        </div>

        <aside className="dba-note-board">
          <div className="dba-note-item">
            <span className="dba-note-title">Aviso del perfil</span>
            <p>{avisoRol}</p>
          </div>

          <div className="dba-note-item">
            <span className="dba-note-title">Recomendación útil</span>
            <p>{tipSecundario || 'Mantén validación de datos al cierre de jornada.'}</p>
          </div>

          <div className="dba-note-item dba-note-item-alt">
            <span className="dba-note-title">Atención operativa</span>
            <p>{noticeSecundario || 'Monitoreo estable, sin incidencias críticas registradas.'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
