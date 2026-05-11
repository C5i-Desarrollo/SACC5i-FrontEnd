import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { useCuip } from '../../../hooks/cuip';
import PendientesCuipTabla from './components/PendientesCuipTabla';
import CuipSeccion from './components/CuipSeccion';
import CitaModal from './components/CitaModal';
import RechazoCuipModal from './components/RechazoCuipModal';
import { MdVerifiedUser } from 'react-icons/md';
import './styles/ValidacionCUIP.css';

const SECCIONES_POR_PAGINA = 8;

const normalizarBusqueda = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const calcularResumenCuip = (cuipValidacion = []) => {
  let total = 0;
  let validados = 0;
  let rechazados = 0;

  cuipValidacion.forEach((seccion) => {
    (seccion?.campos || []).forEach((campo) => {
      total++;
      if (campo.validado === true) validados++;
      else if (campo.validado === false) rechazados++;
    });
  });

  return {
    total,
    validados,
    rechazados,
    pendientes: total - validados - rechazados,
    porcentaje: total > 0 ? Math.round((validados / total) * 100) : 0
  };
};

/**
 * Validación CUIP — Cédula Única de Identificación Personal
 * 32 secciones tipo checklist con accordion colapsable y paginación
 * Flujo:
 * 1. Lista de personas pendientes de validación CUIP
 * 2. Seleccionar persona → checklist de 32 secciones (8 por página)
 * 3. Validar campos individualmente, por sección, o todo a la vez
 * 4. Completar validación cuando todas las secciones estén revisadas
 */
export default function ValidacionCUIP({ setPageTitle }) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const {
    pendientes,
    enProceso,
    personaActual,
    loading,
    submitting,
    cargarPendientes,
    cargarEnProceso,
    iniciarCuip,
    cargarDetalle,
    validarCampo,
    validarSeccion,
    marcarExcepcion,
    validarTodo,
    completarCuip,
    rechazar,
    aprobarYGenerarCita,
    limpiarPersona
  } = useCuip();

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});
  const [paginaSeccion, setPaginaSeccion] = useState(1);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [citaGenerada, setCitaGenerada] = useState(null);
  const [motivoRechazoInicial, setMotivoRechazoInicial] = useState('');
  const [showAccionesMenu, setShowAccionesMenu] = useState(false);
  const [busquedaSeccion, setBusquedaSeccion] = useState('');
  const [seccionEncontradaClave, setSeccionEncontradaClave] = useState(null);
  const accionesMenuRef = useRef(null);
  const seccionesRefs = useRef({});
  const pendingScrollSeccionRef = useRef(null);
  const resaltadoBusquedaTimerRef = useRef(null);

  const limpiarVistaYRedirigirACitas = useCallback(async () => {
    setShowCitaModal(false);
    setShowRechazoModal(false);
    setMotivoRechazoInicial('');
    setCitaGenerada(null);
    setSeccionesAbiertas({});
    setPaginaSeccion(1);
    limpiarPersona();
    sessionStorage.removeItem('cuipPersonaId');

    try {
      await Promise.all([cargarPendientes(), cargarEnProceso()]);
    } finally {
      navigate('/dashboard/citas/historial');
    }
  }, [limpiarPersona, cargarPendientes, cargarEnProceso, navigate]);

  // Resetear página y acordeones cuando cambia la persona
  useEffect(() => {
    setPaginaSeccion(1);
    setSeccionesAbiertas({});
    setShowAccionesMenu(false);
    setBusquedaSeccion('');
    setSeccionEncontradaClave(null);
    pendingScrollSeccionRef.current = null;
    seccionesRefs.current = {};

    if (resaltadoBusquedaTimerRef.current) {
      clearTimeout(resaltadoBusquedaTimerRef.current);
      resaltadoBusquedaTimerRef.current = null;
    }
  }, [personaActual?.id]);

  useEffect(() => {
    return () => {
      if (resaltadoBusquedaTimerRef.current) {
        clearTimeout(resaltadoBusquedaTimerRef.current);
      }
    };
  }, []);

  // ── Establecer el título dinámico en el Navbar ──
  // ValidacionCUIP.jsx
useEffect(() => {
  if (setPageTitle) {
    // Quitamos el !personaActual para que el título sea permanente en esta sección
    setPageTitle({
      titulo: "Validación CUIP",
      subtitulo: personaActual 
        ? `Validando a: ${personaActual.nombre} ${personaActual.primer_apellido}` 
        : "Cédula Única de Identificación Personal",
      icon: <MdVerifiedUser className="nav-icon-highlight" />
    });
  }

  // IMPORTANTE: Limpiar solo cuando el componente se desmonte (al salir de la sección)
  return () => {
    if (setPageTitle) setPageTitle(null);
  };
}, [setPageTitle, personaActual]); // Agregamos personaActual para que el subtítulo cambie dinámicamente

  // Cargar persona desde sessionStorage o lista de pendientes
  useEffect(() => {
    const personaId = sessionStorage.getItem('cuipPersonaId');
    if (personaId) {
      cargarDetalle(parseInt(personaId))
        .then(async (persona) => {
          // Si la persona llegó con fase_cuip pendiente, iniciar CUIP ahora
          if (persona && persona.fase_cuip === 'pendiente') {
            await iniciarCuip(persona.id);
          }
        })
        .catch(() => {
          showNotification('Error al cargar persona para CUIP', 'error');
          sessionStorage.removeItem('cuipPersonaId');
        });
    } else {
      cargarPendientes();
      cargarEnProceso();
    }

    const handler = (e) => {
      if (e.detail?.personaId) {
        cargarDetalle(e.detail.personaId)
          .then(async (persona) => {
            if (persona && persona.fase_cuip === 'pendiente') {
              await iniciarCuip(persona.id);
            }
          })
          .catch(() => {
            showNotification('Error al cargar persona', 'error');
          });
      }
    };
    window.addEventListener('navegarCUIP', handler);
    return () => window.removeEventListener('navegarCUIP', handler);
  }, [cargarDetalle, cargarPendientes, cargarEnProceso, iniciarCuip, showNotification]);

  /**
   * Seleccionar persona de la lista
   */
  const handleSeleccionarPersona = useCallback(async (persona) => {
    try {
      if (persona.fase_cuip === 'pendiente') {
        await iniciarCuip(persona.id);
        showNotification('Validación CUIP iniciada', 'success');
      } else {
        await cargarDetalle(persona.id);
      }
      sessionStorage.setItem('cuipPersonaId', persona.id);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [iniciarCuip, cargarDetalle, showNotification]);

  /**
   * Volver a la lista
   */
  const handleVolverLista = useCallback(() => {
    limpiarPersona();
    sessionStorage.removeItem('cuipPersonaId');
    setSeccionesAbiertas({});
    setPaginaSeccion(1);
    setShowAccionesMenu(false);
    setShowRechazoModal(false);
    setMotivoRechazoInicial('');
    cargarPendientes();
    cargarEnProceso();
    // Navegar de vuelta a la Bandeja Única de Procesos
    window.dispatchEvent(new CustomEvent('navegarEnProceso'));
  }, [limpiarPersona, cargarPendientes, cargarEnProceso]);

  /**
   * Toggle sección accordion
   */
  const toggleSeccion = useCallback((clave) => {
    setSeccionesAbiertas(prev => ({ ...prev, [clave]: !prev[clave] }));
  }, []);

  /**
   * Expandir/colapsar todas (solo la página actual)
   */
  const handleExpandirTodas = useCallback(() => {
    if (!personaActual?.cuip_validacion) return;
    const inicio = (paginaSeccion - 1) * SECCIONES_POR_PAGINA;
    const fin = paginaSeccion * SECCIONES_POR_PAGINA;
    const todas = {};
    personaActual.cuip_validacion.slice(inicio, fin).forEach(s => { todas[s.clave] = true; });
    setSeccionesAbiertas(todas);
  }, [personaActual, paginaSeccion]);

  const handleColapsarTodas = useCallback(() => {
    setSeccionesAbiertas({});
  }, []);

  /**
   * Cambiar página de secciones
   */
  const handleCambiarPagina = useCallback((nuevaPagina) => {
    setPaginaSeccion(nuevaPagina);
    setSeccionesAbiertas({});
  }, []);

  const buscarSeccionPorTermino = useCallback((termino) => {
    const query = normalizarBusqueda(termino);
    if (!query) return null;

    const seccionesDisponibles = personaActual?.cuip_validacion || [];

    for (let index = 0; index < seccionesDisponibles.length; index++) {
      const seccion = seccionesDisponibles[index];

      if (normalizarBusqueda(seccion?.nombre || '').includes(query)) {
        return { seccion, index };
      }

      const campoEncontrado = (seccion?.campos || []).some((campo) => {
        const nombreCampo = normalizarBusqueda(campo?.nombre || '');
        const numeroCampo = String(campo?.num || '');

        return (
          nombreCampo.includes(query) ||
          numeroCampo === query ||
          `campo ${numeroCampo}`.includes(query)
        );
      });

      if (campoEncontrado) {
        return { seccion, index };
      }
    }

    return null;
  }, [personaActual?.cuip_validacion]);

  const handleBuscarSeccion = useCallback((event) => {
    event.preventDefault();

    const query = busquedaSeccion.trim();
    if (!query) {
      setSeccionEncontradaClave(null);
      return;
    }

    const resultado = buscarSeccionPorTermino(query);
    if (!resultado) {
      showNotification('No se encontro ninguna seccion o checkbox con ese criterio.', 'warning');
      setSeccionEncontradaClave(null);
      return;
    }

    const { seccion, index } = resultado;
    const paginaObjetivo = Math.floor(index / SECCIONES_POR_PAGINA) + 1;

    pendingScrollSeccionRef.current = seccion.clave;
    setPaginaSeccion(paginaObjetivo);
    setSeccionesAbiertas((prev) => ({ ...prev, [seccion.clave]: true }));
    setSeccionEncontradaClave(seccion.clave);

    if (resaltadoBusquedaTimerRef.current) {
      clearTimeout(resaltadoBusquedaTimerRef.current);
    }

    resaltadoBusquedaTimerRef.current = setTimeout(() => {
      setSeccionEncontradaClave(null);
    }, 2600);
  }, [busquedaSeccion, buscarSeccionPorTermino, showNotification]);

  useEffect(() => {
    const claveObjetivo = pendingScrollSeccionRef.current;
    if (!claveObjetivo) return;

    const timer = setTimeout(() => {
      const nodoSeccion = seccionesRefs.current[claveObjetivo];
      if (!nodoSeccion) return;

      nodoSeccion.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pendingScrollSeccionRef.current = null;
    }, 80);

    return () => clearTimeout(timer);
  }, [paginaSeccion, seccionesAbiertas, personaActual?.id]);

  /**
   * Validar campo individual
   */
  const handleValidarCampo = useCallback(async (seccionClave, campoNum, validado) => {
    try {
      await validarCampo(personaActual.id, seccionClave, campoNum, validado);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, validarCampo, showNotification]);

  /**
   * Validar sección completa
   */
  const handleValidarSeccion = useCallback(async (seccionClave) => {
    try {
      await validarSeccion(personaActual.id, seccionClave);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, validarSeccion, showNotification]);

  /**
   * Marcar excepción NINGUNO
   */
  const handleMarcarExcepcion = useCallback(async (seccionClave, activa) => {
    try {
      await marcarExcepcion(personaActual.id, seccionClave, activa);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, marcarExcepcion, showNotification]);

  /**
   * Validar TODO el CUIP
   */
  const handleValidarTodo = useCallback(async () => {
    try {
      await validarTodo(personaActual.id);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, validarTodo, showNotification]);

  /**
   * Aprobar CUIP y generar cita biométrica
   */
  const handleAprobarYGenerarCita = useCallback(async (datosCita) => {
    try {
      const estadoValidacion = calcularResumenCuip(personaActual?.cuip_validacion || []);
      const puedeAprobar =
        estadoValidacion.total > 0 &&
        estadoValidacion.pendientes === 0 &&
        estadoValidacion.rechazados === 0;

      if (!puedeAprobar) {
        setShowCitaModal(false);
        showNotification('No se puede generar cita: todos los requisitos deben estar validados y sin rechazos.', 'error');
        return;
      }

      const resultado = await aprobarYGenerarCita(personaActual.id, datosCita);
      setCitaGenerada(resultado.cita);
      setShowCitaModal(false);

      if (resultado.notificacionSolicitada) {
        const msg = resultado.correoEnviado
          ? `✓ Cita ${resultado.cita.folio_cita} programada — notificación enviada por correo`
          : `✓ Cita ${resultado.cita.folio_cita} programada (correo no enviado, revisa la configuración SMTP)`;
        showNotification(msg, resultado.correoEnviado ? 'success' : 'warning');
      } else {
        showNotification(
          `✓ Cita ${resultado.cita.folio_cita} programada y texto copiado para envío manual`,
          'success'
        );
      }

      await limpiarVistaYRedirigirACitas();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, aprobarYGenerarCita, showNotification, limpiarVistaYRedirigirACitas]);

  /**
   * Completar CUIP
   */
  const handleCompletar = useCallback(async () => {
    try {
      await completarCuip(personaActual.id);
      showNotification('Validación CUIP completada exitosamente', 'success');
      sessionStorage.removeItem('cuipPersonaId');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, completarCuip, showNotification]);

  /**
   * Rechazar
   */
  const handleRechazar = useCallback(() => {
    if (!personaActual) return;

    const motivosObservados = (personaActual.cuip_validacion || [])
      .flatMap((seccion) => {
        const seccionNombre = seccion?.nombre || 'Seccion sin nombre';

        return (seccion?.campos || [])
          .filter((campo) => campo?.validado === false)
          .map((campo) => {
            const campoNombre = campo?.nombre || `Campo ${campo?.num || '-'}`;
            return `${seccionNombre}: ${campoNombre}`;
          });
      });

    if (motivosObservados.length > 0) {
      const base = motivosObservados.slice(0, 5).join('; ');
      setMotivoRechazoInicial(`Se detectaron inconsistencias en validacion CUIP: ${base}`);
    } else {
      setMotivoRechazoInicial('');
    }

    setShowRechazoModal(true);
  }, [personaActual]);

  const handleConfirmarRechazo = useCallback(async (motivo) => {
    try {
      await rechazar(personaActual.id, motivo);
      setShowRechazoModal(false);
      setMotivoRechazoInicial('');
      showNotification('Persona rechazada en validación CUIP', 'info');
      await limpiarVistaYRedirigirACitas();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }, [personaActual, rechazar, showNotification, limpiarVistaYRedirigirACitas]);

  // ── Sin persona → lista ──
  if (!personaActual && !loading) {
    return (
      <main className="cuip-main">
        <PendientesCuipTabla
          pendientes={pendientes}
          enProceso={enProceso}
          onSeleccionar={handleSeleccionarPersona}
          onRefrescar={() => { cargarPendientes(); cargarEnProceso(); }}
          loading={loading}
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="cuip-main">
        <div className="cuip-loading">
          <i className='bx bx-loader-alt bx-spin'></i>
          <p>Cargando datos CUIP...</p>
        </div>
      </main>
    );
  }

  const progreso = calcularResumenCuip(personaActual?.cuip_validacion || []);
  const secciones = personaActual?.cuip_validacion || [];
  const excepciones = personaActual?.cuip_excepciones || [];
  const todosCompletos = progreso.pendientes === 0;
  const puedeAprobarCuip = progreso.total > 0 && progreso.pendientes === 0 && progreso.rechazados === 0;

  const nombreCompleto =
    personaActual?.nombre_completo ||
    [
      personaActual?.nombre,
      personaActual?.apellido_paterno || personaActual?.primer_apellido,
      personaActual?.apellido_materno || personaActual?.segundo_apellido
    ]
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
    { label: 'CURP', value: personaActual?.curp },
    { label: 'Municipio', value: personaActual?.municipio_nombre },
    { label: 'Dependencia', value: personaActual?.dependencia_nombre },
    { label: 'Puesto', value: personaActual?.puesto_nombre },
    {
      label: 'Fecha solicitud',
      value: formatFecha(personaActual?.fecha_solicitud || personaActual?.fecha_inicio_cuip)
    }
  ].filter((item) => item.value);

  const totalPaginas = Math.ceil(secciones.length / SECCIONES_POR_PAGINA);
  const motivosSugeridosRechazo = secciones
    .flatMap((seccion) => {
      const seccionNombre = seccion?.nombre || 'Seccion sin nombre';

      return (seccion?.campos || [])
        .filter((campo) => campo?.validado === false)
        .map((campo) => {
          const campoNombre = campo?.nombre || `Campo ${campo?.num || '-'}`;
          return `${seccionNombre}: ${campoNombre}`;
        });
    });

  const seccionesPagina = secciones.slice(
    (paginaSeccion - 1) * SECCIONES_POR_PAGINA,
    paginaSeccion * SECCIONES_POR_PAGINA
  );
  const seccionInicio = (paginaSeccion - 1) * SECCIONES_POR_PAGINA + 1;
  const seccionFin = Math.min(paginaSeccion * SECCIONES_POR_PAGINA, secciones.length);
  const todasSeccionesPaginaAbiertas =
    seccionesPagina.length > 0 &&
    seccionesPagina.every((seccion) => Boolean(seccionesAbiertas[seccion.clave]));

  const handleToggleExpandirColapsar = () => {
    if (todasSeccionesPaginaAbiertas) {
      handleColapsarTodas();
      return;
    }
    handleExpandirTodas();
  };

  const abrirAccionAprobar = () => {
    if (submitting || !puedeAprobarCuip) return;
    setShowCitaModal(true);
  };

  const abrirAccionToggleSecciones = () => {
    if (submitting) return;
    handleToggleExpandirColapsar();
  };

  const abrirAccionValidarTodo = () => {
    if (submitting) return;
    void handleValidarTodo();
  };

  const abrirAccionRechazar = () => {
    if (submitting) return;
    handleRechazar();
  };

  const faseCuipCompletada = personaActual?.fase_cuip === 'completado';
  const progresoConObservaciones = progreso.rechazados > 0;
  const progresoCompletoSinObservaciones = progreso.porcentaje === 100 && !progresoConObservaciones;
  const progresoEstadoTexto = progresoCompletoSinObservaciones
    ? 'Listo para aprobar'
    : progresoConObservaciones
      ? 'Con observaciones'
      : 'En revisión';
  const progresoEstadoClase = progresoCompletoSinObservaciones
    ? 'ok'
    : progresoConObservaciones
      ? 'riesgo'
      : 'proceso';

  return (
    <main className="cuip-main">
      {/* Header persona - estilo credencial */}
      <div className="cuip-header-card">
        <div className="cuip-header-card-glow" aria-hidden="true"></div>

        <div className="cuip-header-top">
          <button className="cuip-btn-volver" onClick={handleVolverLista}>
            <i className='bx bx-arrow-back'></i> Volver a la lista
          </button>
          <span className="cuip-persona-chip">
            <i className='bx bxs-check-shield'></i>
            Validación CUIP en curso
          </span>
        </div>

        <div className="cuip-persona-credencial">
          <div className="cuip-persona-avatar" aria-hidden="true">{iniciales || 'CU'}</div>

          <div className="cuip-persona-identidad">
            <h2>{nombreCompleto}</h2>
            <p>
              {personaActual?.id ? `ID Persona #${personaActual.id}` : 'Identificador no disponible'}
            </p>
          </div>

          <div className="cuip-persona-datos">
            {datosPersona.map((dato) => (
              <div key={dato.label} className="cuip-persona-dato-item">
                <span>{dato.label}</span>
                <strong>{dato.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="cuip-progreso-card">
        <div className="cuip-progreso-head-main">
          <div className="cuip-progreso-title-wrap">
            <h3><i className='bx bxs-check-shield'></i> Cédula Única de Identificación Personal</h3>
            <p>Resumen ejecutivo de revisión de campos CUIP.</p>
          </div>
          <div className={`cuip-progreso-pill ${progresoEstadoClase}`}>
            <span>{progresoEstadoTexto}</span>
            <strong>{progreso.porcentaje}%</strong>
          </div>
        </div>

        <div className="cuip-progreso-stats-grid">
          <article className="cuip-stat-card validados">
            <i className='bx bxs-check-circle'></i>
            <small>Validados</small>
            <strong>{progreso.validados}</strong>
            <span>campos correctos</span>
          </article>

          <article className="cuip-stat-card rechazados">
            <i className='bx bxs-x-circle'></i>
            <small>Rechazados</small>
            <strong>{progreso.rechazados}</strong>
            <span>con observaciones</span>
          </article>

          <article className="cuip-stat-card total">
            <i className='bx bx-list-check'></i>
            <small>Total</small>
            <strong>{progreso.total}</strong>
            <span>campos evaluados</span>
          </article>
        </div>

        <div className="cuip-progreso-foot">
          <span className="cuip-progreso-foot-label">Progreso general</span>
          <span className="cuip-progreso-pct">{progreso.porcentaje}%</span>
        </div>
        <div className="cuip-progreso-bar-wrap">
          <div className="cuip-progreso-bar" style={{ width: `${progreso.porcentaje}%` }} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="cuip-toolbar">
        <div className="cuip-toolbar-menu" ref={accionesMenuRef}>
          {!faseCuipCompletada && (
            <div className={`cuip-acciones-dropdown ${showAccionesMenu ? 'abierto' : ''}`} role="menu" aria-hidden={!showAccionesMenu}>
              <button
                type="button"
                className="cuip-acciones-item accion-toggle"
                onClick={abrirAccionToggleSecciones}
                disabled={submitting}
                title={todasSeccionesPaginaAbiertas ? 'Contraer secciones visibles' : 'Expandir secciones visibles'}
              >
                <i className={`bx ${todasSeccionesPaginaAbiertas ? 'bx-collapse-alt' : 'bx-expand-alt'}`}></i>
                {todasSeccionesPaginaAbiertas ? 'Contraer secciones' : 'Expandir secciones'}
              </button>

              <button
                type="button"
                className={`cuip-acciones-item accion-validar ${todosCompletos ? 'deseleccionar' : ''}`}
                onClick={abrirAccionValidarTodo}
                disabled={submitting}
              >
                {todosCompletos
                  ? <><i className='bx bx-x-circle'></i> Deseleccionar todo</>
                  : <><i className='bx bxs-check-shield'></i> Validar todo</>
                }
              </button>

              {!faseCuipCompletada && (
              <button
                type="button"
                className="cuip-acciones-item aprobar"
                onClick={abrirAccionAprobar}
                disabled={submitting || !puedeAprobarCuip}
                title={!puedeAprobarCuip ? 'Debe validar todos los campos y no tener requisitos rechazados para aprobar' : 'Aprobar y generar cita'}
              >
                <i className='bx bx-calendar-plus'></i>
                Aprobar y generar cita
              </button>
              )}

              {!faseCuipCompletada && (
              <button
                type="button"
                className="cuip-acciones-item rechazar"
                onClick={abrirAccionRechazar}
                disabled={submitting}
              >
                <i className='bx bx-x-circle'></i>
                Rechazar solicitud
              </button>
              )}
            </div>
          )}

          {!faseCuipCompletada ? (
            <button
              type="button"
              className={`cuip-btn-acciones-menu ${showAccionesMenu ? 'abierto' : ''}`}
              onClick={() => setShowAccionesMenu((prev) => !prev)}
              aria-expanded={showAccionesMenu}
              aria-haspopup="menu"
              title={showAccionesMenu ? 'Cerrar acciones' : 'Abrir acciones de dictamen'}
            >
              <i className={`bx ${showAccionesMenu ? 'bx-x' : 'bx-dots-horizontal-rounded'}`}></i>
              {showAccionesMenu ? 'Cerrar acciones' : 'Acciones CUIP'}
            </button>
          ) : (
            <div className={`cuip-toolbar-status ${citaGenerada ? 'con-cita' : 'aprobado'}`}>
              <i className={`bx ${citaGenerada ? 'bx-calendar-check' : 'bx-check-circle'}`}></i>
              <span>{citaGenerada ? `Cita ${citaGenerada.folio_cita}` : 'CUIP aprobado'}</span>
            </div>
          )}
        </div>
      </div>

      <form className="cuip-buscador-requisitos-card" onSubmit={handleBuscarSeccion}>
        <div className="cuip-buscador-requisitos-head">
          <h4>
            <i className='bx bx-search-alt-2'></i>
            Buscador de secciones y checkboxes CUIP
          </h4>
          <span>Presione Enter para ir a la coincidencia</span>
        </div>

        <div className="cuip-buscador-requisitos">
          <i className='bx bx-search'></i>
          <input
            type="text"
            value={busquedaSeccion}
            onChange={(e) => setBusquedaSeccion(e.target.value)}
            placeholder="Ejemplo: domicilio, curp, fotografia, campo 12..."
          />

          {busquedaSeccion && (
            <button
              type="button"
              className="cuip-buscador-clear"
              aria-label="Limpiar busqueda"
              onClick={() => {
                setBusquedaSeccion('');
                setSeccionEncontradaClave(null);
              }}
            >
              <i className='bx bx-x'></i>
            </button>
          )}
        </div>
      </form>

      {/* Secciones paginadas */}
      <div className="cuip-paginacion-header">
        <span className="cuip-pag-info-secciones">
          Secciones {seccionInicio}–{seccionFin} de {secciones.length}
        </span>
        <div className="cuip-pag-paginas">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={`cuip-pag-num ${paginaSeccion === num ? 'activa' : ''}`}
              onClick={() => handleCambiarPagina(num)}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="cuip-secciones">
        {seccionesPagina.map(seccion => {
          const camposValidados = seccion.campos.filter(c => c.validado === true).length;
          const totalCampos = seccion.campos.length;
          const esCompleta = camposValidados === totalCampos;
          const esExcepcion = excepciones.includes(seccion.clave);
          const seccionEsCoincidencia = seccionEncontradaClave === seccion.clave;

          return (
            <div
              key={seccion.clave}
              id={`cuip-seccion-${seccion.clave}`}
              ref={(node) => {
                if (node) {
                  seccionesRefs.current[seccion.clave] = node;
                } else {
                  delete seccionesRefs.current[seccion.clave];
                }
              }}
              className={`cuip-seccion-anchor ${seccionEsCoincidencia ? 'is-target' : ''}`}
            >
              <CuipSeccion
                seccion={seccion}
                abierta={!!seccionesAbiertas[seccion.clave]}
                onToggle={() => toggleSeccion(seccion.clave)}
                onValidarCampo={handleValidarCampo}
                onValidarSeccion={handleValidarSeccion}
                onMarcarExcepcion={handleMarcarExcepcion}
                esCompleta={esCompleta}
                esExcepcion={esExcepcion}
                camposValidados={camposValidados}
                totalCampos={totalCampos}
                disabled={submitting}
              />
            </div>
          );
        })}
      </div>

      {/* Navegación entre páginas de secciones */}
      {totalPaginas > 1 && (
        <div className="cuip-paginacion-footer">
          <button
            className="cuip-btn-secondary"
            onClick={() => handleCambiarPagina(paginaSeccion - 1)}
            disabled={paginaSeccion === 1}
          >
            <i className='bx bx-chevron-left'></i> Anterior
          </button>
          <span className="cuip-pag-footer-info">
            Página {paginaSeccion} de {totalPaginas}
          </span>
          <button
            className="cuip-btn-secondary"
            onClick={() => handleCambiarPagina(paginaSeccion + 1)}
            disabled={paginaSeccion === totalPaginas}
          >
            Siguiente <i className='bx bx-chevron-right'></i>
          </button>
        </div>
      )}

      {/* Modal de cita */}
      {showCitaModal && (
        <CitaModal
          persona={personaActual}
          onConfirmar={handleAprobarYGenerarCita}
          onCancelar={() => setShowCitaModal(false)}
          submitting={submitting}
        />
      )}

      <RechazoCuipModal
        open={showRechazoModal}
        persona={personaActual}
        motivosSugeridos={motivosSugeridosRechazo}
        motivoInicial={motivoRechazoInicial}
        submitting={submitting}
        onCerrar={() => setShowRechazoModal(false)}
        onConfirmar={handleConfirmarRechazo}
      />
    </main>
  );
}