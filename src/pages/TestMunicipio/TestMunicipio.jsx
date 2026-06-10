import React, { useState, useEffect } from "react";
import FiltrosControles from "./FiltrosControles";
import TablaAlta from "./TablaAlta";
import TablaBaja from "./TablaBaja";
import TablaConsultaResumen from "./TablaConsultaResumen";
import TablaConsultaDetalle from "./TablaConsultaDetalle";
import "./TestMunicipio.css";

import {
  obtenerBajasRegistradas,
  obtenerBajasEditables
} from "../../services/bajaService";

export default function TestMunicipio() {
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [tipoTramite, setTipoTramite] = useState("alta");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [fecha, setFecha] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  // ESTADOS SOLO PARA CONSULTA
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [personasConsultaDetalle, setPersonasConsultaDetalle] = useState([]);

  useEffect(() => {
    probarFiltro();
  }, [tipoTramite, municipioNombre, estatus, fecha, terminoBusqueda]);

  const limpiarFiltros = () => {
    setMunicipioNombre("");
    setTipoTramite("alta");
    setTerminoBusqueda("");
    setEstatus("");
    setFecha("");
    setMunicipioSeleccionado(null);
    setPersonasConsultaDetalle([]);
  };

  const probarFiltro = async () => {
    setLoading(true);

    if (tipoTramite === "consulta") {
      setMunicipioSeleccionado(null);
      setPersonasConsultaDetalle([]);
    }

    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
      const token = localStorage.getItem("token");

      if (tipoTramite === "baja") {
  const [bajasSistemaRes, bajasManualesRes] = await Promise.all([
    obtenerBajasRegistradas(),
    obtenerBajasEditables(),
  ]);

  const bajasSistema = (bajasSistemaRes.registros || []).map((item) => ({
    ...item,
    origen_baja: "sistema",
  }));

  const bajasManuales = (bajasManualesRes.registros || []).map((item) => ({
    ...item,
    origen_baja: "manual",
  }));

  setResultados({
    data: {
      registros: [
        ...bajasSistema,
        ...bajasManuales,
      ],
    },
  });

  setLoading(false);
  return;
}

const endpoints = {
  alta: "/api/tramites/alta/todas-personas-c5",
  consulta: "/api/tramites/alta/consulta/municipios",
};

const rutaBase = endpoints[tipoTramite];
const url = `${baseUrl}${rutaBase}`;

const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Error ${response.status}`
        );
      }

      setResultados(data);
    } catch (error) {
      console.error(error);
      setResultados({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const consultarPersonasMunicipio = async (municipio) => {
    setMunicipioSeleccionado(municipio);
    setLoading(true);

    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
      const token = localStorage.getItem("token");

      const url =
        `${baseUrl}/api/tramites/alta/consulta/municipios/${municipio.municipio_id}/personas?municipio_nombre=${encodeURIComponent(municipio.municipio_nombre)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Error ${response.status}`
        );
      }

      const registros =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.registros)
            ? data.data.registros
            : Array.isArray(data?.personas)
              ? data.personas
              : [];

      setPersonasConsultaDetalle(registros);
    } catch (error) {
      console.error(error);
      setPersonasConsultaDetalle([]);
    } finally {
      setLoading(false);
    }
  };

  let resumen = [];
  let datosFiltrados = [];
  let consultaResumen = [];

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

    const normalizarTexto = (valor = "") =>
      String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const obtenerTextoEstatus = (item) => {
  return normalizarTexto(
    item.estatus_descriptivo ||
    item.fase_actual ||
    item.tramite_fase ||
    item.accion_disponible ||
    ''
  );
};

    const obtenerCategoriaEstatus = (item) => {
      const estatus = obtenerTextoEstatus(item);

      if (
        estatus.includes('rechazado') ||
        estatus.includes('no corresponde')
      ) {
        return 'rechazado';
      }

      if (
        estatus.includes('aprobado') ||
        estatus.includes('validado') ||
        estatus.includes('alta ok') ||
        estatus.includes('dictaminado')
      ) {
        return 'aprobado';
      }

      if (
        estatus.includes('revision') ||
        estatus.includes('validacion') ||
        estatus.includes('enviado_c3') ||
        estatus.includes('persona_en_revision') ||
        estatus.includes('persona_en_cuip')
      ) {
        return 'revision';
      }

      if (estatus.includes('pendiente')) {
        return 'pendiente';
      }

      return 'otro';
    };

    const enRevision = datosFiltrados.filter(
      (item) => obtenerCategoriaEstatus(item) === 'revision'
    ).length;
    const aprobados = datosFiltrados.filter(
      (item) => obtenerCategoriaEstatus(item) === 'aprobado'
    ).length;
    const rechazados = datosFiltrados.filter(
      (item) => obtenerCategoriaEstatus(item) === 'rechazado'
    ).length;
    const pendientes = datosFiltrados.filter(
      (item) => obtenerCategoriaEstatus(item) === 'pendiente'
    ).length;

    resumen = [
      {
        cantidad: enRevision,
        estado: "En validación",
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

  datosFiltrados = resultados.data.registros.filter((item) => {

    const coincideMunicipio =
      !municipioNombre ||
      municipioNombre === "TODOS" ||
      item.municipio_nombre?.toLowerCase() ===
        municipioNombre.toLowerCase();

    const textoBusqueda = terminoBusqueda.toLowerCase();

    const coincideBusqueda =
      !terminoBusqueda ||
      item.nombre_elemento
        ?.toLowerCase()
        .includes(textoBusqueda) ||
      item.numero_oficio_municipio
        ?.toLowerCase()
        .includes(textoBusqueda) ||
      item.municipio_nombre
        ?.toLowerCase()
        .includes(textoBusqueda) ||
      item.baja_tipo
        ?.toLowerCase()
        .includes(textoBusqueda) ||
      item.baja_motivo
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

const bajasSistema = datosFiltrados.filter(
  (item) => item.origen_baja === "sistema"
).length;

const bajasManuales = datosFiltrados.filter(
  (item) => item.origen_baja === "manual"
).length;

resumen = [
  {
    cantidad: datosFiltrados.length,
    estado: "Elementos dados de baja",
    color: "rojo",
  },
  {
    cantidad: bajasSistema,
    estado: "Bajas desde el sistema",
    color: "amarillo",
  },
  {
    cantidad: bajasManuales,
    estado: "Bajas manuales",
    color: "gris",
  },
];

}

  // ==========================
  // CONSULTA
  // ==========================
  if (tipoTramite === "consulta") {
    const registrosConsulta =
      Array.isArray(resultados?.data)
        ? resultados.data
        : Array.isArray(resultados?.data?.registros)
          ? resultados.data.registros
          : [];

    consultaResumen = registrosConsulta.filter((item) => {
      const coincideMunicipio =
        !municipioNombre ||
        municipioNombre === "TODOS" ||
        item.municipio_nombre?.toLowerCase() ===
          municipioNombre?.toLowerCase();

      const textoBusqueda = terminoBusqueda.toLowerCase();

      const coincideBusqueda =
        !terminoBusqueda ||
        item.municipio_nombre
          ?.toLowerCase()
          .includes(textoBusqueda);

      return coincideMunicipio && coincideBusqueda;
    });
  }

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

      {tipoTramite === "consulta" && (
        <>
          <TablaConsultaResumen
            datos={consultaResumen}
            municipioSeleccionado={municipioSeleccionado}
            onConsultarMunicipio={consultarPersonasMunicipio}
          />

          <TablaConsultaDetalle
            personas={personasConsultaDetalle}
          />
        </>
      )}
    </div>
  );
}
