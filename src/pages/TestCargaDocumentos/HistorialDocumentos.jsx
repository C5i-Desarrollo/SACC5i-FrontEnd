import { useNavigate } from "react-router-dom";

function HistorialDocumentos() {
  const navigate = useNavigate();

  return (
    <div className="historial-container">

      <h1>Historial de Cambios</h1>

      <button
        onClick={() =>
          navigate("/dashboard/carga-documentos")
        }
      >
        Regresar
      </button>

    </div>
  );
}

export default HistorialDocumentos;