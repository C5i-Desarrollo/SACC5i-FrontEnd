import { useState, useMemo, useEffect } from 'react';

/**
 * RecibidosC3Historial — Historial de trámites que ya pasaron por acción C5
 * Reutiliza clases CSS de RecibidosC3.css
 */

const FASE_LABEL = {
  rechazado_c3:           { text: 'Ver Rechazados',        className: 'rc3-hist-tag-rechazado' },
  revision_requisitos:     { text: 'Enviado a Revisión',    className: 'rc3-hist-tag-revision' },
  validacion_cuip:         { text: 'En Validación CUIP',    className: 'rc3-hist-tag-cuip' },
  rechazado:               { text: 'Rechazado Final',       className: 'rc3-hist-tag-rechazado' },
  rechazado_no_corresponde:{ text: 'No Corresponde',        className: 'rc3-hist-tag-rechazado' },
  finalizado:              { text: 'Finalizado',            className: 'rc3-hist-tag-finalizado' },
};

const DICTAMEN_BADGE = {
  aprobado:  { text: 'ALTA OK',                    className: 'rc3-dict-aprobado' },
  rechazado: { text: 'NO PUDO SER DADO DE ALTA',   className: 'rc3-dict-rechazado' },
  default:   { text: 'EN PROCESO',                 className: 'rc3-dict-proceso' },
};

// Lee los campos que C3 escribe directamente — no cambian al avanzar el trámite
function getDictamen(persona) {
  if (persona.rechazado) return DICTAMEN_BADGE.rechazado;
  if (persona.validado)  return DICTAMEN_BADGE.aprobado;
  return DICTAMEN_BADGE.default;
}

function getFaseTag(tramite_fase) {
  return FASE_LABEL[tramite_fase] || { text: tramite_fase, className: 'rc3-hist-tag-default' };
}

function formatFecha(fecha) {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleDateString('es-MX');
}

const POR_PAGINA = 10;

export default function RecibidosC3Historial({ historial = [], loading }) {
  const [busqueda, setBusqueda]         = useState('');
  const [filtroFase, setFiltroFase]     = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [pagina, setPagina]             = useState(1);

  const municipiosUnicos = useMemo(() =>
    [...new Set(historial.map(p => p.municipio_nombre).filter(Boolean))].sort(),
    [historial]
  );

  const filtrados = useMemo(() => {
    return historial.filter(p => {
      if (busqueda.trim()) {
        const t = busqueda.toLowerCase();
        if (
          !(p.nombre_completo || '').toLowerCase().includes(t) &&
          !(p.numero_oficio_c3 || '').toLowerCase().includes(t) &&
          !(p.municipio_nombre || '').toLowerCase().includes(t)
        ) return false;
      }
      if (filtroFase && p.tramite_fase !== filtroFase) return false;
      if (filtroMunicipio && p.municipio_nombre !== filtroMunicipio) return false;
      return true;
    });
  }, [historial, busqueda, filtroFase, filtroMunicipio]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroFase, filtroMunicipio]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  if (loading) {
    return (
      <div className="rc3-loading">
        <i className='bx bx-loader-alt bx-spin'></i>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="rc3-hist-container">
      {/* Toolbar */}
      <div className="rc3-toolbar">
        <span className="rc3-total-badge">
          <i className='bx bx-history'></i> Historial: <strong>{filtrados.length}</strong>
        </span>

        {/* Filtro fase */}
        <select
          className="rc3-hist-select"
          value={filtroFase}
          onChange={e => setFiltroFase(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          <option value="rechazado_c3">Ver Rechazados</option>
          <option value="revision_requisitos">Enviado a Revisión</option>
          <option value="validacion_cuip">En Validación CUIP</option>
          <option value="rechazado">Rechazado Final</option>
          <option value="rechazado_no_corresponde">No Corresponde</option>
          <option value="finalizado">Finalizado</option>
        </select>

        {/* Filtro municipio */}
        <select
          className="rc3-hist-select"
          value={filtroMunicipio}
          onChange={e => setFiltroMunicipio(e.target.value)}
        >
          <option value="">Todos los municipios</option>
          {municipiosUnicos.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Búsqueda */}
        <div className="rc3-search-box">
          <i className='bx bx-search'></i>
          <input
            type="text"
            placeholder="Buscar por nombre u oficio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="rc3-list">
        {paginados.map((persona, index) => {
          const dictamen = getDictamen(persona);
          const faseTag  = getFaseTag(persona.tramite_fase);
          const cardNumber = (pagina - 1) * POR_PAGINA + index + 1;
          return (
            <div key={persona.id} className="rc3-card rc3-hist-card">
              <div className="rc3-card-col rc3-col-small rc3-col-anchor">
                <label className="rc3-card-label">Registro</label>
                <div className="rc3-card-index">#{cardNumber}</div>
                  <div className="rc3-card-value"><strong>{persona.numero_oficio_c3 ? String(persona.numero_oficio_c3).toUpperCase() : '--'}</strong></div>
                <div className="rc3-card-subvalue">{formatFecha(persona.fecha_solicitud)}</div>
              </div>

              <div className="rc3-card-col rc3-col-main rc3-col-separated">
                <label className="rc3-card-label">Nombre del Elemento</label>
                <div className="rc3-nombre-cell">
                  <strong>{persona.nombre_completo}</strong>
                  <small>{persona.puesto_original_nombre || '--'}</small>
                </div>
              </div>

              <div className="rc3-card-col rc3-col-separated">
                <label className="rc3-card-label">Origen</label>
                {persona.es_tramite_dependencia
                  ? <>
                      <div className="rc3-card-value rc3-dependencia-tag">
                        <i className='bx bx-buildings'></i> {persona.dependencia_nombre || 'Dependencia'}
                      </div>
                      <div className="rc3-card-subvalue">{persona.municipio_nombre || '--'}</div>
                    </>
                  : <div className="rc3-card-value">{persona.municipio_nombre || '--'}</div>
                }
              </div>

              <div className="rc3-card-col rc3-col-separated">
                <label className="rc3-card-label">Movimiento</label>
                <div className="rc3-card-subvalue">{persona.proceso_movimiento || 'Alta'}</div>
              </div>

              <div className="rc3-card-col rc3-col-obs rc3-col-separated">
                <label className="rc3-card-label">Dictamen C3</label>
                <span className={`rc3-dict-badge ${dictamen.className}`}>{dictamen.text}</span>
                <div className="rc3-obs-text" title={persona.observaciones_c3}>
                  {persona.observaciones_c3 || '--'}
                </div>
              </div>

              <div className="rc3-card-col rc3-col-action rc3-col-separated">
                <label className="rc3-card-label">Acción Tomada</label>
                <span className={`rc3-hist-tag ${faseTag.className}`}>
                  <i className='bx bx-check-circle'></i> {faseTag.text}
                </span>
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="rc3-empty">
            <i className='bx bx-archive'></i>
            <p>No hay trámites en el historial</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="rc3-paginacion">
          <button
            className="rc3-pag-btn"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            &larr; Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(0, 5).map(num => (
            <button
              key={num}
              className={`rc3-pag-btn ${num === pagina ? 'rc3-pag-active' : ''}`}
              onClick={() => setPagina(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="rc3-pag-btn"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
