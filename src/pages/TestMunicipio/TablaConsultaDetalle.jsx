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
    <div
      style={{
        marginTop: '18px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '22px',
        border: '1px solid #e5d8dc',
        boxShadow: '0 8px 22px rgba(128, 0, 32, 0.08)'
      }}
    >
      <input
        type="text"
        placeholder="Buscar por nombre o apellidos"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '13px 15px',
          borderRadius: '10px',
          border: '1px solid #d6c8cc',
          marginBottom: '18px',
          outline: 'none'
        }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            tableLayout: 'fixed'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#8b0028', color: 'white' }}>
              <th style={{ padding: '14px', textAlign: 'center', width: '80px' }}>No.</th>
              <th style={{ padding: '14px', textAlign: 'left', width: '24%' }}>Nombre</th>
              <th style={{ padding: '14px', textAlign: 'left', width: '24%' }}>Apellido Paterno</th>
              <th style={{ padding: '14px', textAlign: 'left', width: '24%' }}>Apellido Materno</th>
              <th style={{ padding: '14px', textAlign: 'center', width: '20%' }}>Fecha de nacimiento</th>
            </tr>
          </thead>

          <tbody>
            {personasFiltradas.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#777',
                    backgroundColor: '#fafafa'
                  }}
                >
                  Selecciona un municipio para ver el detalle de personas.
                </td>
              </tr>
            ) : (
              personasFiltradas.map((persona, index) => (
                <tr
                  key={persona.id || index}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#fff' : '#fbf4f6'
                  }}
                >
                  <td style={{ padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                    {index + 1}
                  </td>

                  <td style={{ padding: '14px' }}>
                    {persona.nombre || 'Sin dato'}
                  </td>

                  <td style={{ padding: '14px' }}>
                    {persona.apellido_paterno || 'Sin dato'}
                  </td>

                  <td style={{ padding: '14px' }}>
                    {persona.apellido_materno || 'Sin dato'}
                  </td>

                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    {persona.fecha_nacimiento
                      ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-MX')
                      : 'Sin dato'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}