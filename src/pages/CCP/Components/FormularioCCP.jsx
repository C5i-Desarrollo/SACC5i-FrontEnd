import { useState } from 'react';
import ConfirmModalCCP from './ConfirmModalCCP';
import {
  DESTINATARIO_DEFAULT,
  VOLANTE_OPTIONS,
  buildAsunto,
  formatOficio,
  parseReferenciaVolante,
  hasReferenciaVolante,
  formatReferenciaVolante
} from './ccpHelpers';
import '../styles/FormularioCCP.css';

export default function FormularioCCP({
  form,
  setFormField,
  modoEdicion,
  setModoEdicion,
  guardando,
  guardar,
  onCancelar,
  editandoId,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEditarBtn = () => {
    if (modoEdicion) setShowConfirm(true);
    else setModoEdicion(true);
  };

  const handleConfirmGuardar = () => {
    setModoEdicion(false);
    setShowConfirm(false);
  };

  const toggleReferenciaVolante = (option) => {
    const actuales = new Set(parseReferenciaVolante(form.referencia_volante));

    if (actuales.has(option)) actuales.delete(option);
    else actuales.add(option);

    setFormField('referencia_volante', Array.from(actuales).join('|'));
  };

  const oficioPreview = formatOficio(form.numero_oficio_seq, form.anio, form.texto_prefijo);

  return (
    <>
      <ConfirmModalCCP
        visible={showConfirm}
        onConfirm={handleConfirmGuardar}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="ccp-form-card">
        <div className="ccp-form-titlebar">
          <div className="ccp-form-titlebar-left">
            <span className="ccp-form-badge"><i className="bx bxs-file-doc"></i></span>
            <div>
              <h2 className="ccp-form-titulo">{editandoId ? 'Editar oficio C.C.P.' : 'Nuevo oficio C.C.P.'}</h2>
              <p className="ccp-form-subtitulo">Campos con <span className="ccp-req">*</span> son requeridos</p>
            </div>
          </div>
          <div className="ccp-form-titlebar-actions">
            <button className="ccp-btn-back ccp-btn-back-top" onClick={onCancelar}>
              <i className="bx bx-arrow-back"></i> Regresar a tabla
            </button>
            <button
              className={`ccp-btn-editar-fixed ${modoEdicion ? 'activo' : ''}`}
              onClick={handleEditarBtn}
              title={modoEdicion ? 'Guardar cambios en campos fijos' : 'Editar campos fijos del formato'}
            >
              <i className={`bx ${modoEdicion ? 'bx-save' : 'bx-wrench'}`}></i>
              {modoEdicion ? 'GUARDAR CAMBIOS' : 'EDITAR FORMATO'}
            </button>
          </div>
        </div>

        <div className="ccp-section">
          <div className="ccp-section-header">
            <span className="ccp-section-num">1</span>
            <div><h3>Identificación del oficio</h3><p>Número, año y fecha de emisión</p></div>
          </div>
          <div className="ccp-grid-ident">
            <div className="ccp-field">
              <label>Número <span className="ccp-req">*</span></label>
              <input className="ccp-input" type="number" min="1" value={form.numero_oficio_seq}
                onChange={(e) => setFormField('numero_oficio_seq', e.target.value)} placeholder="0001" autoFocus />
            </div>
            <div className="ccp-field">
              <label>Año <span className="ccp-req">*</span></label>
              <input className="ccp-input" type="number" min="2020" max="2099" value={form.anio}
                onChange={(e) => setFormField('anio', e.target.value)} />
            </div>
            <div className="ccp-field">
              <label>Fecha <span className="ccp-req">*</span></label>
              <input className="ccp-input" type="date" value={form.fecha}
                onChange={(e) => setFormField('fecha', e.target.value)} />
            </div>
            {modoEdicion && (
              <div className="ccp-field">
                <label>Prefijo del formato</label>
                <input type="text" className="ccp-input ccp-input-fixed" value={form.texto_prefijo}
                  onChange={(e) => setFormField('texto_prefijo', e.target.value.toUpperCase())}
                  placeholder="SSP/SII/C5I/DT/" />
              </div>
            )}
          </div>
          {oficioPreview && (
            <div className="ccp-oficio-preview">
              <i className="bx bx-hash"></i>
              <span>Número de Oficio: <strong>{oficioPreview}</strong></span>
            </div>
          )}
        </div>

        <div className="ccp-section">
          <div className="ccp-section-header">
            <span className="ccp-section-num">2</span>
            <div><h3>Datos del destinatario</h3><p>Área, funcionario y cargo</p></div>
          </div>
          <div className="ccp-grid-col1">
            <div className="ccp-field">
              <label>Área / Dirección <span className="ccp-req">*</span></label>
              <input
                className={`ccp-input ${modoEdicion ? '' : 'ccp-input-locked'}`}
                type="text"
                value={form.area || DESTINATARIO_DEFAULT.area}
                onChange={(e) => setFormField('area', e.target.value.toUpperCase())}
                readOnly={!modoEdicion}
              />
            </div>
            <div className="ccp-field">
              <label>Funcionario <span className="ccp-req">*</span></label>
              <input
                className={`ccp-input ${modoEdicion ? '' : 'ccp-input-locked'}`}
                type="text"
                value={form.funcionario || DESTINATARIO_DEFAULT.funcionario}
                onChange={(e) => setFormField('funcionario', e.target.value.toUpperCase())}
                readOnly={!modoEdicion}
              />
            </div>
            <div className="ccp-field">
              <label>Cargo</label>
              <input
                className={`ccp-input ${modoEdicion ? '' : 'ccp-input-locked'}`}
                type="text"
                value={form.cargo || DESTINATARIO_DEFAULT.cargo}
                onChange={(e) => setFormField('cargo', e.target.value.toUpperCase())}
                readOnly={!modoEdicion}
              />
            </div>
          </div>
        </div>

        <div className="ccp-section">
          <div className="ccp-section-header">
            <span className="ccp-section-num">3</span>
            <div><h3>Asunto del oficio</h3><p>Constructor del texto del asunto oficial</p></div>
          </div>
          <div className="ccp-asunto-builder">
            <div className="ccp-asunto-item">
              {modoEdicion
                ? <input className="ccp-chip-input" type="text" value={form.texto_asunto1} onChange={(e) => setFormField('texto_asunto1', e.target.value.toUpperCase())} />
                : <span className="ccp-chip-label">{form.texto_asunto1}</span>}
            </div>
            <div className="ccp-asunto-item ccp-asunto-field-group">
              <label>No. oficio referencia</label>
              <input className="ccp-input ccp-asunto-input" type="text" value={form.oficio_referencia}
                onChange={(e) => setFormField('oficio_referencia', e.target.value.toUpperCase())} placeholder="PM/094/2025" />
            </div>
            <div className="ccp-asunto-item">
              {modoEdicion
                ? <input className="ccp-chip-input" type="text" value={form.texto_asunto2} onChange={(e) => setFormField('texto_asunto2', e.target.value.toUpperCase())} />
                : <span className="ccp-chip-label">{form.texto_asunto2}</span>}
            </div>
            <div className="ccp-asunto-item ccp-asunto-field-group">
              <label>Fecha de referencia</label>
              <input className="ccp-input ccp-asunto-input" type="date" value={form.fecha_referencia}
                onChange={(e) => setFormField('fecha_referencia', e.target.value)} />
            </div>
            <div className="ccp-asunto-item">
              {modoEdicion
                ? <input className="ccp-chip-input" type="text" value={form.texto_asunto3} onChange={(e) => setFormField('texto_asunto3', e.target.value.toUpperCase())} />
                : <span className="ccp-chip-label">{form.texto_asunto3}</span>}
            </div>
            <div className="ccp-asunto-item ccp-asunto-field-group">
              <label>Tipo de solicitud</label>
              <input
                className="ccp-input ccp-asunto-input"
                type="text"
                value={form.tipo_solicitud}
                onChange={(e) => setFormField('tipo_solicitud', e.target.value.toUpperCase())}
                placeholder=""
              />
            </div>
            <div className="ccp-asunto-item">
              {modoEdicion
                ? <input className="ccp-chip-input" type="text" value={form.texto_asunto4} onChange={(e) => setFormField('texto_asunto4', e.target.value.toUpperCase())} />
                : <span className="ccp-chip-label">{form.texto_asunto4}</span>}
            </div>
          </div>
          <div className="ccp-asunto-preview">
            <i className="bx bx-text"></i>
            <p>{buildAsunto(form)}</p>
          </div>
        </div>

        <div className="ccp-section ccp-section-last">
          <div className="ccp-section-header">
            <span className="ccp-section-num">4</span>
            <div><h3>Referencia de volante</h3><p>Puedes marcar una o ambas opciones según corresponda</p></div>
          </div>
          <div className="ccp-volante-group">
            {VOLANTE_OPTIONS.map((option) => (
              <label key={option.value} className="ccp-check-pill">
                <input
                  type="checkbox"
                  checked={hasReferenciaVolante(form.referencia_volante, option.value)}
                  onChange={() => toggleReferenciaVolante(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {hasReferenciaVolante(form.referencia_volante, 'folio') && (
              <input className="ccp-input ccp-folio-input" type="text" value={form.folio_numero}
                onChange={(e) => setFormField('folio_numero', e.target.value.toUpperCase())}
                placeholder="Número de folio" autoFocus />
            )}
            {hasReferenciaVolante(form.referencia_volante, 'volante') && (
              <input className="ccp-input ccp-folio-input" type="text" value={form.volante_numero}
                onChange={(e) => setFormField('volante_numero', e.target.value.toUpperCase())}
                placeholder="Número de volante" />
            )}
            <div className="ccp-volante-preview">
              {formatReferenciaVolante(form.referencia_volante, form.folio_numero, form.volante_numero)}
            </div>
          </div>
        </div>

        <div className="ccp-form-footer">
          <button className="ccp-btn-save" onClick={guardar} disabled={guardando}>
            {guardando
              ? <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</>
              : <><i className="bx bx-check-circle"></i> GUARDAR REGISTRO</>}
          </button>
        </div>
      </div>
    </>
  );
}
