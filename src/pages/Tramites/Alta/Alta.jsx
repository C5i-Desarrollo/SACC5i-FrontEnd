import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { useAltaSolicitudes } from '../../../hooks/alta/useAltaSolicitudes';
import { useAltaCatalogos } from '../../../hooks/alta/useAltaCatalogos';
import { useAltaSteps } from '../../../hooks/alta/useAltaSteps';

// Iconos
import {
  MdAssignment,
  MdAdd,
  MdDescription,
  MdMoveToInbox,
  MdHistory
} from 'react-icons/md';

// Componentes
import AltaListado from './components/AltaListado';
import AltaPaso1 from './components/AltaPaso1';
import AltaPaso2 from './components/AltaPaso2';
import RecibidosC3 from './components/RecibidosC3';

import './styles/Alta.css';

const UNSAVED_CHANGES_MESSAGE = 'Tienes cambios sin guardar en la solicitud de alta. Si sales ahora, se perderan. Deseas continuar?';

export default function Alta({ setPageTitle }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const solicitudNotificacionParam = searchParams.get('solicitud');
  const personaNotificacionParam = searchParams.get('persona');
  const solicitudNotificacionProcesadaRef = useRef(null);
  const esAdminMultiRegion = user?.rol === 'admin' || user?.rol === 'super_admin';
  const [selectedRegionId, setSelectedRegionId] = useState(() => (user?.region_id ? String(user.region_id) : ''));

  const {
    solicitudes,
    solicitudActual,
    loading,
    submitting,
    cargarSolicitudes,
    crearSolicitud,
    obtenerSolicitud,
    limpiarSolicitudActual
  } = useAltaSolicitudes();

  const {
    tiposOficio,
    regiones,
    municipios,
    puestos,
    regionActivaId,
    loading: catalogosLoading
  } = useAltaCatalogos(user, selectedRegionId);

  useEffect(() => {
    if (!esAdminMultiRegion) {
      const fixedRegionId = user?.region_id ? String(user.region_id) : '';
      setSelectedRegionId((prev) => (prev === fixedRegionId ? prev : fixedRegionId));
      return;
    }

    if (!selectedRegionId && user?.region_id) {
      setSelectedRegionId(String(user.region_id));
    }
  }, [esAdminMultiRegion, user?.region_id, selectedRegionId]);

  const regionSeleccionadaNombre = useMemo(() => {
    if (!regionActivaId) return '';
    const match = regiones.find((region) => String(region.id) === String(regionActivaId));
    return match?.nombre || '';
  }, [regiones, regionActivaId]);

  const {
    currentStep,
    goToListado,
    goToPaso1,
    goToPaso2,
    goToStep,
    isStep,
    getStepData
  } = useAltaSteps('listado');

  // true solo cuando el usuario crea un tramite nuevo (no cuando vista existente)
  const [esNuevaTramite, setEsNuevaTramite] = useState(false);
  const [paso1Draft, setPaso1Draft] = useState(null);
  const [paso2Draft, setPaso2Draft] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [mostrarFiltrosListado, setMostrarFiltrosListado] = useState(false);
  const [mostrarFiltrosC3, setMostrarFiltrosC3] = useState(false);
  const [refreshC3Token, setRefreshC3Token] = useState(0);
  const [hasUnsavedPaso1, setHasUnsavedPaso1] = useState(false);
  const [hasUnsavedPaso2, setHasUnsavedPaso2] = useState(false);

  const hasUnsavedChanges =
    (isStep('paso1') && hasUnsavedPaso1) ||
    (isStep('paso2') && hasUnsavedPaso2);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('alta-unsaved-change', {
        detail: {
          hasUnsavedChanges,
          message: UNSAVED_CHANGES_MESSAGE
        }
      })
    );
  }, [hasUnsavedChanges]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent('alta-unsaved-change', {
          detail: {
            hasUnsavedChanges: false,
            message: UNSAVED_CHANGES_MESSAGE
          }
        })
      );
    };
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (setPageTitle) {
      const timer = setTimeout(() => {
        setPageTitle({
          titulo: "Trámites de Alta",
          subtitulo: "Gestión de solicitudes de alta de personal",
          icon: <MdAssignment className="nav-icon-highlight" />
        });
      }, 0);
      return () => {
        clearTimeout(timer);
        setPageTitle(null);
      };
    }
  }, [setPageTitle]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const handleNuevaSolicitud = () => {
    setEsNuevaTramite(false);
    setPaso1Draft(null);
    setPaso2Draft(null);
    limpiarSolicitudActual();
    goToPaso1();
  };

  const formatDateOnly = (value) => {
    if (!value) return '';
    return String(value).split('T')[0];
  };

  const mapSolicitudToPaso1Data = (solicitud) => ({
    region_id: solicitud?.region_id ? String(solicitud.region_id) : (selectedRegionId || ''),
    tipo_documento: solicitud?.tipo_documento || 'Oficio',
    tipo_oficio_id: solicitud?.tipo_oficio_id ? String(solicitud.tipo_oficio_id) : '1',
    municipio_id: solicitud?.municipio_id ? String(solicitud.municipio_id) : '',
    numero_oficio_c5: solicitud?.numero_oficio_c5 || '',
    proceso_movimiento: solicitud?.proceso_movimiento || 'ALTA',
    termino: solicitud?.termino || 'Normal',
    dias_horas: solicitud?.dias_horas || 'Dias',
    fecha_sello_c5: formatDateOnly(solicitud?.fecha_sello_c5),
    fecha_recibido_dt: formatDateOnly(solicitud?.fecha_recibido_dt),
    fecha_solicitud: formatDateOnly(solicitud?.fecha_solicitud),
    observaciones: solicitud?.observaciones || ''
  });

  const mapPaso1DataToSolicitud = (formData, baseSolicitud) => ({
    ...baseSolicitud,
    region_id: formData?.region_id || baseSolicitud?.region_id || regionActivaId,
    region_nombre: formData?.region_id
      ? (regiones.find((region) => String(region.id) === String(formData.region_id))?.nombre || baseSolicitud?.region_nombre)
      : baseSolicitud?.region_nombre,
    tipo_documento: formData?.tipo_documento || baseSolicitud?.tipo_documento,
    tipo_oficio_id: formData?.tipo_oficio_id || baseSolicitud?.tipo_oficio_id,
    municipio_id: formData?.municipio_id || baseSolicitud?.municipio_id,
    numero_oficio_c5: formData?.numero_oficio_c5 ?? baseSolicitud?.numero_oficio_c5 ?? '',
    proceso_movimiento: formData?.proceso_movimiento || baseSolicitud?.proceso_movimiento,
    termino: formData?.termino || baseSolicitud?.termino,
    dias_horas: formData?.dias_horas || baseSolicitud?.dias_horas,
    fecha_sello_c5: formData?.fecha_sello_c5 || null,
    fecha_recibido_dt: formData?.fecha_recibido_dt || null,
    fecha_solicitud: formData?.fecha_solicitud || baseSolicitud?.fecha_solicitud,
    observaciones: formData?.observaciones || '',
    municipio_nombre:
      municipios.find((m) => String(m.id) === String(formData?.municipio_id || baseSolicitud?.municipio_id))?.nombre ||
      baseSolicitud?.municipio_nombre ||
      baseSolicitud?.municipio
  });

  const solicitudPaso2 = getStepData('paso2') || solicitudActual;
  const initialPaso1Data = paso1Draft || getStepData('paso1');
  const hasPendingDraftInAlta = Boolean(esNuevaTramite && (solicitudPaso2?.id || solicitudActual?.id));

  const handlePaso1DraftChange = useCallback((nextDraft) => {
    setPaso1Draft((prev) => {
      const prevSignature = JSON.stringify(prev || {});
      const nextSignature = JSON.stringify(nextDraft || {});
      return prevSignature === nextSignature ? prev : nextDraft;
    });
  }, []);

  const handlePaso2DraftChange = useCallback((nextDraft) => {
    setPaso2Draft((prev) => {
      const prevSignature = JSON.stringify(prev || {});
      const nextSignature = JSON.stringify(nextDraft || {});
      return prevSignature === nextSignature ? prev : nextDraft;
    });
  }, []);

  const handleVerSolicitud = useCallback(async (id) => {
    try {
      const solicitud = await obtenerSolicitud(id);

      if (esAdminMultiRegion && solicitud?.region_id) {
        setSelectedRegionId(String(solicitud.region_id));
      }

      setEsNuevaTramite(false);
      setPaso1Draft(null);
      setPaso2Draft(null);
      setHasUnsavedPaso1(false);
      setHasUnsavedPaso2(false);

      goToPaso2(solicitud);
    } catch (error) {
      showNotification('Error al cargar la solicitud', 'error');
    }
  }, [obtenerSolicitud, esAdminMultiRegion, goToPaso2, showNotification]);

  useEffect(() => {
    if (!solicitudNotificacionParam) return;

    const claveNotificacion = `${solicitudNotificacionParam}-${personaNotificacionParam || ''}`;

    if (solicitudNotificacionProcesadaRef.current === claveNotificacion) {
      return;
    }

    solicitudNotificacionProcesadaRef.current = claveNotificacion;

    handleVerSolicitud(solicitudNotificacionParam).then(() => {
      setSearchParams({}, { replace: true });
    });
  }, [
    solicitudNotificacionParam,
    personaNotificacionParam,
    handleVerSolicitud,
    setSearchParams
  ]);

  const handleSubmitPaso1 = async (formData) => {
    const payload = esAdminMultiRegion
      ? { ...formData, region_id: formData.region_id || selectedRegionId }
      : formData;

    if (esNuevaTramite && solicitudActual?.id) {
      const solicitudActualizada = mapPaso1DataToSolicitud(payload, solicitudPaso2 || solicitudActual);
      goToPaso2(solicitudActualizada);
      setPaso1Draft(payload);
      showNotification('Información de la solicitud actualizada', 'success');
      return;
    }

    try {
      const nuevaSolicitud = await crearSolicitud(payload);
      const solicitudCompleta = await obtenerSolicitud(nuevaSolicitud.id);
      showNotification('Solicitud creada exitosamente', 'success');
      setEsNuevaTramite(true);
      setPaso1Draft(payload);
      goToPaso2(solicitudCompleta);
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Error al crear solicitud',
        'error'
      );
    }
  };

  const handleVolverListado = async () => {
    setEsNuevaTramite(false);
    setPaso1Draft(null);
    setPaso2Draft(null);
    setHasUnsavedPaso1(false);
    setHasUnsavedPaso2(false);
    limpiarSolicitudActual();
    goToListado();
    await cargarSolicitudes();
  };

  const handleVolverDesdePaso2 = () => {
    handleVolverListado();
  };

  const handleRegresarPaso2APaso1 = () => {
    if (esNuevaTramite) {
      const solicitudBase = solicitudPaso2 || solicitudActual;
      const paso1Data = paso1Draft || (solicitudBase ? mapSolicitudToPaso1Data(solicitudBase) : null);

      if (paso1Data) {
        setPaso1Draft(paso1Data);
      }

      goToPaso1(paso1Data);
      return;
    }

    handleVolverDesdePaso2();
  };

  const handleSiguienteDesdePaso2 = () => {
    handleVolverListado();
  };

  const handleSiguienteDesdePaso1 = () => {
    if (solicitudPaso2?.id || solicitudActual?.id) {
      goToPaso2(solicitudPaso2 || solicitudActual);
    }
  };

  const handleRegresarDesdePaso1 = () => {
    handleVolverListado();
  };

  const handleCancelarPaso1 = () => {
    handleVolverListado();
  };

  const handleComplete = () => {
    showNotification('Proceso completado exitosamente', 'success');
    setHasUnsavedPaso1(false);
    setHasUnsavedPaso2(false);
    handleVolverListado();
  };

  const isVistaBandeja = isStep('listado') || isStep('recibidosC3') || isStep('historialC3');
  const filtrosActivos = isStep('listado') ? mostrarFiltrosListado : (isStep('recibidosC3') || isStep('historialC3')) ? mostrarFiltrosC3 : false;

  const handleToggleFiltrosGlobal = () => {
    if (isStep('listado')) {
      setMostrarFiltrosListado((prev) => !prev);
      return;
    }

    if (isStep('recibidosC3') || isStep('historialC3')) {
      setMostrarFiltrosC3((prev) => !prev);
    }
  };

  const handleRefreshVista = async () => {
    if (isStep('listado')) {
      await cargarSolicitudes();
      return;
    }

    if (isStep('recibidosC3') || isStep('historialC3')) {
      setRefreshC3Token((prev) => prev + 1);
    }
  };

  return (
    <div className="alta-container">

      {/* NAVEGACION TIPO GMAIL */}
      {isVistaBandeja && (
        <div className="alta-gmail-toolbar">
          <div className="alta-gmail-tools">
            <div className="alta-gmail-search">
              <i className='bx bx-search'></i>
              <input
                type="text"
                placeholder={isStep('listado') ? 'Buscar por numero de solicitud o municipio' : 'Buscar por folio, nombre o municipio'}
                value={busquedaGlobal}
                onChange={(e) => setBusquedaGlobal(e.target.value)}
              />

              <button
                type="button"
                className={`alta-gmail-search-action ${filtrosActivos ? 'is-active' : ''}`}
                onClick={handleToggleFiltrosGlobal}
                aria-label="Mostrar filtros"
                title="Mostrar filtros"
              >
                <i className='bx bx-slider-alt'></i>
              </button>

              {busquedaGlobal && (
                <button
                  type="button"
                  className="alta-gmail-search-clear"
                  onClick={() => setBusquedaGlobal('')}
                  aria-label="Limpiar busqueda"
                >
                  <i className='bx bx-x'></i>
                </button>
              )}
            </div>

            {isStep('listado') && (
              <button className="alta-btn-nueva" onClick={handleNuevaSolicitud}>
                <MdAdd size={20} /> Nueva Solicitud
              </button>
            )}
          </div>

          <div className="alta-gmail-tabs-row">
            <div className="alta-gmail-tabs" role="tablist" aria-label="Secciones de tramites de alta">
              <button
                className={`alta-gmail-tab ${isStep('listado') ? 'alta-gmail-tab-active' : ''}`}
                onClick={handleVolverListado}
              >
                <MdDescription size={18} /> Principal
              </button>
              <button
                className={`alta-gmail-tab ${isStep('recibidosC3') ? 'alta-gmail-tab-active' : ''}`}
                onClick={() => goToStep('recibidosC3')}
              >
                <MdMoveToInbox size={18} /> Todos
              </button>
              <button
                className={`alta-gmail-tab ${isStep('historialC3') ? 'alta-gmail-tab-active' : ''}`}
                onClick={() => goToStep('historialC3')}
              >
                <MdHistory size={18} /> Historial
              </button>
            </div>

            <button
              type="button"
              className="alta-gmail-refresh-icon"
              onClick={handleRefreshVista}
              title="Actualizar"
              aria-label="Actualizar"
            >
              <i className='bx bx-refresh'></i>
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className={`alta-card ${isVistaBandeja ? 'fondo-transparente' : ''}`}>
        {isStep('listado') && (
          <AltaListado
            solicitudes={solicitudes}
            loading={loading}
            onNuevaSolicitud={handleNuevaSolicitud}
            onVerSolicitud={handleVerSolicitud}
            onRefresh={cargarSolicitudes}
            regionNombre={esAdminMultiRegion ? regionSeleccionadaNombre : user?.region_nombre}
            regionId={esAdminMultiRegion ? regionActivaId : user?.region_id}
            searchTerm={busquedaGlobal}
            onSearchChange={setBusquedaGlobal}
            hideLocalSearch={true}
            hideToolbarActions={true}
            showFiltersExternal={mostrarFiltrosListado}
            onShowFiltersExternalChange={setMostrarFiltrosListado}
          />
        )}

        {isStep('recibidosC3') && (
          <RecibidosC3
            key="recibidas-c3"
            onVolver={handleVolverListado}
            onIrRechazados={() => window.dispatchEvent(new CustomEvent('navegarRechazos'))}
            onIrRevision={(persona) => {
              sessionStorage.setItem('revisionPersonaId', persona.id);
              window.dispatchEvent(new CustomEvent('navegarRevision'));
            }}
            forcedTab="pendientes"
            searchTerm={busquedaGlobal}
            externalFiltersVisible={mostrarFiltrosC3}
            onExternalFiltersVisibleChange={setMostrarFiltrosC3}
            refreshSignal={refreshC3Token}
          />
        )}

        {isStep('historialC3') && (
          <RecibidosC3
            key="historial-c3"
            onVolver={handleVolverListado}
            onIrRechazados={() => window.dispatchEvent(new CustomEvent('navegarRechazos'))}
            onIrRevision={(persona) => {
              sessionStorage.setItem('revisionPersonaId', persona.id);
              window.dispatchEvent(new CustomEvent('navegarRevision'));
            }}
            forcedTab="historial"
            searchTerm={busquedaGlobal}
            externalFiltersVisible={mostrarFiltrosC3}
            onExternalFiltersVisibleChange={setMostrarFiltrosC3}
            refreshSignal={refreshC3Token}
          />
        )}

        {isStep('paso1') && (
          <AltaPaso1
            tiposOficio={tiposOficio}
            regiones={regiones}
            municipios={municipios}
            mostrarSelectorRegion={esAdminMultiRegion}
            selectedRegionId={selectedRegionId}
            onSelectedRegionChange={setSelectedRegionId}
            initialData={initialPaso1Data}
            hasPendingDraft={hasPendingDraftInAlta}
            onSubmit={handleSubmitPaso1}
            onDraftChange={handlePaso1DraftChange}
            onUnsavedChangesChange={setHasUnsavedPaso1}
            onBack={handleRegresarDesdePaso1}
            onNext={handleSiguienteDesdePaso1}
            nextEnabled={Boolean(solicitudPaso2?.id || solicitudActual?.id)}
            onCancel={handleCancelarPaso1}
            submitting={submitting}
          />
        )}

        {isStep('paso2') && (solicitudPaso2 || solicitudActual) && (
          <AltaPaso2
            solicitud={solicitudPaso2 || solicitudActual}
            puestos={puestos}
            municipios={municipios}
            personaDraft={paso2Draft}
            onPersonaDraftChange={handlePaso2DraftChange}
            onUnsavedChangesChange={setHasUnsavedPaso2}
            onBackToPaso1={handleRegresarPaso2APaso1}
            onCancel={handleVolverDesdePaso2}
            onNext={handleSiguienteDesdePaso2}
            nextEnabled={false}
            onComplete={handleComplete}
            isNuevaSolicitud={esNuevaTramite}
            regionNombre={(solicitudPaso2 || solicitudActual)?.region_nombre || (esAdminMultiRegion ? regionSeleccionadaNombre : user?.region_nombre)}
            regionId={(solicitudPaso2 || solicitudActual)?.region_id || (esAdminMultiRegion ? regionActivaId : user?.region_id)}
          />
        )}
      </div>

    </div>
  );
}