import '../styles/RechazadoRow.css';
/**
 * Fila individual de persona rechazada con motivo editable
 */
import { useState } from 'react';
import { formatDate } from '../../../../utils/formatters';

export default function RechazadoRow({
  persona,
  onEditarMotivo,
  onGenerarOficio,
  readOnly = false,
  showOficioAction = true
}) {
  const [editando, setEditando] = useState(false);
  const [motivoTemp, setMotivoTemp] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    if (readOnly) return;
    setMotivoTemp(persona.motivo_especifico || '');
    setEditando(true);
  };

  const handleSave = async () => {
    if (!motivoTemp.trim()) return;
    setSaving(true);
    const ok = await onEditarMotivo(persona.id, motivoTemp.trim());
    setSaving(false);
    if (ok) setEditando(false);
  };

  const handleCancel = () => {
    setEditando(false);
    setMotivoTemp('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <tr>
      <td>
        <span className="rechazados-nombre">{persona.nombre_completo}</span>
        <span className="rechazados-puesto">{persona.puesto_solicitado}</span>
      </td>
      <td>
        <span className="rechazados-etapa">{persona.etapa_rechazo}</span>
      </td>
      <td>
        <div className="rechazados-motivo-container">
          {editando ? (
            <div className="rechazados-motivo-edit">
              <textarea
                value={motivoTemp}
                onChange={(e) => setMotivoTemp(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={saving}
              />
              <div className="rechazados-motivo-edit-actions">
                <button
                  className="rechazados-btn-save"
                  onClick={handleSave}
                  disabled={saving || !motivoTemp.trim()}
                  title="Guardar"
                >
                  <i className='bx bx-check'></i>
                </button>
                <button
                  className="rechazados-btn-cancel"
                  onClick={handleCancel}
                  disabled={saving}
                  title="Cancelar"
                >
                  <i className='bx bx-x'></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="rechazados-motivo-text" onClick={handleStartEdit} title={readOnly ? 'Solo lectura' : 'Click para editar'}>
              <span>{persona.motivo_especifico || 'Sin motivo especificado'}</span>
              {!readOnly && <i className='bx bx-edit-alt'></i>}
            </div>
          )}
        </div>
      </td>
      <td>
        <span className="rechazados-fecha">
          {formatDate(persona.updated_at)}
        </span>
      </td>
      <td>
        {showOficioAction ? (
          <button
            className="rechazados-btn-oficio"
            onClick={() => onGenerarOficio(persona.id)}
          >
            <i className='bx bx-download'></i>
            GENERAR OFICIO
          </button>
        ) : (
          <span className="rechazados-fecha">Solo lectura</span>
        )}
      </td>
    </tr>
  );
}
