import { useMemo, useState } from 'react';
import {
  buildCompactPagination,
  buildAsunto,
  formatFecha,
  formatReferenciaVolante,
} from './ccpHelpers';
import '../styles/TablaCCP.css';

export default function TablaCCP({
  registros,
  loading,
  busqueda,
  pagina,
  setPagina,
  paginacion,
  pageSize = 20,
  seleccionados,
  toggleSeleccionado,
  onEliminarSeleccionados,
  onEliminarTodos,
  onEditar,
  onEliminar,
  onDescargarExcel,
  onDescargarZip,
  onDescargarTabla,
}) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroTipoSolicitud, setFiltroTipoSolicitud] = useState('');

  const paginasVisibles = useMemo(
    () => buildCompactPagination(pagina, paginacion.totalPaginas),
    [pagina, paginacion.totalPaginas]
  );

  const areasUnicas = useMemo(() => {
    const set = new Set(registros.map((r) => (r.area || '').trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [registros]);

  const tiposUnicos = useMemo(() => {
    const set = new Set(registros.map((r) => (r.tipo_solicitud || '').trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    let data = [...registros];
    if (filtroArea) {
      data = data.filter((r) => (r.area || '').trim() === filtroArea);
    }
    if (filtroTipoSolicitud) {
      data = data.filter((r) => (r.tipo_solicitud || '').trim() === filtroTipoSolicitud);
    }
    return data;
  }, [registros, filtroArea, filtroTipoSolicitud]);

  const todosSeleccionados = registrosFiltrados.length > 0
    && registrosFiltrados.every((r) => seleccionados.includes(r.id));

  const limpiarFiltros = () => {
    setFiltroArea('');
    setFiltroTipoSolicitud('');
  };

  const toggleSeleccionarTodosVisibles = () => {
    if (registrosFiltrados.length === 0) return;

    const idsVisibles = registrosFiltrados.map((r) => r.id);
    const todosVisiblesSeleccionados = idsVisibles.every((id) => seleccionados.includes(id));

    if (todosVisiblesSeleccionados) {
      idsVisibles.forEach((id) => {
        if (seleccionados.includes(id)) toggleSeleccionado(id);
      });
      return;
    }

    idsVisibles.forEach((id) => {
      if (!seleccionados.includes(id)) toggleSeleccionado(id);
    });
  };

  return (
    <div className="ccp-tabla-card">
      <div className="ccp-toolbar">
        <div className="ccp-toolbar-row">
          <div className="ccp-toolbar-left">
            {seleccionados.length > 0 && (
              <span className="ccp-sel-badge">
                {seleccionados.length} seleccionado{seleccionados.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="ccp-toolbar-actions">
            <button
              type="button"
              className={`ccp-btn-dl ccp-btn-filter ${mostrarFiltros ? 'is-active' : ''}`}
              onClick={() => setMostrarFiltros((prev) => !prev)}
              aria-label="Mostrar filtros"
              title="Mostrar filtros"
            >
              <i className="bx bx-slider-alt"></i>
              <span className="ccp-btn-text">Filtros</span>
            </button>
            <button className="ccp-btn-dl" onClick={onDescargarZip}
              title={seleccionados.length > 0 ? `Descargar ${seleccionados.length} como ZIP` : 'Descargar todos como ZIP'}>
              <i className="bx bx-download"></i>
              <span className="ccp-btn-text">{seleccionados.length > 0 ? `ZIP (${seleccionados.length})` : 'Descargar ZIP'}</span>
            </button>
            <button className="ccp-btn-dl ccp-btn-excel" onClick={onDescargarTabla} title="Exportar tabla completa en Excel">
              <i className="bx bx-table"></i>
              <span className="ccp-btn-text">Exportar Excel</span>
            </button>
            <button className="ccp-btn-dl ccp-btn-danger" onClick={onEliminarSeleccionados} disabled={seleccionados.length === 0} title="Eliminar seleccionados">
              <i className="bx bx-trash"></i>
              <span className="ccp-btn-text">Eliminar ({seleccionados.length})</span>
            </button>
            <button className="ccp-btn-dl ccp-btn-danger-light" onClick={onEliminarTodos} title="Vaciar tabla CCP completa">
              <i className="bx bx-trash-alt"></i>
              <span className="ccp-btn-text">Vaciar tabla</span>
            </button>
          </div>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="ccp-filtros-panel">
          <div className="ccp-filtros-grid">
            <div className="ccp-filtro-group">
              <label>Área / Dirección</label>
              <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                <option value="">Todas las áreas</option>
                {areasUnicas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="ccp-filtro-group">
              <label>Tipo de solicitud</label>
              <select value={filtroTipoSolicitud} onChange={(e) => setFiltroTipoSolicitud(e.target.value)}>
                <option value="">Todos los tipos</option>
                {tiposUnicos.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="ccp-filtro-actions">
              <button className="ccp-filtro-aplicar" onClick={() => setMostrarFiltros(false)}>Aplicar</button>
              <button className="ccp-filtro-limpiar" onClick={limpiarFiltros}>Limpiar</button>
            </div>
          </div>
        </div>
      )}

      <div className="ccp-table-scroll">
        <table className="ccp-table">
          <thead>
            <tr>
              <th className="ccp-th-check">
                <input className="ccp-checkbox" type="checkbox" checked={todosSeleccionados} onChange={toggleSeleccionarTodosVisibles} title="Seleccionar todos" />
              </th>
              <th>#</th>
              <th>No. Oficio</th>
              <th>Fecha</th>
              <th>Área</th>
              <th>Funcionario</th>
              <th>Cargo</th>
              <th>Asunto</th>
              <th>Ref. Volante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="ccp-td-state">
                <div className="ccp-state-cell"><i className="bx bx-loader-alt bx-spin"></i><span>Cargando registros...</span></div>
              </td></tr>
            ) : registrosFiltrados.length === 0 ? (
              <tr><td colSpan="10" className="ccp-td-state">
                <div className="ccp-state-cell">
                  <i className="bx bx-folder-open"></i>
                  <p>No se encontraron registros</p>
                  {busqueda && <span>Prueba con otro término de búsqueda</span>}
                </div>
              </td></tr>
            ) : registrosFiltrados.map((r, idx) => (
              <tr key={r.id} className={seleccionados.includes(r.id) ? 'ccp-row-sel' : ''}>
                <td className="ccp-td-check">
                  <input className="ccp-checkbox" type="checkbox" checked={seleccionados.includes(r.id)} onChange={() => toggleSeleccionado(r.id)} />
                </td>
                <td className="ccp-td-idx">{(pagina - 1) * pageSize + idx + 1}</td>
                <td><span className="ccp-badge-oficio">{r.numero_oficio}</span></td>
                <td className="ccp-td-nowrap">{formatFecha(r.fecha)}</td>
                <td className="ccp-td-ellipsis ccp-td-area" title={r.area}>{r.area}</td>
                <td className="ccp-td-ellipsis" title={r.funcionario}>{r.funcionario}</td>
                <td className="ccp-td-ellipsis ccp-td-muted" title={r.cargo}>{r.cargo}</td>
                <td className="ccp-td-ellipsis ccp-td-asunto" title={buildAsunto(r)}>{buildAsunto(r)}</td>
                <td className="ccp-td-center">
                  <span className="ccp-badge ccp-badge-folio">
                    {formatReferenciaVolante(r.referencia_volante, r.folio_numero, r.volante_numero)}
                  </span>
                </td>
                <td>
                  <div className="ccp-actions-cell">
                    <button className="ccp-act-btn ccp-act-dl" title="Descargar Excel" onClick={() => onDescargarExcel(r.id, r.numero_oficio)}>
                      <i className="bx bxs-file-export"></i>
                    </button>
                    <button className="ccp-act-btn ccp-act-edit" title="Editar" onClick={() => onEditar(r.id)}>
                      <i className="bx bxs-edit"></i>
                    </button>
                    <button className="ccp-act-btn ccp-act-del" title="Eliminar" onClick={() => onEliminar(r.id)}>
                      <i className="bx bxs-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginacion.totalPaginas > 1 && (
        <div className="ccp-paginacion">
          <button disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
            <i className="bx bx-chevron-left"></i>
          </button>
          {paginasVisibles.map((item, idx) => (
            item === '...'
              ? <span key={`ellipsis-${idx}`} className="ccp-pag-ellipsis">...</span>
              : <button key={item} className={item === pagina ? 'ccp-pag-active' : ''} onClick={() => setPagina(item)}>{item}</button>
          ))}
          <button disabled={pagina === paginacion.totalPaginas} onClick={() => setPagina((p) => p + 1)}>
            <i className="bx bx-chevron-right"></i>
          </button>
          <span className="ccp-pag-total">{paginacion.total} registro{paginacion.total !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
