import { MdTipsAndUpdates } from 'react-icons/md';

export default function BajaRegistroSection({
  registroSeleccionado,
  tipoBoxRef,
  tipoQuery,
  onTipoQueryChange,
  onOpenTipos,
  openTipos,
  tiposFiltrados,
  onSeleccionarTipo,
  tipoSeleccionado,
  motivoBoxRef,
  motivoQuery,
  onMotivoQueryChange,
  onOpenMotivos,
  openMotivos,
  motivosFiltrados,
  onSeleccionarMotivo,
  motivoSeleccionado,
  tipoSinMotivos,
  numeroOficioMunicipio,
  onNumeroOficioMunicipioChange,
  fechaBaja,
  onFechaBajaChange,
  observaciones,
  onObservacionesChange,
  onRegistrarBaja,
  savingBaja
}) {
  const nombreCompletoSeleccionado = registroSeleccionado
    ? [
      registroSeleccionado.nombre_elemento,
      registroSeleccionado.apellido_paterno,
      registroSeleccionado.apellido_materno
    ].filter(Boolean).join(' ')
    : '';

  return (
    <section className="baja-card baja-registro-card">
      <div className="baja-card-header">
        <h3>Registrar baja del elemento seleccionado</h3>
        <p>Tipo y motivo se seleccionan desde el catalogo oficial. No se permite captura manual fuera del catalogo.</p>
      </div>

      <div className="baja-info-chip">
        <MdTipsAndUpdates />
        <span>Use el autocompletado para evitar errores: solo se admiten valores oficiales del catalogo.</span>
      </div>

      <div className="baja-selected-persona">
        {registroSeleccionado ? (
          <>
            <strong>{nombreCompletoSeleccionado || registroSeleccionado.nombre_elemento}</strong>
            <span>{registroSeleccionado.municipio_nombre || 'Sin municipio'} | CUIP: {registroSeleccionado.cuip || '---'}</span>
          </>
        ) : (
          <span>Seleccione una persona de la tabla superior para iniciar el registro de baja.</span>
        )}
      </div>

      <div className="baja-form-grid">
        <div className="form-group" ref={tipoBoxRef}>
          <label>Tipo de baja</label>
          <input
            type="text"
            className="input-field"
            value={tipoQuery}
            onChange={(e) => onTipoQueryChange(e.target.value)}
            onFocus={onOpenTipos}
            placeholder="Buscar tipo de baja"
          />
          {openTipos && (
            <div className="baja-autocomplete-list">
              {tiposFiltrados.length === 0 ? (
                <div className="baja-autocomplete-empty">Sin coincidencias</div>
              ) : (
                tiposFiltrados.map((tipo) => (
                  <button key={tipo} type="button" className="baja-autocomplete-item" onClick={() => onSeleccionarTipo(tipo)}>
                    {tipo}
                  </button>
                ))
              )}
            </div>
          )}
          {!tipoSeleccionado && tipoQuery && (
            <small className="baja-help-error">Seleccione un tipo de la lista.</small>
          )}
        </div>

        <div className="form-group" ref={motivoBoxRef}>
          <label>Motivo de baja</label>
          <input
            type="text"
            className="input-field"
            value={motivoQuery}
            onChange={(e) => onMotivoQueryChange(e.target.value)}
            onFocus={onOpenMotivos}
            placeholder={tipoSeleccionado ? 'Buscar motivo de baja' : 'Primero seleccione tipo'}
            disabled={!tipoSeleccionado || tipoSinMotivos}
          />
          {tipoSinMotivos && (
            <small className="baja-help-muted">Este tipo no tiene motivos hijos; se tomara el mismo valor del tipo.</small>
          )}
          {!tipoSinMotivos && openMotivos && tipoSeleccionado && (
            <div className="baja-autocomplete-list">
              {motivosFiltrados.length === 0 ? (
                <div className="baja-autocomplete-empty">Sin coincidencias</div>
              ) : (
                motivosFiltrados.map((motivo) => (
                  <button key={motivo} type="button" className="baja-autocomplete-item" onClick={() => onSeleccionarMotivo(motivo)}>
                    {motivo}
                  </button>
                ))
              )}
            </div>
          )}
          {!tipoSinMotivos && tipoSeleccionado && !motivoSeleccionado && motivoQuery && (
            <small className="baja-help-error">Seleccione un motivo de la lista.</small>
          )}
        </div>

        <div className="form-group">
          <label>Numero del oficio del municipio</label>
          <input
            type="text"
            className="input-field"
            value={numeroOficioMunicipio}
            onChange={(e) => onNumeroOficioMunicipioChange(e.target.value)}
            placeholder="Ingrese numero de oficio"
          />
        </div>

        <div className="form-group">
          <label>Fecha de baja</label>
          <input type="date" className="input-field" value={fechaBaja} onChange={(e) => onFechaBajaChange(e.target.value)} />
        </div>

        <div className="form-group form-span-2">
          <label>Observaciones</label>
          <textarea
            className="input-field"
            rows="3"
            value={observaciones}
            onChange={(e) => onObservacionesChange(e.target.value)}
            placeholder="Comentarios opcionales sobre la baja"
          />
        </div>
      </div>

      <div className="baja-action-row">
        <button type="button" className="btn-process" onClick={onRegistrarBaja} disabled={savingBaja}>
          {savingBaja ? 'Registrando...' : 'Registrar baja'}
        </button>
      </div>
    </section>
  );
}
