import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { 
  agregarPersonaDependencia, 
  getPersonasDependencia, 
  enviarDependenciaAC3 
} from '../../../services/api';
import { calculateAgeFromIsoDate, getTodayIsoDate, isFutureIsoDate, isValidIsoDate } from '../../../utils/dateValidation';

import '../styles/DepPaso2.css';

const NUMERO_OFICIO_C3_BASE = 'CECSNSP/DGCECC/7724/2025';
const OFICIO_C3_SEGMENT_SIZES = [7, 6, 4, 4];

const formatNumeroOficioC3 = (rawValue = '') => {
  const cleanedValue = String(rawValue || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const parts = [];
  let cursor = 0;

  for (const size of OFICIO_C3_SEGMENT_SIZES) {
    if (cursor >= cleanedValue.length) break;
    const nextPart = cleanedValue.slice(cursor, cursor + size);
    if (!nextPart) break;
    parts.push(nextPart);
    cursor += size;
  }

  return parts.join('/');
};

/**
 * Paso 2 - Agregar personas y enviar a C3 (Dependencia)
 * Las dependencias agregan personas sin pre-validación.
 * Todos los puestos están disponibles (incluso fuera de competencia municipal).
 * Todas las personas agregadas se envían directamente a C3.
 */
export default function DepPaso2({ 
  solicitud, 
  puestos, 
  onCancel, 
  onComplete 
}) {
  const [personasAgregadas, setPersonasAgregadas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviandoC3, setEnviandoC3] = useState(false);
  const { showNotification } = useNotification();
  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    numero_oficio_c3: '',
    puesto_id: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (
        name === 'numero_oficio_c3'
          ? formatNumeroOficioC3(value)
          : ['nombre', 'apellido_paterno', 'apellido_materno'].includes(name)
            ? String(value || '').toUpperCase()
            : value
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_nacimiento: '',
      numero_oficio_c3: '',
      puesto_id: ''
    });
  };

  // Cargar personas existentes del trámite
  const cargarPersonas = async () => {
    if (!solicitud?.id) return;
    setLoading(true);
    try {
      const response = await getPersonasDependencia(solicitud.id);
      setPersonasAgregadas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersonas();
  }, [solicitud?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido_paterno) {
      showNotification('Nombre y apellido paterno son requeridos', 'error');
      return;
    }
    if (!formData.fecha_nacimiento) {
      showNotification('La fecha de nacimiento es requerida', 'error');
      return;
    }

    if (!isValidIsoDate(formData.fecha_nacimiento)) {
      showNotification('La fecha de nacimiento no es valida', 'error');
      return;
    }

    if (isFutureIsoDate(formData.fecha_nacimiento, todayIso)) {
      showNotification('La fecha de nacimiento no puede ser futura', 'error');
      return;
    }

    const edad = calculateAgeFromIsoDate(formData.fecha_nacimiento, todayIso);
    if (!Number.isFinite(edad) || edad < 18) {
      showNotification('La persona debe tener al menos 18 anos', 'error');
      return;
    }

    if (!formData.puesto_id) {
      showNotification('Debe seleccionar un puesto', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await agregarPersonaDependencia(solicitud.id, formData);
      await cargarPersonas();
      resetForm();
      showNotification('Persona agregada exitosamente', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al agregar persona', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar todas las personas a C3
  const handleEnviarAC3 = async () => {
    if (personasAgregadas.length === 0) {
      showNotification('Debe agregar al menos una persona', 'error');
      return;
    }
    if (!confirm(`¿Enviar ${personasAgregadas.length} persona(s) a C3 para dictamen?`)) return;

    setEnviandoC3(true);
    try {
      await enviarDependenciaAC3(solicitud.id);
      showNotification(`${personasAgregadas.length} persona(s) enviada(s) a C3 exitosamente`, 'success');
      onComplete();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al enviar a C3', 'error');
    } finally {
      setEnviandoC3(false);
    }
  };

  // Fase enviado o posterior = solo lectura
  const soloLectura = solicitud?.fase_actual && solicitud.fase_actual !== 'datos_solicitud';

  return (
    <div>
      <div className="info-box">
        <h4>👥 Agregar Personas a la Solicitud</h4>
        <p>Solicitud: <strong>{solicitud?.numero_solicitud || 'N/A'}</strong></p>
        <p>Municipio: <strong>{solicitud?.municipio_nombre || 'N/A'}</strong></p>
      </div>

      {/* Formulario agregar persona (solo si no se ha enviado) */}
      {!soloLectura && (
        <form onSubmit={handleSubmit} className="dep-form">
          <div className="dep-form-grid">
            <div className="dep-form-group">
              <label>Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required />
            </div>
            <div className="dep-form-group">
              <label>Apellido Paterno *</label>
              <input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} placeholder="Apellido Paterno" required />
            </div>
            <div className="dep-form-group">
              <label>Apellido Materno</label>
              <input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} placeholder="Apellido Materno" />
            </div>
            <div className="dep-form-group">
              <label>Fecha de Nacimiento *</label>
              <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} max={todayIso} required />
            </div>
            <div className="dep-form-group">
              <label>Número Oficio C3</label>
              <input type="text" name="numero_oficio_c3" value={formData.numero_oficio_c3} onChange={handleChange} placeholder={`Ej: ${NUMERO_OFICIO_C3_BASE}`} style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="dep-form-group">
              <label>Puesto *</label>
              <select name="puesto_id" value={formData.puesto_id} onChange={handleChange} required>
                <option value="">Seleccione un puesto...</option>
                {puestos.map(puesto => (
                  <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Agregando...' : '➕ Agregar Persona'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de personas */}
      {personasAgregadas.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h3>Personas Agregadas ({personasAgregadas.length})</h3>
          <table className="dep-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Fecha Nacimiento</th>
                <th>Puesto</th>
                <th>Oficio C3</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {personasAgregadas.map(persona => (
                <tr key={persona.id}>
                  <td>
                    {String(persona.nombre || '').toUpperCase()} {String(persona.apellido_paterno || '').toUpperCase()} {String(persona.apellido_materno || '').toUpperCase()}
                  </td>
                  <td>{persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString() : 'N/A'}</td>
                  <td>{persona.puesto_nombre || 'N/A'}</td>
                  <td>{persona.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : '—'}</td>
                  <td>
                    <span className={`dep-badge ${
                      persona.observaciones_c3 ? 'dep-badge-validado' :
                      persona.rechazado ? 'dep-badge-rechazado' :
                      'dep-badge-pendiente'
                    }`}>
                      {persona.observaciones_c3 ? '✓ Dictaminado' :
                       persona.rechazado ? '✗ Rechazado' :
                       '● Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="btn-group" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          ← Volver al Listado
        </button>
        {!soloLectura && personasAgregadas.length > 0 && (
          <button type="button" className="btn btn-success" onClick={handleEnviarAC3} disabled={enviandoC3}>
            {enviandoC3 ? 'Enviando...' : `📤 Enviar ${personasAgregadas.length} persona(s) a C3`}
          </button>
        )}
      </div>
    </div>
  );
}
