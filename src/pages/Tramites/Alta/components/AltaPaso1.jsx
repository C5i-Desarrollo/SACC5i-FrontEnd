import { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import { useAltaForm } from '../../../../hooks/alta/useAltaForm';
import { useNotification } from '../../../../context/NotificationContext';
import { FiFileText } from 'react-icons/fi';
import { getTodayIsoDate, isFutureIsoDate, isValidIsoDate } from '../../../../utils/dateValidation';
import BirthDatePicker from './BirthDatePicker';
import '../styles/AltaPaso1.css';


const NUMERO_OFICIO_C5_EJEMPLO = 'SSP/SII/C5I/DT/3263/2026';
const OFICIO_C5_SEGMENT_SIZES = [3, 3, 3, 2, 4, 4];

const formatNumeroOficioC5 = (rawValue = '') => {
  const cleanedValue = String(rawValue || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const parts = [];
  let cursor = 0;

  for (const size of OFICIO_C5_SEGMENT_SIZES) {
    if (cursor >= cleanedValue.length) break;
    const nextPart = cleanedValue.slice(cursor, cursor + size);
    if (!nextPart) break;
    parts.push(nextPart);
    cursor += size;
  }

  return parts.join('/');
};

/**
 * Componente Paso 1 - Nueva Solicitud
 * Formulario para crear nueva solicitud de alta
 */
export default function AltaPaso1({ 
  tiposOficio,
  regiones = [],
  municipios,
  mostrarSelectorRegion = false,
  selectedRegionId = '',
  onSelectedRegionChange,
  initialData,
  hasPendingDraft = false,
  onSubmit,
  onDraftChange,
  onUnsavedChangesChange,
  onBack,
  onNext,
  nextEnabled = false,
  onCancel,
  submitting 
}) {
  const defaultValues = useMemo(() => ({
    region_id: '',
    tipo_documento: 'Oficio',
    tipo_oficio_id: '1',
    municipio_id: '',
    numero_oficio_c5: '',
    proceso_movimiento: 'ALTA',
    termino: 'Normal',
    dias_horas: 'Dias',
    fecha_sello_c5: '',
    fecha_recibido_dt: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    observaciones: ''
  }), []);

  const { formData, handleChange, getFieldProps, reset, setValue } = useAltaForm(defaultValues);
  const { showNotification } = useNotification();
  const [pendingAction, setPendingAction] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const lastHydratedSignatureRef = useRef('');
  const baselineSignatureRef = useRef('');
  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const normalizedInitialData = useMemo(
    () => ({
      ...defaultValues,
      ...(initialData || {}),
      numero_oficio_c5: formatNumeroOficioC5(initialData?.numero_oficio_c5 || '')
    }),
    [defaultValues, initialData]
  );

  const handleNumeroOficioC5Change = (event) => {
    const maskedValue = formatNumeroOficioC5(event?.target?.value || '');
    setValue('numero_oficio_c5', maskedValue);
  };

  const municipiosIds = useMemo(
    () => new Set((municipios || []).map((municipio) => String(municipio.id))),
    [municipios]
  );
  const opcionesMunicipios = useMemo(
  () =>
    (municipios || []).map((municipio) => ({
      value: String(municipio.id),
      label: municipio.nombre,
    })),
  [municipios]
);

const municipioSeleccionado = useMemo(
  () =>
    opcionesMunicipios.find(
      (opcion) => opcion.value === String(formData.municipio_id || '')
    ) || null,
  [opcionesMunicipios, formData.municipio_id]
);



  useEffect(() => {
    const incomingSignature = JSON.stringify(normalizedInitialData);
    const currentFormSignature = JSON.stringify(formData);
    const isInSync = incomingSignature === currentFormSignature;
    const isHydratedWithIncoming = incomingSignature === lastHydratedSignatureRef.current;

    if (isInSync || isHydratedWithIncoming) {
      if (!lastHydratedSignatureRef.current) {
        lastHydratedSignatureRef.current = incomingSignature;
      }
      if (!baselineSignatureRef.current) {
        baselineSignatureRef.current = currentFormSignature;
      }
      return;
    }

    reset(normalizedInitialData);
    lastHydratedSignatureRef.current = incomingSignature;
    baselineSignatureRef.current = incomingSignature;
  }, [normalizedInitialData, formData, reset]);

  useEffect(() => {
    if (!mostrarSelectorRegion) return;
    const regionExterna = selectedRegionId ? String(selectedRegionId) : '';
    if ((formData.region_id || '') !== regionExterna) {
      setValue('region_id', regionExterna);
    }
  }, [mostrarSelectorRegion, selectedRegionId, formData.region_id, setValue]);

  useEffect(() => {
    if (!formData.municipio_id) return;
    if (!municipiosIds.has(String(formData.municipio_id))) {
      setValue('municipio_id', '');
    }
  }, [municipiosIds, formData.municipio_id, setValue]);

  const emitDraft = (nextData = formData) => {
    if (typeof onDraftChange === 'function') {
      onDraftChange(nextData);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    const currentSignature = JSON.stringify(formData);
    return currentSignature !== baselineSignatureRef.current;
  }, [formData]);

  const shouldWarnOnExit = hasUnsavedChanges || hasPendingDraft;

  useEffect(() => {
    if (typeof onUnsavedChangesChange === 'function') {
      onUnsavedChangesChange(shouldWarnOnExit);
    }
  }, [shouldWarnOnExit, onUnsavedChangesChange]);

  useEffect(() => {
    return () => {
      if (typeof onUnsavedChangesChange === 'function') {
        onUnsavedChangesChange(false);
      }
    };
  }, [onUnsavedChangesChange]);

  const requestNavigationWithGuard = (action) => {
    if (submitting) return;
    if (shouldWarnOnExit) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
      return;
    }
    action();
  };

  const handleConfirmLeave = () => {
    const action = pendingAction;
    setShowUnsavedModal(false);
    setPendingAction(null);
    if (typeof action === 'function') {
      action();
    }
  };

  const handleCloseLeaveModal = () => {
    setShowUnsavedModal(false);
    setPendingAction(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (mostrarSelectorRegion && !formData.region_id) {
      showNotification('Debe seleccionar una region', 'error');
      return;
    }

    if (!formData.municipio_id) {
      showNotification('Debe seleccionar un municipio', 'error');
      return;
    }
    if (!formData.fecha_solicitud) {
      showNotification('La fecha de solicitud es requerida', 'error');
      return;
    }

    if (!isValidIsoDate(formData.fecha_solicitud)) {
      showNotification('La fecha de solicitud no es valida', 'error');
      return;
    }

    if (isFutureIsoDate(formData.fecha_solicitud, todayIso)) {
      showNotification('La fecha de solicitud no puede ser futura', 'error');
      return;
    }

    const numeroOficioC5Normalizado = formatNumeroOficioC5(formData.numero_oficio_c5 || '');
    if (numeroOficioC5Normalizado && !/^[A-Z0-9/]+$/.test(numeroOficioC5Normalizado)) {
      showNotification('El numero de oficio C5 solo puede contener letras, numeros y diagonales', 'error');
      return;
    }

    if (formData.fecha_sello_c5) {
      if (!isValidIsoDate(formData.fecha_sello_c5)) {
        showNotification('La fecha de sello C5 no es valida', 'error');
        return;
      }
      if (isFutureIsoDate(formData.fecha_sello_c5, todayIso)) {
        showNotification('La fecha de sello C5 no puede ser futura', 'error');
        return;
      }
    }

    if (formData.fecha_recibido_dt) {
      if (!isValidIsoDate(formData.fecha_recibido_dt)) {
        showNotification('La fecha de recibido DT no es valida', 'error');
        return;
      }
      if (isFutureIsoDate(formData.fecha_recibido_dt, todayIso)) {
        showNotification('La fecha de recibido DT no puede ser futura', 'error');
        return;
      }
    }

    const payload = {
      ...formData,
      numero_oficio_c5: numeroOficioC5Normalizado
    };

    emitDraft(payload);
    onSubmit(payload);
  };

  // Lógica especial para término/días_horas
  const handleTerminoChange = (e) => {
    const { value } = e.target;
    handleChange(e);
    
    // Si selecciona "Sin termino", establecer días_horas a "Normal"
    if (value === 'Sin termino') {
      const event = {
        target: {
          name: 'dias_horas',
          value: 'Normal'
        }
      };
      handleChange(event);
    }
  };

  const getInputClass = (name, extraClass = '') => {
    const isFilled = String(formData[name] || '').trim() !== '';
    return `alta-field ${isFilled ? 'alta-field-filled' : ''} ${extraClass}`.trim();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="alta-form">
        <div className="paso1-top-nav">
          <button
            type="button"
            className="btn-volver-listado"
            onClick={() => requestNavigationWithGuard(onBack || onCancel)}
            disabled={submitting}
          >
            <i className='bx bx-left-arrow-alt'></i> Regresar
          </button>
          <button
            type="button"
            className="btn-siguiente-listado"
            onClick={() => {
              emitDraft();
              if (typeof onNext === 'function') onNext();
            }}
            disabled={!nextEnabled || submitting}
          >
            Siguiente <i className='bx bx-right-arrow-alt'></i>
          </button>
        </div>

        <div className="alta-solicitud-head">
          <h4>
            <span className="alta-solicitud-icon-wrap">
              <FiFileText className="alta-solicitud-icon" />
            </span>
            Información de la Solicitud
          </h4>
          <p>
            Registre los datos clave del trámite para iniciar el alta de forma clara,
            completa y sin omisiones.
          </p>
        </div>

        <div className="alta-form-grid">
          {mostrarSelectorRegion && (
            <div className="alta-form-group">
              <label htmlFor="region_id">Region *</label>
              <select
                id="region_id"
                name="region_id"
                value={formData.region_id || ''}
                onChange={(e) => {
                  handleChange(e);
                  if (typeof onSelectedRegionChange === 'function') {
                    onSelectedRegionChange(e.target.value || '');
                  }
                }}
                className={getInputClass('region_id')}
                required
                disabled={submitting}
              >
                <option value="">Seleccione region...</option>
                {regiones.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de Documento */}
          <div className="alta-form-group">
            <label htmlFor="tipo_documento">Tipo de Documento *</label>
            <select id="tipo_documento" {...getFieldProps('tipo_documento')} className={getInputClass('tipo_documento')} required>
              <option value="Oficio">Oficio</option>
              <option value="Volante">Volante</option>
              <option value="Folio">Folio</option>
            </select>
          </div>

          {/* Tipo de Oficio */}
          <div className="alta-form-group">
            <label htmlFor="tipo_oficio_id">Tipo de Oficio *</label>
            <select id="tipo_oficio_id" {...getFieldProps('tipo_oficio_id')} className={getInputClass('tipo_oficio_id')} required>
              <option value="">Seleccione...</option>
              {tiposOficio.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Municipio */}
          <div className="alta-form-group">
            <label htmlFor="municipio_id">Municipio *</label>

<Select
  inputId="municipio_id"
  name="municipio_id"
  className={`alta-select-municipio ${
  formData.municipio_id
    ? 'alta-select-municipio-filled'
    : ''
}`}
  classNamePrefix="municipio-select"
  options={opcionesMunicipios}
  value={municipioSeleccionado}
  onChange={(opcion) =>
    setValue('municipio_id', opcion?.value || '')
  }
  placeholder="Buscar o seleccionar municipio..."
  noOptionsMessage={() => 'Municipio no encontrado'}
  isSearchable
  isClearable
  isDisabled={submitting}
  menuPosition="fixed"
  menuPortalTarget={
    typeof document !== 'undefined'
      ? document.body
      : undefined
  }
  styles={{
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  }}
/>


          </div>

          {/* Número de Solicitud */}
          <div className="alta-form-group">
            <label htmlFor="numero_oficio_c5">Número de Solicitud</label>
            <input
              id="numero_oficio_c5"
              name="numero_oficio_c5"
              type="text"
              value={formData.numero_oficio_c5 || ''}
              onChange={handleChange}
              className={getInputClass('numero_oficio_c5')}
              placeholder="Ingrese el número de solicitud"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              maxLength={100}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {/* Proceso/Movimiento */}
          <div className="alta-form-group">
            <label htmlFor="proceso_movimiento">Proceso/Movimiento</label>
            <input 
              id="proceso_movimiento"
              name="proceso_movimiento"
              type="text" 
              value="ALTA" 
              disabled 
              className={getInputClass('proceso_movimiento', 'input-disabled')}
            />
          </div>

          {/* Término */}
          <div className="alta-form-group">
            <label htmlFor="termino">Término</label>
            <select 
              id="termino"
              name="termino"
              value={formData.termino}
              onChange={handleTerminoChange}
              className={getInputClass('termino')}
            >
              <option value="Sin termino">Sin termino</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* Días/Horas */}
          <div className="alta-form-group">
            <label htmlFor="dias_horas">Días/Horas</label>
            <select 
              id="dias_horas"
              {...getFieldProps('dias_horas')}
              className={getInputClass('dias_horas')}
              disabled={formData.termino === 'Sin termino'}
            >
              <option value="Normal">Normal</option>
              <option value="Dias">Días</option>
              <option value="Horas">Horas</option>
            </select>
          </div>

          {/* Fecha Sello C5 */}
          <div className="alta-form-group">
            <label htmlFor="fecha_sello_c5">Fecha Sello C5</label>
            <BirthDatePicker
              id="fecha_sello_c5"
              name="fecha_sello_c5"
              value={formData.fecha_sello_c5}
              onChangeIso={(isoDate) => setValue('fecha_sello_c5', isoDate)}
              className={getInputClass('fecha_sello_c5')}
              maxIsoDate={todayIso}
              emptyOpenToIsoDate={todayIso}
              required={false}
            />
          </div>

          {/* Fecha Recibido DT */}
          <div className="alta-form-group">
            <label htmlFor="fecha_recibido_dt">Fecha Recibido DT</label>
            <BirthDatePicker
              id="fecha_recibido_dt"
              name="fecha_recibido_dt"
              value={formData.fecha_recibido_dt}
              onChangeIso={(isoDate) => setValue('fecha_recibido_dt', isoDate)}
              className={getInputClass('fecha_recibido_dt')}
              maxIsoDate={todayIso}
              emptyOpenToIsoDate={todayIso}
              required={false}
            />
          </div>

          {/* Fecha Solicitud */}
          <div className="alta-form-group">
            <label htmlFor="fecha_solicitud">Fecha Solicitud *</label>
            <BirthDatePicker
              id="fecha_solicitud"
              name="fecha_solicitud"
              value={formData.fecha_solicitud}
              onChangeIso={(isoDate) => setValue('fecha_solicitud', isoDate)}
              className={getInputClass('fecha_solicitud')}
              maxIsoDate={todayIso}
              emptyOpenToIsoDate={todayIso}
              required
            />
          </div>

          {/* Observaciones */}
          <div className="alta-form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="observaciones">Observaciones</label>
            <textarea 
              id="observaciones"
              {...getFieldProps('observaciones')}
              className={getInputClass('observaciones')}
              rows="3"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-secondary alta-paso1-btn-cancelar" 
            onClick={() => requestNavigationWithGuard(onCancel)}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn alta-paso1-btn-guardar"
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </div>
      </form>

      {showUnsavedModal && (
        <div className="alta-confirm-overlay" role="dialog" aria-modal="true" aria-label="Cambios pendientes">
          <div className="alta-confirm-card">
            <div className="alta-confirm-head">
              <h4>Cambios pendientes sin guardar</h4>
            </div>
            <div className="alta-confirm-body">
              <p>
                Desea regresar o cancelar esta solicitud? Tiene cambios pendientes sin guardar y se perderan.
              </p>
            </div>
            <div className="alta-confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCloseLeaveModal}>
                Permanecer
              </button>
              <button type="button" className="btn alta-confirm-danger" onClick={handleConfirmLeave}>
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
