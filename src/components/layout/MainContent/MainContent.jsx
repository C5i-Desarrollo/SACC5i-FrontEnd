import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { usePermissions } from '../../../hooks/usePermissions';
import Dashboard from '../../../pages/Dashboard/Dashboard';
import Alta from '../../../pages/Tramites/Alta/Alta';
import Baja from '../../../pages/Tramites/Baja/Baja';
import Consulta from '../../../pages/Tramites/Consulta/Consulta';
import Usuarios from '../../../pages/Usuarios/Usuarios';
import EditarPerfil from '../../../pages/Perfil/EditarPerfil';
import PersonasPendientesC3 from '../../../pages/C3/PersonasPendientesC3/PersonasPendientesC3';
import TramitesDependencia from '../../../pages/Dependencias/TramitesDependencia';
import Rechazados from '../../../pages/Tramites/Rechazados/Rechazados';
import RevisionRequisitos from '../../../pages/Tramites/RevisionRequisitos/RevisionRequisitos';
import ValidacionCUIP from '../../../pages/Tramites/ValidacionCUIP/ValidacionCUIP';
import EnProceso from '../../../pages/Tramites/EnProceso/EnProceso';
import HistorialC3 from '../../../pages/C3/HistorialC3/HistorialC3';
import HistorialCitas from '../../../pages/Citas/HistorialCitas/HistorialCitas';
import Finalizados from '../../../pages/Finalizados/Finalizados';
import CopiasConocimiento from '../../../pages/CCP/CopiasConocimiento';
import HistorialOperadorCCP from '../../../pages/CCP/HistorialOperadorCCP';
import RepositorioDigitalContainer from '../../../pages/RepositorioDigital/RepositorioDigitalContainer';
import PanelDireccion from '../../../pages/Direccion/PanelDireccion';
import { getPanelDireccionApi } from '../../../services/api';
import './MainContent.css';
import './DireccionSelector.css';

const normalizarAnalistasDireccion = (lista = []) => {
  const analistasMap = new Map();

  lista.forEach((item) => {
    const id = Number(item?.analista_id);
    if (!Number.isFinite(id) || id <= 0 || analistasMap.has(id)) {
      return;
    }

    analistasMap.set(id, {
      id,
      nombre: String(item?.analista_nombre || item?.analista_usuario || 'Analista').trim(),
      usuario: String(item?.analista_usuario || 'sin_usuario').trim(),
      region: String(item?.region_nombre || 'Sin region').trim(),
      totalTramites: Number(item?.total_tramites || 0)
    });
  });

  return Array.from(analistasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
};

const obtenerInicialesAnalista = (nombre = '') => {
  const limpio = String(nombre).trim();
  if (!limpio) return 'AN';

  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0] || ''}${partes[1][0] || ''}`.toUpperCase();
};

function MainContent({
  activeSection,
  setPageTitle,
  isDireccion = false,
  selectedAnalista = null,
  onSelectedAnalistaChange,
  onSectionChange
}) {
  const { can } = usePermissions();
  const hasAnalistaSeleccionado = Boolean(Number(selectedAnalista?.id));

  const renderDireccionSelector = ({
    mensaje,
    nextSectionOnSelect = null
  } = {}) => (
    <DireccionAnalistaSelector
      selectedAnalista={selectedAnalista}
      onSelectedAnalistaChange={onSelectedAnalistaChange}
      onSectionChange={onSectionChange}
      nextSectionOnSelect={nextSectionOnSelect}
      mensaje={mensaje}
    />
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        if (isDireccion) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para consultar la vista operativa desde el menu lateral.',
            nextSectionOnSelect: 'EnProceso'
          });
        }
        return <Dashboard />;

      case 'PanelDireccion':
        if (isDireccion) {
          return (
            <DireccionSinAnalista
              titulo="Panel de direccion deshabilitado"
              mensaje="Esta cuenta opera en modo solo lectura con seguimiento por analista."
            />
          );
        }
        return can('VIEW_PANEL_DIRECCION') ? <PanelDireccion setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'Usuarios':
        return can('VIEW_USUARIOS') ? <Usuarios setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'Alta':
        // 2. Pásalo también a Alta para que funcione ahí
        return can('VIEW_ALTA') ? <Alta setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'Baja':
        return (can('VIEW_BAJA') || isDireccion) ? (
          <Baja
            setPageTitle={setPageTitle}
            isDireccion={isDireccion}
          />
        ) : <NoPermiso />;
        
      case 'PersonasPendientesC3':
        return can('VIEW_PENDIENTES_C3') ? <PersonasPendientesC3 setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'TramitesDependencia':
        return can('VIEW_TRAMITES_DEPENDENCIA') ? <TramitesDependencia setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'Consulta':
        return can('VIEW_CONSULTA') ? <Consulta setPageTitle={setPageTitle} /> : <NoPermiso />;
        
      case 'Perfil':
        return <EditarPerfil setPageTitle={setPageTitle} />;
        
      case 'RechazosC3':
        if (isDireccion && !hasAnalistaSeleccionado) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para abrir Rechazos en modo solo lectura.'
          });
        }
        return can('VIEW_RECHAZOS_C3') ? (
          <Rechazados
            setPageTitle={setPageTitle}
            analistaId={selectedAnalista?.id}
            readOnly={isDireccion}
            requireAnalista={isDireccion}
          />
        ) : <NoPermiso />;

      case 'RevisionRequisitos':
        return can('VIEW_ALTA') ? <RevisionRequisitos setPageTitle={setPageTitle} /> : <NoPermiso />;

      case 'EnProceso':
        if (isDireccion && !hasAnalistaSeleccionado) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para consultar la bandeja de En Proceso.'
          });
        }
        return (can('VIEW_ALTA') || isDireccion) ? (
          <EnProceso
            setPageTitle={setPageTitle}
            analistaId={selectedAnalista?.id}
            readOnly={isDireccion}
            requireAnalista={isDireccion}
          />
        ) : <NoPermiso />;

      case 'ValidacionCUIP':
        // AQUÍ ESTÁ EL ERROR: Te falta pasarla
        return can('VIEW_ALTA') ? <ValidacionCUIP setPageTitle={setPageTitle} /> : <NoPermiso />;

      case 'HistorialC3':
        return can('VIEW_HISTORIAL_C3') ? <HistorialC3 setPageTitle={setPageTitle} /> : <NoPermiso />;

      case 'HistorialCitas':
        if (isDireccion && !hasAnalistaSeleccionado) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para consultar la vista de Citas.'
          });
        }
        return (can('VIEW_CITAS') || isDireccion) ? (
          <HistorialCitas
            setPageTitle={setPageTitle}
            analistaId={selectedAnalista?.id}
            readOnly={isDireccion}
            requireAnalista={isDireccion}
          />
        ) : <NoPermiso />;

      case 'Finalizados':
        if (isDireccion && !hasAnalistaSeleccionado) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para consultar expedientes Finalizados.'
          });
        }
        return can('VIEW_FINALIZADOS') ? (
          <Finalizados
            setPageTitle={setPageTitle}
            analistaId={selectedAnalista?.id}
            readOnly={isDireccion}
            requireAnalista={isDireccion}
          />
        ) : <NoPermiso />;

      case 'CopiasConocimiento':
        return can('VIEW_CCP') ? <CopiasConocimiento setPageTitle={setPageTitle} /> : <NoPermiso />;

      case 'HistorialOperadorCCP':
        return can('VIEW_HISTORIAL_CCP') ? <HistorialOperadorCCP setPageTitle={setPageTitle} /> : <NoPermiso />;


      case 'RepositorioDigital':
        return can('VIEW_REPOSITORIO_DIGITAL') ? <RepositorioDigitalContainer setPageTitle={setPageTitle} /> : <NoPermiso />;
      case 'ConsultaDependencia':
        return <EnDesarrollo seccion={activeSection} />;

      case 'Catalogos':
      case 'Configuracion':
        return <NoPermiso />;
        
      default:
        if (isDireccion) {
          return renderDireccionSelector({
            mensaje: 'Selecciona un analista para iniciar el seguimiento operativo.'
          });
        }
        return <Dashboard />;
    }
  };

  return <main className="main-section-shell">{renderContent()}</main>;
}

function DireccionAnalistaSelector({
  selectedAnalista = null,
  onSelectedAnalistaChange,
  onSectionChange,
  nextSectionOnSelect = null,
  mensaje = 'Selecciona un analista para iniciar el seguimiento operativo.'
}) {
  const [loadingAnalistas, setLoadingAnalistas] = useState(false);
  const [analistas, setAnalistas] = useState([]);
  const [analistaBusqueda, setAnalistaBusqueda] = useState('');
  const [errorCarga, setErrorCarga] = useState('');

  const cargarAnalistas = useCallback(async () => {
    setLoadingAnalistas(true);
    setErrorCarga('');

    try {
      const response = await getPanelDireccionApi();
      const lista = response?.data?.data?.desempeno_analistas || [];
      setAnalistas(normalizarAnalistasDireccion(lista));
    } catch (error) {
      setAnalistas([]);
      setErrorCarga(error?.response?.data?.message || 'No se pudo cargar la lista de analistas.');
    } finally {
      setLoadingAnalistas(false);
    }
  }, []);

  useEffect(() => {
    cargarAnalistas();
  }, [cargarAnalistas]);

  const analistasFiltrados = useMemo(() => {
    const termino = analistaBusqueda.trim().toLowerCase();
    if (!termino) return analistas;

    return analistas.filter((analista) => {
      return (
        analista.nombre.toLowerCase().includes(termino)
        || analista.usuario.toLowerCase().includes(termino)
        || analista.region.toLowerCase().includes(termino)
      );
    });
  }, [analistas, analistaBusqueda]);

  const handleSelectAnalista = useCallback((analista) => {
    onSelectedAnalistaChange?.(analista);

    if (nextSectionOnSelect) {
      onSectionChange?.(nextSectionOnSelect);
    }
  }, [nextSectionOnSelect, onSectionChange, onSelectedAnalistaChange]);

  return (
    <section className="direccion-selector-scene">
      <div className="direccion-selector-atmosphere" aria-hidden="true">
        <span className="direccion-float-orb orb-a"></span>
        <span className="direccion-float-orb orb-b"></span>
        <span className="direccion-float-orb orb-c"></span>
      </div>

      <header className="direccion-selector-header">
        <div className="direccion-selector-header-top">
          <div className="direccion-selector-titleblock">
            <p className="direccion-selector-kicker">Vista operativa de direccion</p>
            <h2>Seleccionar usuario analista</h2>
          </div>

          {selectedAnalista && (
            <div className="direccion-selector-current" aria-label="Analista actual">
              <span className="direccion-selector-current-label">Analista actual</span>
              <strong>{selectedAnalista.nombre}</strong>
              <span className="direccion-selector-current-region">{selectedAnalista.region || 'Sin region'}</span>
            </div>
          )}
        </div>

        <div className="direccion-selector-note" role="note" aria-label="Nota de uso">
          <i className="bx bx-bulb" aria-hidden="true"></i>
          <p>{mensaje}</p>
        </div>
      </header>

      <div className="direccion-selector-toolbar">
        <label className="direccion-selector-search al-search-box">
          <i className="bx bx-search" aria-hidden="true"></i>
          <input
            type="text"
            value={analistaBusqueda}
            onChange={(event) => setAnalistaBusqueda(event.target.value)}
            placeholder="Buscar por nombre o region"
            aria-label="Buscar analista"
          />
        </label>

        <div className="direccion-selector-actions">
          <button
            type="button"
            className="direccion-selector-refresh btn btn-primary"
            onClick={cargarAnalistas}
            disabled={loadingAnalistas}
          >
            <FiRefreshCw className={loadingAnalistas ? 'spin' : ''} />
            {loadingAnalistas ? 'Actualizando...' : 'Actualizar'}
          </button>

          <button
            type="button"
            className="direccion-selector-clear btn btn-secondary"
            onClick={() => onSelectedAnalistaChange?.(null)}
            disabled={!selectedAnalista}
          >
            Limpiar seleccion
          </button>
        </div>
      </div>

      <div className="direccion-selector-grid" role="list" aria-label="Lista de analistas">
        {loadingAnalistas ? (
          <div className="direccion-selector-state">Cargando analistas...</div>
        ) : errorCarga ? (
          <div className="direccion-selector-state error">
            <p>{errorCarga}</p>
            <button type="button" onClick={cargarAnalistas}>Reintentar</button>
          </div>
        ) : analistasFiltrados.length === 0 ? (
          <div className="direccion-selector-state">No hay analistas que coincidan con la busqueda.</div>
        ) : (
          analistasFiltrados.map((analista) => {
            const isSelected = Number(selectedAnalista?.id) === analista.id;

            return (
              <button
                key={analista.id}
                type="button"
                role="listitem"
                className={`direccion-analista-profile${isSelected ? ' is-selected' : ''}`}
                style={{ '--analista-hue': (analista.id * 37) % 360 }}
                onClick={() => handleSelectAnalista(analista)}
              >
                <span className="direccion-analista-avatar">{obtenerInicialesAnalista(analista.nombre)}</span>
                <span className="direccion-analista-name">{analista.nombre}</span>
                <span className="direccion-analista-region">{analista.region}</span>
                <span className="direccion-analista-meta">{analista.totalTramites} tramites</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function NoPermiso() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <i className='bx bx-lock-alt' style={{ fontSize: '60px', color: '#dc3545' }}></i>
      <h2 style={{ color: '#666', marginTop: '20px' }}>Acceso Denegado</h2>
      <p style={{ color: '#999' }}>No tienes permisos para acceder a esta sección</p>
    </div>
  );
}

function EnDesarrollo({ seccion }) {
  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' }}>
        <i className='bx bx-wrench' style={{ fontSize: '60px', color: '#ffc107' }}></i>
        <h2 style={{ marginTop: '20px' }}>{seccion}</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Esta sección está en desarrollo...
        </p>
      </div>
    </div>
  );
}

export default memo(MainContent);
