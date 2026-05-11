import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useDepSolicitudes } from '../../hooks/dependencia/useDepSolicitudes';
import { useDepCatalogos } from '../../hooks/dependencia/useDepCatalogos';
import { useAltaSteps } from '../../hooks/alta/useAltaSteps';

// 1. Importamos el icono para el Navbar
import { MdBusinessCenter } from 'react-icons/md';

// Componentes
import DepListado from './components/DepListado';
import DepPaso1 from './components/DepPaso1';
import DepPaso2 from './components/DepPaso2';

import './styles/Dependencias.css';

/**
 * Componente Container de Trámites de Dependencia
 * Orquesta el flujo: listado → crear solicitud → agregar personas → enviar a C3
 * * 2. Recibimos setPageTitle como prop
 */
export default function TramitesDependencia({ setPageTitle }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Hooks especializados
  const {
    solicitudes,
    solicitudActual,
    loading,
    submitting,
    cargarSolicitudes,
    crearSolicitud,
    obtenerSolicitud,
    limpiarSolicitudActual
  } = useDepSolicitudes();

  const {
    tiposOficio,
    municipios,
    puestos,
    loading: catalogosLoading
  } = useDepCatalogos();

  const {
    currentStep,
    goToListado,
    goToPaso1,
    goToPaso2,
    isStep
  } = useAltaSteps('listado');

  // 3. Efecto para enviar el título al Navbar
  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Mis Trámites",
        // Mostramos el nombre de la dependencia en el subtítulo (o un texto por defecto)
        subtitulo: user?.dependencia_nombre 
          ? `Dependencia: ${user.dependencia_nombre}` 
          : "Gestión de solicitudes de alta de personal",
        icon: <MdBusinessCenter className="nav-icon-highlight" />
      });
    }

    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle, user]); // Agregamos user a las dependencias por si tarda en cargar

  // Cargar solicitudes al montar
  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const handleNuevaSolicitud = () => {
    limpiarSolicitudActual();
    goToPaso1();
  };

  const handleVerSolicitud = async (id) => {
    try {
      const solicitud = await obtenerSolicitud(id);
      goToPaso2(solicitud);
    } catch (error) {
      showNotification('Error al cargar la solicitud', 'error');
    }
  };

  const handleSubmitPaso1 = async (formData) => {
    try {
      const nuevaSolicitud = await crearSolicitud(formData);
      showNotification('Solicitud creada exitosamente', 'success');
      goToPaso2(nuevaSolicitud);
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Error al crear solicitud',
        'error'
      );
    }
  };

  const handleVolverListado = async () => {
    limpiarSolicitudActual();
    goToListado();
    await cargarSolicitudes();
  };

  const handleComplete = () => {
    showNotification('Solicitud enviada a C3 exitosamente', 'success');
    handleVolverListado();
  };

  return (
    <div className="dep-container">
      {/* Header */}
      <div className="dep-header">
        {/* Dejamos este div vacío para que el botón de "Nueva Solicitud" 
            se mantenga alineado a la derecha por el flexbox del CSS */}
        <div></div>
        
        {isStep('listado') && (
          <button className="btn btn-primary" onClick={handleNuevaSolicitud}>
            ➕ Nueva Solicitud
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="dep-card">
        {/* Vista: Listado */}
        {isStep('listado') && (
          <DepListado
            solicitudes={solicitudes}
            loading={loading}
            onNuevaSolicitud={handleNuevaSolicitud}
            onVerSolicitud={handleVerSolicitud}
          />
        )}

        {/* Vista: Paso 1 - Crear Solicitud */}
        {isStep('paso1') && (
          <DepPaso1
            tiposOficio={tiposOficio}
            municipios={municipios}
            onSubmit={handleSubmitPaso1}
            onCancel={handleVolverListado}
            submitting={submitting}
          />
        )}

        {/* Vista: Paso 2 - Agregar Personas */}
        {isStep('paso2') && solicitudActual && (
          <DepPaso2
            solicitud={solicitudActual}
            puestos={puestos}
            onCancel={handleVolverListado}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}