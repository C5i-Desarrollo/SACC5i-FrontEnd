import React, { useEffect, useState } from "react";
import TablaBaja from "../../TestMunicipio/TablaBaja";
import {
  getBajasRegistradasApi,
  getBajasEditablesApi,
} from "../../../services/api";

function Baja() {

  console.log("ENTRO AL COMPONENTE BAJA");

  const [data, setData] = useState([]);
  const [resumen, setResumen] = useState([
    {
      cantidad: 0,
      estado: "Elementos dados de baja",
      color: "rojo",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const extraerRegistros = (response) => {
  const payload = response?.data;

  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.registros)) return payload.registros;

  if (Array.isArray(payload.data)) return payload.data;

  if (Array.isArray(payload.data?.registros)) return payload.data.registros;

  if (Array.isArray(payload.data?.rows)) return payload.data.rows;

  if (Array.isArray(payload.rows)) return payload.rows;

  if (Array.isArray(payload.bajas)) return payload.bajas;

  if (Array.isArray(payload.data?.bajas)) return payload.data.bajas;

  if (Array.isArray(payload.resultados)) return payload.resultados;

  if (Array.isArray(payload.data?.resultados)) return payload.data.resultados;

  return [];
};

  useEffect(() => {
    const cargarBajas = async () => {
      setLoading(true);
      setError(null);

      try {

        console.log("getBajasRegistradasApi");
        console.log("getBajasEditablesApi");

        const [sistemaResult, manualesResult] = await Promise.allSettled([
          getBajasRegistradasApi(),
          getBajasEditablesApi(),
        ]);

        console.log("RESPUESTA SISTEMA COMPLETA:", sistemaResult);
        console.log("RESPUESTA MANUALES COMPLETA:", manualesResult);

        const bajasSistema =
          sistemaResult.status === "fulfilled"
            ? extraerRegistros(sistemaResult.value).map((item) => ({
                ...item,
                origen_baja: "sistema",
              }))
            : [];

        const bajasManuales =
          manualesResult.status === "fulfilled"
            ? extraerRegistros(manualesResult.value).map((item) => ({
                ...item,
                origen_baja: "manual",
              }))
            : [];

        const todasLasBajas = [
          ...bajasSistema,
          ...bajasManuales,
        ];

        console.log("TOTAL SISTEMA:", bajasSistema.length);
        console.log("TOTAL MANUALES:", bajasManuales.length);
        console.log("TOTAL BAJAS:", todasLasBajas.length);

        console.log("BAJAS SISTEMA:", bajasSistema);
        console.log("BAJAS MANUALES:", bajasManuales);
        console.log("TODAS LAS BAJAS:", todasLasBajas);

        setData(todasLasBajas);

        setResumen([
          {
            cantidad: todasLasBajas.length,
            estado: "Elementos dados de baja",
            color: "rojo",
          },
        ]);

        if (
          sistemaResult.status === "rejected" &&
          manualesResult.status === "rejected"
        ) {
          throw new Error("No se pudieron cargar las bajas.");
        }

        if (manualesResult.status === "rejected") {
          console.warn(
            "No se pudieron cargar las bajas manuales:",
            manualesResult.reason
          );
        }

        if (sistemaResult.status === "rejected") {
          console.warn(
            "No se pudieron cargar las bajas del sistema:",
            sistemaResult.reason
          );
        }
      } catch (fetchError) {
        console.error("Error cargando bajas:", fetchError);
        setError(fetchError?.message || "No se pudieron cargar las bajas.");
      } finally {
        setLoading(false);
      }
    };

    cargarBajas();
  }, []);

  return (
    <>
      {error && (
        <div className="error-message">
          No fue posible cargar las bajas: {error}
        </div>
      )}

      <TablaBaja
        data={data}
        resumen={resumen}
      />

      {loading && (
        <div className="cargando-bajas">
          Cargando bajas...
        </div>
      )}
    </>
  );
}

export default Baja;