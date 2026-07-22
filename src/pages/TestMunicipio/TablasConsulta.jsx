import React, { useState } from "react";
import "./TablasConsulta.css";

const normalizarTexto = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const normalizarFecha = (valor = "") => {
  if (!valor) return "";

  const fechaObj = new Date(valor);
  if (Number.isNaN(fechaObj.getTime())) {
    return String(valor).split("T")[0];
  }

  return fechaObj.toISOString().split("T")[0];
};

const formatearFechaMX = (valor = "") => {
  if (!valor) return "Sin dato";

  const fechaObj = new Date(valor);
  if (Number.isNaN(fechaObj.getTime())) return "Sin dato";

  return fechaObj.toLocaleDateString("es-MX");
};

export function TablaConsultaResumen({
  datos = [],
  municipioSeleccionado,
  onConsultarMunicipio
}) {
  const handleSeleccionarMunicipio = (item) => {
    if (typeof onConsultarMunicipio === "function") {
      onConsultarMunicipio([item]);
    }
  };

  return (
    <div className="consulta-card consulta-resumen-card">
      <div className="consulta-card-header">
        <span className="consulta-subtitulo">CONSULTA</span>
        <h2>Consulta de finalizados</h2>
      </div>

      <div className="consulta-table-wrapper">
        <table className="consulta-table consulta-resumen-table">
          <thead>
            <tr>
              <th className="consulta-col-numero">No.</th>
              <th className="consulta-col-center">Municipio</th>
              <th className="consulta-col-total">Personas finalizadas</th>
            </tr>
          </thead>

          <tbody>
            {datos.length === 0 ? (
              <tr>
                <td colSpan="3" className="consulta-empty">
                  No hay registros para mostrar.
                </td>
              </tr>
            ) : (
              datos.map((item, index) => {
                const activo =
                  municipioSeleccionado?.municipio_id === item.municipio_id;

                return (
                  <tr
                    key={item.municipio_id || index}
                    className={activo ? "consulta-row-activa" : ""}
                    onClick={() => handleSeleccionarMunicipio(item)}
                  >
                    <td className="consulta-col-numero">
                      {index + 1}
                    </td>

                    <td className="consulta-col-center">
                      {item.municipio_nombre || "Sin municipio"}
                    </td>

                    <td className="consulta-col-total">
                      <span className="consulta-badge-total">
                        {item.total_personas ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TablaConsultaDetalle({
  personas = [],
  fecha = "",
  terminoBusqueda = ""
}) {
  const [busqueda, setBusqueda] = useState("");

  const personasFiltradas = personas.filter((persona) => {
    const texto = normalizarTexto(terminoBusqueda || busqueda);

    const nombre = normalizarTexto(persona.nombre || "");
    const apellidoPaterno = normalizarTexto(persona.apellido_paterno || "");
    const apellidoMaterno = normalizarTexto(persona.apellido_materno || "");

    const numeroOficio = normalizarTexto(
      persona.numero_oficio ||
      persona.numero_oficio_c3 ||
      ""
    );

    const coincideBusqueda =
      !texto ||
      nombre.includes(texto) ||
      apellidoPaterno.includes(texto) ||
      apellidoMaterno.includes(texto) ||
      numeroOficio.includes(texto);

    const fechaNacimientoISO = normalizarFecha(persona.fecha_nacimiento);

    const fechaNacimientoMX = persona.fecha_nacimiento
      ? new Date(persona.fecha_nacimiento).toLocaleDateString("es-MX")
      : "";

    const fechaFiltro = normalizarTexto(fecha);

    const coincideFecha =
      !fechaFiltro ||
      normalizarTexto(fechaNacimientoISO).includes(fechaFiltro) ||
      normalizarTexto(fechaNacimientoMX).includes(fechaFiltro);

    return coincideBusqueda && coincideFecha;
  });

  const mensajeVacio =
    personas.length === 0
      ? "Selecciona un municipio para ver el detalle de personas."
      : "No se encontraron personas con los filtros aplicados.";

  return (
    <div className="consulta-card consulta-detalle-card">
      <div className="consulta-card-header">
        <span className="consulta-subtitulo">DETALLE</span>
        <h2>Personas finalizadas</h2>
      </div>

      <input
        type="text"
        className="consulta-search"
        placeholder="Buscar por nombre, apellidos o número de oficio"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="consulta-table-wrapper">
        <table className="consulta-table consulta-detalle-table">
          <thead>
            <tr>
              <th className="consulta-col-numero">No.</th>
              <th>Nombre</th>
              <th>Apellido Paterno</th>
              <th>Apellido Materno</th>
              <th className="consulta-col-center">No. Oficio</th>
              <th className="consulta-col-center">Fecha de nacimiento</th>
            </tr>
          </thead>

          <tbody>
            {personasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="6" className="consulta-empty">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              personasFiltradas.map((persona, index) => (
                <tr key={persona.id || persona.finalizado_id || index}>
                  <td className="consulta-col-numero">
                    {index + 1}
                  </td>

                  <td>{persona.nombre || "Sin dato"}</td>

                  <td>{persona.apellido_paterno || "Sin dato"}</td>

                  <td>{persona.apellido_materno || "Sin dato"}</td>

                  <td className="consulta-col-center">
                    {persona.numero_oficio ||
                      persona.numero_oficio_c3 ||
                      "Sin dato"}
                  </td>

                  <td className="consulta-col-center">
                    {formatearFechaMX(persona.fecha_nacimiento)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}