import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { useRevision } from '../../../hooks/revision';
import { useCuip } from '../../../hooks/cuip/useCuip';
import EnProcesoTabla from './components/EnProcesoTabla';
import EnProcesoToolbar from './components/EnProcesoToolbar';
import './styles/EnProceso.css';
import { MdPendingActions } from 'react-icons/md';

export default function EnProceso({
  setPageTitle,
  analistaId = null,
  readOnly = false,
  requireAnalista = false
}) {
  const { showNotification } = useNotification();
  const {
    enProceso: enProcesoRevision,
    loading: loadingRevision,
    cargarEnProceso: cargarEnProcesoRevision,
    cargarDetalle: cargarDetalleRevision
  } = useRevision();
  const {
    enProceso: enProcesoCuip,
    loading: loadingCuip,
    cargarEnProceso: cargarEnProcesoCuip,
    cargarDetalle: cargarDetalleCuip
  } = useCuip();

  const analistaNumerico = Number(analistaId);
  const hasAnalistaFilter = Number.isFinite(analistaNumerico) && analistaNumerico > 0;

  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({ dependencia: '', estatus: '' });
  
  // Efecto para enviar el título al Navbar al cargar el componente
  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "En Proceso",
        subtitulo: "Expedientes asignados para revisión manual en plataformas ajenas al sistema.",
        icon: <MdPendingActions className="nav-icon-highlight" />
      });
    }
    // Al desmontar el componente, limpiamos el título
    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);

  // Cargar ambos procesos
const cargar = useCallback(() => {
  if (requireAnalista && !hasAnalistaFilter) return;

  const filtrosConsulta = {};

  if (hasAnalistaFilter) {
    filtrosConsulta.analista_id = analistaNumerico;
  }

  cargarEnProcesoRevision(filtrosConsulta);
  cargarEnProcesoCuip(filtrosConsulta);
}, [
  cargarEnProcesoRevision,
  cargarEnProcesoCuip,
  requireAnalista,
  hasAnalistaFilter,
  analistaNumerico
]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Unir ambas fuentes y calcular fase actual
  const personasUnificadas = useMemo(() => {
    if (requireAnalista && !hasAnalistaFilter) return [];

    const ahora = Date.now();
    const mapFase = (p) => {
      if (p.fase_cuip === 'en_proceso') {
        // El backend no pre-calcula segundos para CUIP, solo devuelve fecha_inicio_cuip
        const segundosCuip = p.fecha_inicio_cuip
          ? Math.floor((ahora - new Date(p.fecha_inicio_cuip)) / 1000)
          : null;
        return { ...p, fase_actual: 'Validación CUIP', tipo_fase: 'cuip', segundos_en_revision: segundosCuip };
      }
      if (['en_proceso', 'antecedentes', 'documentos'].includes(p.fase_revision)) return { ...p, fase_actual: 'Revisión de Requisitos', tipo_fase: 'revision' };
      return { ...p, fase_actual: 'Desconocida', tipo_fase: 'otro' };
    };
    const revisiones = (enProcesoRevision || []).map(mapFase);
    const cuips = (enProcesoCuip || []).map(mapFase);
    // Evitar duplicados por id
    const ids = new Set();
    const todos = [...revisiones, ...cuips].filter(p => {
      if (ids.has(p.id)) return false;
      ids.add(p.id);
      return true;
    });
    // Más nuevos primero (menor tiempo transcurrido = se inició más recientemente)
    todos.sort((a, b) => (a.segundos_en_revision ?? Infinity) - (b.segundos_en_revision ?? Infinity));
    return todos;
  }, [enProcesoRevision, enProcesoCuip, requireAnalista, hasAnalistaFilter]);

  // Filtros y búsqueda
 const personasFiltradas = useMemo(() => {
  let resultado = [...personasUnificadas];

  if (busqueda.trim()) {
    const term = busqueda.toLowerCase().trim();

    resultado = resultado.filter((p) =>
      (p.nombre_completo || '').toLowerCase().includes(term) ||
      (p.municipio_nombre || '').toLowerCase().includes(term) ||
      (p.numero_oficio_c3 || '').toLowerCase().includes(term)
    );
  }

  return resultado;
}, [personasUnificadas, busqueda]);

  const handleFiltrar = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  const handleLimpiar = () => {
    setFiltros({ dependencia: '', estatus: '' });
  };

  // Navegación inteligente según fase
  const handleContinuar = async (persona) => {
    if (readOnly) return;

    try {
      if (persona.tipo_fase === 'revision') {
        const detalle = await cargarDetalleRevision(persona.id);
        sessionStorage.setItem('revisionPersonaId', persona.id);
        window.dispatchEvent(new CustomEvent('navegarRevision', { detail: { personaId: persona.id } }));
      } else if (persona.tipo_fase === 'cuip') {
        const detalle = await cargarDetalleCuip(persona.id);
        sessionStorage.setItem('cuipPersonaId', persona.id);
        window.dispatchEvent(new CustomEvent('navegarCUIP', { detail: { personaId: persona.id } }));
      } else {
        showNotification('No se puede determinar la fase actual de la persona', 'error');
      }
    } catch {
      showNotification('Error al cargar detalle de la persona', 'error');
    }
  };

  const formatTiempo = (segundos) => {
    if (!segundos || segundos < 0) return '—';
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    if (dias > 0) return `${dias} dias ${String(horas).padStart(2, '0')} hrs ${String(mins).padStart(2, '0')} min`;
    return `${String(horas).padStart(2, '0')} hrs ${String(mins).padStart(2, '0')} min`;
  };

  return (
    <main className="en-proceso-main">
      {/* ELIMINAMOS el div "head-title" y el párrafo "en-proceso-descripcion" 
          porque ahora viven de forma elegante en el Navbar */}

      <EnProcesoToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onRefresh={cargar}
        total={personasFiltradas.length}
        onFiltrar={handleFiltrar}
        onLimpiar={handleLimpiar}
      />

      <EnProcesoTabla
        personas={personasFiltradas}
        loading={loadingRevision || loadingCuip}
        onContinuar={handleContinuar}
        formatTiempo={formatTiempo}
        readOnly={readOnly}
        mostrarFaseActual
      />
    </main>
  );
}