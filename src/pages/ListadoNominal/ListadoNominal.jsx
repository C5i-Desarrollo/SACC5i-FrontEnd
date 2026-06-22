import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import "./ListadoNominal.css";
import { FaRegEye } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
import axios from "axios";

export default function ListadoNominal() {
  const { user } = useAuth();
  const esAdmin = user?.rol === "admin" || user?.rol === "super_admin";
  const [listados, setListados] = useState([]);
  const [municipios, setMunicipios] = useState([]); // Para el <select> del modal
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [archivoSelect, setArchivoSelect] = useState(null);
  const [municipioSelect, setMunicipioSelect] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  // 1. Cargar datos iniciales
  const cargarListados = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/listados-nominales?busqueda=${busqueda}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setListados(data.data);
    } catch (error) {
      console.error("Error cargando listados", error);
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
        // 🔥 FILTRAMOS AQUÍ: Si es admin ve todos, si no, solo los que empatan con su region_id
        const municipiosFiltrados = esAdmin
          ? data.data
          : data.data.filter((m) => m.region_id === user?.region_id);

        setMunicipios(municipiosFiltrados);
      }
    } catch (error) {
      console.error("Error cargando municipios:", error);
    }
  };

  useEffect(() => {
    cargarMunicipios();
  }, []);

  // Efecto de búsqueda con delay (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarListados();
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // 2. Lógica para subir documento
  const handleSubirListado = async (e) => {
    e.preventDefault();
    if (!archivoSelect || !municipioSelect) {
      alert("Selecciona un municipio y un archivo PDF");
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
        cargarListados(); // Refrescar tabla
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error de conexión al subir");
    } finally {
      setSubiendo(false);
    }
  };

  // 3. Lógica para descargar/ver
  const handleAccionArchivo = async (id, accion = "descargar") => {
    try {
      const res = await fetch(`${baseUrl}/listados-nominales/${id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo archivo");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );

      if (accion === "ver") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `listado_${id}.pdf`; // O el nombre real
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      alert("No se pudo obtener el archivo");
    }
  };

  
const handleEliminar = async (id) => {
  const confirmar = window.confirm(
    "¿Deseas eliminar este archivo?"
  );

  if (!confirmar) return;

  try {
    await axios.delete(
      `${baseUrl}/listados-nominales/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Archivo eliminado correctamente");

    cargarListados();
  } catch (error) {
    console.error(error);
    alert("Error al eliminar el archivo");
  }
};




  return (
    <div className="listado-nominal-container">
      {/* HEADER Y BUSCADOR */}
      <div className="listado-header">
        <div className="listado-header-top">
          <div>
            <span className="listado-subtitle">Repositorio de Respaldos</span>
            <h1>Listado Nominal</h1>

            <p>
              Respaldo del personal que trabaja en cada municipio. Solo se
              permiten archivos PDF.
            </p>

            <div />

            <div className="buscador-card">
              <label>Buscar municipio</label>

              <input
                className="input-busqueda"
                type="text"
                placeholder="Escribe el nombre del municipio..."
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

      {/* TABLA BASE */}
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
  onClick={() => handleEliminar(item.id)}
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

      {/* MODAL DE CARGA (Usando Portal para evitar problemas de z-index) */}
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

              <label>Archivo PDF</label>
              <input
                type="file"
                accept="application/pdf"
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
          document.body,
        )}
    </div>
  );
}
