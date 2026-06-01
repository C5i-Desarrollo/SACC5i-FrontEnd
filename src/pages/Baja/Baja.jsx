import TablaBaja from "../../pages/TestMunicipio/TablaBaja";


const data = [
  {
    nombre: "Orlando Mendez",
    oficio: "SSP/SII/C5I",
    puesto: "Policia Auxiliar",
    fecha: "21/02/2026",
    estado: "Aprobado"
  },
  {
    nombre: "Yulissa Ortega",
    oficio: "SSP/SII/C5I",
    puesto: "Policia Auxiliar",
    fecha: "18/02/2026",
    estado: "En revisión"
  }
];

const resumen = [
  {
    cantidad: 2,
    estado: "Aprobados",
    color: "verde"
  },
  {
    cantidad: 1,
    estado: "Rechazados",
    color: "rojo"
  },
  {
    cantidad: 3,
    estado: "Pendientes",
    color: "amarillo"
  }
];

function Baja() {
  return (
    <TablaBaja
      data={data}
      resumen={resumen}
    />
  );
}

export default Baja;
