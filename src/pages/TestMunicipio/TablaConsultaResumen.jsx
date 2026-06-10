import React from 'react';

export default function TablaConsultaResumen({
  datos = [],
  municipioSeleccionado,
  onConsultarMunicipio
}) {
  return (
    <div
      style={{
        marginTop: '30px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '22px',
        border: '1px solid #e5d8dc',
        boxShadow: '0 8px 22px rgba(128, 0, 32, 0.08)'
      }}
    >
      <h2
        style={{
          marginBottom: '20px',
          color: '#800020',
          fontSize: '24px',
          fontWeight: '700'
        }}
      >
        Consulta de finalizados
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#8b0028', color: 'white' }}>
              <th style={{ padding: '14px', textAlign: 'center', width: '80px' }}>No.</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Municipio</th>
              <th style={{ padding: '14px', textAlign: 'center' }}>Personas finalizadas</th>
              <th style={{ padding: '14px', textAlign: 'center', width: '180px' }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {datos.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#777',
                    backgroundColor: '#fafafa'
                  }}
                >
                  No hay registros para mostrar.
                </td>
              </tr>
            ) : (
              datos.map((item, index) => {
                const activo =
                  municipioSeleccionado?.municipio_id === item.municipio_id;

                return (
                  <tr
                    key={item.municipio_id || index}
                    style={{
                      backgroundColor: activo
                        ? '#f5dfe7'
                        : index % 2 === 0
                          ? '#fff'
                          : '#fbf4f6'
                    }}
                  >
                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                      {index + 1}
                    </td>

                    <td style={{ padding: '14px' }}>
                      {item.municipio_nombre || 'Sin municipio'}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                      {item.total_personas ?? 0}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onConsultarMunicipio?.(item)}
                        style={{
                          backgroundColor: activo ? '#800020' : 'white',
                          border: '1px solid #800020',
                          color: activo ? 'white' : '#800020',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        Consulta
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}