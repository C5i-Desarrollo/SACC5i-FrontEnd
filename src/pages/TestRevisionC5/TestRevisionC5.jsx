import React, { useState, useEffect } from 'react';

export default function TestRevisionC5() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/documentos-municipio/pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDocumentos(data.data || []);
    } catch (error) {
      setMensaje('Error al cargar pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', margin: '20px', borderRadius: '8px' }}>
      <h2>📥 Buzón C5: Revisión de Documentos de Municipio</h2>
      <button onClick={cargarPendientes} style={{ padding: '8px', marginBottom: '15px' }}>
        {loading ? 'Actualizando...' : 'Refrescar Bandeja'}
      </button>

      {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#800020', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Municipio ID</th>
            <th>Tipo Movimiento</th>
            <th>Archivo</th>
            <th>Estatus</th>
            <th>Acción (Simulación)</th>
          </tr>
        </thead>
        <tbody>
          {documentos.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>No hay documentos pendientes.</td></tr>
          ) : (
            documentos.map((doc, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '10px' }}>{doc.municipio_id}</td>
                <td>{doc.tipo_movimiento}</td>
                <td>{doc.archivo_nombre}</td>
                <td>{doc.estatus}</td>
                <td>
                  <button style={{ backgroundColor: 'green', color: 'white', marginRight: '5px' }}>Aprobar</button>
                  <button style={{ backgroundColor: 'red', color: 'white' }}>Rechazar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}