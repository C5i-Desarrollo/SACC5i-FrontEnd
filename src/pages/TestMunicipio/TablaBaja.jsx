import { useState } from "react";
import TarjetasResumen from "../../components/TarjetasResumen/TarjetasResumen";
import "./TablaBaja.css";

function TablaBaja({ data, resumen }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  const abrirModal = (item) => {
  console.log(item);
  setDetalleSeleccionado(item);
  setMostrarModal(true);
};

  const cerrarModal = () => {
    setMostrarModal(false);
    setDetalleSeleccionado(null);
  };

  return (
    <div className="tabla-container">
      <div className="header-tabla">
        <p className="subtitulo">REVISIÓN DE MOVIMIENTOS</p>
        <h1>Movimientos de Baja</h1>
      </div>

      <TarjetasResumen resumen={resumenCalculado} />

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
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.nombre_elemento}</td>
                <td>{item.numero_oficio}</td>
                <td>{item.municipio_nombre}</td>
                <td>{item.baja_fecha}</td>
                <td>{item.baja_tipo}</td>
                <td>{item.baja_motivo}</td>

                <td>
                  <button
                    className="btn-detalles"
                    onClick={() => abrirModal(item)}
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {mostrarModal && detalleSeleccionado && (
          <div className="modal-overlay">
            <div className="modal-baja">

              {/* HEADER */}
              <div className="modal-header">
                <h3>
                  👤 Detalle de Movimiento de Baja
                </h3>

                <button
                  className="btn-cerrar"
                  onClick={cerrarModal}
                >
                  ✕
                </button>
              </div>

              {/* BODY */}
              <div className="modal-body">

                {/* INFORMACIÓN DEL ELEMENTO */}
                <h4 className="titulo-seccion">
                  Información del Elemento
                </h4>

                <div className="info-grid">

                  <div className="label">
                    Nombre Completo :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.nombre_elemento}
                  </div>

                  <div className="label">
                    CUIP :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.cuip || "Sin registro"}
                  </div>

                  <div className="label">
                    Municipio :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.municipio_nombre}
                  </div>

                </div>

                {/* INFORMACIÓN */}
                <h4 className="titulo-seccion">
                  Información
                </h4>

                <div className="info-grid">

                  <div className="label">
                    Fecha Término :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.fecha_termino || "-"}
                  </div>

                </div>

                {/* BAJA */}
                <h4 className="titulo-seccion">
                  Información de Baja
                </h4>

                <div className="info-grid">

                  <div className="label">
                    Tipo :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.baja_tipo}
                  </div>

                  <div className="label">
                    Motivo :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.baja_motivo}
                  </div>

                  <div className="label">
                    Fecha de Baja :
                  </div>

                  <div className="valor">
                    {detalleSeleccionado.baja_fecha}
                  </div>

                </div>

                {/* OBSERVACIONES */}
                <h4 className="titulo-seccion">
                  Observaciones
                </h4>

                <textarea
                  className="campo-observaciones"
                  readOnly
                  value={
                    detalleSeleccionado.baja_observaciones || ""
                  }
                />

                {/* BOTONES */}
                <div className="contenedor-botones">

                  <button className="btn-modal btn-pdf">
                    📄 Descargar PDF
                  </button>

                  <button className="btn-modal btn-guardar">
                    💾 Guardar cambios
                  </button>

                  <button
                    className="btn-modal btn-cerrar-modal"
                    onClick={cerrarModal}
                  >
                    ⊗ Cerrar
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