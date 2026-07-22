import React, { useState, useEffect } from "react";
import FiltrosControles from "./FiltrosControles";
import TablaAlta from "./TablaAlta";
import TablaBaja from "./TablaBaja";

import {
  TablaConsultaResumen,
  TablaConsultaDetalle
} from "./TablasConsulta";

import "./TestMunicipio.css";
import { FiFilter } from "react-icons/fi";

import { obtenerAltasRegistradas } from "../../services/altaService";

import { obtenerBajasRegistradas, obtenerBajasEditables } from "../../services/bajaService";

export default function TestMunicipio({ setPageTitle }) {
  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Filtrado por Municipio",
        subtitulo: "Selecciona un municipio y tipo de movimiento para revisar los trámites registrados",
        icon: <FiFilter className="nav-icon-highlight" />
      });
    }
  }, [setPageTitle]);
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [tipoTramite, setTipoTramite] = useState("alta");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [fecha, setFecha] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  const [resumenGeneral, setResumenGeneral] = useState({
    total: 0,
    altas: 0,
    bajas: 0,
    consultas: 0
  });

  // ESTADOS SOLO PARA CONSULTA
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [personasConsultaDetalle, setPersonasConsultaDetalle] = useState([]);

  useEffect(() => {
    probarFiltro();
  }, [tipoTramite, municipioNombre, estatus, fecha, terminoBusqueda]);

  useEffect(() => {
    const actualizarAlVolver = () => {
      if (!document.hidden && tipoTramite === "alta") {
        probarFiltro();
      }
    };


    document.addEventListener("visibilitychange", actualizarAlVolver);

    return () => {
      document.removeEventListener("visibilitychange", actualizarAlVolver);
    };
  }, [tipoTramite]);


  useEffect(() => {
    const intervalo = setInterval(() => {
      if (tipoTramite === "alta") {
        probarFiltro();
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [tipoTramite]);

  const limpiarFiltros = () => {
    setMunicipioNombre("");
    setTipoTramite("alta");
    setTerminoBusqueda("");
    setEstatus("");
    setFecha("");
    setMunicipioSeleccionado(null);
    setPersonasConsultaDetalle([]);
  };

  const cargarResumenGeneral = async () => {
    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
      const token = localStorage.getItem("token");

      const [altasRes, bajasSistemaRes, bajasManualesRes, consultaResponse] =
        await Promise.all([
          obtenerAltasRegistradas(),
          obtenerBajasRegistradas(),
          obtenerBajasEditables(),
          fetch(`${baseUrl}/api/tramites/alta/consulta/municipios`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

      const consultaData = await consultaResponse.json();

      const altas = Array.isArray(altasRes?.registros)
        ? altasRes.registros.length
        : 0;

      const bajasSistema = Array.isArray(bajasSistemaRes?.registros)
        ? bajasSistemaRes.registros.length
        : 0;

      const bajasManuales = Array.isArray(bajasManualesRes?.registros)
        ? bajasManualesRes.registros.length
        : 0;

      const bajas = bajasSistema + bajasManuales;

      const registrosConsulta =
        Array.isArray(consultaData?.data)
          ? consultaData.data
          : Array.isArray(consultaData?.data?.registros)
            ? consultaData.data.registros
            : [];

      const consultas = registrosConsulta.reduce((acc, item) => {
        return acc + Number(item.total_personas || 0);
      }, 0);

      setResumenGeneral({
        total: altas + bajas + consultas,
        altas,
        bajas,
        consultas
      });
    } catch (error) {
      console.error("Error al cargar resumen general:", error);
      setResumenGeneral({
        total: 0,
        altas: 0,
        bajas: 0,
        consultas: 0
      });
    }
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


      if (tipoTramite === "alta") {
        const altasRes = await obtenerAltasRegistradas();

        console.log("PRIMER REGISTRO");
        console.log(altasRes.registros?.[0]);

        console.log("TODAS LAS LLAVES:");
        console.log(Object.keys(altasRes.registros?.[0] || {}));

        console.dir(altasRes.registros?.[0]);

        console.table(
          (altasRes.registros || []).map(item => ({
            nombre: item.nombre_elemento,
            municipio_nombre: item.municipio_nombre,
            municipio: item.municipio,
            nombre_municipio: item.nombre_municipio,
            municipio_origen: item.municipio_origen
          }))
        );
        setResultados({
          data: altasRes.registros || []
        });

        setLoading(false);
        return;
      }

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

  const consultarPersonasDeMunicipios = async (municipios = []) => {
    if (!municipios.length) {
      setPersonasConsultaDetalle([]);
      return;
    }

    setLoading(true);

    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");
      const token = localStorage.getItem("token");

      const respuestas = await Promise.all(
        municipios.map(async (municipio) => {
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

          return Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.registros)
              ? data.data.registros
              : Array.isArray(data?.personas)
                ? data.personas
                : [];
        })
      );
      console.log("PRIMERA PERSONA CONSULTA:");
      console.log(respuestas.flat()[0]);

      console.log("LLAVES CONSULTA:");
      console.log(Object.keys(respuestas.flat()[0] || {}));

      setPersonasConsultaDetalle(respuestas.flat());
    } catch (error) {
      console.error(error);
      setPersonasConsultaDetalle([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (tipoTramite !== "consulta") return;

    const registrosConsulta =
      Array.isArray(resultados?.data)
        ? resultados.data
        : Array.isArray(resultados?.data?.registros)
          ? resultados.data.registros
          : [];

    if (!registrosConsulta.length) {
      setPersonasConsultaDetalle([]);
      return;
    }

    const normalizarTexto = (valor = "") =>
      String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const municipioFiltro = normalizarTexto(municipioNombre);


    const municipiosFiltrados = registrosConsulta.filter((item) => {
      const municipio = normalizarTexto(item.municipio_nombre || "");
      const totalPersonas = String(item.total_personas ?? "");

      const coincideMunicipio =
        !municipioFiltro ||
        municipioFiltro === "todos" ||
        municipioFiltro.includes("todos los municipios") ||
        municipio === municipioFiltro;



      return coincideMunicipio;
    });

    consultarPersonasDeMunicipios(municipiosFiltrados);
  }, [tipoTramite, resultados, municipioNombre, terminoBusqueda]);

  useEffect(() => {
    cargarResumenGeneral();
  }, []);

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
      const textoBusqueda = terminoBusqueda.trim().toLowerCase();

      const nombreCompleto = String(
        item.nombre_elemento ||
        item.nombre_completo ||
        `${item.nombre || ""} ${item.apellido_paterno || ""} ${item.apellido_materno || ""}`
      ).toLowerCase();

      const municipio = String(
        item.municipio_nombre ||
        item.municipio ||
        item.nombre_municipio ||
        item.municipio_origen ||
        ""
      ).toLowerCase();

      const coincideMunicipio =
        !municipioNombre ||
        municipioNombre === "TODOS" ||
        municipio === municipioNombre.toLowerCase();

      const numeroOficio = String(
        item.numero_oficio ||
        item.numero_oficio_c3 ||
        ""
      ).toLowerCase();

      const puesto = String(
        item.puesto_elemento ||
        item.puesto_original_nombre ||
        ""
      ).toLowerCase();

      const estatusReal = String(
        item.fase1_estado ||
        item.estatus_descriptivo ||
        ""
      ).toLowerCase();

      const estatusVisible = estatusReal
        .replace("en_revision", "en validacion")
        .replace("firmado", "aprobado");

      const fechaRegistro = item.fecha_termino || item.fecha_solicitud;

      const coincideBusqueda =
        !textoBusqueda ||
        nombreCompleto.includes(textoBusqueda) ||
        numeroOficio.includes(textoBusqueda) ||
        puesto.includes(textoBusqueda) ||
        estatusReal.includes(textoBusqueda) ||
        estatusVisible.includes(textoBusqueda);

      const coincideEstatus =
        !estatus ||
        estatus === "TODOS" ||
        estatusVisible.includes(estatus.toLowerCase());

      const coincideFecha =
        !fecha ||
        fechaRegistro?.split("T")[0] === fecha;

      return (
        coincideBusqueda &&
        coincideEstatus &&
        coincideFecha &&
        coincideMunicipio
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
        item.fase1_estado ||
        item.estatus_descriptivo ||
        ''
      );
    };


    const obtenerCategoriaEstatus = (item) => {
      const estatus = obtenerTextoEstatus(item);

      if (estatus.includes("rechazado")) return "rechazado";
      if (estatus.includes("firmado")) return "aprobado";
      if (estatus.includes("revision")) return "revision";
      if (estatus.includes("pendiente")) return "pendiente";

      return "otro";
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
    ];

    console.log("RESUMEN ALTAS:", {
      total: datosFiltrados.length,
      enRevision,
      aprobados,
      rechazados,
      pendientes
    });
  }

  // ==========================
  // BAJAS
  // ==========================
  if (
    tipoTramite === "baja" &&
    Array.isArray(resultados?.data?.registros)
  ) {
    const normalizarTexto = (valor = "") =>
      String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const obtenerNombreCompleto = (item) =>
      normalizarTexto(
        `${item.nombre_elemento || ""} ${item.apellido_paterno || ""} ${item.apellido_materno || ""}`
      );

    const obtenerOrigen = (item) => {
      if (item.origen_baja === "manual") return "manual";
      if (item.origen_baja === "sistema") return "sistema";
      return "";
    };

    datosFiltrados = resultados.data.registros.filter((item) => {



      console.log("BUSCANDO:", terminoBusqueda);


      const textoBusqueda = normalizarTexto(terminoBusqueda);

      const nombreCompleto = obtenerNombreCompleto(item);
      const numeroOficio = normalizarTexto(item.numero_oficio_municipio || "");
      const municipio = normalizarTexto(item.municipio_nombre || "");
      const tipo = normalizarTexto(item.baja_tipo || "");
      const motivo = normalizarTexto(item.baja_motivo || "");
      const origen = normalizarTexto(obtenerOrigen(item));

      const fechaBajaRaw = item.baja_fecha || "";
      const fechaBajaISO = normalizarTexto(String(fechaBajaRaw).split("T")[0]);
      const fechaBajaMX = normalizarTexto(
        fechaBajaRaw
          ? new Date(fechaBajaRaw).toLocaleDateString("es-MX")
          : ""
      );

      const coincideMunicipio =
        !municipioNombre ||
        municipioNombre === "TODOS" ||
        municipio === normalizarTexto(municipioNombre);

      let coincideBusqueda = true;

      if (textoBusqueda) {
        coincideBusqueda =
          nombreCompleto.includes(textoBusqueda) ||
          numeroOficio.includes(textoBusqueda) ||
          municipio.includes(textoBusqueda) ||
          fechaBajaISO.includes(textoBusqueda) ||
          fechaBajaMX.includes(textoBusqueda) ||
          tipo.includes(textoBusqueda) ||
          motivo.includes(textoBusqueda) ||
          origen.includes(textoBusqueda);
      }

      const coincideFecha =
        !fecha ||
        String(fechaBajaRaw).split("T")[0] === fecha;

      return coincideMunicipio && coincideBusqueda && coincideFecha;
    });



    datosFiltrados = Array.from(
      new Map(
        datosFiltrados.map((item) => [
          `${item.origen_baja}-${item.numero_oficio_municipio}-${item.nombre_elemento}-${item.apellido_paterno}-${item.apellido_materno}`,
          item
        ])
      ).values()
    );



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



  console.log("RESULTADOS FILTRADOS BAJA:", datosFiltrados.length);
  console.table(
    datosFiltrados.map((item) => ({
      nombre: `${item.nombre_elemento || ""} ${item.apellido_paterno || ""} ${item.apellido_materno || ""}`,
      oficio: item.numero_oficio_municipio,
      municipio: item.municipio_nombre,
      fecha: item.baja_fecha,
      tipo: item.baja_tipo,
      motivo: item.baja_motivo,
      origen: item.origen_baja,
    }))
  );



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

    const normalizarTexto = (valor = "") =>
      String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    consultaResumen = registrosConsulta.filter((item) => {
      const textoBusqueda = normalizarTexto(terminoBusqueda);
      const municipio = normalizarTexto(item.municipio_nombre || "");
      const totalPersonas = String(item.total_personas ?? "");
      const municipioFiltro = normalizarTexto(municipioNombre);

      const coincideMunicipio =
        !municipioFiltro ||
        municipioFiltro === "todos" ||
        municipioFiltro.includes("todos los municipios") ||
        municipio === municipioFiltro;

      const coincideBusqueda =
        !textoBusqueda ||
        municipio.includes(textoBusqueda) ||
        totalPersonas.includes(textoBusqueda);

      return coincideMunicipio && coincideBusqueda;
    });
  }

  return (
    <div className="filtrado-container">

      {/* NUEVO BANNER ESTILO VINO */}
      <div className="filtrado-header-banner">
        <div className="banner-content-left">
          <span className="banner-subtitle">REVISIÓN DE MOVIMIENTOS</span>
          <h1 className="banner-title">Filtrado por Municipio</h1>
          <p className="banner-description">
            Selecciona un municipio y tipo de movimiento para revisar los trámites registrados.
          </p>
        </div>

        <div className="banner-content-right">
          <div className="banner-stat-box">
            <div className="stat-icon">
              <i className="bx bx-folder-open"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">TRÁMITES ENCONTRADOS</span>
              <span className="stat-value">
                {/* Matemáticas simples para mostrar el total en el cuadrito */}
                {tipoTramite === "consulta" ? consultaResumen.length : datosFiltrados.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="resumen-general-movimientos">
        <div className="resumen-general-header">
          <span>RESUMEN GENERAL DE MOVIMIENTOS</span>
          <p>Cantidad total de movimientos registrados en el sistema.</p>
        </div>

        <div className="resumen-general-grid">
          <div className="resumen-general-card total">
            <div className="resumen-general-icon">
              <i className="bx bx-file"></i>
            </div>
            <div>
              <strong>{resumenGeneral.total}</strong>
              <span>Total de movimientos</span>
            </div>
          </div>

          <div className="resumen-general-card altas">
            <div className="resumen-general-icon">
              <i className="bx bx-user-plus"></i>
            </div>
            <div>
              <strong>{resumenGeneral.altas}</strong>
              <span>Altas</span>
            </div>
          </div>

          <div className="resumen-general-card bajas">
            <div className="resumen-general-icon">
              <i className="bx bx-user-minus"></i>
            </div>
            <div>
              <strong>{resumenGeneral.bajas}</strong>
              <span>Bajas</span>
            </div>
          </div>

          <div className="resumen-general-card consultas">
            <div className="resumen-general-icon">
              <i className="bx bx-search-alt"></i>
            </div>
            <div>
              <strong>{resumenGeneral.consultas}</strong>
              <span>Consultas</span>
            </div>
          </div>
        </div>
      </div>

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
            onConsultarMunicipio={consultarPersonasDeMunicipios}
          />

          <TablaConsultaDetalle
            personas={personasConsultaDetalle}
            fecha={fecha}
            terminoBusqueda={terminoBusqueda}
          />

        </>

      )}

    </div>

  );
}
