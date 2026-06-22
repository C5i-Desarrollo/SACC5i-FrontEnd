import { useEffect, useState } from "react";
import { getRepositorioMunicipiosApi } from "../../services/api";

const RepositorioMunicipios = () => {
  const [municipios, setMunicipios] = useState([]);

  useEffect(() => {
    cargarMunicipios();
  }, []);

  const cargarMunicipios = async () => {
    try {
      const response = await getRepositorioMunicipiosApi();
      setMunicipios(response.data.data || []);
    } catch (error) {
      console.error("Error cargando municipios:", error);
    }
  };

  return (
    <div>
      <h1>Repositorio de Respaldos</h1>

      <table>
        <thead>
          <tr>
            <th>Municipio</th>
            <th>Total</th>
            <th>PDF</th>
            <th>Excel</th>
            <th>Imágenes</th>
          </tr>
        </thead>

        <tbody>
          {municipios.map((m) => (
            <tr key={m.municipio_id}>
              <td>{m.municipio_nombre}</td>
              <td>{m.total_documentos}</td>
              <td>{m.total_pdf}</td>
              <td>{m.total_excel}</td>
              <td>{m.total_imagen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RepositorioMunicipios;