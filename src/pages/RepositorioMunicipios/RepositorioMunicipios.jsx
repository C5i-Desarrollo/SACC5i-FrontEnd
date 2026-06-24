import { useEffect, useMemo, useState } from "react";
import {
  getRepositorioMunicipiosApi,
  getRepositorioMunicipioDetalleApi,
  subirDocumentosRepositorioMunicipioApi,
  verDocumentoRepositorioMunicipioApi,
  descargarDocumentoRepositorioMunicipioApi,
  eliminarDocumentoRepositorioMunicipioApi,
} from "../../services/api";
import "./RepositorioMunicipios.css";
import { FiArchive } from "react-icons/fi";

const RepositorioMunicipios = ({ setPageTitle }) => {
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const municipiosPorPagina = 7;
  const [modalEliminar, setModalEliminar] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Personal Activo",
        subtitulo: "Respaldos diarios del personal activo por municipio",
        icon: <FiArchive className="nav-icon-highlight" />
      });
    }
  }, [setPageTitle]);

  const corregirTexto = (texto = "") => {
  try {
    return decodeURIComponent(escape(texto));
  } catch {
    return texto;
  }
};

  useEffect(() => {
    cargarMunicipios();
  }, []);

  const cargarMunicipios = async () => {
    try {
      const response = await getRepositorioMunicipiosApi();
      setMunicipios(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar municipios:", error);
    }
  };

  const mostrarToast = (tipo, titulo, mensaje) => {
    setToast({ tipo, titulo, mensaje });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const refrescarDetalleYTabla = async () => {
    if (!municipioSeleccionado) return;

    const detalleResponse = await getRepositorioMunicipioDetalleApi(
      municipioSeleccionado.municipio_id,
    );

    setDetalle(detalleResponse.data.data);

    await cargarMunicipios();
  };

  const verDetalleMunicipio = async (municipio) => {
    try {
      const response = await getRepositorioMunicipioDetalleApi(
        municipio.municipio_id,
      );

      setDetalle(response.data.data);
      setMunicipioSeleccionado(municipio);
    } catch (error) {
      console.error("ERROR DETALLE", error);
    }
  };

  const manejarArchivos = (files) => {
    const permitidos = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const seleccionados = Array.from(files || []);

    if (seleccionados.length > 5) {
      mostrarToast(
        "error",
        "Límite excedido",
        "Solo puedes seleccionar máximo 5 archivos a la vez.",
      );
      return;
    }

    const validos = seleccionados.filter((file) =>
      permitidos.includes(file.type),
    );

    setArchivosSeleccionados(validos);
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    manejarArchivos(e.dataTransfer.files);
  };

  const subirArchivos = async () => {
    if (!municipioSeleccionado || archivosSeleccionados.length === 0) {
      mostrarToast(
        "error",
        "Archivo requerido",
        "Selecciona al menos un archivo.",
      );
      return;
    }

    try {
      setSubiendo(true);

      await subirDocumentosRepositorioMunicipioApi(
        municipioSeleccionado.municipio_id,
        archivosSeleccionados,
      );

      await refrescarDetalleYTabla();

      setArchivosSeleccionados([]);
      setModalAbierto(false);

      mostrarToast("success", "Éxito", "Archivos cargados correctamente.");
    } catch (error) {
      console.error("Error al subir archivos:", error);
      mostrarToast("error", "Error", "No se pudieron subir los archivos.");
    } finally {
      setSubiendo(false);
    }
  };

  const abrirBlob = (blob) => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const verDocumento = async (doc) => {
    try {
      const response = await verDocumentoRepositorioMunicipioApi(doc.id);
      abrirBlob(response.data);
    } catch (error) {
      console.error("Error al ver documento:", error);
      alert("No se pudo abrir el documento");
    }
  };

  const descargarDocumento = async (doc) => {
    try {
      const response = await descargarDocumentoRepositorioMunicipioApi(doc.id);

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = corregirTexto(doc.nombre_original);
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar documento:", error);
      alert("No se pudo descargar el documento");
    }
  };

  const eliminarDocumento = async () => {
    if (!documentoAEliminar) return;

    try {
      await eliminarDocumentoRepositorioMunicipioApi(documentoAEliminar.id);

      const response = await getRepositorioMunicipioDetalleApi(
        municipioSeleccionado.municipio_id,
      );

      setDetalle(response.data.data);
      await cargarMunicipios();

      setModalEliminar(false);
      setDocumentoAEliminar(null);
      mostrarToast(
        "success",
        "Eliminado",
        "Documento eliminado correctamente.",
      );
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      mostrarToast("error", "Error", "No se pudo eliminar el documento.");
    }
  };

  const municipiosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return municipios;

    return municipios.filter((m) =>
      String(m.municipio_nombre || "")
        .toLowerCase()
        .includes(texto),
    );
  }, [municipios, busqueda]);

  const totalPaginas = Math.ceil(
    municipiosFiltrados.length / municipiosPorPagina,
  );
  const municipiosPaginados = municipiosFiltrados.slice(
    (paginaActual - 1) * municipiosPorPagina,
    paginaActual * municipiosPorPagina,
  );

  const documentosPorFecha = useMemo(() => {
    if (!detalle?.documentos) return [];

    const grupos = {};

    detalle.documentos.forEach((doc) => {
      const fechaKey = doc.fecha_carga || doc.created_at?.split("T")[0];

      if (!grupos[fechaKey]) {
        grupos[fechaKey] = {
          fecha: fechaKey,
          pdf: [],
          excel: [],
        };
      }

      grupos[fechaKey][doc.tipo_archivo]?.push(doc);
    });

    return Object.values(grupos).sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );
  }, [detalle]);

  if (municipioSeleccionado && detalle) {
    return (
      <div className="repo-page">
        <div className="repo-detail-top">
          <button
            className="repo-back-btn"
            onClick={() => {
              setMunicipioSeleccionado(null);
              setDetalle(null);
            }}
          >
            ← Volver a municipios
          </button>

          <button
            type="button"
            className="repo-upload-btn"
            onClick={() => setModalAbierto(true)}
          >
            <i className="bx bx-upload"></i>
            Cargar archivos
          </button>
        </div>

        <p className="repo-kicker">RESPALDOS DE</p>
        <h1>{corregirTexto(detalle.municipio.municipio_nombre)}</h1>

        <div className="repo-stats">
          <div className="repo-stat-card repo-stat-total">
            <i className="bx bx-user-check"></i>

            <div>
              <strong>{detalle.municipio.total_documentos}</strong>
              <span>Documentos totales</span>
            </div>
          </div>

          <div className="repo-stat-card repo-stat-pdf">
            <i className="bx bxs-file-pdf"></i>

            <div>
              <strong>{detalle.municipio.total_pdf}</strong>
              <span>Documentos PDF</span>
            </div>
          </div>

          <div className="repo-stat-card repo-stat-excel">
            <i className="bx bxs-spreadsheet"></i>

            <div>
              <strong>{detalle.municipio.total_excel}</strong>
              <span>Hojas de Excel</span>
            </div>
          </div>
        </div>

        <section className="repo-days">
          {documentosPorFecha.length === 0 ? (
            <div className="repo-table-card repo-empty">
              Este municipio aún no tiene documentos cargados.
            </div>
          ) : (
            documentosPorFecha.map((grupo) => (
              <div className="repo-day-card" key={grupo.fecha}>
                <div className="repo-day-header">
                  <h2>
                    <i className="bx bx-calendar"></i>
                    {new Date(grupo.fecha).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>

                  <span>
                    {grupo.pdf.length + grupo.excel.length} archivo(s)
                  </span>
                </div>

                <div className="repo-file-columns">
                  <div className="repo-file-column repo-tipo-card">
                    <div className="repo-tipo-header">
                      <div className="repo-tipo-title">
                        <i className="bx bxs-file-pdf"></i>
                        <span>Documentos PDF</span>
                      </div>

                      <div className="repo-tipo-count repo-pdf">
                        {grupo.pdf.length}
                      </div>
                    </div>

                    {grupo.pdf.length === 0 ? (
                      <p className="repo-no-files">Sin archivos de este tipo</p>
                    ) : (
                      <div className="repo-files-scroll">
                        {grupo.pdf.map((doc) => (
                          <div className="repo-file-item" key={doc.id}>
                            <div className="repo-file-info">
                              <i className="bx bxs-file-pdf"></i>
                              <span>{corregirTexto(doc.nombre_original)}</span>
                            </div>

                            <div className="repo-file-actions">
                              <button
                                type="button"
                                onClick={() => verDocumento(doc)}
                              >
                                <i className="bx bx-show"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => descargarDocumento(doc)}
                              >
                                <i className="bx bx-download"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDocumentoAEliminar(doc);
                                  setModalEliminar(true);
                                }}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="repo-file-column repo-tipo-card">
                    <div className="repo-tipo-header">
                      <div className="repo-tipo-title">
                        <i className="bx bxs-spreadsheet"></i>
                        <span>Hojas de Excel</span>
                      </div>

                      <div className="repo-tipo-count repo-excel">
                        {grupo.excel.length}
                      </div>
                    </div>

                    {grupo.excel.length === 0 ? (
                      <p className="repo-no-files">Sin archivos de este tipo</p>
                    ) : (
                      <div className="repo-files-scroll">
                        {grupo.excel.map((doc) => (
                          <div className="repo-file-item" key={doc.id}>
                            <div className="repo-file-info">
                              <i className="bx bxs-spreadsheet"></i>
                              <span>{corregirTexto(doc.nombre_original)}</span>
                            </div>

                            <div className="repo-file-actions">
                              <button
                                type="button"
                                onClick={() => descargarDocumento(doc)}
                              >
                                <i className="bx bx-download"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDocumentoAEliminar(doc);
                                  setModalEliminar(true);
                                }}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {modalAbierto && (
          <div className="repo-modal-overlay">
            <div className="repo-modal">
              <div className="repo-modal-header">
                <div>
                  <h2>Cargar archivos</h2>
                  <p>Municipio: {detalle.municipio.municipio_nombre}</p>
                </div>

                <button
                  type="button"
                  className="repo-modal-close"
                  onClick={() => setModalAbierto(false)}
                >
                  ×
                </button>
              </div>

              <label
                className="repo-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={manejarDrop}
              >
                <div className="repo-file-icons">
                  <span className="repo-pdf">PDF</span>
                  <span className="repo-excel">Excel</span>
                </div>

                <strong>
                  Arrastra los archivos o haz clic para seleccionar
                </strong>
                <p>PDF y Excel (.xlsx) - puedes subir varios</p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.xls,.xlsx"
                  onChange={(e) => manejarArchivos(e.target.files)}
                />
              </label>

              {archivosSeleccionados.length > 0 && (
                <div className="repo-selected-files">
                  {archivosSeleccionados.map((archivo, index) => (
                    <p key={index}>{corregirTexto(archivo.name)}</p>
                  ))}
                </div>
              )}

              <div className="repo-modal-actions">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  disabled={subiendo}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="repo-submit-btn"
                  onClick={subirArchivos}
                  disabled={subiendo}
                >
                  {subiendo ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalEliminar && (
          <div className="repo-delete-overlay">
            <div className="repo-delete-modal">
              <div className="repo-delete-icon">
                <i className="bx bx-trash"></i>
              </div>

              <h2>Eliminar documento</h2>

              <p>
                ¿Seguro que deseas eliminar{" "}
                <strong> {corregirTexto(documentoAEliminar?.nombre_original)} </strong>
              </p>

              <div className="repo-delete-actions">
                <button
                  type="button"
                  onClick={() => {
                    setModalEliminar(false);
                    setDocumentoAEliminar(null);
                  }}
                >
                  Cancelar
                </button>

                <button type="button" onClick={eliminarDocumento}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`repo-toast repo-toast-${toast.tipo}`}>
            <div className="repo-toast-icon">
              <i
                className={toast.tipo === "success" ? "bx bx-check" : "bx bx-x"}
              ></i>
            </div>

            <div>
              <strong>{toast.titulo}</strong>
              <p>{toast.mensaje}</p>
            </div>

            <button type="button" onClick={() => setToast(null)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="repo-page">
      
      {/* NUEVO BANNER ESTILO VINO */}
      <div className="repo-header-banner">
        <div className="banner-content-left">
          <span className="banner-subtitle">REPOSITORIO DE RESPALDOS</span>
          <h1 className="banner-title">Listado de Personal Activo</h1>
          <p className="banner-description">
            <i className="bx bx-info-circle" style={{ marginRight: "6px", color: "#c4a173", fontSize: "18px" }}></i>
            Selecciona un municipio para ver y cargar los respaldos diarios del personal activo.
          </p>
        </div>

        <div className="banner-content-right">
          <div className="banner-stat-box">
            <div className="stat-icon">
              <i className="bx bx-building-house"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">MUNICIPIOS ENCONTRADOS</span>
              <span className="stat-value">
                {municipiosFiltrados.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="repo-search-card">
        <label>Buscar municipio</label>

        <div className="repo-search-input">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Escribe el nombre del municipio..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </section>

      <h2 className="repo-section-title">
        <i className="bx bx-building-house"></i>
        Municipios con respaldos ({municipiosFiltrados.length})
      </h2>

      <section className="repo-table-card">
        <table className="repo-table">
          <thead>
            <tr>
              <th>Municipio</th>
              <th>Archivos por tipo</th>
              <th>Total</th>
              <th>Última carga</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {municipiosPaginados.map((m) => (
              <tr key={m.municipio_id}>
                <td>
                  <div className="repo-municipio-cell">
                    <span className="repo-municipio-icon">
                      <i className="bx bx-building"></i>
                    </span>
                    <strong>{corregirTexto(m.municipio_nombre)}</strong>
                  </div>
                </td>

                <td>
                  <div className="repo-badges">
                    <span className="repo-badge repo-pdf">
                      <i className="bx bxs-file-pdf"></i>
                      {m.total_pdf}
                    </span>

                    <span className="repo-badge repo-excel">
                      <i className="bx bxs-spreadsheet"></i>
                      {m.total_excel}
                    </span>
                  </div>
                </td>

                <td>
                  <strong>{m.total_documentos}</strong>
                </td>

                <td>
                  {m.ultima_carga
                    ? new Date(m.ultima_carga).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Sin carga"}
                </td>

                <td>
                  <button
                    type="button"
                    className="repo-action-btn"
                    onClick={() => verDetalleMunicipio(m)}
                  >
                    Ver respaldos
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </td>
              </tr>
            ))}

            {municipiosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="repo-empty">
                  No se encontraron municipios.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="repo-pagination">
          <button
            type="button"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => p - 1)}
          >
            ← Anterior
          </button>

          <span>
            Página {paginaActual} de {totalPaginas || 1}
          </span>

          <button
            type="button"
            disabled={paginaActual === totalPaginas || totalPaginas === 0}
            onClick={() => setPaginaActual((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </section>
    </div>
  );
};

export default RepositorioMunicipios;
