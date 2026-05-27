import React, { useState } from 'react';

export default function TestMunicipio() {
  const [municipioId, setMunicipioId] = useState('');
  const [tipoTramite, setTipoTramite] = useState('alta'); // Nuevo estado para elegir qué buscar
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  const probarFiltro = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // 👇 AQUÍ CAMBIA ESTAS RUTAS POR LAS REALES DE TU BACKEND 👇
      const endpoints = {
        alta: '/api/tramites/alta/todas-personas-c5',
        baja: '/api/tramites/alta/bajas',
        consulta: '/api/tramites/alta/consulta/municipios'
      };

      const rutaBase = endpoints[tipoTramite];
      
      const url = municipioId 
        ? `${baseUrl}${rutaBase}?municipio_id=${municipioId}` 
        : `${baseUrl}${rutaBase}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
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
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        
        {/* Selector de Módulo */}
        <select 
          value={tipoTramite} 
          onChange={(e) => setTipoTramite(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}
        >
          <option value="alta">Altas</option>
          <option value="baja">Bajas</option>
          <option value="consulta">Consultas</option>
        </select>

        {/* Selector de Municipio */}
        <select 
          value={municipioId} 
          onChange={(e) => setMunicipioId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Todos los municipios (Sin filtro)</option>
          <option value="85">Municipio ID 85 (Ej. Izucar)</option>
          <option value="48">Municipio ID 48 (Ej. Tehuacán)</option>
          <option value="60">Municipio ID 60 (Ej. Atlixco)</option>
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
          {resultados ? JSON.stringify(resultados, null, 2) : 'Aún no se ha realizado ninguna consulta.'}
        </pre>
      </div>
    </div>
  );
}