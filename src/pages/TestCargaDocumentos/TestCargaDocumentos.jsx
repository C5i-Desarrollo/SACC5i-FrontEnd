import React, { useState } from 'react';

export default function TestCargaDocumentos() {
  const [archivo, setArchivo] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('Alta');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const baseUrl = import.meta.env.VITE_API_URL;

  const handleSubirDocumento = async (e) => {
    e.preventDefault();
    if (!archivo) return alert('Selecciona un PDF primero');

    setLoading(true);
    const token = localStorage.getItem('token');

    // Para enviar archivos DEBES usar FormData, no JSON
    const formData = new FormData();
    formData.append('documento', archivo);
    formData.append('tipo_movimiento', tipoMovimiento);

    try {
      const response = await fetch(`${baseUrl}/documentos-municipio/cargar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // OJO: No se pone 'Content-Type' cuando usas FormData, el navegador lo calcula solo.
        },
        body: formData
      });

      const data = await response.json();
      setMensaje(data.message || (response.ok ? 'Cargado con éxito' : 'Error al cargar'));

      // Si la respuesta fue exitosa (código 200 o 201), limpiamos el formulario
      if (response.ok) {
        setArchivo(null); // Resetea el estado del archivo
        setTipoMovimiento('Alta'); // Vuelve al valor por defecto

        // Resetear el input HTML físicamente
        const fileInput = document.getElementById('archivo-input');
        if (fileInput) fileInput.value = '';

        // (Opcional) Si tienes una función para recargar la tabla, llámala aquí:
        // cargarHistorial(); 
      }

    } catch (error) {
      setMensaje('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', margin: '20px', borderRadius: '8px' }}>
      <h2>🧪 Prueba: Carga de Documentos (Rol Municipio)</h2>

      <form onSubmit={handleSubirDocumento} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          value={tipoMovimiento}
          onChange={(e) => setTipoMovimiento(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="Alta">Alta</option>
          <option value="Baja">Baja</option>
          <option value="Consulta">Consulta</option>
        </select>

        <input
          id="archivo-input"
          type="file"
          accept=".pdf"
          onChange={(e) => setArchivo(e.target.files[0])}
        />

        <button type="submit" disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#800020', color: 'white', border: 'none', borderRadius: '4px' }}>
          {loading ? 'Subiendo...' : 'Cargar Documento'}
        </button>
      </form>

      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <hr />

      <h3>Simulación de Tabla de Historial (Bitácora)</h3>
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px' }}>
        <pre>
            // Aquí el frontend hará un GET a /api/documentos-municipio/mis-documentos
        // y dibujará la tabla que me mostraste en las imágenes.
        </pre>
      </div>
    </div>
  );
}