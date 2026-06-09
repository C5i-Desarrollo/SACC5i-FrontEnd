import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Upload, Download, Eye, Trash2, CloudUpload, X, RefreshCw } from "lucide-react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import BitacoraModal from "../../components/layout/Bitacora/BitacoraModal";
import "./TestCargaDocumentos.css";

const formatearFecha = (fechaString) => {
  if (!fechaString) return "Sin fecha";
  const opciones = {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  };
  return new Date(fechaString).toLocaleDateString("es-MX", opciones);
};

export default function TestCargaDocumentos() {
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState("pendientes"); 
  const [filtroMovimiento, setFiltroMovimiento] = useState("");
  
  const [paginaActual, setPaginaActual] = useState(1);
  const documentosPorPagina = 6;

  // Estados del Modal de Carga
  const [modalCargaOpen, setModalCargaOpen] = useState(false);
  const [archivosCarga, setArchivosCarga] = useState([]);
  const [movimientoCarga, setMovimientoCarga] = useState("Alta");
  const [subiendo, setSubiendo] = useState(false);
  
  // 🔥 NUEVO: Estado para saber si estamos actualizando un documento rechazado
  const [docAActualizar, setDocAActualizar] = useState(null);

  const [modalBitacora, setModalBitacora] = useState({ isOpen: false, docId: null });
  const [toast, setToast] = useState({ show: false, tipo: "", titulo: "", mensaje: "" });

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const movimientos = ["Alta", "Baja", "Consulta"];

  const mostrarToast = (tipo, titulo, msj) => {
    setToast({ show: true, tipo, titulo, mensaje: msj });
    setTimeout(() => setToast({ show: false, tipo: "", titulo: "", mensaje: "" }), 4000);
  };

  const cargarMisDocumentos = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/documentos-municipio/mis-documentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDocumentos(data.data || []);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisDocumentos();
    const intervalo = setInterval(() => cargarMisDocumentos(true), 5000);
    return () => clearInterval(intervalo);
  }, []);

  const documentosFiltrados = documentos.filter((doc) => {
    const esPendiente = doc.estatus === "En revisión";
    if (vistaActual === "pendientes" && !esPendiente) return false;
    if (vistaActual === "evaluados" && esPendiente) return false;
    if (filtroMovimiento && doc.tipo_movimiento !== filtroMovimiento) return false;
    return true;
  }).sort((a, b) => new Date(b.fecha_carga) - new Date(a.fecha_carga));

  const totalPaginas = Math.ceil(documentosFiltrados.length / documentosPorPagina) || 1;
  const documentosPagina = documentosFiltrados.slice(
    (paginaActual - 1) * documentosPorPagina,
    paginaActual * documentosPorPagina
  );

  useEffect(() => { setPaginaActual(1); }, [vistaActual, filtroMovimiento]);

  // 🔥 NUEVO: Función para abrir el modal en Modo Nuevo o Modo Corregir
  const handleAbrirModalCarga = (doc = null) => {
    setDocAActualizar(doc); // Si viene un doc, estamos corrigiendo
    if (doc) {
      setMovimientoCarga(doc.tipo_movimiento); // Bloqueamos el movimiento al que ya tenía
    } else {
      setMovimientoCarga("Alta");
    }
    setArchivosCarga([]);
    setModalCargaOpen(true);
  };

  const handleSubirDocumento = async (e) => {
    e.preventDefault();
    if (archivosCarga.length === 0) {
      mostrarToast("error", "Error", "Selecciona un archivo PDF primero.");
      return;
    }

    setSubiendo(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    archivosCarga.forEach((archivo) => {
      formData.append("documentos", archivo);
    });
    formData.append("tipo_movimiento", movimientoCarga);

    // 🔥 NUEVO: Si hay un docAActualizar, usamos el método PUT hacia la nueva ruta
    const url = docAActualizar 
      ? `${baseUrl}/documentos-municipio/${docAActualizar.id}/actualizar`
      : `${baseUrl}/documentos-municipio/cargar`;
    
    const method = docAActualizar ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        mostrarToast("aprobado", "Éxito", docAActualizar ? "Documento corregido y reenviado." : "Documento cargado y enviado a C5.");
        setModalCargaOpen(false);
        setArchivosCarga([]);
        setDocAActualizar(null);
        cargarMisDocumentos(true);
        if (docAActualizar) setVistaActual("pendientes"); // Lo regresamos a la bandeja de pendientes
      } else {
        throw new Error("Error al cargar");
      }
    } catch (error) {
      mostrarToast("error", "Error", "Ocurrió un problema al enviar el documento.");
    } finally {
      setSubiendo(false);
    }
  };

  const visualizarDocumento = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/documentos-municipio/${id}/archivo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      window.open(window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" })), "_blank");
    } catch (error) {
      alert("Hubo un problema al visualizar el archivo.");
    }
  };

  const descargarDocumento = async (id, nombreArchivo) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/documentos-municipio/${id}/archivo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreArchivo || "documento.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Hubo un problema al descargar el archivo.");
    }
  };

const eliminarDocumento = async (id) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${baseUrl}/documentos-municipio/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (res.ok) {
      mostrarToast(
        "aprobado",
        "Eliminado",
        "Documento eliminado correctamente."
      );

      cargarMisDocumentos(true);
    } else {
      throw new Error();
    }
  } catch (error) {
    mostrarToast(
      "error",
      "Error",
      "Error al eliminar el documento."
    );
  }
};

const handleDropArchivo = (e) => {
  e.preventDefault();
  validarYGuardarArchivos(
    e.dataTransfer.files
  );
};

const handleDragOverArchivo = (e) => {
  e.preventDefault();
};
  
const validarYGuardarArchivos = (files, input = null) => {
  const archivos = Array.from(files || []);

  if (archivos.length === 0) return;

if (archivos.length > 10) {
  mostrarToast(
    "error",
    "Límite de documentos excedido",
    "No puedes subir más de 10 documentos a la vez. Selecciona máximo 10 archivos PDF."
  );

  setArchivosCarga([]);

  if (input) input.value = "";

  return;
}

  const pdfs = archivos.filter(
    (file) => file.type === "application/pdf"
  );

  if (pdfs.length !== archivos.length) {
    mostrarToast(
      "error",
      "Archivo inválido",
      "Solo se permiten archivos PDF."
    );

    setArchivosCarga([]);

    if (input) input.value = "";

    return;
  }

  setArchivosCarga(archivos);

  if (input) input.value = "";
};

  return (
    <div className="carga-page-container">
      <div className="carga-page-card">
        
        <div className="carga-page-header">
          <h1>
            {/* Le damos el color vino y un tamaño más grande solo al ícono */}
            <CloudUpload size={34} color="#7D2447" style={{ marginRight: '12px' }} />
            Carga de Documentos
          </h1>
          <p>Sube tus documentos o revisa el estado de los que ya enviaste a C5.</p>
        </div>

        <div className="carga-controls">
          <div className="carga-tabs">
            <button className={`carga-tab-btn ${vistaActual === "pendientes" ? "active" : ""}`} onClick={() => setVistaActual("pendientes")}>
              Documentos en Revisión
            </button>
            <button className={`carga-tab-btn ${vistaActual === "evaluados" ? "active" : ""}`} onClick={() => setVistaActual("evaluados")}>
              Historial (Evaluados)
            </button>
          </div>

          <div className="carga-actions-right">
            <select className="carga-filtro-select" value={filtroMovimiento} onChange={(e) => setFiltroMovimiento(e.target.value)}>
              <option value="">Todos los movimientos</option>
              {movimientos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            
            <button className="btn-abrir-modal-carga" onClick={() => handleAbrirModalCarga(null)}>
              <Upload size={18} /> Cargar Documento
            </button>
          </div>
        </div>

        <table className="tabla-limpia">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Fecha de envío</th>
              <th>Movimiento</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && documentos.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}>Cargando documentos...</td></tr>
            ) : documentosPagina.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}>No se encontraron documentos en esta bandeja.</td></tr>
            ) : (
              documentosPagina.map((doc) => (
                <tr key={doc.id}>
                  <td className="tabla-archivo-nombre">{doc.archivo_nombre}</td>
                  <td>{formatearFecha(doc.fecha_carga)}</td>
                  <td>{doc.tipo_movimiento}</td>
                  <td>
                    <span className={`badge-limpio badge-${doc.estatus ? doc.estatus.toLowerCase().replace(" ", "-") : "pendiente"}`}>
                      {doc.estatus}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-limpias">
                      <button className="btn-accion view" onClick={() => visualizarDocumento(doc.id)} title="Ver PDF">
                        <Eye size={18} />
                      </button>
                      <button className="btn-accion download" onClick={() => descargarDocumento(doc.id, doc.archivo_nombre)} title="Descargar">
                        <Download size={18} />
                      </button>
                      
                      {vistaActual === "pendientes" ? (
                        <button
                          className="btn-accion delete"
                          onClick={() => {
                            setDocumentoAEliminar(doc.id);
                            setModalEliminarOpen(true);
                          }}
                          title="Cancelar envío"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <>
                          {/* 🔥 NUEVO: Botón de Corregir que solo sale si está rechazado */}
                          {doc.estatus === "Rechazado" && (
                            <button className="btn-accion update" onClick={() => handleAbrirModalCarga(doc)} title="Corregir documento">
                              <RefreshCw size={16} style={{ marginRight: '4px' }}/> Corregir
                            </button>
                          )}
                          <button className="btn-accion bitacora" onClick={() => setModalBitacora({ isOpen: true, docId: doc.id })} title="Ver observaciones">
                            Ver más
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="paginacion-limpia">
          <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>
            &lt; Anterior
          </button>
          <span>Página {paginaActual} de {totalPaginas}</span>
          <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)}>
            Siguiente &gt;
          </button>
        </div>
      </div>

      {/* MODAL DE CARGA (Sirve para Nuevo y para Actualizar) */}
      {modalCargaOpen && createPortal(
        <div className="modal-carga-overlay">
          <div className="modal-carga-box">
            <div className="modal-carga-header">
              <h3>{docAActualizar ? "CORREGIR DOCUMENTO RECHAZADO" : "CARGA DE DOCUMENTOS"}</h3>
              <button className="close-btn" onClick={() => setModalCargaOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="modal-carga-body">
              <label
                className="carga-drop-zone"
                onDrop={handleDropArchivo}
                onDragOver={handleDragOverArchivo}
              >
                <CloudUpload size={40} color="#800020" />
                <p>
                  {docAActualizar
                    ? "Arrastra tu nuevo documento corregido aquí"
                    : "Arrastra tu documento aquí"}
                  <br />
                  o
                </p>

                <span className="fake-btn">Seleccionar archivo</span>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) =>
                    validarYGuardarArchivos(
                      e.target.files,
                      e.target
                    )
                  }
                  style={{ display: "none" }}
                />
              </label>
              {archivosCarga.length > 0 && (
                <div className="archivo-seleccionado">
                  {archivosCarga.map((archivo, index) => (
                    <p key={index}>📄 {archivo.name}</p>
                  ))}
                </div>
              )}
              <div className="carga-input-group">
                <label>TIPO DE MOVIMIENTO</label>
                <select 
                  value={movimientoCarga} 
                  onChange={(e) => setMovimientoCarga(e.target.value)}
                  disabled={!!docAActualizar} // Lo bloqueamos si estamos corrigiendo
                  style={{ backgroundColor: docAActualizar ? '#f0f0f0' : 'white' }}
                >
                  {movimientos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {docAActualizar && <span style={{fontSize: '12px', color: '#888'}}>* No puedes cambiar el tipo de movimiento al corregir un rechazo.</span>}
              </div>
            </div>

            <div className="modal-carga-footer">
              <button className="btn-cancelar" onClick={() => setModalCargaOpen(false)} disabled={subiendo}>
                Cancelar
              </button>
              <button className="btn-subir" onClick={handleSubirDocumento} disabled={subiendo || archivosCarga.length === 0}>
                {subiendo ? "Subiendo..." : (docAActualizar ? "Guardar y Reenviar" : "Subir Documento")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalBitacora.isOpen && createPortal(
        <div className="envoltura-magica-bitacora">
          <BitacoraModal documentoId={modalBitacora.docId} baseUrl={baseUrl} onClose={() => setModalBitacora({ isOpen: false, docId: null })} />
        </div>,
        document.body 
      )}

{modalEliminarOpen &&
  createPortal(
    <div className="modal-carga-overlay">
      <div
        className="modal-carga-box"
        style={{ maxWidth: "450px" }}
      >
        <div className="modal-carga-header">
          <h3>ELIMINAR DOCUMENTO</h3>
          <button
            className="close-btn"
            onClick={() => setModalEliminarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-carga-body">
          <p>
            ¿Estás seguro de que deseas eliminar este documento?
          </p>

          <p
            style={{
              color: "#dc3545",
              fontWeight: "bold"
            }}
          >
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="modal-carga-footer">
          <button
            className="btn-cancelar"
            onClick={() => {
              setModalEliminarOpen(false);
              setDocumentoAEliminar(null);
            }}
          >
            Cancelar
          </button>

          <button
            className="btn-subir"
            style={{
              backgroundColor: "#dc3545"
            }}
            onClick={() => {
              eliminarDocumento(documentoAEliminar);
              setModalEliminarOpen(false);
              setDocumentoAEliminar(null);
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}

    {createPortal(
      <div className={`toast-container ${toast.show ? "show" : ""}`}>
        <div className={`toast toast-${toast.tipo}`}>
          <div className="toast-icon">
            {toast.tipo === "aprobado" ? (
              <FiCheckCircle size={20} />
            ) : (
              <FiXCircle size={20} />
            )}
          </div>

          <div className="toast-content">
            <h4>{toast.titulo}</h4>
            <p>{toast.mensaje}</p>
          </div>

          <button
            className="toast-close"
            onClick={() =>
              setToast({
                show: false,
                tipo: "",
                titulo: "",
                mensaje: ""
              })
            }
          >
            <X size={16} />
          </button>
        </div>
      </div>,
      document.body
    )}

    </div>
  );
}