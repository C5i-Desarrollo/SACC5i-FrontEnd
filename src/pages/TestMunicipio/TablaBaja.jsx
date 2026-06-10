import { useState } from "react";
import TarjetasResumen from "../../components/TarjetasResumen/TarjetasResumen";
import "./TablaBaja.css";

function TablaBaja({ data, resumen }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  const [observacionesGuardadas, setObservacionesGuardadas] = useState(() => {
    const dataLocal = localStorage.getItem("observaciones_bajas");
    return dataLocal ? JSON.parse(dataLocal) : {};
  });

  const obtenerId = (item) =>
    item.id ||
    item.baja_id ||
    item.registro_id ||
    item.id_baja ||
    item.persona_tramite_id;

  const normalizarTexto = (valor = "") =>
    String(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const obtenerNombreCompleto = (item) =>
    `${item.nombre_elemento || ""} ${item.apellido_paterno || ""} ${
      item.apellido_materno || ""
    }`.trim();

  const obtenerTipoOrigenBaja = (item) => {
    if (item.origen_baja === "manual") {
      return "manual";
    }

    if (item.origen_baja === "sistema") {
      return "sistema";
    }

    const tipo = normalizarTexto(item.baja_tipo || "");
    const motivo = normalizarTexto(item.baja_motivo || "");

    const esProcesoSistema =
      tipo === "baja" &&
      motivo === "baja";

    return esProcesoSistema ? "sistema" : "manual";
  };

  const abrirModal = (item) => {
    const id = obtenerId(item);

    setDetalleSeleccionado({
      ...item,
      observaciones:
        observacionesGuardadas[id] ||
        item.observaciones ||
        item.baja_observaciones ||
        "",
    });

    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setDetalleSeleccionado(null);
  };

  const guardarObservacion = () => {
    const id = obtenerId(detalleSeleccionado);

    if (!id) {
      alert("No se pudo identificar el registro para guardar la observación.");
      return;
    }

    const nuevasObservaciones = {
      ...observacionesGuardadas,
      [id]: detalleSeleccionado.observaciones || "",
    };

    setObservacionesGuardadas(nuevasObservaciones);

    localStorage.setItem(
      "observaciones_bajas",
      JSON.stringify(nuevasObservaciones)
    );

    alert("Observación guardada correctamente.");
  };

  const descargarPDF = () => {
    const origen =
      obtenerTipoOrigenBaja(detalleSeleccionado) === "manual"
        ? "Baja registrada manualmente"
        : "Baja generada por el sistema";

    const contenido = `
      <html>
        <head>
          <title>Detalle de Baja</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #222;
            }

            h1 {
              color: #7a1235;
              border-bottom: 3px solid #7a1235;
              padding-bottom: 10px;
            }

            .dato {
              margin-bottom: 12px;
              font-size: 14px;
            }

            .label {
              font-weight: bold;
              color: #7a1235;
            }

            .badge {
              display: inline-block;
              margin: 10px 0 20px;
              padding: 8px 14px;
              border-radius: 999px;
              background: #f4e8ee;
              color: #7a1235;
              font-weight: bold;
              border: 1px solid #7a1235;
            }

            .observaciones {
              margin-top: 25px;
              padding: 15px;
              border: 1px solid #ccc;
              border-radius: 8px;
              min-height: 80px;
            }
          </style>
        </head>

        <body>
          <h1>Detalle de Movimiento de Baja</h1>

          <div class="badge">${origen}</div>

          <div class="dato"><span class="label">Nombre:</span> ${obtenerNombreCompleto(detalleSeleccionado)}</div>
          <div class="dato"><span class="label">CUIP:</span> ${detalleSeleccionado.cuip || "Sin registro"}</div>
          <div class="dato"><span class="label">Municipio:</span> ${detalleSeleccionado.municipio_nombre || "-"}</div>
          <div class="dato"><span class="label">No. Oficio:</span> ${detalleSeleccionado.numero_oficio_municipio || "-"}</div>
          <div class="dato"><span class="label">Tipo:</span> ${detalleSeleccionado.baja_tipo || "-"}</div>
          <div class="dato"><span class="label">Motivo:</span> ${detalleSeleccionado.baja_motivo || "-"}</div>
          <div class="dato"><span class="label">Fecha de baja:</span> ${
            detalleSeleccionado.baja_fecha
              ? new Date(detalleSeleccionado.baja_fecha).toLocaleDateString("es-MX")
              : "-"
          }</div>

          <div class="observaciones">
            <span class="label">Observaciones:</span><br/>
            ${detalleSeleccionado.observaciones || "Sin observaciones"}
          </div>
        </body>
      </html>
    `;

    const ventana = window.open("", "_blank");
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  return (
    <div className="tabla-container">
      <div className="header-tabla">
        <p className="subtitulo">REVISIÓN DE MOVIMIENTOS</p>
        <h1>Movimientos de Baja</h1>
      </div>

      <TarjetasResumen resumen={resumen} />

      <div className="tabla-box">
        <table className="tabla-estilizada">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>No. Oficio</th>
              <th>Municipio</th>
              <th>Fecha de baja</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Origen</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => {
              const origen = obtenerTipoOrigenBaja(item);

              return (
                <tr key={obtenerId(item) || i}>
                  <td>{obtenerNombreCompleto(item)}</td>
                  <td>{item.numero_oficio_municipio}</td>
                  <td>{item.municipio_nombre}</td>
                  <td>
                    {item.baja_fecha
                      ? new Date(item.baja_fecha).toLocaleDateString("es-MX")
                      : "-"}
                  </td>
                  <td>{item.baja_tipo}</td>
                  <td>{item.baja_motivo}</td>
                  <td>
                    <span
                      className={
                        origen === "manual"
                          ? "badge-manual"
                          : "badge-sistema"
                      }
                    >
                      {origen === "manual" ? "Manual" : "Sistema"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-detalles"
                      onClick={() => abrirModal(item)}
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {mostrarModal && detalleSeleccionado && (
          <div className="modal-overlay">
            <div className="modal-baja">
              <div className="modal-header">
                <h3>Detalle de Movimiento de Baja</h3>

                <button className="btn-cerrar" onClick={cerrarModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <h4 className="titulo-seccion">Información del Elemento</h4>

                <div className="info-grid">
                  <div className="label">Nombre completo:</div>
                  <div className="valor">
                    {obtenerNombreCompleto(detalleSeleccionado)}
                  </div>

                  <div className="label">CUIP:</div>
                  <div className="valor">
                    {detalleSeleccionado.cuip || "Sin registro"}
                  </div>

                  <div className="label">Municipio:</div>
                  <div className="valor">
                    {detalleSeleccionado.municipio_nombre || "-"}
                  </div>
                </div>

                <h4 className="titulo-seccion">Información de Baja</h4>

                <div className="info-grid">
                  <div className="label">Tipo:</div>
                  <div className="valor">
                    {detalleSeleccionado.baja_tipo || "-"}
                  </div>

                  <div className="label">Motivo:</div>
                  <div className="valor">
                    {detalleSeleccionado.baja_motivo || "-"}
                  </div>

                  <div className="label">Fecha de baja:</div>
                  <div className="valor">
                    {detalleSeleccionado.baja_fecha
                      ? new Date(detalleSeleccionado.baja_fecha).toLocaleDateString("es-MX")
                      : "-"}
                  </div>

                  <div className="label">Origen:</div>
                  <div className="valor">
                    <span
                      className={
                        obtenerTipoOrigenBaja(detalleSeleccionado) === "manual"
                          ? "badge-manual"
                          : "badge-sistema"
                      }
                    >
                      {obtenerTipoOrigenBaja(detalleSeleccionado) === "manual"
                        ? "Baja registrada manualmente"
                        : "Baja generada por el sistema"}
                    </span>
                  </div>
                </div>

                <h4 className="titulo-seccion">Observaciones</h4>

                <textarea
                  className="campo-observaciones"
                  value={detalleSeleccionado.observaciones || ""}
                  onChange={(e) =>
                    setDetalleSeleccionado({
                      ...detalleSeleccionado,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Escribe una observación sobre este elemento..."
                />

                <div className="contenedor-botones">
                  <button className="btn-modal btn-pdf" onClick={descargarPDF}>
                    Descargar PDF
                  </button>

                  <button
                    className="btn-modal btn-guardar"
                    onClick={guardarObservacion}
                  >
                    Guardar cambios
                  </button>

                  <button
                    className="btn-modal btn-cerrar-modal"
                    onClick={cerrarModal}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TablaBaja;