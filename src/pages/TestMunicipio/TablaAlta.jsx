import TarjetasResumen from "../../components/TarjetasResumen/TarjetasResumen";
import "./TablaAlta.css";

function TablaAlta({ data, resumen }) {
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
              <th>Fecha de solicitud</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.nombre_completo}</td>
                <td>{item.numero_oficio_c3}</td>
                <td>{item.puesto_original_nombre}</td>
                <td>{item.fecha_solicitud ? new Date(item.fecha_solicitud).toLocaleDateString("es-MX") : "-"} </td>
                <td>{item.estatus_descriptivo}</td>
               
               </tr> ))}
          </tbody>
        </table>
      </div>
    </div>
  );} export default TablaAlta;


  