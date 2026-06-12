import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTENTICACIÓN =====
export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const getProfile = () => {
  return api.get('/auth/profile');
};

export const heartbeatSession = () => {
  return api.post('/auth/heartbeat');
};

export const logoutSession = () => {
  return api.post('/auth/logout');
};

export const updateProfile = (data) => {
  return api.put('/auth/profile', data);
};

export const changePassword = (currentPassword, newPassword) => {
  return api.put('/auth/change-password', { currentPassword, newPassword });
};

// ===== ADMIN =====
export const getUsuarios = (params = {}) => {
  return api.get('/admin/usuarios', { params });
};

export const createUsuario = (data) => {
  return api.post('/admin/usuarios', data);
};

export const updateUsuario = (id, data) => {
  return api.put(`/admin/usuarios/${id}`, data);
};

export const deleteUsuario = (id) => {
  return api.delete(`/admin/usuarios/${id}`);
};

export const purgeRegistrosAnalistaUsuario = (id) => {
  return api.delete(`/admin/usuarios/${id}/registros`);
};

export const activateUsuario = (id) => {
  return api.patch(`/admin/usuarios/${id}/activate`);
};

export const deactivateUsuario = (id) => {
  return api.patch(`/admin/usuarios/${id}/deactivate`);
};

export const resetPasswordUsuario = (id) => {
  return api.patch(`/admin/usuarios/${id}/reset-password`);
};

export const generarPasswordTemporalUsuario = (id, data) => {
  return api.post(`/admin/usuarios/${id}/temporary-password`, data);
};

export const obtenerPasswordTemporalUsuario = (id, params = {}) => {
  return api.get(`/admin/usuarios/${id}/temporary-password`, { params });
};

export const revocarPasswordTemporalUsuario = (id, data = {}) => {
  return api.delete(`/admin/usuarios/${id}/temporary-password`, { data });
};

export const getEstadisticasAdmin = () => {
  return api.get('/admin/estadisticas');
};

// ===== CATÁLOGOS =====
export const getTiposOficio = () => {
  return api.get('/catalogos/tipos-oficio');
};

export const getMunicipios = (params = {}) => {
  return api.get('/catalogos/municipios', { params });
};

export const getRegiones = () => {
  return api.get('/catalogos/regiones');
};

export const getEstatus = () => {
  return api.get('/catalogos/estatus');
};

export const getDependencias = () => {
  return api.get('/catalogos/dependencias');
};

export const getPuestos = () => {
  return api.get('/catalogos/puestos');
};

// ===== TRÁMITES ALTA =====
export const getMisSolicitudes = (params = {}) => {
  return api.get('/tramites/alta/mis-solicitudes', { params });
};

export const getDashboardMunicipios = () => {
  return api.get('/tramites/alta/dashboard-municipios');
};

export const crearNuevaSolicitud = (data) => {
  return api.post('/tramites/alta/nueva-solicitud', data);
};

export const obtenerSolicitudPorId = (id) => {
  return api.get(`/tramites/alta/${id}`);
};

export const eliminarBorradorSolicitudAlta = (tramiteId, options = {}) => {
  if (options.keepalive) {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    return fetch(`${API_URL}/tramites/alta/${tramiteId}/borrador`, {
      method: 'DELETE',
      headers,
      keepalive: true,
      credentials: 'same-origin'
    });
  }

  return api.delete(`/tramites/alta/${tramiteId}/borrador`);
};

export const agregarPersona = (tramiteId, data) => {
  return api.post(`/tramites/alta/${tramiteId}/personas`, data);
};

export const obtenerPersonasPorTramite = (tramiteId) => {
  return api.get(`/tramites/alta/${tramiteId}/personas`);
};

export const editarPersonaAlta = (personaId, data) => {
  return api.put(`/tramites/alta/persona/${personaId}`, data);
};

export const validarPersona = (personaId) => {
  return api.put(`/tramites/alta/persona/${personaId}/validar`);
};

export const rechazarPersona = (personaId, data) => {
  return api.put(`/tramites/alta/persona/${personaId}/rechazar`, data);
};

export const enviarSolicitudAC3 = (tramiteId) => {
  return api.post('/tramites/alta/enviar-a-c3', { tramite_id: tramiteId });
};

export const obtenerPersonasPendientesC3 = (params = {}) => {
  return api.get('/tramites/alta/personas-pendientes-c3', { params });
};

export const obtenerSolicitudParaC3 = (tramiteId) => {
  return api.get(`/tramites/alta/c3/${tramiteId}`);
};

export const emitirDictamenPersonaC3 = (personaId, data) => {
  return api.post(`/tramites/alta/persona/${personaId}/dictamen-c3`, data);
};

export const obtenerPropuestasC3 = () => {
  return api.get('/tramites/alta/rechazos-c3');
};

export const obtenerTodasLasPersonasC5 = (params = {}) => {
  return api.get('/tramites/alta/todas-personas-c5', { params });
};

export const emitirDecisionFinalC5 = (personaId, data) => {
  return api.post(`/tramites/alta/c5/personas/${personaId}/decision-final`, data);
};

export const obtenerHistorialC3 = (params = {}) => {
  return api.get('/tramites/alta/historial-c3', { params });
};

export const obtenerPersonasRechazadas = (params = {}) => {
  return api.get('/tramites/alta/personas-rechazadas', { params });
};

export const actualizarMotivoRechazo = (personaId, data) => {
  return api.put(`/tramites/alta/personas-rechazadas/${personaId}/motivo`, data);
};

export const generarOficioRechazo = (personaId) => {
  return api.get(`/tramites/alta/personas-rechazadas/${personaId}/oficio`);
};

export const getSolicitudes = (params = {}) => {
  return api.get('/tramites/alta/mis-solicitudes', { params });
};

export const getSolicitudById = (id) => {
  return api.get(`/tramites/alta/solicitudes/${id}`);
};

export const createSolicitud = (data) => {
  return api.post('/tramites/alta/solicitudes', data);
};

export const updateSolicitud = (id, data) => {
  return api.put(`/tramites/alta/solicitudes/${id}`, data);
};

export const deleteSolicitud = (id) => {
  return api.delete(`/tramites/alta/solicitudes/${id}`);
};

export const updateEstatusSolicitud = (id, estatus) => {
  return api.patch(`/tramites/alta/solicitudes/${id}/estatus`, { estatus });
};

export const getEstadisticasSolicitudes = () => {
  return api.get('/tramites/alta/estadisticas');
};

// ============================================
// DEPENDENCIAS
// ============================================
export const crearSolicitudDependencia = (data) => {
  return api.post('/dependencias/solicitudes', data);
};

export const getMisSolicitudesDependencia = (params = {}) => {
  return api.get('/dependencias/mis-solicitudes', { params });
};

export const getSolicitudDependenciaPorId = (id) => {
  return api.get(`/dependencias/solicitudes/${id}`);
};

export const agregarPersonaDependencia = (tramiteId, data) => {
  return api.post(`/dependencias/tramites/${tramiteId}/personas`, data);
};

export const getPersonasDependencia = (tramiteId) => {
  return api.get(`/dependencias/tramites/${tramiteId}/personas`);
};

export const enviarDependenciaAC3 = (tramiteId) => {
  return api.post(`/dependencias/tramites/${tramiteId}/enviar-c3`);
};

// ===== REVISIÓN DE REQUISITOS =====
export const obtenerPendientesRevision = (params = {}) => {
  return api.get('/tramites/alta/revision/pendientes', { params });
};

export const obtenerEnProcesoRevision = (params = {}) => {
  return api.get('/tramites/alta/revision/en-proceso', { params });
};

export const iniciarRevisionPersona = (personaId) => {
  return api.post(`/tramites/alta/revision/${personaId}/iniciar`);
};

export const obtenerDetalleRevision = (personaId) => {
  return api.get(`/tramites/alta/revision/${personaId}`);
};

export const guardarAntecedentes = (personaId, data) => {
  return api.put(`/tramites/alta/revision/${personaId}/antecedentes`, data);
};

export const validarDocumentoRevision = (personaId, data) => {
  return api.put(`/tramites/alta/revision/${personaId}/documento`, data);
};

export const validarTodosDocumentosRevision = (personaId) => {
  return api.put(`/tramites/alta/revision/${personaId}/validar-todos`);
};

export const completarRevisionPersona = (personaId) => {
  return api.post(`/tramites/alta/revision/${personaId}/completar`);
};

export const rechazarEnRevision = (personaId, motivo) => {
  return api.post(`/tramites/alta/revision/${personaId}/rechazar`, { motivo });
};

// ===== VALIDACIÓN CUIP =====
export const obtenerPendientesCuip = (params = {}) => {
  return api.get('/tramites/alta/cuip/pendientes', { params });
};

export const obtenerEnProcesoCuip = (params = {}) => {
  return api.get('/tramites/alta/cuip/en-proceso', { params });
};

export const iniciarCuipPersona = (personaId) => {
  return api.post(`/tramites/alta/cuip/${personaId}/iniciar`);
};

export const obtenerDetalleCuip = (personaId) => {
  return api.get(`/tramites/alta/cuip/${personaId}`);
};

export const validarCampoCuip = (personaId, data) => {
  return api.put(`/tramites/alta/cuip/${personaId}/campo`, data);
};

export const validarSeccionCuip = (personaId, seccionClave) => {
  return api.put(`/tramites/alta/cuip/${personaId}/seccion`, { seccion_clave: seccionClave });
};

export const marcarExcepcionCuip = (personaId, seccionClave, activa) => {
  return api.put(`/tramites/alta/cuip/${personaId}/excepcion`, { seccion_clave: seccionClave, activa });
};

export const validarTodoCuipApi = (personaId) => {
  return api.put(`/tramites/alta/cuip/${personaId}/validar-todo`);
};

export const completarCuipPersona = (personaId) => {
  return api.post(`/tramites/alta/cuip/${personaId}/completar`);
};

export const rechazarEnCuip = (personaId, motivo) => {
  return api.post(`/tramites/alta/cuip/${personaId}/rechazar`, { motivo });
};

export const aprobarYGenerarCitaApi = (personaId, datosCita) => {
  return api.post(`/tramites/alta/cuip/${personaId}/aprobar-cita`, datosCita);
};

// ── Historial de Citas ──────────────────────────────────────────
export const getHistorialCitasApi = (params) =>
  api.get('/tramites/alta/citas', { params });

export const getEstadisticasCitasApi = (params = {}) =>
  api.get('/tramites/alta/citas/stats', { params });

export const actualizarEstadoCitaApi = (citaId, estado) =>
  api.patch(`/tramites/alta/citas/${citaId}/estado`, { estado });

export const getBitacoraCitaApi = (citaId) =>
  api.get(`/tramites/alta/citas/${citaId}/bitacora`);

export const reprogramarCitaApi = (citaId, data) =>
  api.patch(`/tramites/alta/citas/${citaId}/reprogramar`, data);

export const cancelarCitaApi = (citaId, motivo) =>
  api.patch(`/tramites/alta/citas/${citaId}/cancelar`, { motivo });

export const finalizarFlujoCitaApi = (citaId, data) =>
  api.patch(`/tramites/alta/citas/${citaId}/finalizar-flujo`, data);

export const getFinalizadosApi = (params = {}) =>
  api.get('/tramites/alta/finalizados', { params });

export const actualizarFase1FinalizadoApi = (registroId, fase1_estado) =>
  api.patch(`/tramites/alta/finalizados/${registroId}/fase1`, { fase1_estado });

export const subirAcuseFinalizadoApi = (registroId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/tramites/alta/finalizados/${registroId}/acuse`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const eliminarAcuseFinalizadoApi = (registroId) =>
  api.delete(`/tramites/alta/finalizados/${registroId}/acuse`);

export const verConstanciaFinalizadoApi = (registroId) =>
  api.get(`/tramites/alta/finalizados/${registroId}/constancia/view`, { responseType: 'blob' });

export const subirAcusePersonaFinalizadoApi = (registroId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/tramites/alta/finalizados/${registroId}/acuse-persona`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const eliminarAcusePersonaFinalizadoApi = (registroId) =>
  api.delete(`/tramites/alta/finalizados/${registroId}/acuse-persona`);

export const verAcusePersonaFinalizadoApi = (registroId) =>
  api.get(`/tramites/alta/finalizados/${registroId}/acuse-persona/view`, { responseType: 'blob' });

export const getCatalogoBajasApi = () =>
  api.get('/tramites/alta/bajas/catalogo');

export const getDisponiblesBajaApi = (params = {}) =>
  api.get('/tramites/alta/bajas/disponibles', { params });

export const getBajasRegistradasApi = (params = {}) =>
  api.get('/tramites/alta/bajas', { params });

export const registrarBajaApi = (payload) =>
  api.post('/tramites/alta/bajas/registrar', payload);

export const getBajasEditablesApi = (params = {}) =>
  api.get('/tramites/alta/bajas/editables', { params });

export const crearBajaEditableApi = (payload) =>
  api.post('/tramites/alta/bajas/editables', payload);

export const editarBajaEditableApi = (id, payload) =>
  api.put(`/tramites/alta/bajas/editables/${id}`, payload);

export const eliminarBajaEditableApi = (id) =>
  api.delete(`/tramites/alta/bajas/editables/${id}`);

export const getConsultaMunicipiosApi = (params = {}) =>
  api.get('/tramites/alta/consulta/municipios', { params });

export const getConsultaPersonasMunicipioApi = (municipioId, params = {}) =>
  api.get(`/tramites/alta/consulta/municipios/${municipioId}/personas`, { params });

export const exportarConsultaPersonasMunicipioApi = (municipioId, params = {}) =>
  api.get(`/tramites/alta/consulta/municipios/${municipioId}/personas/exportar`, {
    params,
    responseType: 'blob'
  });

// ── Panel Direccion ───────────────────────────────────────────
export const getPanelDireccionApi = () =>
  api.get('/direccion/panel');

// ── Copias de Conocimiento (CCP) ────────────────────────────────
export const getCcpListApi = (params) =>
  api.get('/ccp', { params });

export const getCcpByIdApi = (id) =>
  api.get(`/ccp/${id}`);

export const getCcpSiguienteNumeroApi = (anio) =>
  api.get('/ccp/siguiente', { params: { anio } });

export const crearCcpApi = (data) =>
  api.post('/ccp', data);

export const actualizarCcpApi = (id, data) =>
  api.put(`/ccp/${id}`, data);

export const eliminarCcpApi = (id) =>
  api.delete(`/ccp/${id}`);

export const descargarExcelCcpApi = (id) =>
  api.get(`/ccp/${id}/download`, { responseType: 'blob' });

export const descargarZipCcpApi = (ids = []) =>
  api.get('/ccp/download/zip', {
    params: ids.length > 0 ? { ids: ids.join(',') } : {},
    responseType: 'blob'
  });

export const descargarTablaExcelCcpApi = (busqueda = '') =>
  api.get('/ccp/download/tabla', {
    params: busqueda ? { busqueda } : {},
    responseType: 'blob'
  });

export const eliminarCcpMasivoApi = (ids = []) =>
  api.post('/ccp/bulk-delete', { ids });

export const eliminarTodosCcpApi = () =>
  api.delete('/ccp');

export const getHistorialRegistrosCcpApi = (params = {}) =>
  api.get('/ccp/historial/registros', { params });

export const getActividadOperadorCcpApi = (params = {}) =>
  api.get('/ccp/historial/movimientos', { params });

// ── Repositorio Digital ───────────────────────────────────────
export const getRepositorioTreeApi = () =>
  api.get('/repositorio-digital/tree');

export const getRepositorioChildrenApi = (parentId = null, search = '') =>
  api.get('/repositorio-digital/folders', {
    params: {
      parentId,
      search
    }
  });

export const getRepositorioFilesApi = (folderId, search = '', pagina = 1, limit = 10, fecha = '') =>
  api.get(`/repositorio-digital/folders/${folderId}/files`, {
    params: { search, pagina, limit, fecha }
  });

export const getRepositorioDaysApi = (folderId, search = '') =>
  api.get(`/repositorio-digital/folders/${folderId}/days`, {
    params: { search }
  });

export const crearAnioRepositorioApi = (year) =>
  api.post('/repositorio-digital/years', { year });

export const crearSubcarpetaRepositorioApi = (parentId, nombre) =>
  api.post(`/repositorio-digital/folders/${parentId}/subfolders`, { nombre });

export const eliminarCarpetaRepositorioApi = (folderId) =>
  api.delete(`/repositorio-digital/folders/${folderId}`);

export const subirArchivoRepositorioApi = (folderId, file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.folio) formData.append('folio', metadata.folio);
  if (metadata.original_name) formData.append('original_name', metadata.original_name);

  return api.post(`/repositorio-digital/folders/${folderId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const eliminarArchivoRepositorioApi = (fileId) =>
  api.delete(`/repositorio-digital/files/${fileId}`);

export const verArchivoRepositorioApi = (fileId) =>
  api.get(`/repositorio-digital/files/${fileId}/view`, { responseType: 'blob' });

export const descargarRepositorioAnualZipApi = (folderId) =>
  api.get(`/repositorio-digital/folders/${folderId}/download-all`, { responseType: 'blob' });

export const descargarRepositorioSeleccionadosZipApi = (folderId, ids = []) =>
  api.post(`/repositorio-digital/folders/${folderId}/download-selected`, { ids }, { responseType: 'blob' });

export const eliminarArchivosRepositorioBulkApi = (ids = []) =>
  api.post('/repositorio-digital/files/bulk-delete', { ids });

// ── Oficios de Respuesta ───────────────────────────────────────
export const getOficiosRespuestaTreeApi = () =>
  api.get('/oficios-respuesta/tree');

export const getOficiosRespuestaChildrenApi = (parentId = null, search = '') =>
  api.get('/oficios-respuesta/folders', {
    params: {
      parentId,
      search
    }
  });

export const getOficiosRespuestaFilesApi = (folderId, search = '', pagina = 1, limit = 10, fecha = '') =>
  api.get(`/oficios-respuesta/folders/${folderId}/files`, {
    params: { search, pagina, limit, fecha }
  });

export const getOficiosRespuestaDaysApi = (folderId, search = '') =>
  api.get(`/oficios-respuesta/folders/${folderId}/days`, {
    params: { search }
  });

export const crearAnioOficiosRespuestaApi = (year) =>
  api.post('/oficios-respuesta/years', { year });

export const crearSubcarpetaOficiosRespuestaApi = (parentId, nombre) =>
  api.post(`/oficios-respuesta/folders/${parentId}/subfolders`, { nombre });

export const eliminarCarpetaOficiosRespuestaApi = (folderId) =>
  api.delete(`/oficios-respuesta/folders/${folderId}`);

export const subirArchivoOficiosRespuestaApi = (folderId, file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.folio) formData.append('folio', metadata.folio);
  if (metadata.original_name) formData.append('original_name', metadata.original_name);

  return api.post(`/oficios-respuesta/folders/${folderId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const eliminarArchivoOficiosRespuestaApi = (fileId) =>
  api.delete(`/oficios-respuesta/files/${fileId}`);

export const verArchivoOficiosRespuestaApi = (fileId) =>
  api.get(`/oficios-respuesta/files/${fileId}/view`, { responseType: 'blob' });

export const descargarOficiosRespuestaAnualZipApi = (folderId) =>
  api.get(`/oficios-respuesta/folders/${folderId}/download-all`, { responseType: 'blob' });

export const descargarOficiosRespuestaSeleccionadosZipApi = (folderId, ids = []) =>
  api.post(`/oficios-respuesta/folders/${folderId}/download-selected`, { ids }, { responseType: 'blob' });

export const eliminarArchivosOficiosRespuestaBulkApi = (ids = []) =>
  api.post('/oficios-respuesta/files/bulk-delete', { ids });

export default api;
