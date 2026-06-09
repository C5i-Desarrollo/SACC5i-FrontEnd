import {
  Upload,
  FileText,
  Download,
  CloudUpload,
  Eye,
  Trash2,
  History
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";


import "./TestCargaDocumentos.css";

export default function TestCargaDocumentos() {
  const [archivo, setArchivo] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState("Alta");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const [paginaActual, setPaginaActual] = useState(1);
  const documentosPorPagina = 5;

  const baseUrl = import.meta.env.VITE_API_URL;

  const handleSubirDocumento = async (e) => {
    e.preventDefault();

    if (!archivo) {
      alert("Selecciona un PDF primero");
      return;
    }

    setLoading(true);

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("documento", archivo);
    formData.append("tipo_movimiento", tipoMovimiento);

    try {
      const response = await fetch(
        `${baseUrl}/documentos-municipio/cargar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      setMensaje(
        data.message ||
          (response.ok
            ? "Documento cargado correctamente"
            : "Error al cargar")
      );

      if (response.ok) {

        const nuevoDocumento = {
          archivo: archivo.name,
          fecha: new Date().toLocaleString("es-MX"),
          movimiento: tipoMovimiento,
          estatus: "En revisión",
          usuario: "Usuario actual",
          observacion: "Documento enviado a revisión",
          url: URL.createObjectURL(archivo),
          validado: false
        };

        setHistorial(prev => [
          nuevoDocumento,
          ...prev
        ]);

        setArchivo(null);

        const input = document.getElementById("archivo-input");

        if (input) input.value = "";
      }
    } catch (error) {
      setMensaje("Error al cargar documento");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // DATOS DE EJEMPLO
  // ==========================
const [historial, setHistorial] = useState([    
    {
      archivo: "Oficio_Consulta.pdf",
      fecha: "12/05/2026 10:30 a.m",
      movimiento: "Consulta",
      estatus: "Aprobado",
      usuario: "X persona",
      observacion:
        "Documento aprobado correctamente",
      url: "/documentos/Oficio_Consulta.pdf",
    },
    {
      archivo: "Oficio_Alta.pdf",
      fecha: "12/05/2026 10:30 a.m",
      movimiento: "Alta",
      estatus: "En revisión",
      usuario: "X persona",
      observacion:
        "Documento enviado a revisión",
      url: "/documentos/Oficio_Alta.pdf",
    },
    {
      archivo: "Oficio_Baja.pdf",
      fecha: "12/05/2026 10:40 a.m",
      movimiento: "Baja",
      estatus: "Rechazado",
      usuario: "X persona",
      observacion:
        "El documento no cuenta con fecha",
      url: "/documentos/Oficio_Baja.pdf",
    },
    {
      archivo: "Alta_02.pdf",
      fecha: "13/05/2026",
      movimiento: "Alta",
      estatus: "Aprobado",
      usuario: "Usuario 2",
      observacion: "Validado",
      url: "/documentos/Alta_02.pdf",
    },
    {
      archivo: "Alta_03.pdf",
      fecha: "13/05/2026",
      movimiento: "Alta",
      estatus: "En revisión",
      usuario: "Usuario 3",
      observacion: "En proceso",
      url: "/documentos/Alta_03.pdf",
    },
    {
      archivo: "Alta_04.pdf",
      fecha: "14/05/2026",
      movimiento: "Alta",
      estatus: "En revisión",
      usuario: "Usuario 4",
      observacion: "Revisión",
      url: "/documentos/Alta_04.pdf",
    },
    {
      archivo: "Alta_05.pdf",
      fecha: "15/05/2026",
      movimiento: "Alta",
      estatus: "Aprobado",
      usuario: "Usuario 5",
      observacion: "Correcto",
      url: "/documentos/Alta_05.pdf",
    },
    {
      archivo: "Alta_06.pdf",
      fecha: "16/05/2026",
      movimiento: "Alta",
      estatus: "Aprobado",
      usuario: "Usuario 6",
      observacion: "Correcto",
      url: "/documentos/Alta_06.pdf",
    },
  ]);

  // ==========================
  // FILTRO POR MOVIMIENTO
  // ==========================
  const documentosFiltrados = historial.filter(
    (doc) =>
      doc.movimiento.toLowerCase() ===
      tipoMovimiento.toLowerCase()
  );

  // ==========================
  // PAGINACIÓN
  // ==========================
  const totalPaginas = Math.ceil(
    documentosFiltrados.length /
      documentosPorPagina
  );

  const indiceInicial =
    (paginaActual - 1) *
    documentosPorPagina;

  const indiceFinal =
    indiceInicial + documentosPorPagina;

  const documentosPagina =
    documentosFiltrados.slice(
      indiceInicial,
      indiceFinal
    );

  useEffect(() => {
    setPaginaActual(1);
  }, [tipoMovimiento]);

  // ==========================
  // DESCARGA
  // ==========================
  const descargarDocumento = (documento) => {
 const descargarDocumento = (documento) => {

    if (!documento.url) {
      alert("No existe archivo para descargar");
      return;
    }

    const link = document.createElement("a");
    link.href = documento.url;
    link.download = documento.archivo;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    const link = document.createElement("a");
    link.href = documento.url;
    link.download = documento.url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visualizarDocumento = (documento) => {
  if (documento.url) {
    window.open(documento.url, "_blank");
  }
};  

const eliminarDocumento = (indexEliminar) => {
  const confirmar = window.confirm(
    "¿Deseas eliminar este documento?"
  );

  if (!confirmar) return;

  const nuevaLista = historial.filter(
    (_, index) => index !== indexEliminar
  );

  setHistorial(nuevaLista);
};

  return (
    <div className="carga-container">
      {/* CABECERA */}
      <div className="carga-header">

  <div className="header-superior">

    <div className="titulo-wrapper">
      <div className="icon-circle">
        <CloudUpload size={32} />
      </div>

      <div>
        <h1>Carga de Documentos</h1>

        <p>
          Selecciona un municipio y tipo de movimiento
          para revisar los trámites registrados
        </p>
      </div>
    </div>

    <button
      className="btn-historial"
      onClick={() =>
        navigate("/dashboard/historial-documentos")
      }
    >
      <History size={18} />
      Historial de Cambios
    </button>

  </div>

        {/* FORMULARIO */}
        <form
          className="form-upload"
          onSubmit={handleSubirDocumento}
        >
          <div className="select-container">
            <select
              value={tipoMovimiento}
              onChange={(e) =>
                setTipoMovimiento(
                  e.target.value
                )
              }
            >
              <option value="Alta">
                Alta
              </option>

              <option value="Baja">
                Baja
              </option>

              <option value="Consulta">
                Consulta
              </option>
            </select>
          </div>

          <div className="file-container">
            <label
              htmlFor="archivo-input"
              className="file-btn"
            >
              Seleccionar archivo
            </label>

            <input
              id="archivo-input"
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setArchivo(
                  e.target.files[0]
                )
              }
            />

            <span className="file-name">
              {archivo
                ? archivo.name
                : "Sin archivo seleccionado"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="upload-btn"
          >
            <Upload size={18} />

            {loading
              ? "Subiendo..."
              : "Cargar Documento"}
          </button>
        </form>

        {mensaje && (
          <div className="mensaje-upload">
            {mensaje}
          </div>
        )}
      </div>

      {/* TABLA */}
      <div className="tabla-wrapper">
        <table className="tabla-documentos">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Fecha y hora</th>
              <th>Tipo de movimiento</th>
              <th>Estatus</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {documentosPagina.map(
              (item, index) => (
                <tr key={index}>
                  <td className="archivo-col">
                    <FileText size={20} />
                    {item.archivo}
                  </td>

                  <td>{item.fecha}</td>

                  <td>
                    {item.movimiento}
                  </td>

                  <td>
                    <span
                      className={`estatus ${item.estatus
                        .toLowerCase()
                        .replace(
                          " ",
                          "-"
                        )}`}
                    >
                      {item.estatus}
                    </span>
                  </td>

                  <td>
                    {item.observacion}
                  </td>

      <td className="acciones">
          <button 
          className="view-btn"
          onClick={() => visualizarDocumento(item)}
          >
          <Eye size={16} />
          </button>

          <button
          className="download-btn"
          onClick={() => descargarDocumento(item)}
          >
          <Download size={16} />
          </button>

          <button
          className="delete-btn"
          onClick={() =>
          eliminarDocumento(
          historial.findIndex(
            doc => doc.archivo === item.archivo
            ) ) } >
          <Trash2 size={16} />
          </button>
          </td>
          </tr>
            ) ) }
          </tbody>
          </table>

        {/* PAGINACIÓN */}
        <div className="pagination">
          <button
            disabled={
              paginaActual === 1
            }
            onClick={() =>
              setPaginaActual(
                paginaActual - 1
              )
            }
          >
            {"<"}
          </button>

          <span>
            Página {paginaActual} de{" "}
            {totalPaginas || 1}
          </span>

          <button
            disabled={
              paginaActual ===
              totalPaginas
            }
            onClick={() =>
              setPaginaActual(
                paginaActual + 1
              )
            }
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
}