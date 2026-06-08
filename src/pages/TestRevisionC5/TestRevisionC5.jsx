import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import BitacoraModal from "../../components/layout/Bitacora/BitacoraModal";
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import "./TestRevisionC5.css";

export default function TestRevisionC5() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [movimientoFiltro, setMovimientoFiltro] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [documentosFiltrados, setDocumentosFiltrados] = useState([]);

  const [vistaActual, setVistaActual] = useState("pendientes");
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
  const [modalBitacora, setModalBitacora] = useState({ isOpen: false, docId: null });

  // ESTADOS PARA EL NUEVO MODAL DE EVALUACIÓN
  const [modalEvaluarOpen, setModalEvaluarOpen] = useState(false);
  const [docAEvaluar, setDocAEvaluar] = useState(null);
  const [estatusNuevo, setEstatusNuevo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [evaluando, setEvaluando] = useState(false);

  // ESTADO PARA LA NOTIFICACIÓN (TOAST)
  const [toast, setToast] = useState({ show: false, tipo: "", titulo: "", mensaje: "" });

  const municipios = [...new Set(documentos.map((doc) => doc.municipio_nombre).filter(Boolean))];
  const movimientos = ["Alta", "Baja", "Consulta"];
  const estatuses = ["Aprobado", "Rechazado"];

  const mostrarToast = (tipo, titulo, msj) => {
    setToast({ show: true, tipo, titulo, mensaje: msj });
    setTimeout(() => {
      setToast({ show: false, tipo: "", titulo: "", mensaje: "" });
    }, 4000); // Se oculta después de 4 segundos
  };

  const cargarDocumentos = async (vista, silent = false) => {
    if (!silent) setLoading(true);
    setMensaje("");

    try {
      const token = localStorage.getItem("token");
      const endpoint = vista === "pendientes" ? "/pendientes" : "/evaluados";

      const response = await fetch(`${baseUrl}/documentos-municipio${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Error al cargar documentos");

      setDocumentos(data.data || []);
    } catch (error) {
      if (!silent) setMensaje(error.message || "Error al cargar los documentos");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocumentos(vistaActual);
    const intervalo = setInterval(() => {
      cargarDocumentos(vistaActual, true);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [vistaActual]);

  useEffect(() => {
    let resultado = [...documentos];
    if (municipioFiltro) resultado = resultado.filter((doc) => doc.municipio_nombre === municipioFiltro);
    if (movimientoFiltro) resultado = resultado.filter((doc) => doc.tipo_movimiento === movimientoFiltro);
    if (estatusFiltro) resultado = resultado.filter((doc) => doc.estatus === estatusFiltro);
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

  // Abre el modal en lugar de usar window.prompt
  const abrirModalEvaluar = (doc, estatus) => {
    setDocAEvaluar(doc);
    setEstatusNuevo(estatus);
    setObservaciones("");
    setModalEvaluarOpen(true);
  };

  const confirmarEvaluacion = async () => {
    if (!docAEvaluar) return;
    setEvaluando(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseUrl}/documentos-municipio/${docAEvaluar.id}/evaluar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estatus_nuevo: estatusNuevo,
          observaciones: observaciones,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error("Error al evaluar");

      // Mostrar el toast de éxito
      const tituloToast = estatusNuevo === "Aprobado" ? "Documento aprobado" : "Documento rechazado";
      mostrarToast(
        estatusNuevo.toLowerCase(), 
        tituloToast, 
        `Se guardó la información correctamente. Las observaciones fueron enviadas al municipio de ${docAEvaluar.municipio_nombre}.`
      );

      setModalEvaluarOpen(false);
      cargarDocumentos(vistaActual);
    } catch (error) {
      mostrarToast("error", "Error", "Ocurrió un problema al evaluar el documento.");
    } finally {
      setEvaluando(false);
    }
  };

  const limpiarFiltros = () => {
    setMunicipioFiltro("");
    setMovimientoFiltro("");
    setEstatusFiltro("");
  };

  return (
    <div className="revision-container">
      <div className="revision-card">
        <h1>Revisión de Documentos de Municipio</h1>
        <div className="descripcion">
          <p>Administra y revisa los documentos enviados por los municipios</p>
        </div>

        {/* PESTAÑAS PARA CAMBIAR DE VISTA */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${vistaActual === "pendientes" ? "active" : ""}`}
            onClick={() => setVistaActual("pendientes")}
          >
            📁 Bandeja de Pendientes
          </button>
          <button
            className={`tab-btn ${vistaActual === "evaluados" ? "active" : ""}`}
            onClick={() => setVistaActual("evaluados")}
          >
            🕒 Historial (Evaluados)
          </button>
        </div>

        {mensaje && <p style={{ color: "red" }}>{mensaje}</p>}

        <div className="filtros-panel">
          <div className="filtro-group">
            <label>Municipio</label>
            <select value={municipioFiltro} onChange={(e) => setMunicipioFiltro(e.target.value)}>
              <option value="">Todos</option>
              {municipios.map((municipio) => (
                <option key={municipio} value={municipio}>{municipio}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Movimiento</label>
            <select value={movimientoFiltro} onChange={(e) => setMovimientoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {movimientos.map((movimiento) => (
                <option key={movimiento} value={movimiento}>{movimiento}</option>
              ))}
            </select>
          </div>

          {vistaActual === "evaluados" && (
            <div className="filtro-group">
              <label>Estatus</label>
              <select value={estatusFiltro} onChange={(e) => setEstatusFiltro(e.target.value)}>
                <option value="">Todos</option>
                {estatuses.map((estatus) => (
                  <option key={estatus} value={estatus}>{estatus}</option>
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

        <table className="tabla-documentos">
          <thead>
            <tr>
              <th>Municipio</th>
              <th>Movimiento</th>
              <th>Archivo</th>
              <th>Estatus</th>
              {vistaActual === "pendientes" && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {documentosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={vistaActual === "pendientes" ? "5" : "4"} style={{ textAlign: "center" }}>
                  No hay documentos en esta bandeja.
                </td>
              </tr>
            ) : (
              documentosFiltrados.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.municipio_nombre || doc.municipio_id}</td>
                  <td>{doc.tipo_movimiento}</td>
                  <td>
                    <button onClick={() => handleVerDocumento(doc.id)} className="btn-pdf">
                      Ver PDF
                    </button>
                    {vistaActual === "evaluados" && (
                      <button onClick={() => setModalBitacora({ isOpen: true, docId: doc.id })} className="btn-bitacora">
                        Ver más
                      </button>
                    )}
                  </td>
                  <td>
                    <span className={`badge-${doc.estatus ? doc.estatus.toLowerCase() : "pendiente"}`}>
                      {doc.estatus}
                    </span>
                  </td>
                  {vistaActual === "pendientes" && (
                    <td>
                      <button onClick={() => abrirModalEvaluar(doc, "Aprobado")} className="btn-aprobar">
                        Aprobar
                      </button>
                      <button onClick={() => abrirModalEvaluar(doc, "Rechazado")} className="btn-rechazar">
                        Rechazar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE BITÁCORA */}
      {modalBitacora.isOpen && (
        <BitacoraModal
          documentoId={modalBitacora.docId}
          baseUrl={baseUrl}
          onClose={() => setModalBitacora({ isOpen: false, docId: null })}
        />
      )}

      {/* MODAL DE EVALUACIÓN PERSONALIZADO (TELETRANSPORTADO) */}
      {modalEvaluarOpen && docAEvaluar && createPortal(
        <div className="eval-modal-overlay">
          <div className="eval-modal">
            <div className="eval-modal-header">
              <div className="eval-modal-icon">
                {estatusNuevo === "Aprobado" ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
              </div>
              <div className="eval-modal-titles">
                <h3>{estatusNuevo === "Aprobado" ? "Aprobar documento" : "Rechazar documento"}</h3>
                <p>{docAEvaluar.municipio_nombre} • Movimiento de {docAEvaluar.tipo_movimiento}</p>
              </div>
            </div>
            
            <div className="eval-modal-body">
              <div className={`eval-alert eval-alert-${estatusNuevo.toLowerCase()}`}>
                <FiInfo size={18} className="alert-icon" />
                <p>
                  Vas a marcar este documento como <strong>{estatusNuevo}</strong>. Escribe tus observaciones para el municipio.
                </p>
              </div>

              <div className="eval-form-group">
                <label>Observaciones</label>
                <textarea
                  placeholder="Describe el motivo o las indicaciones para el municipio..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows="4"
                ></textarea>
                <span className="char-count">{observaciones.length} caracteres</span>
              </div>
            </div>

            <div className="eval-modal-footer">
              <button className="btn-cancelar-modal" onClick={() => setModalEvaluarOpen(false)} disabled={evaluando}>
                Cancelar
              </button>
              <button 
                className={`btn-confirmar-modal ${observaciones.length === 0 ? "disabled" : ""}`} 
                onClick={confirmarEvaluacion} 
                disabled={evaluando || observaciones.length === 0}
              >
                {evaluando ? "Guardando..." : "Guardar y confirmar"}
              </button>
            </div>
          </div>
        </div>,
        document.body // <--- ESTO LO MANDA HASTA EL FRENTE DE TODA LA PÁGINA
      )}

      {/* TOAST DE NOTIFICACIÓN (TELETRANSPORTADO) */}
      {createPortal(
        <div className={`toast-container ${toast.show ? "show" : ""}`}>
          <div className={`toast toast-${toast.tipo}`}>
            <div className="toast-icon">
              {toast.tipo === "aprobado" ? <FiCheckCircle size={20} /> : <FiXCircle size={20} />}
            </div>
            <div className="toast-content">
              <h4>{toast.titulo}</h4>
              <p>{toast.mensaje}</p>
            </div>
            <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}>
              <FiX size={16} />
            </button>
          </div>
        </div>,
        document.body // <--- ESTO LO MANDA HASTA EL FRENTE DE TODA LA PÁGINA
      )}

    </div>
  );
}
