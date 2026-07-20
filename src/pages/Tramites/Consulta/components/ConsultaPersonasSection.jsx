import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEdit2, FiRefreshCcw, FiSave, FiTrash2, FiUserPlus, FiX, FiXCircle } from 'react-icons/fi';
import { MdFileDownload, MdGroups, MdPlace, MdSearch } from 'react-icons/md';
import '../../../Usuarios/styles/UsuarioForm.css';

const FORM_INICIAL = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  fecha_nacimiento: '',
  numero_oficio: ''
};

const normalizarMayusculas = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const formatearFechaNacimiento = (value) => {
  if (!value) return '---';

  if (typeof value === 'string') {
    const isoDate = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    }
  }

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '---';
  return fecha.toLocaleDateString('es-MX');
};

export default function ConsultaPersonasSection({
  municipioActivo,
  busquedaPersonasInput,
  onBusquedaPersonasChange,
  loadingPersonas,
  personas,
  selectedRows,
  allCurrentPageSelected,
  onToggleSelectAll,
  onToggleSelectRow,
  onAgregarPersona,
  onEditarPersona,
  onEliminarPersona,
  onLimpiarRegistrosRecientes,
  onExportarCompleto,
  onExportarSeleccion,
  exportingExcel,
  puedeExportarCompleto,
  puedeExportarSeleccion,
  tieneRegistrosRecientes,
  paginacionPersonas,
  onPaginaAnterior,
  onPaginaSiguiente
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [registroEditandoId, setRegistroEditandoId] = useState(null);
  const [nuevaPersona, setNuevaPersona] = useState(FORM_INICIAL);

  const maxFechaNacimiento = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const siguienteNumero =
    personas.length + 1 + ((paginacionPersonas.pagina || 1) - 1) * (paginacionPersonas.limit || 10);

  const numeroRegistroEditando = useMemo(() => {
    if (!registroEditandoId) return '---';

    const index = personas.findIndex((item) => item.finalizado_id === registroEditandoId);
    if (index < 0) return '---';

    return index + 1 + ((paginacionPersonas.pagina || 1) - 1) * (paginacionPersonas.limit || 10);
  }, [paginacionPersonas.limit, paginacionPersonas.pagina, personas, registroEditandoId]);

  const abrirModalAgregar = () => {
    setModoModal('crear');
    setRegistroEditandoId(null);
    setNuevaPersona(FORM_INICIAL);
    setModalAbierto(true);
  };

  const abrirModalEditar = (persona) => {
    const esRecienAgregado = Boolean(persona?.es_local) || String(persona?.finalizado_id || '').startsWith('local-');
    if (!esRecienAgregado) return;

    setModoModal('editar');
    setRegistroEditandoId(persona.finalizado_id);
    setNuevaPersona({
      nombre: normalizarMayusculas(persona?.nombre || ''),
      apellido_paterno: normalizarMayusculas(persona?.apellido_paterno || ''),
      apellido_materno: normalizarMayusculas(persona?.apellido_materno || ''),
      fecha_nacimiento: String(persona?.fecha_nacimiento || '').slice(0, 10),
      numero_oficio: persona?.numero_oficio || persona?.numero_oficio_c3 || ''
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoModal('crear');
    setRegistroEditandoId(null);
    setNuevaPersona(FORM_INICIAL);
  };

  const handleGuardarPersona = (event) => {
    event.preventDefault();

    const numeroOficio = String(nuevaPersona.numero_oficio || '').trim().toUpperCase();

    const registro = {
      nombre: normalizarMayusculas(nuevaPersona.nombre),
      apellido_paterno: normalizarMayusculas(nuevaPersona.apellido_paterno),
      apellido_materno: normalizarMayusculas(nuevaPersona.apellido_materno),
      fecha_nacimiento: nuevaPersona.fecha_nacimiento,
      numero_oficio: numeroOficio || null,
      numero_oficio_c3: numeroOficio || null
    };

    const esEdicion = modoModal === 'editar';
    const resultado = esEdicion
      ? onEditarPersona?.(registroEditandoId, registro)
      : onAgregarPersona?.(registro);

    if (resultado !== false) {
      if (esEdicion) {
        cerrarModal();
      } else {
        setNuevaPersona(FORM_INICIAL);
      }
    }
  };

  const submitDeshabilitado =
    !nuevaPersona.nombre.trim() ||
    !nuevaPersona.apellido_paterno.trim() ||
    !nuevaPersona.fecha_nacimiento;

  const mostrarEstadoSinMunicipio = !municipioActivo && personas.length === 0;

  const modalContent = modalAbierto ? (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={modoModal === 'editar' ? 'Editar persona finalizada' : 'Agregar persona finalizada'}>
      <div className="modal-container">
        <form onSubmit={handleGuardarPersona} className="usuario-form form-editar modal-form">
          <div className="form-header modal-header">
            <h3 className="form-titulo editar">
              {modoModal === 'editar' ? <FiEdit2 size={16} /> : <FiUserPlus size={16} />}
              {modoModal === 'editar' ? 'Editar persona finalizada' : 'Agregar persona finalizada'}
            </h3>
            <button type="button" className="btn-cerrar" onClick={cerrarModal}>
              <FiX size={16} />
            </button>
          </div>

          <div className="modal-body">
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">No.</label>
                <input
                  type="text"
                  className="form-input"
                  value={modoModal === 'editar' ? numeroRegistroEditando : siguienteNumero}
                  readOnly
                />
              </div>

              <div className="form-field">
                <label className="form-label">Nombre: <span className="requerido">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={nuevaPersona.nombre}
                  onChange={(e) => setNuevaPersona((prev) => ({ ...prev, nombre: normalizarMayusculas(e.target.value) }))}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Apellido paterno: <span className="requerido">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={nuevaPersona.apellido_paterno}
                  onChange={(e) => setNuevaPersona((prev) => ({ ...prev, apellido_paterno: normalizarMayusculas(e.target.value) }))}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Apellido materno:</label>
                <input
                  type="text"
                  className="form-input"
                  value={nuevaPersona.apellido_materno}
                  onChange={(e) => setNuevaPersona((prev) => ({ ...prev, apellido_materno: normalizarMayusculas(e.target.value) }))}
                  maxLength={100}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Fecha de nacimiento: <span className="requerido">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={nuevaPersona.fecha_nacimiento}
                  onChange={(e) => setNuevaPersona((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  max={maxFechaNacimiento}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Número de oficio:
                </label>

                <input
                  type="text"
                  className="form-input"
                  value={nuevaPersona.numero_oficio}
                  onChange={(e) =>
                    setNuevaPersona((prev) => ({
                      ...prev,
                      numero_oficio: e.target.value.toUpperCase()
                    }))
                  }
                  maxLength={100}
                  placeholder="Opcional"
                />
              </div>

            </div>
          </div>

          <div className="form-acciones modal-footer">
            <button type="submit" className="btn-submit editar" disabled={submitDeshabilitado}>
              <FiSave size={15} /> {modoModal === 'editar' ? 'Guardar cambios' : 'Agregar a la tabla'}
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
      <section className="consulta-card">
        <div className="consulta-card-header">
          <div className="consulta-card-header-top">
            <div className="consulta-card-title">
              <span className="consulta-card-title-icon" aria-hidden="true">
                <MdGroups />
              </span>
              <h3>Personas finalizadas por municipio</h3>
            </div>

            <span className={`consulta-selected-badge ${municipioActivo ? '' : 'is-empty'}`}>
              <MdPlace />
              {municipioActivo
                ? (municipioActivo.municipio_nombre || 'Sin municipio')
                : 'Sin municipio seleccionado'}
            </span>
          </div>

          <p>
            {municipioActivo
              ? 'Filtre por nombre y exporte la tabla completa o un subconjunto seleccionado.'
              : 'Puede agregar personas sin seleccionar municipio y tambien consultar por municipio.'}
          </p>
        </div>

        <div className="consulta-toolbar-row">
          <div className="consulta-search-box">
            <MdSearch className="consulta-search-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre o apellidos"
              value={busquedaPersonasInput}
              onChange={(e) => onBusquedaPersonasChange(e.target.value)}
            />
          </div>

          <div className="consulta-toolbar-actions">
            <button
              type="button"
              className="consulta-btn-add-persona"
              onClick={abrirModalAgregar}
            >
              <FiUserPlus /> Agregar persona
            </button>
            <button
              type="button"
              className="consulta-btn-clear-recent"
              onClick={onLimpiarRegistrosRecientes}
              disabled={!tieneRegistrosRecientes}
            >
              <FiRefreshCcw /> Limpiar tabla (recientes)
            </button>
            <button type="button" className="consulta-btn-export" onClick={onExportarCompleto} disabled={!puedeExportarCompleto || exportingExcel}>
              <MdFileDownload /> Exportar todo a Excel
            </button>
            <button
              type="button"
              className="consulta-btn-export secondary"
              onClick={onExportarSeleccion}
              disabled={!puedeExportarSeleccion || exportingExcel}
            >
              <MdFileDownload /> Exportar seleccionados ({selectedRows.length})
            </button>
          </div>
        </div>

        <div className="consulta-table-wrap">
          {mostrarEstadoSinMunicipio ? (
            <div className="consulta-state">Aun no selecciona un municipio.</div>
          ) : municipioActivo && loadingPersonas ? (
            <div className="consulta-state"><i className='bx bx-loader-alt bx-spin'></i> Cargando personas...</div>
          ) : personas.length === 0 ? (
            <div className="consulta-state">No hay personas finalizadas para este municipio.</div>
          ) : (
            <table className="consulta-table consulta-table-personas">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allCurrentPageSelected} onChange={onToggleSelectAll} />
                  </th>
                  <th>No.</th>
                  <th>Nombre</th>
                  <th>Apellido Paterno</th>
                  <th>Apellido Materno</th>
                  <th>Fecha de nacimiento</th>
                  <th>No. Oficio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((item, index) => {
                  const checked = selectedRows.includes(item.finalizado_id);
                  const fechaNac = formatearFechaNacimiento(item.fecha_nacimiento);
                  const esRecienAgregado = Boolean(item.es_local) || String(item.finalizado_id || '').startsWith('local-');

                  return (
                    <tr key={item.finalizado_id} className={checked ? 'is-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleSelectRow(item.finalizado_id)}
                        />
                      </td>
                      <td>{index + 1 + ((paginacionPersonas.pagina || 1) - 1) * (paginacionPersonas.limit || 10)}</td>
                      <td>{item.nombre || '---'}</td>
                      <td>{item.apellido_paterno || '---'}</td>
                      <td>{item.apellido_materno || '---'}</td>
                      <td>{fechaNac}</td>
                      <td>{item.numero_oficio || item.numero_oficio_c3 || 'Sin oficio'}</td>
                      <td>
                        {esRecienAgregado ? (
                          <div className="consulta-row-actions">
                            <button
                              type="button"
                              className="consulta-row-btn edit"
                              onClick={() => abrirModalEditar(item)}
                            >
                              <FiEdit2 /> Editar
                            </button>
                            <button
                              type="button"
                              className="consulta-row-btn delete"
                              onClick={() => onEliminarPersona?.(item.finalizado_id)}
                            >
                              <FiTrash2 /> Eliminar
                            </button>
                          </div>
                        ) : (
                          <span className="consulta-row-lock">Registro base</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="consulta-pagination">
          <button type="button" onClick={onPaginaAnterior} disabled={(paginacionPersonas.pagina || 1) <= 1}>
            Anterior
          </button>
          <span>Pagina {paginacionPersonas.pagina || 1} de {paginacionPersonas.totalPaginas || 1}</span>
          <button
            type="button"
            onClick={onPaginaSiguiente}
            disabled={(paginacionPersonas.pagina || 1) >= (paginacionPersonas.totalPaginas || 1)}
          >
            Siguiente
          </button>
        </div>
      </section>

      {modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
