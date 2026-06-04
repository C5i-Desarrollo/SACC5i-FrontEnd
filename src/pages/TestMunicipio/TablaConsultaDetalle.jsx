import React, { useState } from 'react';

export default function TablaConsultaDetalle({
  personas = []
}) {
  const [busqueda, setBusqueda] = useState('');

  const personasFiltradas = personas.filter((persona) => {
    const texto = busqueda.toLowerCase();

    return (
      (persona.nombre || '').toLowerCase().includes(texto) ||
      (persona.apellido_paterno || '').toLowerCase().includes(texto) ||
      (persona.apellido_materno || '').toLowerCase().includes(texto)
    );
  });

  return (
    <div style={{ marginTop: '20px' }}>
      <input
        type="text"
        placeholder="Buscar por nombre o apellidos"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          marginBottom: '16px'
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#800020', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>No.</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Nombre</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Apellido Paterno</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Apellido Materno</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Fecha de nacimiento</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {personasFiltradas.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#777'
                }}
              >
                Selecciona un municipio para ver el detalle de personas.
              </td>
            </tr>
          ) : (
            personasFiltradas.map((persona, index) => (
              <tr
                key={persona.id || index}
                style={{ borderBottom: '1px solid #eee' }}
              >
                <td style={{ padding: '12px' }}>{index + 1}</td>

                <td style={{ padding: '12px' }}>
                  {persona.nombre || 'Sin dato'}
                </td>

                <td style={{ padding: '12px' }}>
                  {persona.apellido_paterno || 'Sin dato'}
                </td>

                <td style={{ padding: '12px' }}>
                  {persona.apellido_materno || 'Sin dato'}
                </td>

                <td style={{ padding: '12px' }}>
                  {persona.fecha_nacimiento
                    ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-MX')
                    : 'Sin dato'}
                </td>

                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #800020',
                      color: '#800020',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}