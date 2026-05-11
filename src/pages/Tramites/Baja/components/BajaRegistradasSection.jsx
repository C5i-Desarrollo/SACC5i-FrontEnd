import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import { FiEdit2, FiSave, FiTrash2, FiUserPlus, FiX, FiXCircle } from 'react-icons/fi';
import { MdAssignmentTurnedIn, MdEditNote, MdFileDownload, MdSearch } from 'react-icons/md';
import '../../../Usuarios/styles/UsuarioForm.css';

const FORM_INICIAL = {
  nombre_elemento: '',
  apellido_paterno: '',
  apellido_materno: '',
  municipio_nombre: '',
  cuip: '',
  numero_oficio_municipio: '',
  baja_tipo: '',
  baja_motivo: '',
  baja_fecha: '',
  observaciones: ''
};

const normalizarMayusculas = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizarTextoLibre = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim();

export default function BajaRegistradasSection({
  titulo = 'Elementos dados de baja',
  descripcion = 'Los elementos registrados aqui ya no aparecen en la tabla de finalizados disponibles.',
  allowEdicion = true,
  mostrarBuscador = true,
  mostrarAccionesToolbar = true,
  mostrarColumnaSeleccion = true,
  mostrarColumnaAcciones = true,
  mostrarPaginacion = true,
  placeholderBusqueda = 'Buscar en bajas por persona, apellidos, CUIP, municipio, tipo o motivo',
  textoCargando = 'Cargando bajas registradas...',
  textoVacio = 'Aun no hay bajas registradas.',
  busquedaBajasInput,
  onBusquedaBajasChange,
  loadingBajas,
  bajasTabla,
  catalogoBajas,
  onAgregarBajaLocal,
  onEditarBajaLocal,
  onEliminarBajaLocal,
  onLimpiarBajasLocales,
  onExportarBajasExcel,
  exportingBajasExcel,
  puedeExportarBajasCompleto,
  puedeExportarBajasSeleccion,
  selectedRowsBajas,
  allBajasCurrentSelected,
  onToggleSelectBaja,
  onToggleSelectAllBajas,
  formatDate,
  paginacionBajas,
  onPaginaAnterior,
  onPaginaSiguiente,
  mostrarContadorBajasRegistradas = false,
  mostrarContadorBajasManuales = false,
  totalBajasManuales = 0
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [registroEditandoId, setRegistroEditandoId] = useState(null);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardandoModal, setGuardandoModal] = useState(false);

  const tiposDisponibles = useMemo(() => Object.keys(catalogoBajas || {}), [catalogoBajas]);

  const motivosDelTipo = useMemo(() => {
    if (!formData.baja_tipo) return [];
    return catalogoBajas?.[formData.baja_tipo] || [];
  }, [catalogoBajas, formData.baja_tipo]);

  const tipoSinMotivosLocal = Boolean(formData.baja_tipo) && motivosDelTipo.length === 0;

  const abrirAgregar = () => {
    setModoModal('crear');
    setRegistroEditandoId(null);
    setFormData({
      ...FORM_INICIAL,
      baja_fecha: new Date().toISOString().slice(0, 10)
    });
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    if (!item?.es_local) return;

    setModoModal('editar');
    setRegistroEditandoId(item.row_id);
    setFormData({
      nombre_elemento: normalizarMayusculas(item.nombre_elemento || ''),
      apellido_paterno: normalizarMayusculas(item.apellido_paterno || ''),
      apellido_materno: normalizarMayusculas(item.apellido_materno || ''),
      municipio_nombre: normalizarMayusculas(item.municipio_nombre || ''),
      cuip: normalizarMayusculas(item.cuip || ''),
      numero_oficio_municipio: normalizarTextoLibre(item.numero_oficio_municipio || item.numero_oficio || ''),
      baja_tipo: normalizarTextoLibre(item.baja_tipo || ''),
      baja_motivo: normalizarTextoLibre(item.baja_motivo || ''),
      baja_fecha: String(item.baja_fecha || '').slice(0, 10),
      observaciones: normalizarTextoLibre(item.observaciones || item.baja_observaciones || '')
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoModal('crear');
    setRegistroEditandoId(null);
    setFormData(FORM_INICIAL);
  };

  const handleGuardar = async (event) => {
    event.preventDefault();

    const tipoResuelto = normalizarTextoLibre(formData.baja_tipo);
    const motivoResuelto = tipoSinMotivosLocal
      ? tipoResuelto
      : normalizarTextoLibre(formData.baja_motivo);

    const payload = {
      nombre_elemento: normalizarMayusculas(formData.nombre_elemento),
      apellido_paterno: normalizarMayusculas(formData.apellido_paterno),
      apellido_materno: normalizarMayusculas(formData.apellido_materno),
      municipio_nombre: normalizarMayusculas(formData.municipio_nombre),
      cuip: normalizarMayusculas(formData.cuip || ''),
      numero_oficio_municipio: normalizarTextoLibre(formData.numero_oficio_municipio || ''),
      baja_tipo: tipoResuelto,
      baja_motivo: motivoResuelto,
      baja_fecha: String(formData.baja_fecha || '').slice(0, 10),
      observaciones: normalizarTextoLibre(formData.observaciones || '')
    };

    setGuardandoModal(true);
    try {
      const resultado = await Promise.resolve(
        modoModal === 'editar'
          ? onEditarBajaLocal?.(registroEditandoId, payload)
          : onAgregarBajaLocal?.(payload)
      );

      if (resultado !== false) {
        onBusquedaBajasChange?.('');
        cerrarModal();
      }
    } finally {
      setGuardandoModal(false);
    }
  };

  const tipoValido = Boolean(formData.baja_tipo);
  const motivoValido = tipoValido && (tipoSinMotivosLocal || Boolean(formData.baja_motivo));
  const totalBajasRegistradas = Number(paginacionBajas?.total ?? bajasTabla?.length ?? 0);
  const totalManuales = Number(totalBajasManuales || 0);

  const submitDeshabilitado =
    guardandoModal ||
    !formData.nombre_elemento.trim() ||
    !formData.apellido_paterno.trim() ||
    !formData.municipio_nombre.trim() ||
    !tipoValido ||
    !motivoValido ||
    !formData.baja_fecha;

  const modalContent = modalAbierto ? (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={modoModal === 'editar' ? 'Editar baja' : 'Agregar baja'}>
      <div className="modal-container">
        <form onSubmit={handleGuardar} className="usuario-form form-editar modal-form">
          <div className="form-header modal-header">
            <h3 className="form-titulo editar">
              {modoModal === 'editar' ? <FiEdit2 size={16} /> : <FiUserPlus size={16} />}
              {modoModal === 'editar' ? 'Editar elemento dado de baja' : 'Agregar elemento dado de baja'}
            </h3>
            <button type="button" className="btn-cerrar" onClick={cerrarModal}>
              <FiX size={16} />
            </button>
          </div>

          <div className="modal-body">
            <p className="baja-help-inline">Capture los datos del elemento para agregarlo a la tabla reciente editable.</p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Nombre: <span className="requerido">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre_elemento}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre_elemento: normalizarMayusculas(e.target.value) }))}
                  maxLength={160}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Apellido paterno: <span className="requerido">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.apellido_paterno}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apellido_paterno: normalizarMayusculas(e.target.value) }))}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Apellido materno:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.apellido_materno}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apellido_materno: normalizarMayusculas(e.target.value) }))}
                  maxLength={120}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Municipio: <span className="requerido">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.municipio_nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, municipio_nombre: normalizarMayusculas(e.target.value) }))}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">CUIP:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cuip}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cuip: normalizarMayusculas(e.target.value) }))}
                  maxLength={40}
                  placeholder="Ingrese CUIP"
                />
              </div>

              <div className="form-field">
                <label className="form-label">No. Oficio municipio:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.numero_oficio_municipio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero_oficio_municipio: normalizarTextoLibre(e.target.value) }))}
                  maxLength={120}
                  placeholder="Ingrese numero de oficio del municipio"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Tipo de baja: <span className="requerido">*</span></label>
                <select
                  className="form-input"
                  value={formData.baja_tipo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baja_tipo: e.target.value, baja_motivo: '' }))}
                  required
                >
                  <option value="">Seleccione tipo de baja</option>
                  {tiposDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Motivo de baja: <span className="requerido">*</span></label>
                <select
                  className="form-input"
                  value={tipoSinMotivosLocal ? formData.baja_tipo : formData.baja_motivo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baja_motivo: e.target.value }))}
                  disabled={!formData.baja_tipo || tipoSinMotivosLocal}
                  required
                >
                  <option value="">{formData.baja_tipo ? 'Seleccione motivo de baja' : 'Primero seleccione tipo'}</option>
                  {motivosDelTipo.map((motivo) => (
                    <option key={motivo} value={motivo}>{motivo}</option>
                  ))}
                </select>
                {tipoSinMotivosLocal && (
                  <small className="baja-help-inline">Este tipo no tiene motivos hijos; se registrara el mismo valor del tipo.</small>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Fecha de baja: <span className="requerido">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.baja_fecha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baja_fecha: e.target.value }))}
                  required
                />
              </div>

              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Observaciones:</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.observaciones}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Comentarios opcionales para exportacion"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          <div className="form-acciones modal-footer">
            <button type="submit" className="btn-submit editar" disabled={submitDeshabilitado}>
              <FiSave size={15} /> {guardandoModal ? 'Guardando...' : (modoModal === 'editar' ? 'Guardar cambios' : 'Agregar a la tabla')}
            </button>
            <button type="button" className="btn-cancelar" onClick={cerrarModal}>
              <FiXCircle size={15} /> Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <section className="baja-card">
        <div className="baja-card-header">
          <div className="baja-header-copy">
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
          </div>
          {(mostrarContadorBajasRegistradas || mostrarContadorBajasManuales) && (
            <div className="baja-header-kpis baja-header-kpis-right baja-header-kpis-compact">
              {mostrarContadorBajasRegistradas && (
                <article className="baja-metric-card metric-bajas">
                  <span className="baja-metric-icon" aria-hidden="true">
                    <MdAssignmentTurnedIn />
                  </span>
                  <div className="baja-metric-content">
                    <small>Bajas registradas</small>
                    <strong>{totalBajasRegistradas}</strong>
                  </div>
                </article>
              )}

              {mostrarContadorBajasManuales && (
                <article className="baja-metric-card metric-manuales">
                  <span className="baja-metric-icon" aria-hidden="true">
                    <MdEditNote />
                  </span>
                  <div className="baja-metric-content">
                    <small>Bajas registradas manualmente</small>
                    <strong>{totalManuales}</strong>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        {(mostrarBuscador || (allowEdicion && mostrarAccionesToolbar)) && (
          <div className="baja-toolbar-row baja-toolbar-row-wrap">
            {mostrarBuscador && (
              <div className="baja-search-box">
                <MdSearch className="baja-search-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder={placeholderBusqueda}
                  value={busquedaBajasInput}
                  onChange={(e) => onBusquedaBajasChange(e.target.value)}
                />
              </div>
            )}

            {allowEdicion && mostrarAccionesToolbar && (
            <div className="baja-toolbar-actions baja-toolbar-actions-wrap">
              <button type="button" className="baja-filtros-btn baja-btn-add-persona" onClick={abrirAgregar}>
                <FiUserPlus /> Agregar persona
              </button>
              <button
                type="button"
                className="baja-filtros-btn baja-btn-export"
                onClick={() => onExportarBajasExcel?.(false)}
                disabled={!puedeExportarBajasCompleto || exportingBajasExcel}
              >
                <MdFileDownload /> Exportar todo a Excel
              </button>
              <button
                type="button"
                className="baja-filtros-btn baja-btn-export baja-btn-export-secondary"
                onClick={() => onExportarBajasExcel?.(true)}
                disabled={!puedeExportarBajasSeleccion || exportingBajasExcel}
              >
                <MdFileDownload /> Exportar seleccionados ({selectedRowsBajas.length})
              </button>
            </div>
            )}
          </div>
        )}

        <div className="baja-table-wrap">
          {loadingBajas ? (
            <div className="baja-state"><i className='bx bx-loader-alt bx-spin'></i> {textoCargando}</div>
          ) : bajasTabla.length === 0 ? (
            <div className="baja-state">{textoVacio}</div>
          ) : (
            <table className="baja-table">
              <thead>
                <tr>
                  {mostrarColumnaSeleccion && (
                    <th>
                      <input type="checkbox" checked={allBajasCurrentSelected} onChange={onToggleSelectAllBajas} />
                    </th>
                  )}
                  <th>Nombre</th>
                  <th>Apellido paterno</th>
                  <th>Apellido materno</th>
                  <th>Municipio</th>
                  <th>CUIP</th>
                  <th>No. Oficio municipio</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Fecha baja</th>
                  <th>Estatus</th>
                  {mostrarColumnaAcciones && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {bajasTabla.map((item) => {
                  const checked = mostrarColumnaSeleccion && selectedRowsBajas.includes(item.row_id);
                  return (
                    <tr key={item.row_id} className={checked ? 'is-selected' : ''}>
                      {mostrarColumnaSeleccion && (
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleSelectBaja(item.row_id)}
                          />
                        </td>
                      )}
                      <td>{item.nombre_elemento || '---'}</td>
                      <td>{item.apellido_paterno || '---'}</td>
                      <td>{item.apellido_materno || '---'}</td>
                      <td>{item.municipio_nombre || '---'}</td>
                      <td>{item.cuip || '---'}</td>
                      <td>{item.numero_oficio_municipio || item.numero_oficio || '---'}</td>
                      <td>{item.baja_tipo || '---'}</td>
                      <td>{item.baja_motivo || '---'}</td>
                      <td>{formatDate(item.baja_fecha)}</td>
                      <td>
                        <span className="baja-badge">Dado de baja</span>
                      </td>
                      {mostrarColumnaAcciones && (
                        <td>
                          {item.es_local && allowEdicion ? (
                            <div className="baja-row-actions">
                              <button type="button" className="baja-row-btn edit" onClick={() => abrirEditar(item)}>
                                <FiEdit2 /> Editar
                              </button>
                              <button type="button" className="baja-row-btn delete" onClick={() => onEliminarBajaLocal(item.row_id)}>
                                <FiTrash2 /> Eliminar
                              </button>
                            </div>
                          ) : (
                            <span className="baja-row-lock">Registro base</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {mostrarPaginacion && (
          <div className="baja-pagination">
            <button
              type="button"
              disabled={paginacionBajas.pagina <= 1}
              onClick={onPaginaAnterior}
            >
              Anterior
            </button>
            <span>Pagina {paginacionBajas.pagina || 1} de {paginacionBajas.totalPaginas || 1}</span>
            <button
              type="button"
              disabled={(paginacionBajas.pagina || 1) >= (paginacionBajas.totalPaginas || 1)}
              onClick={onPaginaSiguiente}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      {modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
