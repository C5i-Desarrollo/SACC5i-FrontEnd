import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import "./ListadoNominal.css";
import { FaRegEye } from "react-icons/fa";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import { FiList } from "react-icons/fi";

export default function ListadoNominal({ setPageTitle }) {
  const { success, error, warning } = useNotification();
  const { user } = useAuth();

  const esAdmin = user?.rol === "admin" || user?.rol === "super_admin";

  const [listados, setListados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 7; // Mostrar 7 registros por página

  const corregirTexto = (texto = "") => {
    try {
      return decodeURIComponent(escape(texto));
    } catch {
      return texto;
    }
  };

  const [modalAbierto, setModalAbierto] = useState(false);
  const [archivoSelect, setArchivoSelect] = useState(null);
  const [municipioSelect, setMunicipioSelect] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const [archivoEliminar, setArchivoEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const cargarListados = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${baseUrl}/listados-nominales?busqueda=${encodeURIComponent(busqueda)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (data.success) {
        setListados(data.data);
      } else {
        warning(data.message || "No se pudieron cargar los listados.");
      }
    } catch (fetchError) {
      console.error("Error cargando listados:", fetchError);
      error("Error al cargar los listados nominales.");
    } finally {
      setLoading(false);
    }
  };

  const cargarMunicipios = async () => {
    try {
      const res = await fetch(`${baseUrl}/catalogos/municipios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        const municipiosFiltrados = esAdmin
          ? data.data
          : data.data.filter((m) => m.region_id === user?.region_id);

        setMunicipios(municipiosFiltrados);
      }
    } catch (fetchError) {
      console.error("Error cargando municipios:", fetchError);
      error("Error al cargar municipios.");
    }
  };

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Listado Nominal",
        subtitulo: "Repositorio de respaldos documentales PDF",
        icon: <FiList className="nav-icon-highlight" />
      });
    }
  }, [setPageTitle]);

  useEffect(() => {
    cargarMunicipios();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarListados();
      setPaginaActual(1); // Regresar a la página 1 cuando se busca algo nuevo
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleSubirListado = async (e) => {
    e.preventDefault();

    if (!archivoSelect || !municipioSelect) {
      warning("Selecciona un municipio y un archivo.");
      return;
    }

    setSubiendo(true);

    const formData = new FormData();
    formData.append("documento", archivoSelect);
    formData.append("municipio_id", municipioSelect);

    try {
      const res = await fetch(`${baseUrl}/listados-nominales/subir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setModalAbierto(false);
        setArchivoSelect(null);
        setMunicipioSelect("");
        success("Archivo subido correctamente.");
        cargarListados();
      } else {
        warning(data.message || "No se pudo subir el archivo.");
      }
    } catch (fetchError) {
      console.error("Error subiendo archivo:", fetchError);
      error("Error de conexión al subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleAccionArchivo = async (id, accion = "descargar") => {
    try {
      const res = await fetch(`${baseUrl}/listados-nominales/${id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Error obteniendo archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      if (accion === "ver") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `listado_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (downloadError) {
      console.error("Error obteniendo archivo:", downloadError);
      error("No se pudo obtener el archivo.");
    }
  };

  const handleEliminar = (item) => {
    setArchivoEliminar(item);
  };

  const cancelarEliminar = () => {
    setArchivoEliminar(null);
  };

  const confirmarEliminar = async () => {
    if (!archivoEliminar) return;

    setEliminando(true);

    try {
      await axios.delete(
        `${baseUrl}/listados-nominales/${archivoEliminar.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      success("Archivo eliminado correctamente.");
      setArchivoEliminar(null);
      cargarListados();
    } catch (deleteError) {
      console.error("Error al eliminar archivo:", deleteError);
      error("Error al eliminar el archivo.");
    } finally {
      setEliminando(false);
    }
  };

  // LÓGICA DE PAGINACIÓN MATEMÁTICA
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const listadosPaginados = listados.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(listados.length / itemsPorPagina) || 1;

  return (
    <div className="listado-nominal-container">
      
      {/* NUEVO BANNER ESTILO VINO */}
      <div className="listado-header-banner">
        <div className="banner-content-left">
          <span className="banner-subtitle">REPOSITORIO DE RESPALDOS</span>
          <h1 className="banner-title">Listado Nominal</h1>
          <p className="banner-description">
            <i className="bx bx-info-circle" style={{ marginRight: "6px", color: "#c4a173", fontSize: "18px" }}></i>
            Respaldo del personal que trabaja en cada municipio. Se permiten solamente archivos PDF.
          </p>
        </div>

        <div className="banner-content-right">
          <div className="banner-stat-box">
            <div className="stat-icon">
              <i className="bx bxs-file-pdf"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">ARCHIVOS TOTALES</span>
              <span className="stat-value">
                {listados.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES: BUSCADOR Y BOTÓN */}
      <div className="controles-accion">
        <div className="buscador-card">
          <label>Buscar respaldo</label>
          <input
            className="input-busqueda"
            type="text"
            placeholder="Escribe el municipio o el nombre del archivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <button
          className="btn-subir-listado"
          onClick={() => setModalAbierto(true)}
        >
          <i className="bx bx-upload" style={{ fontSize: "18px" }}></i>
          Subir Listado Nominal
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Municipio</th>
                <th>Fecha de carga</th>
                <th>Subido por</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {/* Aquí usamos listadosPaginados en vez de listados */}
              {listadosPaginados.map((item) => (
                <tr key={item.id}>
                  <td>{corregirTexto(item.archivo_nombre)}</td>
                  <td>{item.municipio_nombre}</td>
                  <td>{new Date(item.created_at).toLocaleDateString("es-MX")}</td>
                  <td>{item.subido_por}</td>
                  <td>
                    <span
                      className={`estado-badge ${item.estado?.toLowerCase()}`}
                    >
                      {item.estado}
                    </span>
                  </td>
                  <td className="acciones-cell">
                    <button
                      className="btn-ver"
                      onClick={() => handleAccionArchivo(item.id, "ver")}
                    >
                      <FaRegEye size={14} />
                      Ver
                    </button>

                    <button
                      className="btn-descargar"
                      onClick={() => handleAccionArchivo(item.id, "descargar")}
                    >
                      <FiDownload size={14} />
                      Descargar
                    </button>

                    <button
                      className="btn-Eliminar"
                      onClick={() => handleEliminar(item)}
                    >
                      <FiTrash2 size={14} />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {listadosPaginados.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* CONTROLES DE PAGINACIÓN */}
          {listados.length > 0 && (
            <div className="listado-paginacion">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* MODALES MANTENIDOS IGUAL */}
      {modalAbierto &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-listado">
              <div className="modal-header-listado">
                <div className="header-icon">📤</div>

                <div>
                  <div className="header-text">
                    <h3>Cargar Listado Nominal</h3>
                  </div>
                  <div className="header-subtext">
                    <p>Respaldo en formato PDF</p>
                  </div>
                </div>
              </div>

              <div className="modal-content">
                <label>Municipio</label>

                <select
                  value={municipioSelect}
                  onChange={(e) => setMunicipioSelect(e.target.value)}
                >
                  <option value="">Selecciona un municipio...</option>

                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>

                <label>Archivo PDF</label>

                <div className="upload-area">
                  <input
                    type="file"
                    id="archivoPdf"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setArchivoSelect(e.target.files[0])}
                    hidden
                  />

                  {!archivoSelect ? (
                    <label htmlFor="archivoPdf" className="upload-dropzone">
                      <div className="pdf-icon">📄</div>

                      <h4>Haz clic para seleccionar</h4>

                      <span>Formato permitido (.pdf)</span>
                    </label>
                  ) : (
                    <div className="archivo-preview">
                      <div className="archivo-info">
                        <div className="pdf-icon-small">📄</div>

                        <div>
                          <strong>{archivoSelect.name}</strong>

                          <span>
                            {(archivoSelect.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={() => setArchivoSelect(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancelar"
                  onClick={() => setModalAbierto(false)}
                  disabled={subiendo}
                >
                  Cancelar
                </button>

                <button
                  className="btn-subir"
                  onClick={handleSubirListado}
                  disabled={subiendo || !archivoSelect || !municipioSelect}
                >
                  {subiendo ? "Subiendo..." : "Subir Documento"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {archivoEliminar &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-listado modal-eliminar">
              <div className="modal-eliminar-header">
                <div className="modal-eliminar-icono">
                  <FiTrash2 />
                </div>

                <div>
                  <h3>¿Deseas eliminar este archivo?</h3>
                  <p>Esta acción es permanente</p>
                </div>
              </div>

              <div className="modal-eliminar-body">
                <div className="modal-info">
                  <div>
                    Archivo:
                    <strong>
                      {corregirTexto(archivoEliminar?.archivo_nombre) ||
                        "Sin archivo"}
                    </strong>
                  </div>

                  <div>
                    Municipio:
                    <strong>
                      {corregirTexto(archivoEliminar?.municipio_nombre) ||
                        "Sin municipio"}
                    </strong>
                  </div>
                </div>

                <div className="modal-warning">
                  <span>⚠️</span>
                  <span>Esta acción no se puede deshacer.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancelar"
                  onClick={cancelarEliminar}
                  disabled={eliminando}
                >
                  Cancelar
                </button>

                <button
                  className="btn-eliminar-modal"
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                >
                  <FiTrash2 size={14} />
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}