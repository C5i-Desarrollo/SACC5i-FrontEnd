import { useCallback } from 'react';
import '../styles/CuipSeccion.css';

/**
 * CuipSeccion — Sección colapsable del checklist CUIP
 * Muestra una sección con sus campos y controles de validación
 */
export default function CuipSeccion({
  seccion,
  abierta,
  onToggle,
  onValidarCampo,
  onValidarSeccion,
  onMarcarExcepcion,
  esCompleta,
  esExcepcion,
  camposValidados,
  totalCampos,
  esCampoOpcional,
  disabled
}) {
  const handleCampoClick = useCallback((campoNum, validado) => {
    if (disabled) return;
    onValidarCampo(seccion.clave, campoNum, validado);
  }, [seccion.clave, onValidarCampo, disabled]);

  const handleExcepcion = useCallback((e) => {
    if (disabled) return;
    onMarcarExcepcion(seccion.clave, e.target.checked);
  }, [seccion.clave, onMarcarExcepcion, disabled]);

  const statusClass = esCompleta ? 'cuip-sec-completa' : 'cuip-sec-pendiente';
  const statusLabel = esCompleta ? 'VALIDADO' : 'PENDIENTE';

  return (
    <div className={`cuip-seccion ${statusClass} ${abierta ? 'abierta' : ''}`}>
      <div className="cuip-seccion-header" onClick={onToggle}>
        <div className="cuip-sec-left">
          <i className={`bx ${abierta ? 'bx-chevron-down' : 'bx-chevron-right'} cuip-sec-chevron`}></i>
          <span className="cuip-sec-nombre">{seccion.nombre}</span>
          {esExcepcion && (
            <span className="cuip-sec-excepcion-badge">NINGUNO</span>
          )}
        </div>

        <div className="cuip-sec-right">
          <span className="cuip-sec-progreso">{camposValidados}/{totalCampos}</span>
          <span className={`cuip-sec-status ${esCompleta ? 'validado' : 'pendiente'}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {abierta && (
        <div className="cuip-seccion-body">
          <div className="cuip-sec-toolbar">
            {seccion.tiene_excepcion && (
              <label className="cuip-sec-excepcion">
                <input
                  type="checkbox"
                  checked={seccion.excepcion_activa || false}
                  onChange={handleExcepcion}
                  disabled={disabled}
                />
                <span>NINGUNO / NINGUNA</span>
              </label>
            )}

            <button
              className={`cuip-sec-btn-validar ${esCompleta && totalCampos > 0 ? 'deseleccionar' : ''}`}
              onClick={() => onValidarSeccion(seccion.clave)}
              disabled={disabled || totalCampos === 0}
            >
              {esCompleta && totalCampos > 0
                ? <><i className='bx bx-x-circle'></i> Deseleccionar</>
                : <><i className='bx bx-check-double'></i> Validar sección</>
              }
            </button>
          </div>

          <div className="cuip-campos-grid">
            {seccion.campos.map((campo) => {
              const campoOpcional = esCampoOpcional?.(seccion, campo) || false;
              const campoNoAplica = campoOpcional && campo.validado !== true && campo.validado !== false;

              return (
                <div
                  key={campo.num}
                  className={`cuip-campo ${
                    campo.validado === true
                      ? 'validado'
                      : campo.validado === false
                        ? 'rechazado'
                        : campoNoAplica
                          ? 'opcional'
                          : 'sin-revisar'
                  }`}
                >
                  <span className="cuip-campo-num">({campo.num})</span>

                  <span className="cuip-campo-nombre">
                    {campo.nombre}
                    {campoOpcional && (
                      <small className="cuip-campo-opcional-label">Opcional</small>
                    )}
                  </span>

                  <div className="cuip-campo-acciones">
                    <button
                      className={`cuip-campo-btn validar ${campo.validado === true ? 'activo' : ''}`}
                      onClick={() => handleCampoClick(campo.num, campo.validado === true ? null : true)}
                      disabled={disabled}
                      title={campo.validado === true ? 'Quitar validación' : 'Validar'}
                    >
                      <i className='bx bx-check'></i>
                    </button>

                    {campoOpcional && (
                      <button
                        className={`cuip-campo-btn opcional ${campoNoAplica ? 'activo' : ''}`}
                        onClick={() => handleCampoClick(campo.num, null)}
                        disabled={disabled}
                        title="Marcar como opcional / no aplica"
                      >
                        <i className='bx bx-minus'></i>
                      </button>
                    )}

                    <button
                      className={`cuip-campo-btn rechazar ${campo.validado === false ? 'activo' : ''}`}
                      onClick={() => handleCampoClick(campo.num, campo.validado === false ? null : false)}
                      disabled={disabled}
                      title={campo.validado === false ? 'Quitar rechazo' : 'Rechazar'}
                    >
                      <i className='bx bx-x'></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}