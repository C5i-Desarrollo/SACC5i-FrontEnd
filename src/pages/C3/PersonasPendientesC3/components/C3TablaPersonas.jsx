import C3PersonaRow from './C3PersonaRow';
import '../styles/C3TablaPersonas.css';

export default function C3TablaPersonas({
  personas,
  seleccionadas,
  onToggleSeleccion,
  onToggleSeleccionarTodas,
  dictamenes,
  onDictamenChange,
  observaciones,
  onObservacionChange
}) {
  if (personas.length === 0) {
    return (
      <div className="c3t-empty">
        <i className='bx bx-check-circle'></i>
        <p>No hay personas pendientes de dictamen</p>
      </div>
    );
  }

  return (
    <div className="c3t-list">
      <div className="c3t-list-header">
        <label className="c3t-select-all">
          <input
            type="checkbox"
            checked={personas.length > 0 && seleccionadas.size === personas.length}
            onChange={onToggleSeleccionarTodas}
          />
          <span>Seleccionar todas</span>
        </label>
        <span className="c3t-list-count">{personas.length} solicitudes en cola de validacion</span>
      </div>

      {personas.map(persona => (
        <C3PersonaRow
          key={persona.id}
          persona={persona}
          isSelected={seleccionadas.has(persona.id)}
          onToggleSeleccion={() => onToggleSeleccion(persona.id)}
          dictamenActual={dictamenes[persona.id] || ''}
          onDictamenChange={(value) => onDictamenChange(persona.id, value)}
          observacion={observaciones[persona.id] || ''}
          onObservacionChange={(value) => onObservacionChange(persona.id, value)}
        />
      ))}
    </div>
  );
}