import '../styles/EnProcesoTabla.css';

// Lógica de motivo mantenida (no se muestra en tabla pero está disponible para uso futuro)
const _getMotivoBadge = (persona) => {
  if (persona.tipo_fase === 'cuip') return { text: 'Validación CUIP', className: 'ep-motivo-cuip' };
  const fase = persona.fase_revision;
  if (fase === 'en_proceso') return { text: 'Consulta en RNPSP', className: 'ep-motivo-rnpsp' };
  if (fase === 'antecedentes') return { text: 'Consulta en SUIC', className: 'ep-motivo-suic' };
  if (fase === 'documentos') return { text: 'Consulta en SIM', className: 'ep-motivo-sim' };
  return { text: 'En revisión', className: 'ep-motivo-default' };
};

const getFaseBadge = (persona) => {
  if (persona.tipo_fase === 'cuip') return { label: 'Validación CUIP', className: 'ep-fase-cuip' };
  return { label: 'Revisión de Requisitos', className: 'ep-fase-revision' };
};

const getTiempoInfo = (segundos) => {
  if (!segundos || segundos < 600)
    return { className: 'ep-tiempo-verde', icon: 'bx-time' };
  if (segundos < 3600)
    return { className: 'ep-tiempo-amarillo', icon: 'bx-time-five' };
  if (segundos < 86400)
    return { className: 'ep-tiempo-rojo', icon: 'bx-alarm-exclamation' };
  return { className: 'ep-tiempo-critico', icon: 'bx-error-circle' };
};

const getOrigenBadge = (persona) => {
  if (persona.es_tramite_dependencia)
    return { label: 'Dependencia', className: 'ep-origen-dependencia' };
  return { label: 'Municipio', className: 'ep-origen-municipio' };
};

export default function EnProcesoTabla({ personas, loading, onContinuar, formatTiempo, readOnly = false }) {
  if (loading) {
    return <div className="ep-loading">Cargando expedientes en proceso...</div>;
  }

  if (personas.length === 0) {
    return (
      <div className="ep-empty">
        <i className='bx bx-folder-open'></i>
        <p>No hay expedientes en proceso de revisión</p>
      </div>
    );
  }

  return (
    <div className="ep-table-wrapper">
      <table className="ep-table">
        <thead>
          <tr>
            <th>Nombre del elemento</th>
            <th>Origen</th>
            <th>Municipio</th>
            <th>Oficio C3</th>
            <th>Tiempo</th>
            <th>Fase Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personas.map(persona => {
            const faseBadge = getFaseBadge(persona);
            const tiempoInfo = getTiempoInfo(persona.segundos_en_revision);
            const origenBadge = getOrigenBadge(persona);
            return (
              <tr key={persona.id}>
                <td>
                  <div className="ep-nombre-cell">
                    <span className="ep-nombre">{persona.nombre_completo}</span>
                    <span className="ep-puesto">{persona.puesto_nombre || '—'}</span>
                  </div>
                </td>
                <td>
                  <span className={`ep-origen-badge ${origenBadge.className}`}>
                    {origenBadge.label}
                  </span>
                </td>
                <td>
                  <span className="ep-municipio">{persona.municipio_nombre || '—'}</span>
                </td>
                <td>
                  <span className="ep-oficio-c3">
                    {persona.numero_oficio_c3
                      ? String(persona.numero_oficio_c3).toUpperCase()
                      : <span className="ep-oficio-vacio">—</span>}
                  </span>
                </td>
                <td>
                  <div className={`ep-tiempo-cell ${tiempoInfo.className}`}>
                    <i className={`bx ${tiempoInfo.icon}`}></i>
                    <span>
                      {persona.segundos_en_revision > 0
                        ? formatTiempo(persona.segundos_en_revision)
                        : 'Reciente'}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`ep-fase-badge ${faseBadge.className}`}>
                    {faseBadge.label}
                  </span>
                </td>
                <td>
                  {readOnly ? (
                    <span className="ep-oficio-vacio">Solo lectura</span>
                  ) : (
                    <button
                      className="ep-btn-continuar"
                      onClick={() => onContinuar(persona)}
                    >
                      <i className='bx bx-edit-alt'></i> CONTINUAR
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}