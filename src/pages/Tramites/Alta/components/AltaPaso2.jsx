import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAltaForm } from '../../../../hooks/alta/useAltaForm';
import { useNotification } from '../../../../context/NotificationContext';
import {
  agregarPersona,
  editarPersonaAlta,
  obtenerPersonasPorTramite,
  validarPersona,
  rechazarPersona,
  enviarSolicitudAC3,
  iniciarRevisionPersona,
  eliminarBorradorSolicitudAlta
} from '../../../../services/api';
import { calculateAgeFromIsoDate, getTodayIsoDate, isFutureIsoDate, isValidIsoDate } from '../../../../utils/dateValidation';
import BirthDatePicker from './BirthDatePicker';
import '../styles/AltaPaso2.css';

const OFICIO_C3_SEGMENT_SIZES = [7, 6, 4, 4];
const NUMERO_OFICIO_C3_BASE = 'CECSNSP/DGCECC/7724/2025';

const AUTOFILL_TRAP_STYLE = {
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none'
};

const formatNumeroOficioC3 = (rawValue = '') => {
  const cleanedValue = String(rawValue || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const parts = [];
  let cursor = 0;

  for (const size of OFICIO_C3_SEGMENT_SIZES) {
    if (cursor >= cleanedValue.length) {
      break;
    }

    const nextPart = cleanedValue.slice(cursor, cursor + size);
    if (!nextPart) {
      break;
    }

    parts.push(nextPart);
    cursor += size;
  }

  return parts.join('/');
};

export default function AltaPaso2({
  solicitud,
  puestos,
  municipios = [],
  personaDraft,
  onPersonaDraftChange,
  onUnsavedChangesChange,
  onBackToPaso1,
  onCancel,
  onNext,
  nextEnabled = true,
  onComplete,
  isNuevaSolicitud = false,
  regionNombre,
  regionId
}) {
  const [personasAgregadas, setPersonasAgregadas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviandoC3, setEnviandoC3] = useState(false);
  const [descartandoBorrador, setDescartandoBorrador] = useState(false);
  const [iniciandoRevisionIds, setIniciandoRevisionIds] = useState([]);
  const [editandoPersonaId, setEditandoPersonaId] = useState(null);
  const [accionPersonaLoading, setAccionPersonaLoading] = useState({ id: null, tipo: null });
  const [rechazoModal, setRechazoModal] = useState({ open: false, personaId: null, motivo: '' });
  const [salidaModal, setSalidaModal] = useState({ open: false, action: null });
  const [envioC3Modal, setEnvioC3Modal] = useState({ open: false, total: 0 });
  const [oficioReadOnly, setOficioReadOnly] = useState(true);
  const { showNotification } = useNotification();

  const defaultPersonaValues = useMemo(() => ({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    numero_oficio_c3: '',
    puesto_id: ''
  }), []);
  const { formData, setValue, getFieldProps, reset } = useAltaForm(defaultPersonaValues);
  const lastHydratedSignatureRef = useRef('');
  const baselinePersonaSignatureRef = useRef(JSON.stringify(defaultPersonaValues));
  const borradorDescartadoRef = useRef(false);
  const borradorDescartandoRef = useRef(false);
  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const faseActualSolicitud = String(solicitud?.fase_actual || '').toLowerCase();
  const FASES_EDITABLES = ['datos_solicitud', 'validacion_personal'];
  const FASES_CON_REVISION_DISPONIBLE = ['dictaminado_c3', 'validado_c3', 'revision_requisitos', 'validacion_cuip', 'cita_programada', 'finalizado'];
  const hayPersonasEnFlujoPosterior = personasAgregadas.some((persona) => {
    const faseRevision = String(persona?.fase_revision || '').toLowerCase();
    const faseCuip = String(persona?.fase_cuip || '').toLowerCase();
    return Boolean(
      (faseRevision && faseRevision !== 'pendiente') ||
      (faseCuip && faseCuip !== 'pendiente')
    );
  });
  const soloLectura = !FASES_EDITABLES.includes(faseActualSolicitud) || hayPersonasEnFlujoPosterior;
  const puedeIniciarRevisionEnSolicitud = FASES_CON_REVISION_DISPONIBLE.includes(faseActualSolicitud);
  const debeDescartarBorrador = Boolean(isNuevaSolicitud && solicitud?.id && !soloLectura);

  useEffect(() => {
    if (!personaDraft) return;

    const normalizedDraft = {
      nombre: String(personaDraft.nombre || '').toUpperCase(),
      apellido_paterno: String(personaDraft.apellido_paterno || '').toUpperCase(),
      apellido_materno: String(personaDraft.apellido_materno || '').toUpperCase(),
      fecha_nacimiento: personaDraft.fecha_nacimiento || '',
      numero_oficio_c3: formatNumeroOficioC3(personaDraft.numero_oficio_c3 || ''),
      puesto_id: personaDraft.puesto_id || ''
    };

    const incomingSignature = JSON.stringify(normalizedDraft);
    const currentFormSignature = JSON.stringify(formData);

    if (
      incomingSignature === currentFormSignature ||
      incomingSignature === lastHydratedSignatureRef.current
    ) {
      return;
    }

    reset(normalizedDraft);
    lastHydratedSignatureRef.current = incomingSignature;
    baselinePersonaSignatureRef.current = incomingSignature;
  }, [personaDraft, formData, reset]);

  const isPersonaFormDirty = useMemo(
    () => JSON.stringify(formData) !== baselinePersonaSignatureRef.current,
    [formData]
  );

  const hasUnsavedChanges = isPersonaFormDirty || debeDescartarBorrador;

  useEffect(() => {
    if (typeof onUnsavedChangesChange === 'function') {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  useEffect(() => {
    return () => {
      if (typeof onUnsavedChangesChange === 'function') {
        onUnsavedChangesChange(false);
      }
    };
  }, [onUnsavedChangesChange]);

  const emitPersonaDraft = () => {
    if (typeof onPersonaDraftChange === 'function') {
      onPersonaDraftChange(formData);
    }
  };

  const getInputClass = (name) => {
    const isFilled = String(formData[name] || '').trim() !== '';
    return `alta-field ${isFilled ? 'alta-field-filled' : ''}`.trim();
  };

  const handleNumeroOficioC3Change = (event) => {
    const maskedValue = formatNumeroOficioC3(event?.target?.value || '');
    setValue('numero_oficio_c3', maskedValue);
  };

  const habilitarCapturaOficio = () => {
    if (oficioReadOnly) {
      setOficioReadOnly(false);
    }
  };

  const bloquearAutofillOficio = () => {
    if (!oficioReadOnly) {
      setOficioReadOnly(true);
    }
  };

  const getNumeroSolicitudCorto = (numeroSolicitud) => {
    if (!numeroSolicitud && numeroSolicitud !== 0) return 'N/A';

    const texto = String(numeroSolicitud).trim();
    if (!texto) return 'N/A';
    if (/^\d+$/.test(texto)) return String(parseInt(texto, 10));

    const match = texto.match(/(\d+)$/);
    return match ? String(parseInt(match[1], 10)) : texto;
  };

  const getFaseTextoSolicitud = () => {
    const faseMap = {
      datos_solicitud: 'Captura de personas',
      validacion_personal: 'Captura de personas',
      enviado_c3: 'Enviado a C3',
      dictaminado_c3: 'Dictaminado C3',
      validado_c3: 'Validado C3',
      revision_requisitos: 'Revision de requisitos',
      validacion_cuip: 'Validacion CUIP',
      cita_programada: 'Cita programada',
      finalizado: 'Finalizado',
      rechazado_c3: 'Rechazado C3',
      rechazado_no_corresponde: 'No corresponde',
      rechazado: 'Rechazado'
    };

    return faseMap[faseActualSolicitud] || 'Seguimiento de tramite';
  };

  const cargarPersonas = async () => {
    if (!solicitud?.id) return;
    setLoading(true);
    try {
      const response = await obtenerPersonasPorTramite(solicitud.id);
      setPersonasAgregadas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersonas();
  }, [solicitud?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido_paterno) {
      showNotification('Nombre y apellido paterno son requeridos', 'error');
      return;
    }
    if (!formData.fecha_nacimiento) {
      showNotification('La fecha de nacimiento es requerida', 'error');
      return;
    }

    if (!isValidIsoDate(formData.fecha_nacimiento)) {
      showNotification('La fecha de nacimiento no es valida', 'error');
      return;
    }

    if (isFutureIsoDate(formData.fecha_nacimiento, todayIso)) {
      showNotification('La fecha de nacimiento no puede ser futura', 'error');
      return;
    }

    const edad = calculateAgeFromIsoDate(formData.fecha_nacimiento, todayIso);
    if (!Number.isFinite(edad) || edad < 18) {
      showNotification('La persona debe tener al menos 18 anos', 'error');
      return;
    }

    if (!formData.puesto_id) {
      showNotification('Debe seleccionar un puesto', 'error');
      return;
    }

    const numeroOficioC3 = String(formData.numero_oficio_c3 || '').trim();

    const personaPayload = {
      ...formData,
      numero_oficio_c3: numeroOficioC3 || null
    };

    setSubmitting(true);
    try {
      if (editandoPersonaId) {
        await editarPersonaAlta(editandoPersonaId, personaPayload);
        showNotification('Persona actualizada exitosamente', 'success');
      } else {
        await agregarPersona(solicitud.id, personaPayload);
        showNotification('Persona agregada exitosamente', 'success');
      }
      await cargarPersonas();
      reset();
      baselinePersonaSignatureRef.current = JSON.stringify(defaultPersonaValues);
      setEditandoPersonaId(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || (editandoPersonaId ? 'Error al actualizar persona' : 'Error al agregar persona'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditarPersona = (persona) => {
    setEditandoPersonaId(persona.id);
    const personaFormData = {
      nombre: String(persona.nombre || '').toUpperCase(),
      apellido_paterno: String(persona.apellido_paterno || '').toUpperCase(),
      apellido_materno: String(persona.apellido_materno || '').toUpperCase(),
      fecha_nacimiento: persona.fecha_nacimiento ? String(persona.fecha_nacimiento).split('T')[0] : '',
      numero_oficio_c3: formatNumeroOficioC3(persona.numero_oficio_c3 || ''),
      puesto_id: persona.puesto_id ? String(persona.puesto_id) : ''
    };
    reset(personaFormData);
    baselinePersonaSignatureRef.current = JSON.stringify(personaFormData);
  };

  const handleCancelarEdicion = () => {
    setEditandoPersonaId(null);
    reset();
    baselinePersonaSignatureRef.current = JSON.stringify(defaultPersonaValues);
  };

  const descartarBorrador = useCallback(async ({ keepalive = false, silent = false } = {}) => {
    if (!debeDescartarBorrador || !solicitud?.id) {
      return true;
    }

    if (borradorDescartadoRef.current || borradorDescartandoRef.current) {
      return true;
    }

    if (keepalive) {
      try {
        borradorDescartandoRef.current = true;
        void eliminarBorradorSolicitudAlta(solicitud.id, { keepalive: true });
        borradorDescartadoRef.current = true;
        return true;
      } catch {
        return false;
      } finally {
        borradorDescartandoRef.current = false;
      }
    }

    setDescartandoBorrador(true);
    borradorDescartandoRef.current = true;
    try {
      await eliminarBorradorSolicitudAlta(solicitud.id);
      borradorDescartadoRef.current = true;
      showNotification('Borrador descartado correctamente', 'success');
      return true;
    } catch (error) {
      if (!silent) {
        showNotification(error.response?.data?.message || 'No fue posible descartar el borrador', 'error');
      }
      return false;
    } finally {
      setDescartandoBorrador(false);
      borradorDescartandoRef.current = false;
    }
  }, [debeDescartarBorrador, solicitud?.id, showNotification]);

  useEffect(() => {
    if (!debeDescartarBorrador || !solicitud?.id) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handlePageHide = () => {
      if (borradorDescartadoRef.current || borradorDescartandoRef.current) return;
      descartarBorrador({ keepalive: true, silent: true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [debeDescartarBorrador, solicitud?.id, descartarBorrador]);

  const ejecutarSalida = async (action) => {
    if (descartandoBorrador) return;

    const borradorDescartado = await descartarBorrador();
    if (!borradorDescartado) return;

    emitPersonaDraft();
    if (typeof action === 'function') {
      await action();
    }
  };

  const requestSalidaConGuard = (action) => {
    if (isPersonaFormDirty || debeDescartarBorrador) {
      setSalidaModal({ open: true, action });
      return;
    }
    ejecutarSalida(action);
  };

  const confirmarSalidaSinGuardar = async () => {
    const action = salidaModal.action;
    setSalidaModal({ open: false, action: null });
    await ejecutarSalida(action);
  };

  const cerrarSalidaModal = () => {
    if (descartandoBorrador) return;
    setSalidaModal({ open: false, action: null });
  };

  const abrirModalRechazo = (personaId) => {
    setRechazoModal({ open: true, personaId, motivo: '' });
  };

  const cerrarModalRechazo = () => {
    if (accionPersonaLoading.id) return;
    setRechazoModal({ open: false, personaId: null, motivo: '' });
  };

  const handleRegresar = () => {
    if (typeof onBackToPaso1 === 'function') {
      emitPersonaDraft();
      onBackToPaso1();
      return;
    }

    requestSalidaConGuard(onCancel);
  };

  const handleValidar = async (personaId) => {
    if (accionPersonaLoading.id) return;
    setAccionPersonaLoading({ id: personaId, tipo: 'validar' });
    try {
      await validarPersona(personaId);
      showNotification('Persona validada', 'success');
      await cargarPersonas();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al validar', 'error');
    } finally {
      setAccionPersonaLoading({ id: null, tipo: null });
    }
  };

  const handleRechazar = async (personaId, motivoManual = null) => {
    if (accionPersonaLoading.id) return;
    const motivo = String(motivoManual || '').trim();
    if (!motivo || !motivo.trim()) {
      showNotification('Ingresa un motivo de rechazo', 'error');
      return;
    }
    setAccionPersonaLoading({ id: personaId, tipo: 'rechazar' });
    try {
      await rechazarPersona(personaId, { motivo_rechazo: motivo });
      showNotification('Persona rechazada', 'success');
      cerrarModalRechazo();
      await cargarPersonas();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al rechazar', 'error');
    } finally {
      setAccionPersonaLoading({ id: null, tipo: null });
    }
  };

  const handleEnviarAC3 = async () => {
    const validadas = personasAgregadas.filter(p => p.validado && !p.rechazado);
    if (validadas.length === 0) {
      showNotification('Debe haber al menos una persona validada para enviar a C3', 'error');
      return;
    }

    setEnvioC3Modal({ open: true, total: validadas.length });
  };

  const cerrarEnvioC3Modal = () => {
    if (enviandoC3) return;
    setEnvioC3Modal({ open: false, total: 0 });
  };

  const confirmarEnvioAC3 = async () => {
    const validadas = personasAgregadas.filter((p) => p.validado && !p.rechazado);
    if (validadas.length === 0) {
      cerrarEnvioC3Modal();
      showNotification('Debe haber al menos una persona validada para enviar a C3', 'error');
      return;
    }

    setEnviandoC3(true);
    try {
      await enviarSolicitudAC3(solicitud.id);
      borradorDescartadoRef.current = true;
      showNotification(`${validadas.length} persona(s) enviada(s) a C3 exitosamente`, 'success');
      setEnvioC3Modal({ open: false, total: 0 });
      onComplete();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al enviar a C3', 'error');
    } finally {
      setEnviandoC3(false);
    }
  };

  const puestosMunicipales = puestos.filter((p) => p.es_competencia_municipal);

  const personasActivas = personasAgregadas.filter((p) => !p.rechazado);
  const pendientes = personasActivas.filter((p) => !p.validado);
  const validadas = personasActivas.filter((p) => p.validado);
  const rechazadas = personasAgregadas.filter(p => p.rechazado);
  const enviadasC3 = soloLectura ? validadas.length : 0;
  const puedeEnviar = validadas.length > 0 && pendientes.length === 0;

  const getFaseLabel = (persona) => {
    if (persona.rechazado) {
      const motivo = String(persona.motivo_rechazo || '').toLowerCase();
      if (motivo.includes('cita') || motivo.includes('asistió')) return { label: 'Rechazado en Cita', css: 'fase-rechazado' };
      if (motivo.includes('cuip')) return { label: 'Rechazado CUIP', css: 'fase-rechazado' };
      if (motivo.includes('revisión') || motivo.includes('revision')) return { label: 'Rechazado Revisión', css: 'fase-rechazado' };
      if (motivo.includes('dictamen c3')) return { label: 'Rechazado C3', css: 'fase-rechazado' };
      return { label: 'Rechazado', css: 'fase-rechazado' };
    }

    const estatusDesc = String(persona.estatus_descriptivo || '');
    
    if (estatusDesc === 'Finalizado') return { label: 'Finalizado', css: 'fase-revision-ok' };
    if (estatusDesc === 'Cita Programada') return { label: 'Cita Programada', css: 'fase-espera' };

    const faseCuip = String(persona.fase_cuip || '').toLowerCase();
    const faseRevision = String(persona.fase_revision || '').toLowerCase();

    if (faseCuip === 'completado') return { label: 'Validación CUIP Completada', css: 'fase-cuip-ok' }; 
    if (faseCuip === 'en_proceso') return { label: 'CUIP en Proceso', css: 'fase-cuip-proceso' };

    const labelsRevision = {
      en_proceso: { label: 'Revisión en Proceso', css: 'fase-revision-proceso' },
      antecedentes: { label: 'Revisando Antecedentes', css: 'fase-revision-proceso' },
      documentos: { label: 'Revisando Documentos', css: 'fase-revision-proceso' },
      completado: { label: 'Revisión Completa', css: 'fase-revision-ok' },
      rechazado_revision: { label: 'Rechazado Revisión', css: 'fase-rechazado' }
    };

    if (faseRevision && faseRevision !== 'pendiente') return labelsRevision[faseRevision] || { label: faseRevision, css: 'fase-otro' };
    if (!persona.validado) return { label: 'Pendiente Validación', css: 'fase-pendiente' };
    if (persona.observaciones_c3) return { label: 'Aprobado C3', css: 'fase-cuip-ok' }; 

    return { label: 'Pendiente Revisión', css: 'fase-espera' };
  };

  const puedeIrARevision = (persona) => {
    const faseRevision = String(persona?.fase_revision || '').toLowerCase();
    const faseCuip = String(persona?.fase_cuip || '').toLowerCase();

    if (faseRevision && faseRevision !== 'pendiente') return false;
    if (faseCuip && faseCuip !== 'pendiente') return false;

    if (persona?.accion_disponible === 'revision_requisitos') return true;
    return Boolean(persona?.validado && persona?.observaciones_c3 && !persona?.rechazado);
  };

  const yaPasoRevision = (persona) => {
    if (!persona) return false;
    const faseRevisionActiva = persona.fase_revision && persona.fase_revision !== 'pendiente';
    const faseCuipActiva = persona.fase_cuip && persona.fase_cuip !== 'pendiente';
    return Boolean(faseRevisionActiva || faseCuipActiva);
  };

  const handleIniciarRevision = async (persona) => {
    if (!persona?.id || iniciandoRevisionIds.includes(persona.id)) return;

    setIniciandoRevisionIds((prev) => [...prev, persona.id]);
    try {
      await iniciarRevisionPersona(persona.id);
      sessionStorage.setItem('revisionPersonaId', persona.id);
      window.dispatchEvent(new CustomEvent('navegarRevision'));
      showNotification('Revisión de requisitos iniciada', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al iniciar revisión', 'error');
    } finally {
      setIniciandoRevisionIds((prev) => prev.filter((id) => id !== persona.id));
    }
  };

  const renderAccionesPersona = (persona) => {
    const estaIniciandoRevision = iniciandoRevisionIds.includes(persona.id);
    const esAccionPersona = accionPersonaLoading.id === persona.id;
    const validandoPersona = esAccionPersona && accionPersonaLoading.tipo === 'validar';
    const solicitudEnviadaC3 = faseActualSolicitud === 'enviado_c3';
    const textoValidar = persona.validado ? 'Desvalidar' : 'Validar';
    const textoRechazar = 'Rechazar';

    if (!soloLectura) {
      return (
        <div className="alta-acciones-persona">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleEditarPersona(persona)}
            disabled={esAccionPersona || persona.rechazado}
          >
            Editar
          </button>
          <button
            className={`btn btn-sm ${persona.validado ? 'btn-outline-success' : 'btn-success'}`}
            onClick={() => handleValidar(persona.id)}
            disabled={esAccionPersona || persona.rechazado}
          >
            {validandoPersona ? 'Procesando...' : textoValidar}
          </button>

          {persona.rechazado ? (
            <button className="btn btn-sm btn-outline-danger" disabled>
              Rechazada
            </button>
          ) : (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => abrirModalRechazo(persona.id)}
              disabled={esAccionPersona || persona.validado}
            >
              {textoRechazar}
            </button>
          )}
        </div>
      );
    }

    if (solicitudEnviadaC3) {
      return (
        <button className="alta-btn-revision" disabled>
          REVISION DE REQUISITOS <span>&rsaquo;</span>
        </button>
      );
    }

    if (soloLectura && puedeIniciarRevisionEnSolicitud && puedeIrARevision(persona)) {
      return (
        <button
          className={`alta-btn-revision ${estaIniciandoRevision ? 'alta-btn-revision-loading' : ''}`}
          onClick={() => handleIniciarRevision(persona)}
          disabled={estaIniciandoRevision}
        >
          {estaIniciandoRevision
            ? <><i className='bx bx-loader-alt bx-spin'></i> Iniciando...</>
            : <>REVISION DE REQUISITOS <span>&rsaquo;</span></>}
        </button>
      );
    }

    const deshabilitado = !puedeIrARevision(persona) || yaPasoRevision(persona);
    return (
      <button className="alta-btn-revision" disabled={deshabilitado}>
        REVISION DE REQUISITOS <span>&rsaquo;</span>
      </button>
    );
  };

  return (
    <div className="paso2-main-container">
      {/* BOTON VOLVER - FUERA del cuadro blanco */}
      <div className="btn-volver-container">
        <div className="paso2-top-nav">
          <button
            type="button"
            className="btn-volver-listado"
            onClick={handleRegresar}
            disabled={descartandoBorrador}
          >
            <i className='bx bx-left-arrow-alt'></i> Regresar
          </button>
          <button
            type="button"
            className="btn-siguiente-listado"
            onClick={() => requestSalidaConGuard(onNext || onCancel)}
            disabled={!nextEnabled || descartandoBorrador}
          >
            Siguiente <i className='bx bx-right-arrow-alt'></i>
          </button>
        </div>
      </div>

      <div className="paso2-detalle-standalone">
        <div className="alta-detalle-panel alta-detalle-banner">
          <h4>
            <span className="alta-detalle-icon-wrap">
              <i className='bx bx-group'></i>
            </span>
            {soloLectura ? 'Detalle de Personas' : 'Agregar Personas para Validar'}
          </h4>
          <p>
            {soloLectura
              ? 'Solicitud en seguimiento. Esta vista es solo de consulta para evitar cambios fuera de fase.'
              : 'Administre y valide personas antes del envío a C3. Puede validar/desvalidar en cualquier momento previo al envío; una persona rechazada ya no se puede revertir.'}
          </p>
          <div className="alta-detalle-grid">
            <article className="alta-detalle-item">
              <span className="alta-detalle-label">Solicitud</span>
              <strong>{getNumeroSolicitudCorto(solicitud?.numero_solicitud)}</strong>
            </article>
            <article className="alta-detalle-item">
              <span className="alta-detalle-label">Municipio</span>
              <strong>
                {solicitud?.municipio_nombre ||
                  solicitud?.municipio ||
                  municipios.find((m) => String(m.id) === String(solicitud?.municipio_id))?.nombre ||
                  'Sin municipio asignado'}
              </strong>
            </article>
            <article className="alta-detalle-item">
              <span className="alta-detalle-label">Fase</span>
              <strong>{getFaseTextoSolicitud()}</strong>
            </article>
            <article className="alta-detalle-item">
              <span className="alta-detalle-label">Region analista</span>
              <strong>{regionNombre || (regionId ? `Region ${regionId}` : 'Sin region asignada')}</strong>
            </article>
          </div>
        </div>
      </div>

      {/* CUADRO BLANCO - Todo el contenido */}
      <div className="paso2-contenido">
        {soloLectura && (
          <div className="alta-info-msg" role="status" aria-live="polite">
            <i className='bx bx-info-circle'></i>
            <span>Esta solicitud ya fue enviada a C3 - vista de solo lectura</span>
          </div>
        )}

        {isNuevaSolicitud && !soloLectura && (
          <form onSubmit={handleSubmit} className="alta-form">
            <input
              type="text"
              name="datos_no_autocompletar_usuario"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              style={AUTOFILL_TRAP_STYLE}
            />
            <input
              type="password"
              name="datos_no_autocompletar_password"
              autoComplete="current-password"
              tabIndex={-1}
              aria-hidden="true"
              style={AUTOFILL_TRAP_STYLE}
            />
            <div className="alta-form-grid">
              <div className="alta-form-group">
                <label htmlFor="persona_nombre">Nombre <span className="required">*</span></label>
                <input id="persona_nombre" type="text" {...getFieldProps('nombre')} className={getInputClass('nombre')} placeholder="Nombre" required />
              </div>
              <div className="alta-form-group">
                <label htmlFor="persona_apellido_paterno">Apellido Paterno <span className="required">*</span></label>
                <input id="persona_apellido_paterno" type="text" {...getFieldProps('apellido_paterno')} className={getInputClass('apellido_paterno')} placeholder="Apellido Paterno" required />
              </div>
              <div className="alta-form-group">
                <label htmlFor="persona_apellido_materno">Apellido Materno</label>
                <input id="persona_apellido_materno" type="text" {...getFieldProps('apellido_materno')} className={getInputClass('apellido_materno')} placeholder="Apellido Materno" />
              </div>
              <div className="alta-form-group">
                <label htmlFor="persona_fecha_nacimiento">Fecha de Nacimiento <span className="required">*</span></label>
                <BirthDatePicker
                  id="persona_fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  maxIsoDate={todayIso}
                  emptyOpenToIsoDate="2004-01-01"
                  autoComplete="off"
                  className={getInputClass('fecha_nacimiento')}
                  onChangeIso={(isoDate) => setValue('fecha_nacimiento', isoDate)}
                  required
                />
              </div>
              <div className="alta-form-group">
                <label htmlFor="persona_oficio_c3_ref">Numero Oficio C3</label>
                <input
                  id="persona_oficio_c3_ref"
                  name="referencia_manual_c3"
                  type="text"
                  value={formData.numero_oficio_c3 || ''}
                  onChange={handleNumeroOficioC3Change}
                  onPointerDown={habilitarCapturaOficio}
                  onKeyDown={habilitarCapturaOficio}
                  onFocus={habilitarCapturaOficio}
                  onBlur={bloquearAutofillOficio}
                  className={getInputClass('numero_oficio_c3')}
                  placeholder={NUMERO_OFICIO_C3_BASE}
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  inputMode="text"
                  pattern="[A-Za-z0-9/]*"
                  maxLength={25}
                  readOnly={oficioReadOnly}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="alta-form-group">
                <label htmlFor="persona_puesto_id">Puesto Solicitado <span className="required">*</span></label>
                <select id="persona_puesto_id" {...getFieldProps('puesto_id')} className={getInputClass('puesto_id')} required>
                  <option value="">Seleccione un puesto...</option>
                  <optgroup label="Competencia Municipal">
                    {puestosMunicipales.map(puesto => (
                      <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="btn-group">
              {editandoPersonaId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelarEdicion} disabled={submitting}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? (editandoPersonaId ? 'Guardando...' : 'Agregando...')
                  : (editandoPersonaId ? 'Guardar cambios' : '+ Agregar Persona')}
              </button>
            </div>
          </form>
        )}

        {personasAgregadas.length > 0 && (
          <div className="alta-resumen-personas">
            <span className="alta-resumen-item alta-resumen-total">
              <i className='bx bx-group'></i>
              <small>Total</small>
              <strong>{personasAgregadas.length}</strong>
            </span>
            {enviadasC3 > 0 && (
              <span className="alta-resumen-item validado">
                <i className='bx bx-badge-check'></i>
                <small>Enviadas</small>
                <strong>{enviadasC3}</strong>
              </span>
            )}
            {rechazadas.length > 0 && (
              <span className="alta-resumen-item rechazado">
                <i className='bx bx-x-circle'></i>
                <small>Rechazadas</small>
                <strong>{rechazadas.length}</strong>
              </span>
            )}
          </div>
        )}

        {personasAgregadas.length > 0 && (
          <div className="alta-table-scroll">
            <table className="alta-table">
              <thead>
                <tr>
                  <th className="col-nombre">Nombre Completo</th>
                  <th className="col-fecha">Fecha Nacimiento</th>
                  <th className="col-puesto">Puesto</th>
                  <th className="col-oficio">Oficio C3</th>
                  <th className="col-fase">Fase Actual</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personasActivas.map(persona => (
                  <tr key={persona.id}>
                    <td className="col-nombre">
                      <span className="alta-nombre-cell">
                        {String(persona.nombre || '').toUpperCase()} {String(persona.apellido_paterno || '').toUpperCase()} {String(persona.apellido_materno || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="col-fecha">{persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString() : 'N/A'}</td>
                    <td className="col-puesto">{persona.puesto_nombre || 'N/A'}</td>
                    <td className="col-oficio">{persona.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : '-'}</td>
                    <td className="col-fase">
                      {(() => { const f = getFaseLabel(persona); return <span className={`alta-badge fase-badge ${f.css}`}>{f.label}</span>; })()}
                    </td>
                    <td className="col-acciones">
                      {renderAccionesPersona(persona)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rechazadas.length > 0 && (
          <section className="alta-historial-rechazos">
            <h5>Historial de personas rechazadas</h5>
            <div className="alta-table-scroll">
              <table className="alta-table alta-table-historial">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Puesto</th>
                    <th>Motivo de rechazo</th>
                    <th>Fecha</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {rechazadas.map((persona) => (
                    <tr key={`rechazada-${persona.id}`}>
                      <td>
                        {String(persona.nombre || '').toUpperCase()} {String(persona.apellido_paterno || '').toUpperCase()} {String(persona.apellido_materno || '').toUpperCase()}
                      </td>
                      <td>{persona.puesto_nombre || 'N/A'}</td>
                      <td>{persona.motivo_rechazo || 'Sin motivo registrado'}</td>
                      <td>{persona.updated_at ? new Date(persona.updated_at).toLocaleDateString() : '--'}</td>
                      <td>
                        <span className="alta-badge alta-badge-rechazado">En historial</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isNuevaSolicitud && !soloLectura && (
          <div className="btn-group-final">
            {pendientes.length > 0 && (
              <small className="aviso-pendientes">
                Valida o rechaza las {pendientes.length} persona(s) pendiente(s) antes de enviar
              </small>
            )}
            {puedeEnviar && (
              <button type="button" className="btn btn-success" onClick={handleEnviarAC3} disabled={enviandoC3}>
                {enviandoC3 ? 'Enviando...' : `Enviar ${validadas.length} validada(s) a C3`}
              </button>
            )}
          </div>
        )}
      </div>

      {rechazoModal.open && (
        <div className="alta-modal-overlay" onClick={(e) => e.target === e.currentTarget && cerrarModalRechazo()}>
          <div className="alta-modal-card" role="dialog" aria-modal="true" aria-labelledby="alta-rechazo-title">
            <div className="alta-modal-header">
              <h3 id="alta-rechazo-title">Motivo de rechazo</h3>
              <button type="button" className="alta-modal-close" onClick={cerrarModalRechazo}>
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="alta-modal-body">
              <p>Especifique el motivo por el cual esta persona será rechazada.</p>
              <textarea
                id="motivo_rechazo_modal"
                name="motivo_rechazo_modal"
                aria-label="Motivo de rechazo"
                value={rechazoModal.motivo}
                onChange={(e) => setRechazoModal((prev) => ({ ...prev, motivo: e.target.value }))}
                rows="4"
                placeholder="Escriba el motivo..."
              />
            </div>
            <div className="alta-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cerrarModalRechazo} disabled={accionPersonaLoading.id !== null}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRechazar(rechazoModal.personaId, rechazoModal.motivo)}
                disabled={accionPersonaLoading.id !== null}
              >
                {accionPersonaLoading.tipo === 'rechazar' ? 'Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {salidaModal.open && (
        <div className="alta-modal-overlay" role="dialog" aria-modal="true" aria-label="Cambios pendientes">
          <div className="alta-modal-card">
            <div className="alta-modal-header">
              <h4>Confirmar salida</h4>
            </div>
            <div className="alta-modal-body">
              {debeDescartarBorrador ? (
                <p>Si sale ahora, este trámite no enviado a C3 se descartará por completo y no aparecerá en el listado.</p>
              ) : (
                <p>Desea regresar o cancelar esta solicitud? Tiene cambios pendientes sin guardar y se perderan.</p>
              )}
            </div>
            <div className="alta-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={cerrarSalidaModal} disabled={descartandoBorrador}>
                Permanecer
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmarSalidaSinGuardar} disabled={descartandoBorrador}>
                {descartandoBorrador ? 'Saliendo...' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {envioC3Modal.open && (
        <div
          className="alta-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alta-envio-c3-title"
          onClick={(e) => e.target === e.currentTarget && cerrarEnvioC3Modal()}
        >
          <div className="alta-modal-card">
            <div className="alta-modal-header">
              <h3 id="alta-envio-c3-title">Confirmar envio a C3</h3>
              <button type="button" className="alta-modal-close" onClick={cerrarEnvioC3Modal} disabled={enviandoC3}>
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="alta-modal-body">
              <p>Se enviaran {envioC3Modal.total} persona(s) validada(s) a C3 para dictamen.</p>
              <p>Una vez enviadas, esta solicitud pasara a fase de seguimiento en C3.</p>
            </div>
            <div className="alta-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={cerrarEnvioC3Modal} disabled={enviandoC3}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmarEnvioAC3} disabled={enviandoC3}>
                {enviandoC3 ? 'Enviando...' : 'Confirmar envio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}