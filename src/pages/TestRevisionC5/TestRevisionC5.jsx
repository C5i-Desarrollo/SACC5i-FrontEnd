import React, { useState, useEffect } from "react";
import BitacoraModal from "../../components/layout/Bitacora/BitacoraModal";
import "./TestRevisionC5.css";

export default function TestRevisionC5() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [movimientoFiltro, setMovimientoFiltro] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);

  // NUEVO ESTADO: Controla si vemos "pendientes" o "evaluados"
  const [vistaActual, setVistaActual] = useState("pendientes");

  // Buscamos la URL en el archivo .env, si no existe, usamos localhost por defecto.
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const [modalBitacora, setModalBitacora] = useState({
    isOpen: false,
    docId: null,
  });

  const municipios = [
    ...new Set(documentos.map((doc) => doc.municipio_nombre).filter(Boolean)),
  ];

  const movimientos = ["Alta", "Baja", "Consulta"];

  const estatuses = [ "Aprobado", "Rechazado"];

  // Modificamos la función para que consulte una ruta u otra según la pestaña
  const cargarDocumentos = async (vista, silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setMensaje("");

    try {
      const token = localStorage.getItem("token");
      const endpoint = vista === "pendientes" ? "/pendientes" : "/evaluados";

      const response = await fetch(
        `${baseUrl}/documentos-municipio${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();

      console.log("STATUS:", response.status);
      console.log("DATA:", data);
      console.log("DOCUMENTOS:", data.data);

      if (!response.ok) {
        throw new Error(data?.message || "Error al cargar documentos");
      }

      setDocumentos(data.data || []);
    } catch (error) {
      console.error("Error cargando documentos:", error);

      if (!silent) {
        setMensaje(error.message || "Error al cargar los documentos");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Cada vez que cambiamos de pestaña, recargamos la tabla
  useEffect(() => {
    cargarDocumentos(vistaActual);

    const intervalo = setInterval(() => {
      cargarDocumentos(vistaActual, true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [vistaActual]);

  useEffect(() => {
    let resultado = [...documentos];

    if (municipioFiltro) {
      resultado = resultado.filter(
        (doc) => doc.municipio_nombre === municipioFiltro,
      );
    }

    if (movimientoFiltro) {
      resultado = resultado.filter(
        (doc) => doc.tipo_movimiento === movimientoFiltro,
      );
    }

    if (estatusFiltro) {
      resultado = resultado.filter((doc) => doc.estatus === estatusFiltro);
    }

    setDocumentosFiltrados(resultado);
  }, [documentos, municipioFiltro, movimientoFiltro, estatusFiltro]);

  const handleVerDocumento = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/documentos-municipio/${id}/archivo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const fileBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(fileBlob);
      window.open(url, "_blank");
    } catch (error) {
      alert("Hubo un problema al visualizar el archivo.");
    }
  };

  const handleEvaluar = async (id, estatusNuevo) => {
    const observaciones = window.prompt(
      `Vas a marcar este documento como "${estatusNuevo}". Escribe tus observaciones para el municipio:`,
    );
    if (observaciones === null) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${baseUrl}/documentos-municipio/${id}/evaluar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estatus_nuevo: estatusNuevo,
            observaciones: observaciones,
          }),
        },
      );

      const data = await response.json();
      alert(data.message);

      // Recargamos la tabla actual
      cargarDocumentos(vistaActual);
    } catch (error) {
      alert("Error al evaluar el documento.");
    }
  };

  const limpiarFiltros = () => {
    setMunicipioFiltro("");
    setMovimientoFiltro("");
    setEstatusFiltro("");
  };

  const actualizarTabla = () => {
    cargarDocumentos(vistaActual);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fff",
        margin: "20px",
        borderRadius: "8px",
      }}
    >
      <h1>Revisión de Documentos de Municipio</h1>
      <div className="descripcion">
        <p>Administra y revisa los documentos enviados por los municipios</p>
      </div>

      {/* PESTAÑAS PARA CAMBIAR DE VISTA */}
      <div
        style={{
          marginTop: "15px",
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => setVistaActual("pendientes")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            borderRadius: "4px",
            border: "none",
            backgroundColor:
              vistaActual === "pendientes" ? "#800020" : "#e0e0e0",
            color: vistaActual === "pendientes" ? "#fff" : "#333",
            fontWeight: "bold",
          }}
        >
          📁 Bandeja de Pendientes
        </button>
        <button
          onClick={() => setVistaActual("evaluados")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            borderRadius: "4px",
            border: "none",
            backgroundColor:
              vistaActual === "evaluados" ? "#800020" : "#e0e0e0",
            color: vistaActual === "evaluados" ? "#fff" : "#333",
            fontWeight: "bold",
          }}
        >
          🕒 Historial (Evaluados)
        </button>
      </div>

      {mensaje && <p style={{ color: "red" }}>{mensaje}</p>}

      <div className="filtros-panel">
        <div className="filtro-group">
          <label>Municipio</label>
          <select
            value={municipioFiltro}
            onChange={(e) => setMunicipioFiltro(e.target.value)}
          >
            <option value="">Todos</option>

            {municipios.map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Movimiento</label>
          <select
            value={movimientoFiltro}
            onChange={(e) => setMovimientoFiltro(e.target.value)}
          >
            <option value="">Todos</option>

            {movimientos.map((movimiento) => (
              <option key={movimiento} value={movimiento}>
                {movimiento}
              </option>
            ))}
          </select>
        </div>

        {vistaActual === "evaluados" && (
          <div className="filtro-group">
            <label>Estatus</label>
            <select
              value={estatusFiltro}
              onChange={(e) => setEstatusFiltro(e.target.value)}
            >
              <option value="">Todos</option>

              {estatuses.map((estatus) => (
                <option key={estatus} value={estatus}>
                  {estatus}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filtro-botones">
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#800020",
              color: "#fff",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "10px" }}>Municipio</th>
            <th>Movimiento</th>
            <th>Archivo</th>
            <th>Estatus</th>
            {/* Solo mostramos la columna de Acciones si estamos en Pendientes */}
            {vistaActual === "pendientes" && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {documentosFiltrados.length === 0 ? (
            <tr>
              <td
                colSpan={vistaActual === "pendientes" ? "5" : "4"}
                style={{ padding: "10px", textAlign: "center" }}
              >
                No hay documentos en esta bandeja.
              </td>
            </tr>
          ) : (
            documentosFiltrados.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ padding: "10px" }}>
                  {doc.municipio_nombre || doc.municipio_id}
                </td>
                <td>{doc.tipo_movimiento}</td>
                <td>
                  <button
                    onClick={() => handleVerDocumento(doc.id)}
                    style={{
                      backgroundColor: "#007BFF",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "8px",
                    }}
                  >
                    Ver PDF
                  </button>
                  {vistaActual === "evaluados" && (
                    <button
                      onClick={() =>
                        setModalBitacora({ isOpen: true, docId: doc.id })
                      }
                      className="btn-bitacora"
                    >
                      Ver más
                    </button>
                  )}
                </td>
                <td>
                  {/* Etiqueta visual para el estatus */}
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      backgroundColor:
                        doc.estatus === "Aprobado"
                          ? "#d4edda"
                          : doc.estatus === "Rechazado"
                            ? "#f8d7da"
                            : "#fff3cd",
                      color:
                        doc.estatus === "Aprobado"
                          ? "#155724"
                          : doc.estatus === "Rechazado"
                            ? "#721c24"
                            : "#856404",
                    }}
                  >
                    {doc.estatus}
                  </span>
                </td>
                {vistaActual === "pendientes" && (
                  <td>
                    <button
                      onClick={() => handleEvaluar(doc.id, "Aprobado")}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        marginRight: "5px",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleEvaluar(doc.id, "Rechazado")}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Rechazar
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalBitacora.isOpen && (
        <BitacoraModal
          documentoId={modalBitacora.docId}
          baseUrl={baseUrl}
          onClose={() => setModalBitacora({ isOpen: false, docId: null })}
        />
      )}
    </div>
  );
}
