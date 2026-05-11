import LoadingScreen from '../../../components/ui/components/LoadingScreen';
import '../styles/DepListado.css';

/**
 * Listado de solicitudes de dependencia
 */
export default function DepListado({ 
  solicitudes, 
  loading, 
  onNuevaSolicitud, 
  onVerSolicitud 
}) {
  if (loading) {
    return <LoadingScreen message="Cargando solicitudes..." />;
  }

  if (solicitudes.length === 0) {
    return (
      <div className="dep-empty-state">
        <i className='bx bx-folder-open' style={{ fontSize: '48px', color: '#ccc' }}></i>
        <p>No hay solicitudes registradas</p>
        <button className="btn btn-primary" onClick={onNuevaSolicitud}>
          Crear primera solicitud
        </button>
      </div>
    );
  }

  const getFaseBadgeClass = (fase) => {
    const map = {
      'datos_solicitud': 'dep-badge-borrador',
      'validacion_personal': 'dep-badge-pendiente',
      'enviado_c3': 'dep-badge-enviado',
      'dictaminado_c3': 'dep-badge-validado',
      'validado_c3': 'dep-badge-validado',
      'rechazado_c3': 'dep-badge-rechazado',
      'finalizado': 'dep-badge-finalizado'
    };
    return map[fase] || 'dep-badge-pendiente';
  };

  const getFaseTexto = (fase) => {
    const map = {
      'datos_solicitud': 'Datos Solicitud',
      'validacion_personal': 'Agregar Personas',
      'enviado_c3': 'Enviado a C3',
      'dictaminado_c3': 'Dictaminado C3',
      'validado_c3': 'Validado C3',
      'rechazado_c3': 'Rechazado C3',
      'finalizado': 'Finalizado'
    };
    return map[fase] || fase;
  };

  return (
    <table className="dep-table">
      <thead>
        <tr>
          <th>Número Solicitud</th>
          <th>Municipio</th>
          <th>Fecha Solicitud</th>
          <th>Fase Actual</th>
          <th>Total Personas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {solicitudes.map(sol => (
          <tr key={sol.id}>
            <td>{sol.numero_solicitud || 'N/A'}</td>
            <td>{sol.municipio_nombre || 'N/A'}</td>
            <td>{sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleDateString() : 'N/A'}</td>
            <td>
              <span className={`dep-badge ${getFaseBadgeClass(sol.fase_actual)}`}>
                {getFaseTexto(sol.fase_actual)}
              </span>
            </td>
            <td className="text-center">{sol.total_personas || 0}</td>
            <td>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => onVerSolicitud(sol.id)}
              >
                Ver Detalles
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
