import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { useRevision } from '../../../hooks/revision';
import { useCuip } from '../../../hooks/cuip';
import RevisionAntecedentes from './components/RevisionAntecedentes';
import RevisionDocumentos from './components/RevisionDocumentos';
import AvisoAntecedentes from './components/AvisoAntecedentes';
import RechazoRevisionModal from './components/RechazoRevisionModal';
import PendientesRevisionTabla from './components/PendientesRevisionTabla';
import './styles/RevisionRequisitos.css';
// Importamos el icono
import { MdFactCheck } from 'react-icons/md';

export default function RevisionRequisitos({ setPageTitle }) {
  const { showNotification } = useNotification();
  const {
    pendientes,
    enProceso,
    personaActual,
    loading,
    submitting,
    cargarPendientes,
    cargarEnProceso,
    cargarDetalle,
    iniciarRevision,
    registrarAntecedentes,
    validarDocumento,
    validarTodos,
    completarRevision,
    rechazar,
    limpiarPersona
  } = useRevision();

  // Para iniciar CUIP automáticamente al completar revisión
  const { iniciarCuip } = useCuip();

  const [showAvisoAntecedentes, setShowAvisoAntecedentes] = useState(false);
  const [antecedentesTemp, setAntecedentesTemp] = useState(null);
  const [sistemasModal, setSistemasModal] = useState([]);
  const [showRechazoModal, setShowRechazoModal] = useState(false);

  // EFECTO PARA EL TÍTULO DINÁMICO
  useEffect(() => {
    if (setPageTitle) {
      if (personaActual) {
        // Si hay una persona siendo revisada, mostramos su nombre en el subtítulo
        setPageTitle({
          titulo: "Revisión de Requisitos",
          subtitulo: `Expediente en revisión: ${personaActual.nombre_completo || (personaActual.nombre + ' ' + personaActual.apellido_paterno)}`,
          icon: <MdFactCheck className="nav-icon-highlight" />
        });
      } else {
        // Título estándar para la lista de pendientes
        setPageTitle({
          titulo: "Revisión de Requisitos",
          subtitulo: "Validación de antecedentes (RNPSP/SUIC) y revisión de requisitos del personal.",
          icon: <MdFactCheck className="nav-icon-highlight" />
        });
      }
    }
    return () => { if (setPageTitle) setPageTitle(null); };
  }, [setPageTitle, personaActual]);

  // Cargar persona desde sessionStorage o lista de pendientes
  useEffect(() => {
    const personaId = sessionStorage.getItem('revisionPersonaId');
    if (personaId) {
      cargarDetalle(parseInt(personaId)).catch(() => {
        showNotification('Error al cargar persona para revisión', 'error');
        sessionStorage.removeItem('revisionPersonaId');
      });
    } else {
      cargarPendientes();
      cargarEnProceso();
    }

    const handler = (e) => {
      if (e.detail?.personaId) {
        cargarDetalle(e.detail.personaId).catch(() => {
          showNotification('Error al cargar persona', 'error');
        });
      }
    };
    window.addEventListener('navegarRevision', handler);
    return () => window.removeEventListener('navegarRevision', handler);
  }, [cargarDetalle, cargarPendientes, cargarEnProceso, showNotification]);

  const handleSeleccionarPersona = useCallback(async (persona) => {
    try {
      if (persona.fase_revision === 'pendiente') {
        await iniciarRevision(persona.id);
        showNotification('Revisión de requisitos iniciada', 'success');
      } else {
        await cargarDetalle(persona.id);
      }
      sessionStorage.setItem('revisionPersonaId', persona.id);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [iniciarRevision, cargarDetalle, showNotification]);

  const handleVolverLista = useCallback(() => {
    limpiarPersona();
    sessionStorage.removeItem('revisionPersonaId');
    cargarPendientes();
    cargarEnProceso();
    // Navegar de vuelta a la Bandeja Única de Procesos
    window.dispatchEvent(new CustomEvent('navegarEnProceso'));
  }, [limpiarPersona, cargarPendientes, cargarEnProceso]);

  // (Handers de antecedentes, documentos, completar y rechazar se mantienen igual...)
  const handleGuardarAntecedentes = useCallback(async (datos) => {
    const sistemasConAntecedentes = [];
    if (datos.resultado_rnpsp === 'con_antecedentes') sistemasConAntecedentes.push('rnpsp');
    if (datos.resultado_suic === 'con_antecedentes')  sistemasConAntecedentes.push('suic');

    if (sistemasConAntecedentes.length > 0) {
      setAntecedentesTemp(datos);
      setSistemasModal(sistemasConAntecedentes);
      setShowAvisoAntecedentes(true);
      return;
    }
    try {
      await registrarAntecedentes(personaActual.id, datos);
      showNotification('Antecedentes registrados correctamente', 'success');
    } catch (err) { showNotification(err.message, 'error'); }
  }, [personaActual, registrarAntecedentes, showNotification]);

  const handleConfirmarAntecedentes = useCallback(async (justificaciones) => {
    if (!antecedentesTemp) return;
    try {
      await registrarAntecedentes(personaActual.id, {
        ...antecedentesTemp,
        ...justificaciones
      });
      setShowAvisoAntecedentes(false);
      setAntecedentesTemp(null);
      setSistemasModal([]);
      showNotification('Antecedentes registrados con justificación', 'success');
    } catch (err) { showNotification(err.message, 'error'); }
  }, [antecedentesTemp, personaActual, registrarAntecedentes, showNotification]);

  const handleValidarDocumento = useCallback(async (clave, validado, observacion) => {
    try {
      await validarDocumento(personaActual.id, clave, validado, observacion);
    } catch (err) { showNotification(err.message, 'error'); }
  }, [personaActual, validarDocumento, showNotification]);

  const handleValidarTodos = useCallback(async () => {
    try {
      await validarTodos(personaActual.id);
      showNotification('Todos los documentos validados', 'success');
    } catch (err) { showNotification(err.message, 'error'); }
  }, [personaActual, validarTodos, showNotification]);

  const handleCompletar = useCallback(async () => {
    try {
      let result = personaActual;

      // Solo llamar completarRevision si aún no está completada
      if (personaActual.fase_revision !== 'completado') {
        result = await completarRevision(personaActual.id);
      }

      if (result.fase_revision === 'completado') {
        // Iniciar CUIP (idempotente en backend, no lanza error si ya está iniciado)
        try {
          await iniciarCuip(personaActual.id);
        } catch {
          // Si falla iniciarCuip (ej. ya está en proceso), igual navegamos a CUIP
        }
        showNotification('Revisión completada. Iniciando validación CUIP...', 'success');
        sessionStorage.setItem('cuipPersonaId', personaActual.id);
        sessionStorage.removeItem('revisionPersonaId');
        window.dispatchEvent(new CustomEvent('navegarCUIP', { detail: { personaId: personaActual.id } }));
      } else {
        // Solo llega aquí si hay documentos con rechazo explícito (con observación)
        showNotification('La persona tiene documentos rechazados con observación. Fue enviada a rechazados.', 'warning');
        sessionStorage.removeItem('revisionPersonaId');
        limpiarPersona();
        window.dispatchEvent(new CustomEvent('navegarEnProceso'));
      }
    } catch (err) { showNotification(err.message, 'error'); }
  }, [personaActual, completarRevision, iniciarCuip, limpiarPersona, showNotification]);

  const handleConfirmarRechazo = useCallback(async (motivo) => {
    try {
      await rechazar(personaActual.id, motivo);
      setShowRechazoModal(false);
      showNotification('Trámite rechazado. Persona enviada a rechazados.', 'info');
      sessionStorage.removeItem('revisionPersonaId');
      limpiarPersona();
      window.dispatchEvent(new CustomEvent('navegarRechazos'));
    } catch (err) { showNotification(err.message, 'error'); }
  }, [personaActual, rechazar, limpiarPersona, showNotification]);

  // VISTA 1: LISTA DE PENDIENTES
  if (!personaActual && !loading) {
    return (
      <main className="revision-main">
        {/* Eliminamos el head-title viejo */}
        <PendientesRevisionTabla
          pendientes={pendientes}
          enProceso={enProceso}
          onSeleccionar={handleSeleccionarPersona}
          onRefrescar={() => { cargarPendientes(); cargarEnProceso(); }}
          loading={loading}
        />
      </main>
    );
  }

  // VISTA 2: CARGANDO
  if (loading) {
    return (
      <main className="revision-main">
        <div className="revision-loading">
          <i className='bx bx-loader-alt bx-spin'></i>
          <p>Cargando datos de revisión...</p>
        </div>
      </main>
    );
  }

  const documentos = personaActual.documentos_validados || [];
  const docsValidados = documentos.filter(d => d.validado).length;
  const docsTotal = documentos.length;
  const progreso = docsTotal > 0 ? Math.round((docsValidados / docsTotal) * 100) : 0;
  const motivosDocsRechazados = documentos
    .filter(d => d.rechazado)
    .map(d => `No cumplio con ${d.nombre}`);
  const motivoSugeridoRechazo = motivosDocsRechazados.join('; ');

  const nombreCompleto =
    personaActual?.nombre_completo ||
    [personaActual?.nombre, personaActual?.apellido_paterno, personaActual?.apellido_materno]
      .filter(Boolean)
      .join(' ') ||
    'Persona sin nombre';

  const iniciales = nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const formatFecha = (valor) => {
    if (!valor) return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return null;
    return fecha.toLocaleDateString('es-MX');
  };

  const datosPersona = [
    { label: 'No. Solicitud', value: personaActual?.numero_solicitud },
    { label: 'Municipio', value: personaActual?.municipio_nombre },
    { label: 'Puesto', value: personaActual?.puesto_nombre },
    { label: 'Fecha solicitud', value: formatFecha(personaActual?.fecha_solicitud) }
  ].filter((item) => item.value);

  return (
    <main className="revision-main">
      <div className="rev-header-card">
        <div className="rev-header-card-glow" aria-hidden="true"></div>

        <div className="rev-header-top">
          <button className="rev-btn-volver" onClick={handleVolverLista}>
            <i className='bx bx-arrow-back'></i> Volver a la lista
          </button>
          <span className="rev-persona-chip">
            <i className='bx bxs-badge-check'></i>
            Revisión de requisitos en curso
          </span>
        </div>

        <div className="rev-persona-credencial">
          <div className="rev-persona-avatar" aria-hidden="true">{iniciales || 'YO'}</div>

          <div className="rev-persona-identidad">
            <h2>{nombreCompleto}</h2>
            <p>{personaActual?.id ? `ID Persona #${personaActual.id}` : 'Identificador no disponible'}</p>
          </div>

          <div className="rev-persona-datos">
            {datosPersona.map((dato) => (
              <div key={dato.label} className="rev-persona-dato-item">
                <span>{dato.label}</span>
                <strong>{dato.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="revision-grid">
        <RevisionAntecedentes
          persona={personaActual}
          onGuardar={handleGuardarAntecedentes}
          onRechazar={() => setShowRechazoModal(true)}
          onCompletar={handleCompletar}
          submitting={submitting}
          motivosRechazoDocs={motivosDocsRechazados}
        />

        <RevisionDocumentos
          documentos={documentos}
          onValidar={handleValidarDocumento}
          onValidarTodos={handleValidarTodos}
          progreso={progreso}
          docsValidados={docsValidados}
          docsTotal={docsTotal}
          disabled={personaActual.resultado_rnpsp === 'pendiente'}
        />
      </div>

      {showAvisoAntecedentes && (
        <AvisoAntecedentes
          sistemas={sistemasModal}
          onConfirmar={handleConfirmarAntecedentes}
          onCancelar={() => { setShowAvisoAntecedentes(false); setAntecedentesTemp(null); setSistemasModal([]); }}
          submitting={submitting}
        />
      )}

      {showRechazoModal && (
        <RechazoRevisionModal
          onConfirmar={handleConfirmarRechazo}
          onCerrar={() => setShowRechazoModal(false)}
          submitting={submitting}
          motivoInicial={motivoSugeridoRechazo}
        />
      )}
    </main>
  );
}