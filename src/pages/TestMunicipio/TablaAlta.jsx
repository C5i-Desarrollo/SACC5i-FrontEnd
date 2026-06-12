import TarjetasResumen from "../../components/TarjetasResumen/TarjetasResumen";
import "./TablaAlta.css";

function TablaAlta({ data, resumen }) {
  const obtenerEstatus = (item) => {
    const estatus = item.fase1_estado || item.estatus_descriptivo || "Sin estatus";

    const estados = {
      pendiente: "Pendiente",
      en_revision: "En validación",
      rechazado: "Rechazado",
      firmado: "Aprobado"
    };

    return estados[estatus] || estatus;
  };

  return (
    <div className="tabla-container">
      <div className="header-tabla">
        <p className="subtitulo">REVISIÓN DE MOVIMIENTOS</p>
        <h1>Movimientos de Alta</h1>
      </div>

      <TarjetasResumen resumen={resumen} />

      <div className="tabla-box">
        <table className="tabla-estilizada">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>No. Oficio</th>
              <th>Puesto</th>
              <th>Fecha de término</th>
              <th>Estatus</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => (
              <tr key={item.id || i}>
                <td>{item.nombre_elemento || item.nombre_completo || "Sin nombre"}</td>
                <td>{item.numero_oficio || item.numero_oficio_c3 || "-"}</td>
                <td>{item.puesto_elemento || item.puesto_original_nombre || "-"}</td>
                <td>
                  {item.fecha_termino || item.fecha_solicitud
                    ? new Date(item.fecha_termino || item.fecha_solicitud).toLocaleDateString("es-MX")
                    : "-"}
                </td>
                <td>{obtenerEstatus(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaAlta;