import { useState } from 'react';
import '../styles/DepPaso1.css';

/**
 * Paso 1 - Crear solicitud de dependencia
 * Formulario simplificado: solo tipo de movimiento y municipio
 */
export default function DepPaso1({ 
  tiposOficio, 
  municipios, 
  onSubmit, 
  onCancel, 
  submitting 
}) {
  const [formData, setFormData] = useState({
    tipo_oficio_id: '',
    municipio_id: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tipo_oficio_id) return;
    if (!formData.municipio_id) return;
    onSubmit({
      tipo_oficio_id: parseInt(formData.tipo_oficio_id),
      municipio_id: parseInt(formData.municipio_id)
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="dep-form">
        <div className="info-box">
          <h4>📝 Nueva Solicitud de Dependencia</h4>
          <p>Complete los datos de la solicitud. La dependencia y fecha se asignan automáticamente.</p>
        </div>

        <div className="dep-form-grid">
          <div className="dep-form-group">
            <label>Tipo de Movimiento *</label>
            <select 
              name="tipo_oficio_id" 
              value={formData.tipo_oficio_id} 
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              {tiposOficio.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>

          <div className="dep-form-group">
            <label>Corporación / Municipio *</label>
            <select 
              name="municipio_id" 
              value={formData.municipio_id} 
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              {municipios.map(mun => (
                <option key={mun.id} value={mun.id}>{mun.nombre}</option>
              ))}
            </select>
          </div>

          <div className="dep-form-group">
            <label>Fecha de Solicitud</label>
            <input 
              type="date" 
              value={new Date().toISOString().split('T')[0]}
              disabled 
              className="input-disabled"
            />
          </div>
        </div>

        <div className="btn-group">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            ← Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Solicitud →'}
          </button>
        </div>
      </form>
    </div>
  );
}
