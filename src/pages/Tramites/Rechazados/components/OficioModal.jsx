/**
 * Modal para previsualizar y descargar oficio de rechazo
 */
import { generarHTMLOficio } from '../utils/oficioTemplate';
import '../styles/OficioModal.css';

export default function OficioModal({ oficio, onClose }) {
  if (!oficio) return null;

  const handleDescargar = () => {
    const html = generarHTMLOficio(oficio);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Oficio_No_Procedencia_${oficio.persona.nombre_completo.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImprimir = () => {
    const html = generarHTMLOficio(oficio);
    const ventana = window.open('', '_blank', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => ventana.print(), 500);
  };

  return (
    <div className="rechazados-modal-overlay" onClick={onClose}>
      <div className="rechazados-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rechazados-modal-header">
          <h2>Oficio de No Procedencia</h2>
          <button className="rechazados-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="rechazados-modal-body">
          {/* Datos del oficio */}
          <div className="rechazados-oficio-section">
            <h3>Datos del Oficio</h3>
            <div className="rechazados-oficio-grid">
              <div className="rechazados-oficio-field">
                <label>Número de Solicitud</label>
                <span>{oficio.oficio.numero_solicitud}</span>
              </div>
              {oficio.oficio.numero_oficio_c3 && (
                <div className="rechazados-oficio-field">
                  <label>Oficio C3</label>
                  <span>{String(oficio.oficio.numero_oficio_c3).toUpperCase()}</span>
                </div>
              )}
              <div className="rechazados-oficio-field">
                <label>Fecha de Emisión</label>
                <span>{oficio.oficio.fecha_emision}</span>
              </div>
            </div>
          </div>

          {/* Datos de la persona */}
          <div className="rechazados-oficio-section">
            <h3>Datos de la Persona</h3>
            <div className="rechazados-oficio-grid">
              <div className="rechazados-oficio-field">
                <label>Nombre Completo</label>
                <span>{oficio.persona.nombre_completo}</span>
              </div>
              <div className="rechazados-oficio-field">
                <label>Puesto Solicitado</label>
                <span>{oficio.persona.puesto_solicitado}</span>
              </div>
              <div className="rechazados-oficio-field">
                <label>Fecha de Nacimiento</label>
                <span>{oficio.persona.fecha_nacimiento}</span>
              </div>
            </div>
          </div>

          {/* Información del rechazo */}
          <div className="rechazados-oficio-section">
            <h3>Información del Rechazo</h3>
            <div className="rechazados-oficio-grid">
              <div className="rechazados-oficio-field">
                <label>Etapa de Rechazo</label>
                <span>{oficio.rechazo.etapa}</span>
              </div>
              <div className="rechazados-oficio-field">
                <label>Fecha de Rechazo</label>
                <span>{oficio.rechazo.fecha}</span>
              </div>
            </div>
            <div className="rechazados-oficio-motivo">
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Motivo</label>
              <p>{oficio.rechazo.motivo}</p>
            </div>
          </div>

          {/* Contexto */}
          <div className="rechazados-oficio-section">
            <h3>Contexto del Trámite</h3>
            <div className="rechazados-oficio-grid">
              <div className="rechazados-oficio-field">
                <label>Municipio</label>
                <span>{oficio.contexto.municipio}</span>
              </div>
              <div className="rechazados-oficio-field">
                <label>Región</label>
                <span>{oficio.contexto.region}</span>
              </div>
              {oficio.contexto.es_dependencia && (
                <div className="rechazados-oficio-field">
                  <label>Dependencia</label>
                  <span>{oficio.contexto.dependencia}</span>
                </div>
              )}
              <div className="rechazados-oficio-field">
                <label>Analista</label>
                <span>{oficio.contexto.analista}</span>
              </div>
              <div className="rechazados-oficio-field">
                <label>Validador C3</label>
                <span>{oficio.contexto.validador_c3}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rechazados-modal-footer">
          <button className="rechazados-btn-cerrar" onClick={onClose}>Cerrar</button>
          <button className="rechazados-btn-download" onClick={handleImprimir}>
            <i className='bx bx-printer'></i>
            Imprimir
          </button>
          <button className="rechazados-btn-download" onClick={handleDescargar}>
            <i className='bx bx-download'></i>
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
