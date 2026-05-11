import { Fragment } from 'react';
import '../styles/AltaPasos.css';

/**
 * Componente de indicador de pasos
 * Muestra visualmente en qué paso del proceso está el usuario
 */
export default function AltaPasos({ currentStep }) {
  const pasos = [
    
  ];

  const getStepStatus = (pasoId) => {
    if (currentStep === pasoId) return 'paso-activo';
    // Si currentStep es paso2 y el paso actual es paso1, marcar como completado
    if (currentStep === 'paso2' && pasoId === 'paso1') return 'paso-completado';
    return '';
  };

  return (
    <div className="pasos-indicador">
      {pasos.map((paso, index) => (
        <Fragment key={paso.id}>
          <div className={`paso ${getStepStatus(paso.id)}`}>
            <div className="paso-numero">{paso.numero}</div>
            <div className="paso-texto">{paso.texto}</div>
          </div>
          {index < pasos.length - 1 && (
            <div className="paso-linea"></div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
