import '../styles/C3PersonaRow.css';

const DICTAMEN_OPTIONS = [
  { value: '', label: 'En proceso' },
  { value: 'ALTA OK', label: 'ALTA OK' },
  { value: 'NO PUEDE SER DADO DE ALTA', label: 'No puede ser dado de alta' },
  { value: 'PENDIENTE', label: 'Pendiente' }
];

export default function C3PersonaRow({
  persona,
  isSelected,
  onToggleSeleccion,
  dictamenActual,
  onDictamenChange,
  observacion,
  onObservacionChange
}) {
  const formatFecha = (fecha) => {
    if (!fecha) return '--';
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  const getDictamenClass = () => {
    if (dictamenActual === 'ALTA OK') return 'c3r-dict-ok';
    if (dictamenActual === 'NO PUEDE SER DADO DE ALTA') return 'c3r-dict-rechazado';
    if (dictamenActual === 'PENDIENTE') return 'c3r-dict-pendiente';
    return 'c3r-dict-proceso';
  };

  return (
    <div className={`c3r-card ${isSelected ? 'c3r-card-selected' : ''}`}>
      {/* Checkbox */}
      <div className="c3r-check">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSeleccion}
        />
      </div>

      {/* Contenido principal */}
      <div className="c3r-content">
        {/* Fila 1: Datos principales */}
        <div className="c3r-row-main">
          <div className="c3r-field">
            <span className="c3r-label">Region / Dependencia</span>
            <span className="c3r-value">{persona.region_nombre || '--'}</span>
            {persona.es_tramite_dependencia ? (
              <small className="c3r-origin-dep">{persona.dependencia_nombre || '--'}</small>
            ) : (
              <small className="c3r-origin-c5">C5</small>
            )}
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Corporacion / Municipio</span>
            <span className="c3r-value">{persona.municipio_nombre || '--'}</span>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Tipo de Movimiento</span>
            <span className="c3r-movimiento">{persona.proceso_movimiento || 'ALTA'}</span>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Fecha Solicitud</span>
            <span className="c3r-value">{formatFecha(persona.fecha_solicitud)}</span>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Fecha Nacimiento</span>
            <span className="c3r-value">{formatFecha(persona.fecha_nacimiento)}</span>
          </div>
        </div>

        {/* Fila 2: Nombre, Oficio, Dictamen, Puesto, Obs */}
        <div className="c3r-row-main c3r-row-bottom">
          <div className="c3r-field">
            <span className="c3r-label">Nombre del Elemento</span>
            <span className="c3r-value c3r-nombre">{persona.nombre_completo}</span>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">No. Oficio C3</span>
            <span className="c3r-value">{persona.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : '--'}</span>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Dictamen C3</span>
            <select
              value={dictamenActual}
              onChange={(e) => onDictamenChange(e.target.value)}
              className={`c3r-dictamen-select ${getDictamenClass()}`}
            >
              {DICTAMEN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="c3r-field">
            <span className="c3r-label">Puesto Validado</span>
            <span className="c3r-value c3r-puesto">{persona.puesto_nombre || '--'}</span>
          </div>

          <div className="c3r-field c3r-field-obs">
            <span className="c3r-label">Observaciones C3</span>
            <input
              type="text"
              placeholder="Escriba sus observaciones..."
              value={observacion}
              onChange={(e) => onObservacionChange(e.target.value)}
              className="c3r-obs-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}