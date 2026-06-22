import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import "./ListadoNominal.css";
import { FaRegEye } from "react-icons/fa";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import axios from "axios";

export default function ListadoNominal() {
  const { success, error, warning } = useNotification();
  const { user } = useAuth();

  const esAdmin = user?.rol === "admin" || user?.rol === "super_admin";

  const [listados, setListados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

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
        }
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
    cargarMunicipios();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarListados();
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
        link.download = `listado_${id}`;
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
      await axios.delete(`${baseUrl}/listados-nominales/${archivoEliminar.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  return (
    <div className="listado-nominal-container">
      <div className="listado-header">
        <div className="listado-header-top">
          <div>
            <span className="listado-subtitle">Repositorio de Respaldos</span>
            <h1>Listado Nominal</h1>

            <p>
              Respaldo del personal que trabaja en cada municipio. Se permiten
              archivos PDF y Excel.
            </p>

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
          </div>
        </div>

        <button
          className="btn-subir-listado"
          onClick={() => setModalAbierto(true)}
        >
          Subir Listado Nominal
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
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
            {listados.map((item) => (
              <tr key={item.id}>
                <td>{item.archivo_nombre}</td>
                <td>{item.municipio_nombre}</td>
                <td>{new Date(item.created_at).toLocaleDateString("es-MX")}</td>
                <td>{item.subido_por}</td>
                <td>{item.estado}</td>

                <td className="acciones-cell">
                  <button
                    className="btn-ver"
                    onClick={() => handleAccionArchivo(item.id, "ver")}
                  >
                    <FaRegEye size={10} />
                    Ver
                  </button>

                  <button
                    className="btn-descargar"
                    onClick={() => handleAccionArchivo(item.id, "descargar")}
                  >
                    <FiDownload size={10} />
                    Descargar
                  </button>

                  <button
                    className="btn-Eliminar"
                    onClick={() => handleEliminar(item)}
                  >
                    <FiTrash2 size={10} />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-listado">
              <h3>Cargar Listado Nominal</h3>

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

              <br />
              <br />

              <label>Archivo PDF o Excel</label>
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setArchivoSelect(e.target.files[0])}
              />

              <br />
              <br />

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
          document.body
        )}

      {archivoEliminar &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-listado modal-eliminar">
              <h3>¿Deseas eliminar este archivo?</h3>

              <p>
                Archivo: <strong>{archivoEliminar.archivo_nombre}</strong>
              </p>

              <p>
                Municipio: <strong>{archivoEliminar.municipio_nombre}</strong>
              </p>

              <p className="texto-advertencia">
                Esta acción no se puede deshacer.
              </p>

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
          document.body
        )}
    </div>
  );
}
