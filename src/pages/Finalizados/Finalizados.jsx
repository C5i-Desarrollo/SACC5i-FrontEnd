import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import {
  getFinalizadosApi,
  actualizarFase1FinalizadoApi,
  subirAcuseFinalizadoApi,
  eliminarAcuseFinalizadoApi,
  verConstanciaFinalizadoApi,
  subirAcusePersonaFinalizadoApi,
  eliminarAcusePersonaFinalizadoApi,
  verAcusePersonaFinalizadoApi
} from '../../services/api';
import TablaFinalizados from './components/TablaFinalizados';
import { MdAssignmentTurnedIn } from 'react-icons/md'; 


export default function Finalizados({
  setPageTitle,
  analistaId = null,
  readOnly = false,
  requireAnalista = false
}) {
  const { showNotification } = useNotification();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaInput, setBusquedaInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1, pagina: 1 });
  const [updatingId, setUpdatingId] = useState(null);
  const [uploadingConstanciaId, setUploadingConstanciaId] = useState(null);
  const [uploadingAcusePersonaId, setUploadingAcusePersonaId] = useState(null);
  const [viewingConstanciaId, setViewingConstanciaId] = useState(null);
  const [viewingAcusePersonaId, setViewingAcusePersonaId] = useState(null);
  const [deletingConstanciaId, setDeletingConstanciaId] = useState(null);
  const [deletingAcusePersonaId, setDeletingAcusePersonaId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const analistaNumerico = Number(analistaId);
  const hasAnalistaFilter = Number.isFinite(analistaNumerico) && analistaNumerico > 0;

  useEffect(() => {
    setPageTitle?.({
      titulo: 'Finalizados',
      subtitulo: 'Control de fase final, constancias y acuses de persona',
      icon: <MdAssignmentTurnedIn className="nav-icon-highlight" /> // <--- Aquí agregas el ícono
    });

    return () => setPageTitle?.(null);
  }, [setPageTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaInput.trim());
      setPagina(1);
    }, 260);

    return () => clearTimeout(timer);
  }, [busquedaInput]);

  const cargarFinalizados = useCallback(async () => {
    if (requireAnalista && !hasAnalistaFilter) {
      setRegistros([]);
      setPaginacion({ total: 0, totalPaginas: 1, pagina: 1 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = { busqueda, pagina, limit: 10 };
      if (hasAnalistaFilter) params.analista_id = analistaNumerico;

      const { data } = await getFinalizadosApi(params);
      setRegistros(data?.data?.registros || []);
      setPaginacion(data?.data?.paginacion || { total: 0, totalPaginas: 1, pagina: 1 });
    } catch (err) {
      setRegistros([]);
      showNotification(err?.response?.data?.message || 'No se pudo cargar finalizados', 'error');
    } finally {
      setLoading(false);
    }
  }, [busqueda, pagina, showNotification, requireAnalista, hasAnalistaFilter, analistaNumerico]);

  useEffect(() => {
    cargarFinalizados();
  }, [cargarFinalizados]);

  const handleActualizarFase1 = useCallback(async (registroId, estado) => {
    if (readOnly) return;

    setUpdatingId(registroId);
    try {
      await actualizarFase1FinalizadoApi(registroId, estado);
      await cargarFinalizados();
      showNotification('Fase 1 actualizada correctamente', 'success');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo actualizar Fase 1', 'error');
    } finally {
      setUpdatingId(null);
    }
  }, [cargarFinalizados, showNotification, readOnly]);

  const handleSubirConstancia = useCallback(async (registroId, file) => {
    if (readOnly) return;

    setUploadingConstanciaId(registroId);
    try {
      await subirAcuseFinalizadoApi(registroId, file);
      await cargarFinalizados();
      showNotification('Constancia subida correctamente', 'success');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo subir la constancia', 'error');
    } finally {
      setUploadingConstanciaId(null);
    }
  }, [cargarFinalizados, showNotification, readOnly]);

  const handleSubirAcusePersona = useCallback(async (registroId, file) => {
    if (readOnly) return;

    setUploadingAcusePersonaId(registroId);
    try {
      await subirAcusePersonaFinalizadoApi(registroId, file);
      await cargarFinalizados();
      showNotification('Acuse de persona subido correctamente', 'success');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo subir el acuse de persona', 'error');
    } finally {
      setUploadingAcusePersonaId(null);
    }
  }, [cargarFinalizados, showNotification, readOnly]);

  const handleEliminarConstancia = useCallback(async (registroId) => {
    if (readOnly) return;

    setDeletingConstanciaId(registroId);
    try {
      await eliminarAcuseFinalizadoApi(registroId);
      await cargarFinalizados();
      showNotification('Constancia eliminada correctamente', 'success');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo eliminar la constancia', 'error');
    } finally {
      setDeletingConstanciaId(null);
    }
  }, [cargarFinalizados, showNotification, readOnly]);

  const handleEliminarAcusePersona = useCallback(async (registroId) => {
    if (readOnly) return;

    setDeletingAcusePersonaId(registroId);
    try {
      await eliminarAcusePersonaFinalizadoApi(registroId);
      await cargarFinalizados();
      showNotification('Acuse de persona eliminado correctamente', 'success');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo eliminar el acuse de persona', 'error');
    } finally {
      setDeletingAcusePersonaId(null);
    }
  }, [cargarFinalizados, showNotification, readOnly]);

  const handleVerConstancia = useCallback(async (registro) => {
    const constanciaSubida = Boolean(registro?.constancia_subida ?? registro?.acuse_subido);
    if (!constanciaSubida) {
      showNotification('Primero debes cargar la constancia para visualizarla', 'warning');
      return;
    }

    setViewingConstanciaId(registro.id);
    try {
      const response = await verConstanciaFinalizadoApi(registro.id);
      const mimeType = response?.headers?.['content-type'] || 'application/pdf';
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: mimeType });

      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo abrir la constancia', 'error');
    } finally {
      setViewingConstanciaId(null);
    }
  }, [showNotification]);

  const handleVerAcusePersona = useCallback(async (registro) => {
    if (!registro?.acuse_persona_subido) {
      showNotification('Primero debes cargar el acuse de persona para visualizarlo', 'warning');
      return;
    }

    setViewingAcusePersonaId(registro.id);
    try {
      const response = await verAcusePersonaFinalizadoApi(registro.id);
      const mimeType = response?.headers?.['content-type'] || 'application/pdf';
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: mimeType });

      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'No se pudo abrir el acuse de persona', 'error');
    } finally {
      setViewingAcusePersonaId(null);
    }
  }, [showNotification]);

  const solicitarEliminarDocumento = useCallback((tipo, registroId) => {
    if (readOnly) return;
    setDeleteTarget({ tipo, registroId });
  }, [readOnly]);

  const cancelarEliminarDocumento = useCallback(() => {
    if (deletingConstanciaId || deletingAcusePersonaId) return;
    setDeleteTarget(null);
  }, [deletingConstanciaId, deletingAcusePersonaId]);

  const confirmarEliminarDocumento = useCallback(async () => {
    if (!deleteTarget?.registroId) return;

    if (deleteTarget.tipo === 'acuse_persona') {
      await handleEliminarAcusePersona(deleteTarget.registroId);
    } else {
      await handleEliminarConstancia(deleteTarget.registroId);
    }

    setDeleteTarget(null);
  }, [deleteTarget, handleEliminarAcusePersona, handleEliminarConstancia]);

  return (
    <main className="fz-container">
      <TablaFinalizados
        registros={registros}
        loading={loading}
        readOnly={readOnly}
        busquedaInput={busquedaInput}
        onBusquedaChange={setBusquedaInput}
        paginacion={paginacion}
        onPaginaChange={setPagina}
        updatingId={updatingId}
        uploadingConstanciaId={uploadingConstanciaId}
        uploadingAcusePersonaId={uploadingAcusePersonaId}
        deletingConstanciaId={deletingConstanciaId}
        deletingAcusePersonaId={deletingAcusePersonaId}
        onActualizarFase1={handleActualizarFase1}
        onSubirConstancia={handleSubirConstancia}
        onSubirAcusePersona={handleSubirAcusePersona}
        onEliminarConstancia={(registroId) => solicitarEliminarDocumento('constancia', registroId)}
        onEliminarAcusePersona={(registroId) => solicitarEliminarDocumento('acuse_persona', registroId)}
        onVerConstancia={handleVerConstancia}
        onVerAcusePersona={handleVerAcusePersona}
        viewingConstanciaId={viewingConstanciaId}
        viewingAcusePersonaId={viewingAcusePersonaId}
      />

      {deleteTarget?.registroId && (
        <div className="fz-modal-backdrop" role="presentation">
          <div className="fz-modal" role="dialog" aria-modal="true" aria-labelledby="fz-delete-acuse-title">
            <h3 id="fz-delete-acuse-title">
              {deleteTarget.tipo === 'acuse_persona' ? 'Eliminar acuse de persona' : 'Eliminar constancia firmada'}
            </h3>
            <p>
              {deleteTarget.tipo === 'acuse_persona'
                ? '¿Deseas eliminar el acuse de persona de este registro? Esta acción es irreversible.'
                : '¿Deseas eliminar la constancia firmada de este registro? Esta acción es irreversible.'}
            </p>

            <div className="fz-modal-actions">
              <button
                type="button"
                className="fz-btn-secondary"
                onClick={cancelarEliminarDocumento}
                disabled={Boolean(deletingConstanciaId || deletingAcusePersonaId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="fz-btn-danger"
                onClick={confirmarEliminarDocumento}
                disabled={Boolean(deletingConstanciaId || deletingAcusePersonaId)}
              >
                {deletingConstanciaId || deletingAcusePersonaId
                  ? 'Eliminando...'
                  : (deleteTarget.tipo === 'acuse_persona' ? 'Eliminar acuse' : 'Eliminar constancia')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
