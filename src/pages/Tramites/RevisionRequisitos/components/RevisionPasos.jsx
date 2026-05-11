import '../styles/RevisionPasos.css';

/**
 * Fases del proceso de trámite de alta.
 * Escalable: agregar nuevas fases aquí cuando se implementen.
 */
const FASES_TRAMITE = [
  { id: 1, label: 'Revisión de Requisitos' },
  { id: 2, label: 'Validación CUIP' },
  // { id: 3, label: 'Alta Completada' }, // ejemplo de expansión futura
];

/**
 * RevisionPasos - Barra de progreso de fases del trámite.
 * @param {number} pasoActual - ID de la fase activa (1=Revisión de Requisitos, 2=Validación CUIP...)
 */
export default function RevisionPasos({ pasoActual }) {
  return (
    <div className="rev-pasos">
      {FASES_TRAMITE.map((fase, idx) => {
        const completado = fase.id < pasoActual;
        const activo = fase.id === pasoActual;

        return (
          <div key={fase.id} className="rev-paso-item">
            {idx > 0 && (
              <div className={`rev-paso-linea${completado ? ' completada' : ''}`} />
            )}
            <div className={`rev-paso-circulo${activo ? ' activo' : ''}${completado ? ' completado' : ''}`}>
              {completado
                ? <i className="bx bx-check" />
                : idx + 1
              }
            </div>
            <span className={`rev-paso-label${activo ? ' activo' : ''}${completado ? ' completado-label' : ''}`}>
              {fase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
