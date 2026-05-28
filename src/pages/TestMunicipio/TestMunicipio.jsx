import React, { useState } from 'react';

export default function TestMunicipio() {
  const [municipioNombre, setMunicipioNombre] = useState('');
  const [tipoTramite, setTipoTramite] = useState('alta');
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  const probarFiltro = async () => {
    setLoading(true);

    try {
      const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const baseUrl = rawBaseUrl.replace(/\/api\/?$/, '');
      const token = localStorage.getItem('token');

      let url = '';

      if (tipoTramite === 'consulta') {
          url = municipioNombre
            ? `${baseUrl}/api/tramites/alta/consulta/municipios/0/personas?municipio_nombre=${encodeURIComponent(municipioNombre)}`
            : `${baseUrl}/api/tramites/alta/consulta/municipios`;
        } else {
        const endpoints = {
          alta: '/api/tramites/alta/todas-personas-c5',
          baja: '/api/tramites/alta/bajas'
        };

        const rutaBase = endpoints[tipoTramite];

        url = municipioNombre
          ? `${baseUrl}${rutaBase}?municipio_nombre=${encodeURIComponent(municipioNombre)}`
          : `${baseUrl}${rutaBase}`;
      }

      console.log('URL_FINAL', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Error ${response.status}`);
      }

      setResultados(data);
    } catch (error) {
      setResultados({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', margin: '20px' }}>
      <h2 style={{ marginBottom: '15px' }}>🧪 Prueba de Filtro por Municipio</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={tipoTramite}
          onChange={(e) => setTipoTramite(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}
        >
          <option value="alta">Altas</option>
          <option value="baja">Bajas</option>
          <option value="consulta">Consultas</option>
        </select>

        <select
          value={municipioNombre}
          onChange={(e) => setMunicipioNombre(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Todos los municipios (Sin filtro)</option>
          <option value="Izucar">Izucar</option>
          <option value="Tehuacán">Tehuacán</option>
          <option value="Atlixco">Atlixco</option>
          <option value="Chinantla">Chinantla</option>
        </select>

        <button
          onClick={probarFiltro}
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#800020', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Consultando...' : 'Consultar a la API'}
        </button>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', color: '#00ff00', padding: '15px', borderRadius: '6px', maxHeight: '500px', overflowY: 'auto' }}>
        <pre style={{ margin: 0, fontSize: '13px' }}>
          {resultados ? (
            resultados.total === 0 || resultados.data?.paginacion?.total === 0 ? (
              JSON.stringify({
                success: true,
                data: [],
                total: 0,
                message: 'No hay registros para el municipio seleccionado'
              }, null, 2)
            ) : (
              JSON.stringify(resultados, null, 2)
            )
          ) : (
            'Aún no se ha realizado ninguna consulta.'
          )}
        </pre>
      </div>
    </div>
  );
}