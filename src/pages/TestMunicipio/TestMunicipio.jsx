import React, { useState, useEffect } from "react";
import FiltrosControles from "./FiltrosControles";
import TablaAlta from "./TablaAlta";
import TablaBaja from "./TablaBaja";
import "./TestMunicipio.css";

export default function TestMunicipio() {
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [tipoTramite, setTipoTramite] = useState("alta");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [fecha, setFecha] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  // CONSULTAR AL CAMBIAR FILTROS
  useEffect(() => {
    probarFiltro();
  }, [tipoTramite, municipioNombre, estatus, fecha, terminoBusqueda]);

  const limpiarFiltros = () => {
    setMunicipioNombre("");
    setTipoTramite("alta");
    setTerminoBusqueda("");
    setEstatus("");
    setFecha("");
  };

  const probarFiltro = async () => {
    
    setLoading(true);

    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");

      const token = localStorage.getItem("token");

      let url = "";

      const endpoints = {
        alta: "/api/tramites/alta/todas-personas-c5",
        baja: "/api/tramites/alta/bajas",
        consulta: "/api/tramites/alta/consulta/municipios",
      };

      const rutaBase = endpoints[tipoTramite];

      url = `${baseUrl}${rutaBase}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
console.log(
  "PRIMER REGISTRO COMPLETO:",
  JSON.stringify(data?.data?.[0], null, 2)
);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Error ${response.status}`
        );
      }

      setResultados(data);
      console.log("PRIMER REGISTRO:", data?.data?.[0]);
    } catch (error) {
      console.error(error);
      setResultados({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  let resumen = [];
  let datosFiltrados = [];

  // ==========================
  // ALTAS
  // ==========================
  if (
    tipoTramite === "alta" &&
    Array.isArray(resultados?.data)
  ) {
    datosFiltrados = resultados.data.filter((item) => {

 const coincideMunicipio =
  !municipioNombre ||
  municipioNombre === "TODOS" ||
  item.municipio_nombre?.toLowerCase() ===
    municipioNombre?.toLowerCase();

  const coincideEstatus =
    !estatus ||
    item.estatus_descriptivo
      ?.toLowerCase()
      .includes(estatus.toLowerCase());

  const textoBusqueda = terminoBusqueda.toLowerCase();

const coincideBusqueda =
  !terminoBusqueda ||

  item.numero_oficio_c3
    ?.toLowerCase()
    .includes(textoBusqueda) ||

  item.nombre_completo
    ?.toLowerCase()
    .includes(textoBusqueda) ||

  item.municipio_nombre
    ?.toLowerCase()
    .includes(textoBusqueda) ||

  item.numero_solicitud
    ?.toString()
    .includes(textoBusqueda);

  const coincideFecha =
    !fecha ||
    item.fecha_solicitud?.split("T")[0] === fecha;

  return (
    coincideMunicipio &&
    coincideEstatus &&
    coincideBusqueda &&
    coincideFecha
  );
});

    const enRevision = datosFiltrados.filter((item) =>
      item.estatus_descriptivo
        ?.toLowerCase()
        .includes("pendiente")
    ).length;

    const aprobados = datosFiltrados.filter(
      (item) => item.validado === 1
    ).length;

    const rechazados = datosFiltrados.filter(
      (item) => item.rechazado === 1
    ).length;

    const pendientes = datosFiltrados.filter((item) =>
      item.estatus_descriptivo
        ?.toLowerCase()
        .includes("pendiente")
    ).length;

    resumen = [
      {
        cantidad: enRevision,
        estado: "En revisión",
        color: "amarillo",
      },
      {
        cantidad: aprobados,
        estado: "Aprobados",
        color: "verde",
      },
      {
        cantidad: rechazados,
        estado: "Rechazados",
        color: "rojo",
      },
      {
        cantidad: pendientes,
        estado: "Pendientes",
        color: "gris",
      },
    ];
  }

  // ==========================
  // BAJAS
  // ==========================
  if (
    tipoTramite === "baja" &&
    Array.isArray(resultados?.data?.registros)
  ) {
    datosFiltrados =
  resultados.data.registros.filter((item) => {

    const coincideMunicipio =
  !municipioNombre ||
  municipioNombre === "TODOS" ||
  item.municipio_nombre?.toLowerCase() ===
    municipioNombre?.toLowerCase();

    const textoBusqueda = terminoBusqueda.toLowerCase();

const coincideBusqueda =
  !terminoBusqueda ||

  item.numero_oficio_c3
    ?.toLowerCase()
    .includes(textoBusqueda) ||

  item.nombre_completo
    ?.toLowerCase()
    .includes(textoBusqueda) ||

  item.municipio_nombre
    ?.toLowerCase()
    .includes(textoBusqueda);

    const coincideFecha =
      !fecha ||
      item.baja_fecha?.split("T")[0] === fecha;

    return (
      coincideMunicipio &&
      coincideBusqueda &&
      coincideFecha
    );
});

    resumen = [
      {
        cantidad: datosFiltrados.length,
        estado: "Elementos dados de baja",
        color: "rojo",
      },
      {
        cantidad: datosFiltrados.filter(
          (item) => item.baja_observaciones
        ).length,
        estado: "Bajas registradas manualmente",
        color: "amarillo",
      },
    ];
  }

  console.log("TIPO:", tipoTramite);
console.log("MUNICIPIO:", municipioNombre);
console.log("ESTATUS:", estatus);
console.log("FECHA:", fecha);
console.log("DATOS FILTRADOS:", datosFiltrados);

  return (
    <div className="filtrado-container">
      <span className="filtrado-subtitle">
        REVISIÓN DE MOVIMIENTOS
      </span>

      <h1 className="filtrado-title">
        Filtrado por Municipio
      </h1>

      <p className="filtrado-description">
        Selecciona un municipio y tipo de movimiento para revisar
        los trámites registrados
      </p>

      <FiltrosControles
        municipioNombre={municipioNombre}
        setMunicipioNombre={setMunicipioNombre}
        tipoTramite={tipoTramite}
        setTipoTramite={setTipoTramite}
        terminoBusqueda={terminoBusqueda}
        setTerminoBusqueda={setTerminoBusqueda}
        estatus={estatus}
        setEstatus={setEstatus}
        fecha={fecha}
        setFecha={setFecha}
        mostrarFiltros={mostrarFiltros}
        setMostrarFiltros={setMostrarFiltros}
        limpiarFiltros={limpiarFiltros}
        loading={loading}
      />

      {tipoTramite === "alta" &&
        Array.isArray(resultados?.data) && (
          <TablaAlta
            data={datosFiltrados}
            resumen={resumen}
          />
        )}

      {tipoTramite === "baja" &&
        Array.isArray(resultados?.data?.registros) && (
          <TablaBaja
            data={datosFiltrados}
            resumen={resumen}
          />
        )}
    </div>
  );
}