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
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #ddd'
      }}
    >
      <h2 style={{ marginBottom: '20px', color: '#800020' }}>
        Consulta de finalizados
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#800020', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>No.</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Municipio</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Personas finalizadas</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#777'
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
                    borderBottom: '1px solid #eee',
                    backgroundColor: activo ? '#f8e8ee' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px' }}>{index + 1}</td>

                  <td style={{ padding: '12px' }}>
                    {item.municipio_nombre || 'Sin municipio'}
                  </td>

                  <td style={{ padding: '12px' }}>
                    {item.total_personas ?? 0}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onConsultarMunicipio?.(item)}
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
  );
}