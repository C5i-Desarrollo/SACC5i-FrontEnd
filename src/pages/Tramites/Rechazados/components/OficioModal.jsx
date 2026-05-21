/**
 * Modal para previsualizar y descargar oficio de rechazo
 */
import { useState } from 'react';
import { generarHTMLOficio } from '../utils/oficioTemplate';
import '../styles/OficioModal.css';

export default function OficioModal({ oficio, onClose }) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!oficio) return null;

  const generarTextoOficio = () => {
    const { oficio: datos_oficio, persona, rechazo, contexto } = oficio;
    
    return `No. Solicitud: ${datos_oficio.numero_solicitud}

${datos_oficio.numero_oficio_c3 ? `Oficio C3: ${String(datos_oficio.numero_oficio_c3).toUpperCase()}

` : ''}Puebla de Zaragoza, a ${datos_oficio.fecha_emision}

Por medio del presente, se hace constar que derivado del análisis y evaluación realizada al trámite de alta con número de solicitud ${datos_oficio.numero_solicitud}, se ha determinado que la persona abajo referida NO PROCEDE para ser dada de alta en el puesto solicitado.

Nombre completo:
${persona.nombre_completo}

Puesto solicitado:
${persona.puesto_solicitado}

Fecha de nacimiento:
${persona.fecha_nacimiento}

Municipio:
${contexto.municipio}

Región:
${contexto.region}

${contexto.es_dependencia ? `Dependencia:
${contexto.dependencia}

` : ''}Etapa de rechazo:
${rechazo.etapa}

Fecha de rechazo:
${rechazo.fecha}

MOTIVO DE NO PROCEDENCIA
${rechazo.motivo}

Lo anterior, con fundamento en las disposiciones aplicables en materia de control de confianza y evaluación de personal de seguridad pública del Estado de Puebla.

Se extiende el presente para los fines legales y administrativos que correspondan.`;
  };

  const handleCopiar = async () => {
    try {
      setCopying(true);
      const texto = generarTextoOficio();
      
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      setCopied(true);
      setCopying(false);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error('Error al copiar:', error);
      setCopying(false);
    }
  };

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
          <button 
            className={`rechazados-btn-copiar ${copied ? 'copied' : ''}`}
            onClick={handleCopiar}
            disabled={copying || copied}
          >
            <i className={`bx ${copied ? 'bx-check-circle' : copying ? 'bx-loader-alt bx-spin' : 'bx-copy'}`}></i>
            {copied ? '¡Copiado!' : copying ? 'Copiando...' : 'Copiar'}
          </button>
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
