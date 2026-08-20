import { useRef } from 'react';
import '../styles/Finalizados.css';

const FASE1_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revision' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'firmado', label: 'Firmado' }
];

const FASE1_META = {
  pendiente: { icon: 'bx-time', cls: 'fz-status-pendiente' },
  en_revision: { icon: 'bx-time-five', cls: 'fz-status-revision' },
  rechazado: { icon: 'bx-x-circle', cls: 'fz-status-rechazado' },
  firmado: { icon: 'bx-check-circle', cls: 'fz-status-firmado' }
};

function formatDate(dateValue) {
  if (!dateValue) return '---';
  const d = new Date(String(dateValue).includes('T') ? dateValue : `${dateValue}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString('es-MX');
}

function Paginacion({ pagina, totalPaginas, onCambiar }) {
  return (
    <div className="fz-pagination">
      <button type="button" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>Anterior</button>
      <span>Pagina {pagina} de {totalPaginas}</span>
      <button type="button" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>Siguiente</button>
    </div>
  );
}

const REGIONES_OFICIALES = [
  { id: 1, nombre: 'Huejotzingo' },
  { id: 2, nombre: 'Izúcar' },
  { id: 3, nombre: 'Cuapiaxtla de Madero' },
  { id: 4, nombre: 'Libres' },
  { id: 5, nombre: 'Puebla' },
  { id: 6, nombre: 'Tehuacán' },
  { id: 7, nombre: 'Teziutlán' },
  { id: 8, nombre: 'Zacatlán' },
  { id: 9, nombre: 'Palmar de Bravo' }
];

export default function TablaFinalizados({
  registros,
  loading,
  canManageAll,
  regionId,
  onRegionChange,
  selectedIds,
  onSelectIds,
  onDescargarZip,
  downloadingZip,
  readOnly,
  busquedaInput,
  onBusquedaChange,
  paginacion,
  onPaginaChange,
  updatingId,
  uploadingConstanciaId,
  uploadingAcusePersonaId,
  deletingConstanciaId,
  deletingAcusePersonaId,
  onActualizarFase1,
  onSubirConstancia,
  onSubirAcusePersona,
  onEliminarConstancia,
  onEliminarAcusePersona,
  onVerConstancia,
  onVerAcusePersona,
  viewingConstanciaId,
  viewingAcusePersonaId
}) {
  const fileInputConstanciaRef = useRef({});
  const fileInputAcuseRef = useRef({});

  return (
    <section className="fz-wrapper">
      <div className="fz-header">
        <div>
          <h3>Gestión de Expedientes Concluidos</h3>
          <p>Control de emisión, carga de constancia y carga de acuse de persona por expediente.</p>
        </div>

        <div className="fz-controls-wrapper">
          
          {canManageAll && (
            <>
              {/* Select de Región */}
              <div className="fz-search-modern fz-region-select-wrap">
                <i className="bx bx-map" style={{ color: '#6e1530' }}></i>
                <select 
                  className="fz-region-select"
                  value={regionId} 
                  onChange={(e) => onRegionChange(e.target.value)}
                >
                  <option value="">Todas las regiones</option>
                  {REGIONES_OFICIALES.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Botón de ZIP */}
              <button 
                type="button"
                className="fz-btn-zip" 
                onClick={onDescargarZip} 
                disabled={selectedIds.length === 0 || downloadingZip}
                title={selectedIds.length === 0 ? "Selecciona registros en la tabla para descargar" : "Descargar archivos"}
              >
                {downloadingZip ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bxs-file-archive" />}
                {downloadingZip ? 'Empaquetando...' : `Descargar ZIP (${selectedIds.length})`}
              </button>
            </>
          )}

          {/* Buscador */}
          <div className="fz-search-modern">
            <i className="bx bx-search"></i>
            <input
              type="text"
              value={busquedaInput}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar por nombre, oficio o CUIP..."
            />
          </div>
        </div>
      </div>

      <div className="fz-table-wrap">
        {loading ? (
          <div className="fz-state"><i className="bx bx-loader-alt bx-spin" /> Cargando finalizados...</div>
        ) : registros.length === 0 ? (
          <div className="fz-state"><i className="bx bx-folder-open" /> Sin registros finalizados.</div>
        ) : (
          <table className="fz-table">
            <thead>
              <tr>
                {canManageAll && (
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={registros.length > 0 && selectedIds.length === registros.length}
                      onChange={(e) => onSelectIds(e.target.checked ? registros.map(r => r.id) : [])}
                    />
                  </th>
                )}
                <th>Nombre del elemento</th>
                <th>Puesto</th>
                <th>No. de oficio</th>
                <th>Fecha de termino</th>
                <th>CUIP</th>
                <th>Selecciona</th>
                <th>Cargar constancia</th>
                <th>Ver constancia</th>
                <th>Cargar acuse persona</th>
                <th>Ver acuse persona</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => {
                const faseFirmado = registro.fase1_estado === 'firmado';
                const isUpdating = updatingId === registro.id;
                const isUploadingConstancia = uploadingConstanciaId === registro.id;
                const isUploadingAcusePersona = uploadingAcusePersonaId === registro.id;
                const isViewingConstancia = viewingConstanciaId === registro.id;
                const isViewingAcusePersona = viewingAcusePersonaId === registro.id;
                const isDeletingConstancia = deletingConstanciaId === registro.id;
                const isDeletingAcusePersona = deletingAcusePersonaId === registro.id;
                const constanciaSubida = Boolean(registro.constancia_subida ?? registro.acuse_subido);
                const acusePersonaSubido = Boolean(registro.acuse_persona_subido);
                const fase1Bloqueada = constanciaSubida || acusePersonaSubido || readOnly;
                const puedeVerConstancia = constanciaSubida;
                const puedeVerAcusePersona = acusePersonaSubido;
                const meta = FASE1_META[registro.fase1_estado] || FASE1_META.pendiente;

                return (
                  <tr key={registro.id}>
                    {canManageAll && (
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(registro.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onSelectIds([...selectedIds, registro.id]);
                            } else {
                              onSelectIds(selectedIds.filter(id => id !== registro.id));
                            }
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <strong>{registro.nombre_elemento}</strong>
                    </td>
                    <td className="fz-puesto-cell">{registro.puesto_elemento || 'Sin puesto'}</td>
                    <td>{registro.numero_oficio || '---'}</td>
                    <td>{formatDate(registro.fecha_termino)}</td>
                    <td>{registro.cuip || '---'}</td>
                    <td>
                      <div className={`fz-select-wrap ${meta.cls} ${fase1Bloqueada ? 'is-locked' : ''}`}>
                        <i className={`bx ${meta.icon}`} />
                        <select
                          className="fz-select"
                          value={registro.fase1_estado}
                          disabled={isUpdating || fase1Bloqueada}
                          title={readOnly
                            ? 'Modo solo lectura para dirección'
                            : ((constanciaSubida || acusePersonaSubido)
                              ? 'Elimina los documentos cargados para modificar Fase 1'
                              : 'Seleccionar estado de Fase 1')}
                          onChange={(e) => onActualizarFase1(registro.id, e.target.value)}
                        >
                          {FASE1_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {fase1Bloqueada && <i className="bx bx-lock-alt fz-select-lock" title="Bloqueado por constancia" />}
                      </div>
                    </td>
                    <td>
                      {readOnly ? (
                        <div className="fz-acuse-ok">
                          <span>{constanciaSubida ? 'CONSTANCIA CARGADA' : 'SIN CONSTANCIA'}</span>
                        </div>
                      ) : constanciaSubida ? (
                        <div className="fz-acuse-ok">
                          <span>CONSTANCIA CARGADA</span>
                          <button
                            type="button"
                            className="fz-trash"
                            title="Eliminar constancia"
                            disabled={isDeletingConstancia}
                            onClick={() => onEliminarConstancia(registro.id)}
                          >
                            {isDeletingConstancia ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-trash" />}
                            <span>Eliminar</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            ref={(el) => { fileInputConstanciaRef.current[registro.id] = el; }}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="fz-hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onSubirConstancia(registro.id, file);
                              e.target.value = '';
                            }}
                          />
                          <button
                            type="button"
                            className="fz-btn-upload"
                            disabled={!faseFirmado || isUploadingConstancia}
                            onClick={() => fileInputConstanciaRef.current[registro.id]?.click()}
                            title={faseFirmado ? 'Subir constancia firmada' : 'Debes firmar Fase 1 primero'}
                          >
                            {isUploadingConstancia ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-upload" />} Cargar constancia
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fz-btn-folder"
                        disabled={!puedeVerConstancia || isViewingConstancia}
                        onClick={() => onVerConstancia(registro)}
                        title={puedeVerConstancia ? 'Abrir constancia adjunta' : 'Disponible cuando la constancia este cargada'}
                      >
                        {isViewingConstancia ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-file-find" />} Ver constancia
                      </button>
                    </td>
                    <td>
                      {readOnly ? (
                        <div className="fz-acuse-ok">
                          <span>{acusePersonaSubido ? 'ACUSE CARGADO' : 'SIN ACUSE'}</span>
                        </div>
                      ) : acusePersonaSubido ? (
                        <div className="fz-acuse-ok">
                          <span>ACUSE CARGADO</span>
                          <button
                            type="button"
                            className="fz-trash"
                            title="Eliminar acuse de persona"
                            disabled={isDeletingAcusePersona}
                            onClick={() => onEliminarAcusePersona(registro.id)}
                          >
                            {isDeletingAcusePersona ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-trash" />}
                            <span>Eliminar</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            ref={(el) => { fileInputAcuseRef.current[registro.id] = el; }}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="fz-hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onSubirAcusePersona(registro.id, file);
                              e.target.value = '';
                            }}
                          />
                          <button
                            type="button"
                            className="fz-btn-upload fz-btn-upload-acuse"
                            disabled={!faseFirmado || isUploadingAcusePersona}
                            onClick={() => fileInputAcuseRef.current[registro.id]?.click()}
                            title={faseFirmado ? 'Subir acuse de persona' : 'Debes firmar Fase 1 primero'}
                          >
                            {isUploadingAcusePersona ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-upload" />} Cargar acuse
                          </button>
                        </>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fz-btn-folder"
                        disabled={!puedeVerAcusePersona || isViewingAcusePersona}
                        onClick={() => onVerAcusePersona(registro)}
                        title={puedeVerAcusePersona ? 'Abrir acuse de persona adjunto' : 'Disponible cuando el acuse de persona este cargado'}
                      >
                        {isViewingAcusePersona ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-file-find" />} Ver acuse
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {paginacion.totalPaginas > 1 && (
        <Paginacion pagina={paginacion.pagina} totalPaginas={paginacion.totalPaginas} onCambiar={onPaginaChange} />
      )}
    </section>
  );
}