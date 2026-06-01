import React, { useState } from "react";
import FiltrosControles from "./FiltrosControles";
import "./TestMunicipio.css";

export default function TestMunicipio() {
  // ESTADOS
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [tipoTramite, setTipoTramite] = useState("alta");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [estatus, setEstatus] = useState("");
  const [fecha, setFecha] = useState("");

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  // LIMPIAR FILTROS
  const limpiarFiltros = () => {
    setMunicipioNombre("");
    setTipoTramite("alta");
    setTerminoBusqueda("");
    setEstatus("");
    setFecha("");
  };

  // FETCH API
  const probarFiltro = async () => {
    setLoading(true);

    try {
      const rawBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, "");

      const token = localStorage.getItem("token");

      let url = "";

      if (tipoTramite === "consulta") {
        url = municipioNombre
          ? `${baseUrl}/api/tramites/alta/consulta/municipios/0/personas?municipio_nombre=${encodeURIComponent(municipioNombre)}`
          : `${baseUrl}/api/tramites/alta/consulta/municipios`;
      } else {
        const endpoints = {
          alta: "/api/tramites/alta/todas-personas-c5",
          baja: "/api/tramites/alta/bajas",
        };

        const rutaBase = endpoints[tipoTramite];

        url = municipioNombre
          ? `${baseUrl}${rutaBase}?municipio_nombre=${encodeURIComponent(municipioNombre)}`
          : `${baseUrl}${rutaBase}`;
      }

      if (terminoBusqueda.trim()) {
        url += url.includes("?")
          ? `&busqueda=${encodeURIComponent(terminoBusqueda)}`
          : `?busqueda=${encodeURIComponent(terminoBusqueda)}`;
      }

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
          data?.message || data?.error || `Error ${response.status}`,
        );
      }

      setResultados(data);
    } catch (error) {
      setResultados({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="filtrado-container">
      <span className="filtrado-subtitle">REVISIÓN DE MOVIMIENTOS</span>

      <h1 className="filtrado-title">Filtrado por Municipio</h1>

      <p className="filtrado-description">
        Selecciona un municipio y tipo de movimiento para revisar los trámites
        registrados
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
        probarFiltro={probarFiltro}
        limpiarFiltros={limpiarFiltros}
        loading={loading}
      />
    </div>
  );
}
