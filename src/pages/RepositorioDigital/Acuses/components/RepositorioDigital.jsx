import { useEffect, useMemo, useRef, useState } from 'react';
import {
  crearAnioRepositorioApi,
  descargarRepositorioAnualZipApi,
  descargarRepositorioSeleccionadosZipApi,
  eliminarArchivoRepositorioApi,
  eliminarArchivosRepositorioBulkApi,
  getRepositorioDaysApi,
  getRepositorioFilesApi,
  getRepositorioTreeApi,
  subirArchivoRepositorioApi,
  verArchivoRepositorioApi
} from '../../../../services/api';
import { useNotification } from '../../../../context/NotificationContext';
import { usePermissions } from '../../../../hooks/usePermissions';
import '../styles/RepositorioDigital.css';

const MAX_UPLOAD_FILES = 10;

const buildFileKey = (file) => `${file.name}-${file.size}-${file.lastModified || 0}`;

const getFileExtension = (fileName = '') => {
  const match = String(fileName || '').match(/(\.[^.]+)$/);
  return match ? match[1] : '';
};

const buildCustomFileName = (originalName, customName) => {
  const clean = String(customName || '').trim();
  if (!clean) return '';
  if (/\.[^.]+$/.test(clean)) return clean;
  return `${clean}${getFileExtension(originalName)}`;
};

const formatDayLabel = (day) => {
  if (!day) return '-';

  const key = String(day.fecha_key || '').trim();
  if (!key) return day.fecha_formateada || '-';

  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day.fecha_formateada || key;

  const weekday = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(date);
  const normalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${normalizedWeekday} ${day.fecha_formateada || key}`;
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const bytesToSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

export default function RepositorioDigital({ setPageTitle }) {
  const { userRole, isDependencia, isAdmin, isSuperAdmin } = usePermissions();
  const { error, success } = useNotification();

  const canUpload = useMemo(() => {
    return userRole === 'operador_ccp' || isAdmin() || isSuperAdmin();
  }, [userRole, isAdmin, isSuperAdmin]);

  const canCreateYear = canUpload;
  const canZipDownloads = useMemo(() => {
    return isDependencia() || userRole === 'analista';
  }, [isDependencia, userRole]);

  const [tree, setTree] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(0);

  const [files, setFiles] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [filesPagination, setFilesPagination] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [filesPage, setFilesPage] = useState(1);
  const [filesLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [viewMode, setViewMode] = useState('days');
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  const [showYearModal, setShowYearModal] = useState(false);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, idx) => currentYear - 5 + idx);
  const [yearToCreate, setYearToCreate] = useState(currentYear);

  const [showUploadMetaModal, setShowUploadMetaModal] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [foliosByFile, setFoliosByFile] = useState({});
  const [customNamesByFile, setCustomNamesByFile] = useState({});

  const uploadInputRef = useRef(null);

  const selectedYearNode = useMemo(
    () => tree.find((node) => node.id === Number(selectedYearId)) || null,
    [tree, selectedYearId]
  );

  const selectedDayNode = useMemo(
    () => days.find((day) => String(day.fecha_key) === String(selectedDay)) || null,
    [days, selectedDay]
  );

  const extractErrorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

  const refreshTree = async () => {
    const response = await getRepositorioTreeApi();
    const nodes = response.data.data || [];
    setTree(nodes);

    if (!nodes.length) {
      setSelectedYearId(0);
      return;
    }

    const selectedExists = nodes.some((node) => node.id === Number(selectedYearId));
    if (selectedExists) return;

    const currentYearNode = nodes.find((node) => Number(node.year_value) === currentYear);
    setSelectedYearId(currentYearNode?.id || nodes[0].id);
  };

  const refreshDays = async (folderId = selectedYearId, searchText = search) => {
    if (!folderId) {
      setDays([]);
      return;
    }

    const response = await getRepositorioDaysApi(folderId, searchText);
    setDays(response.data.data || []);
  };

  const refreshFiles = async (folderId = selectedYearId, searchText = search, page = filesPage, fecha = selectedDay) => {
    if (!folderId) {
      setFiles([]);
      setSelectedFileIds([]);
      setFilesPagination({ pagina: 1, totalPaginas: 1, total: 0 });
      return;
    }

    setLoading(true);
    try {
      const filesRes = await getRepositorioFilesApi(folderId, searchText, page, filesLimit, fecha);
      setFiles(filesRes.data.data || []);
      setSelectedFileIds([]);
      setFilesPagination({
        pagina: Number(filesRes.data.pagina || 1),
        totalPaginas: Number(filesRes.data.totalPaginas || 1),
        total: Number(filesRes.data.total || 0)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle?.({
      titulo: 'Acuses compartidos',
      icon: <i className="bx bx-archive nav-icon-highlight" />
    });

    return () => setPageTitle?.(null);
  }, [setPageTitle]);

  useEffect(() => {
    refreshTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;
    setSelectedDay('');
    setViewMode('days');
    refreshDays(selectedYearId, search);
    setFiles([]);
    setSelectedFileIds([]);
    setFilesPagination({ pagina: 1, totalPaginas: 1, total: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId]);

  useEffect(() => {
    if (!selectedYearId) return;
    const timeoutId = setTimeout(() => {
      const query = String(search || '').trim();

      const runSearch = async () => {
        await refreshDays(selectedYearId, query);

        if (viewMode === 'files' && selectedDay) {
          setFilesPage(1);
          await refreshFiles(selectedYearId, query, 1, selectedDay);
          return;
        }

        if (!query) {
          return;
        }

        const response = await getRepositorioFilesApi(selectedYearId, query, 1, 1, '');
        const firstMatch = response.data.data?.[0];
        if (!firstMatch?.fecha_key) {
          return;
        }

        const nextDay = String(firstMatch.fecha_key);
        setSelectedDay(nextDay);
        setViewMode('files');
        setFilesPage(1);
        await refreshFiles(selectedYearId, query, 1, nextDay);
      };

      runSearch();
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, viewMode, selectedDay, selectedYearId]);

  useEffect(() => {
    if (!selectedYearId) return;
    if (viewMode === 'files' && selectedDay) {
      refreshFiles(selectedYearId, search, filesPage, selectedDay);
    }
  }, [filesPage, selectedDay, selectedYearId, viewMode]);

  const onSelectAllFiles = (checked) => {
    if (!checked) {
      setSelectedFileIds([]);
      return;
    }
    setSelectedFileIds(files.map((file) => file.id));
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFileIds((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
  };

  const onSelectDay = (day) => {
    setSelectedDay(day.fecha_key);
    setViewMode('files');
    setFilesPage(1);
    refreshFiles(selectedYearId, search, 1, day.fecha_key);
  };

  const onBackToDays = () => {
    setSelectedDay('');
    setViewMode('days');
    setSearch('');
    setFiles([]);
    setSelectedFileIds([]);
    setFilesPagination({ pagina: 1, totalPaginas: 1, total: 0 });
    refreshDays(selectedYearId, '');
  };

  const setUploadFiles = (incomingFiles = []) => {
    if (!selectedYearNode || !canUpload) return;

    const list = Array.from(incomingFiles);
    const accepted = list.filter((file) => {
      const isPdfMime = file.type === 'application/pdf';
      const isPdfExt = file.name?.toLowerCase().endsWith('.pdf');
      const isExcelMime = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ].includes(file.type);
      const isExcelExt = file.name?.toLowerCase().endsWith('.xls') || file.name?.toLowerCase().endsWith('.xlsx');
      return isPdfMime || isPdfExt || isExcelMime || isExcelExt;
    });

    if (!accepted.length) {
      error('Solo se permiten archivos PDF o Excel (.xls, .xlsx)');
      return;
    }

    if (accepted.length < list.length) {
      error('Algunos archivos fueron ignorados. Solo se permiten PDF y Excel');
    }

    const limitedFiles = accepted.slice(0, MAX_UPLOAD_FILES);
    if (accepted.length > MAX_UPLOAD_FILES) {
      error(`Solo puedes subir hasta ${MAX_UPLOAD_FILES} archivos por lote`);
    }

    setPendingUploadFiles(limitedFiles);
    setFoliosByFile(
      limitedFiles.reduce((acc, file) => {
        acc[buildFileKey(file)] = '';
        return acc;
      }, {})
    );
    setCustomNamesByFile(
      limitedFiles.reduce((acc, file) => {
        acc[buildFileKey(file)] = '';
        return acc;
      }, {})
    );
    setShowUploadMetaModal(true);
  };

  const onUpload = (event) => {
    const incomingFiles = event.target.files || [];
    if (!incomingFiles.length || !selectedYearNode) return;

    setUploadFiles(incomingFiles);
    event.target.value = '';
  };

  const onDropUpload = (event) => {
    event.preventDefault();
    setDragActive(false);
    if (!selectedYearNode || !canUpload) return;

    const incomingFiles = event.dataTransfer?.files || [];
    if (incomingFiles.length > 0) setUploadFiles(incomingFiles);
  };

  const onConfirmUpload = async () => {
    if (!pendingUploadFiles.length || !selectedYearNode || !canUpload) return;

    setUploading(true);
    try {
      for (const file of pendingUploadFiles) {
        const key = buildFileKey(file);
        const folio = String(foliosByFile[key] || '').trim().toUpperCase();
        const customName = buildCustomFileName(file.name, customNamesByFile[key]);

        await subirArchivoRepositorioApi(selectedYearNode.id, file, {
          folio,
          original_name: customName
        });
      }
      if (selectedDay) {
        await refreshFiles(selectedYearNode.id, search, filesPage, selectedDay);
      } else {
        await refreshDays(selectedYearNode.id, search);
      }
      await refreshTree();
      success(`Se subieron ${pendingUploadFiles.length} archivo(s) correctamente`);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudieron subir los archivos'));
    } finally {
      setUploading(false);
      setPendingUploadFiles([]);
      setShowUploadMetaModal(false);
      setFoliosByFile({});
      setCustomNamesByFile({});
    }
  };

  const onCreateYear = async () => {
    if (!canCreateYear) return;
    try {
      await crearAnioRepositorioApi(Number(yearToCreate));
      await refreshTree();
      success(`Año ${yearToCreate} listo en repositorio`);
      setShowYearModal(false);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo crear el año'));
    }
  };

  const onViewFile = async (fileId) => {
    try {
      const response = await verArchivoRepositorioApi(fileId);
      const mime = response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 15000);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo abrir el archivo'));
    }
  };

  const onDownloadSingle = async (file) => {
    try {
      const response = await verArchivoRepositorioApi(file.id);
      const mime = response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const fileName = file.original_name || `archivo-${file.id}`;
      downloadBlob(blob, fileName);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo descargar el archivo'));
    }
  };

  const onDownloadAllZip = async () => {
    if (!selectedYearNode?.id || !canZipDownloads) return;

    setDownloadingAll(true);
    try {
      const response = await descargarRepositorioAnualZipApi(selectedYearNode.id);
      const blob = new Blob([response.data], { type: 'application/zip' });
      downloadBlob(blob, `${selectedYearNode.nombre || 'acuses-anuales'}.zip`);
      success('Descarga del lote completo iniciada');
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo descargar el ZIP completo'));
    } finally {
      setDownloadingAll(false);
    }
  };

  const onDownloadSelectedZip = async () => {
    if (!selectedYearNode?.id || !canZipDownloads || selectedFileIds.length === 0) return;

    setDownloadingSelected(true);
    try {
      const response = await descargarRepositorioSeleccionadosZipApi(selectedYearNode.id, selectedFileIds);
      const blob = new Blob([response.data], { type: 'application/zip' });
      downloadBlob(blob, `${selectedYearNode.nombre || 'acuses'}-seleccionados.zip`);
      success(`Descarga de ${selectedFileIds.length} archivo(s) seleccionados iniciada`);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo descargar el ZIP de archivos seleccionados'));
    } finally {
      setDownloadingSelected(false);
    }
  };

  const onDeleteSingle = async (file) => {
    if (!canUpload) return;
    const confirmed = window.confirm(`¿Eliminar el archivo "${file.original_name}"?`);
    if (!confirmed) return;

    try {
      await eliminarArchivoRepositorioApi(file.id);
      if (selectedDay) {
        await refreshFiles(selectedYearNode.id, search, filesPage, selectedDay);
      } else {
        await refreshDays(selectedYearNode.id, search);
      }
      await refreshTree();
      success('Archivo eliminado correctamente');
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudo eliminar el archivo'));
    }
  };

  const onDeleteSelected = async () => {
    if (!canUpload || selectedFileIds.length === 0) return;

    const confirmed = window.confirm(`¿Eliminar ${selectedFileIds.length} archivo(s) seleccionado(s)?`);
    if (!confirmed) return;

    setDeletingSelected(true);
    try {
      await eliminarArchivosRepositorioBulkApi(selectedFileIds);
      if (selectedDay) {
        await refreshFiles(selectedYearNode.id, search, filesPage, selectedDay);
      } else {
        await refreshDays(selectedYearNode.id, search);
      }
      await refreshTree();
      success(`${selectedFileIds.length} archivo(s) eliminado(s)`);
    } catch (err) {
      error(extractErrorMessage(err, 'No se pudieron eliminar los archivos seleccionados'));
    } finally {
      setDeletingSelected(false);
    }
  };

  const allChecked = files.length > 0 && selectedFileIds.length === files.length;

  return (
    <div className="rdv-shell">
      <section className="rdv-card">
        <header className="rdv-head">
          <h2>Acuses compartidos</h2>
          <p>Carpeta anual compartida con carga por lote y descargas en ZIP.</p>
        </header>

        <div className="rdv-year-row">
          <select
            className="rdv-year-select"
            value={selectedYearId || ''}
            onChange={(e) => {
              setFilesPage(1);
              setSelectedYearId(Number(e.target.value));
            }}
            disabled={!tree.length}
          >
            {tree.map((node) => (
              <option key={node.id} value={node.id}>{node.nombre}</option>
            ))}
          </select>

          {canCreateYear && (
            <button type="button" className="rdv-btn rdv-btn-primary" onClick={() => setShowYearModal(true)}>
              <i className="bx bx-calendar-plus" /> Crear año
            </button>
          )}
        </div>

        <div className="rdv-toolbar">
          <div className="rdv-search-wrap">
            <i className="bx bx-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por folio, nombre o fecha (dd/mm/yyyy)"
            />
          </div>

          <div className="rdv-actions">
            {canUpload && (
              <button
                type="button"
                className="rdv-btn rdv-btn-danger"
                onClick={onDeleteSelected}
                disabled={selectedFileIds.length === 0 || deletingSelected}
              >
                {deletingSelected ? 'Eliminando...' : `Eliminar seleccionados (${selectedFileIds.length})`}
              </button>
            )}
            {canZipDownloads && (
              <button type="button" className="rdv-btn rdv-btn-soft" onClick={onDownloadAllZip} disabled={!selectedYearNode || downloadingAll}>
                {downloadingAll ? 'Generando ZIP...' : 'Descargar todos (.zip)'}
              </button>
            )}
            {canZipDownloads && (
              <button
                type="button"
                className="rdv-btn rdv-btn-soft"
                onClick={onDownloadSelectedZip}
                disabled={selectedFileIds.length === 0 || downloadingSelected}
              >
                {downloadingSelected ? 'Generando ZIP...' : `Descargar seleccionados (${selectedFileIds.length})`}
              </button>
            )}
          </div>
        </div>

        {canUpload && selectedYearNode && (
          <div
            className={`rdv-upload ${dragActive ? 'is-active' : ''} ${uploading ? 'is-disabled' : ''}`}
            onClick={() => {
              if (!uploading) uploadInputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!uploading) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDropUpload}
          >
            <i className="bx bx-cloud-upload" />
            <span>Arrastra o da clic para subir (PDF/Excel, max 10 por lote)</span>
          </div>
        )}

        {canUpload && selectedYearNode && (
          <input
            ref={uploadInputRef}
            className="rdv-hidden-input"
            type="file"
            accept="application/pdf,.pdf,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
            multiple
            disabled={uploading}
            onChange={onUpload}
          />
        )}

          <section className="rdv-explorer">
            <div className="rdv-explorer-head">
              <div>
                <h3>{viewMode === 'files' && selectedDayNode ? `Archivos del día ${formatDayLabel(selectedDayNode)}` : 'Explorador por día'}</h3>
                <p>
                  {viewMode === 'files'
                    ? 'Haz clic en volver para regresar al listado diario.'
                    : 'Haz clic en un día para abrir todos los archivos cargados en esa fecha.'}
                </p>
              </div>

              {viewMode === 'files' && selectedDayNode && (
                <button type="button" className="rdv-btn rdv-btn-soft" onClick={onBackToDays}>
                  <i className="bx bx-arrow-back" /> Volver a días
                </button>
              )}
            </div>

            {viewMode === 'days' ? (
              <div className="rdv-explorer-panel">
                <div className="rdv-explorer-list">
                  {days.map((day) => (
                    <button
                      key={day.fecha_key}
                      type="button"
                      className="rdv-explorer-item"
                      onClick={() => onSelectDay(day)}
                    >
                      <span className="rdv-explorer-icon">
                        <i className="bx bx-folder-open" />
                      </span>
                      <span className="rdv-explorer-main">
                        <span className="rdv-explorer-title">Día: {formatDayLabel(day)}</span>
                        <span className="rdv-explorer-subtitle">Archivos cargados ese día</span>
                      </span>
                      <span className="rdv-explorer-meta">
                        <span className="rdv-day-badge">{day.total}</span>
                        <span className="rdv-day-meta-label">archivos</span>
                      </span>
                      <span className="rdv-explorer-arrow">
                        <i className="bx bx-chevron-right" />
                      </span>
                    </button>
                  ))}

                  {days.length === 0 && !loading && (
                    <div className="rdv-empty rdv-explorer-empty">
                      No hay archivos cargados en este año.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="rdv-table-wrap">
                  <table className="rdv-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(event) => onSelectAllFiles(event.target.checked)}
                            disabled={files.length === 0}
                          />
                        </th>
                        <th>Nombre</th>
                        <th>Folio</th>
                        <th>Tamaño</th>
                        <th>Fecha de carga</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={() => toggleFileSelection(file.id)}
                            />
                          </td>
                          <td>{file.original_name}</td>
                          <td>{file.folio || '-'}</td>
                          <td>{bytesToSize(file.size_bytes)}</td>
                          <td>{formatDate(file.created_at)}</td>
                          <td className="rdv-actions-cell">
                            <button type="button" className="rdv-btn rdv-btn-soft" onClick={() => onViewFile(file.id)}>
                              Ver
                            </button>
                            <button type="button" className="rdv-btn rdv-btn-soft" onClick={() => onDownloadSingle(file)}>
                              Descargar
                            </button>
                            {canUpload && (
                              <button type="button" className="rdv-btn rdv-btn-danger" onClick={() => onDeleteSingle(file)}>
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {files.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="rdv-empty">Sin archivos en el día seleccionado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filesPagination.totalPaginas > 1 && (
                  <div className="rdv-pagination">
                    <button
                      type="button"
                      className="rdv-btn rdv-btn-soft"
                      disabled={filesPagination.pagina <= 1}
                      onClick={() => setFilesPage((prev) => Math.max(1, prev - 1))}
                    >
                      <i className="bx bx-chevron-left" />
                    </button>
                    <span>
                      Página {filesPagination.pagina} de {filesPagination.totalPaginas} ({filesPagination.total} archivo(s))
                    </span>
                    <button
                      type="button"
                      className="rdv-btn rdv-btn-soft"
                      disabled={filesPagination.pagina >= filesPagination.totalPaginas}
                      onClick={() => setFilesPage((prev) => Math.min(filesPagination.totalPaginas, prev + 1))}
                    >
                      <i className="bx bx-chevron-right" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
      </section>

      {showYearModal && (
        <div className="rdv-modal-backdrop" role="presentation">
          <div className="rdv-modal" role="dialog" aria-modal="true" aria-labelledby="rdv-create-year-title">
            <h3 id="rdv-create-year-title">Crear nuevo año</h3>
            <p>Selecciona el año que quieres habilitar en el repositorio.</p>

            <label htmlFor="rdv-year-select">Año</label>
            <select id="rdv-year-select" value={yearToCreate} onChange={(e) => setYearToCreate(Number(e.target.value))}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <div className="rdv-modal-actions">
              <button type="button" className="rdv-btn rdv-btn-soft" onClick={() => setShowYearModal(false)}>Cancelar</button>
              <button type="button" className="rdv-btn rdv-btn-primary" onClick={onCreateYear}>Crear año</button>
            </div>
          </div>
        </div>
      )}

      {showUploadMetaModal && (
        <div className="rdv-modal-backdrop" role="presentation">
          <div className="rdv-modal rdv-modal-upload" role="dialog" aria-modal="true" aria-labelledby="rdv-upload-title">
            <h3 id="rdv-upload-title">Subir archivos</h3>
            <p>{`Se seleccionaron ${pendingUploadFiles.length} archivo(s).`}</p>

            <div className="rdv-manual-expedientes">
              {pendingUploadFiles.map((file) => {
                const key = buildFileKey(file);
                return (
                  <div className="rdv-manual-row" key={key}>
                    <span className="rdv-manual-filename" title={file.name}>{file.name}</span>
                    <input
                      type="text"
                      value={customNamesByFile[key] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomNamesByFile((prev) => ({ ...prev, [key]: value }));
                      }}
                      placeholder="Nombre del archivo (opcional)"
                    />
                    <input
                      type="text"
                      value={foliosByFile[key] || ''}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setFoliosByFile((prev) => ({ ...prev, [key]: value }));
                      }}
                      placeholder="Folio (opcional)"
                    />
                  </div>
                );
              })}
            </div>

            <div className="rdv-modal-actions">
              <button
                type="button"
                className="rdv-btn rdv-btn-soft"
                onClick={() => {
                  setShowUploadMetaModal(false);
                  setPendingUploadFiles([]);
                  setFoliosByFile({});
                  setCustomNamesByFile({});
                }}
              >
                Cancelar
              </button>
              <button type="button" className="rdv-btn rdv-btn-primary" onClick={onConfirmUpload} disabled={uploading || pendingUploadFiles.length === 0}>
                {uploading ? 'Subiendo...' : `Subir ${pendingUploadFiles.length} archivo(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
