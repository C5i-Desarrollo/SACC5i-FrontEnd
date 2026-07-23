/**
 * HistorialC3 — Historial de trámites procesados por C3
 * Muestra todos los trámites que el validador C3 ha dictaminado
 * con filtros, estadísticas y tabla detallada.
 */

import { useEffect, useMemo, useState } from 'react';
import { MdHistory } from 'react-icons/md';
import { useHistorialC3 } from '../../../hooks/historial';
import {
  buildPersonSearchableText,
  matchesSearchQuery,
  isSolicitudSearchQuery,
  matchesSolicitudQuery
} from '../utils/searchUtils.js';
import HistorialStats from './components/HistorialStats';
import HistorialFiltros from './components/HistorialFiltros';
import './styles/HistorialC3.css';
import './styles/HistorialRow.css';

const REGISTROS_POR_PAGINA = 10;

export default function HistorialC3({ setPageTitle }) {
  const {
    tramites,
    loading,
    filtros,
    stats,
    cargarHistorial,
    aplicarFiltros,
    limpiarFiltros,
    actualizarFiltro
  } = useHistorialC3();

  const [showFiltros, setShowFiltros] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    if (!setPageTitle) return undefined;

    setPageTitle({
      titulo: 'Historial de Dictámenes C3',
      icon: <MdHistory className="nav-icon-highlight" />
    });

    return () => setPageTitle(null);
  }, [setPageTitle]);

  const handleBusqueda = (valor) => {
    actualizarFiltro('busqueda', valor);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  const filasFiltradas = useMemo(() => {
    const query = (filtros?.busqueda || '').trim();

    if (!query) {
      return tramites.flatMap((tramite) => {
        const personas = Array.isArray(tramite.personas)
          ? tramite.personas
          : [];

        return personas.map((persona) => ({
          tramite,
          persona
        }));
      });
    }

    return tramites.flatMap((tramite) => {
      const personas = Array.isArray(tramite.personas)
        ? tramite.personas
        : [];

      return personas
        .map((persona) => ({
          tramite,
          persona
        }))
        .filter(({ tramite: tramiteActual, persona }) => {
          if (isSolicitudSearchQuery(query)) {
            return matchesSolicitudQuery(
              tramiteActual,
              persona,
              query
            );
          }

          const textoBuscable = buildPersonSearchableText(
            persona,
            tramiteActual
          );

          return matchesSearchQuery(textoBuscable, query);
        });
    });
  }, [tramites, filtros?.busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filasFiltradas.length / REGISTROS_POR_PAGINA)
  );

  const filasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;

    return filasFiltradas.slice(inicio, fin);
  }, [filasFiltradas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtros?.busqueda,
    filtros?.fecha_inicio,
    filtros?.fecha_fin,
    filtros?.dictamen
  ]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const irPaginaAnterior = () => {
    setPaginaActual((pagina) => Math.max(1, pagina - 1));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((pagina) =>
      Math.min(totalPaginas, pagina + 1)
    );
  };

  const obtenerClaseDictamen = (persona) => {
    if (persona.fase_c3 === 'rechazado_c3' || persona.rechazado) {
      return 'hist-badge-rechazado';
    }

    if (persona.fase_c3 === 'validado_c3' || persona.validado) {
      return 'hist-badge-validado';
    }

    if (persona.fase_c3 === 'dictaminado_c3') {
      return 'hist-badge-dictaminado';
    }

    return 'hist-badge-pendiente';
  };

  const obtenerTextoDictamen = (persona) => {
    if (persona.fase_c3 === 'rechazado_c3' || persona.rechazado) {
      return 'Rechazado C3';
    }

    if (persona.fase_c3 === 'validado_c3' || persona.validado) {
      return 'Validado C3';
    }

    if (persona.fase_c3 === 'dictaminado_c3') {
      return 'Dictaminado';
    }

    return persona.fase_c3 || '—';
  };

  const obtenerNombreCompleto = (persona) => {
    return (
      persona.nombre_completo ||
      [
        persona.nombre,
        persona.apellido_paterno,
        persona.apellido_materno
      ]
        .filter(Boolean)
        .join(' ') ||
      '—'
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    if (!fecha) return '';

    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="hist-container">
      {/* Filtros y búsqueda */}
      <HistorialFiltros
        filtros={filtros}
        showFiltros={showFiltros}
        onToggle={() => setShowFiltros((prev) => !prev)}
        onRefrescar={cargarHistorial}
        onActualizar={actualizarFiltro}
        onAplicar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        onBusqueda={handleBusqueda}
        onKeyDown={handleKeyDown}
      />

      {/* Estadísticas */}
      <HistorialStats stats={stats} />

      {/* Contenido */}
      {loading ? (
        <div className="hist-loading">
          <i className="bx bx-loader-alt bx-spin"></i>
          <p>Cargando historial...</p>
        </div>
      ) : tramites.length === 0 ? (
        <div className="hist-empty">
          <i className="bx bx-history"></i>
          <p>No hay trámites procesados aún</p>
          <small>Los trámites dictaminados aparecerán aquí</small>
        </div>
      ) : filasFiltradas.length === 0 ? (
        <div className="hist-empty">
          <i className="bx bx-search-alt"></i>
          <p>No se encontraron resultados</p>
          <small>Prueba con otros criterios de búsqueda</small>
        </div>
      ) : (
        <div className="hist-card">
          <table className="hist-table">
            <thead>
              <tr>
                <th>No. Solicitud</th>
                <th>Municipio</th>
                <th>Región</th>
                <th>Resultado</th>
                <th>Nombre Persona</th>
                <th>Puesto</th>
                <th>Analista C5</th>
                <th>Validador C3</th>
                <th>Fecha Dictamen</th>
              </tr>
            </thead>

            <tbody>
              {filasPaginadas.map(({ tramite, persona }) => (
                <tr
                  key={`${tramite.id}-${persona.id}`}
                  className="hist-row"
                >
                  <td>
                    <div className="hist-solicitud-cell">
                      <strong>
                        {tramite.numero_solicitud || '—'}
                      </strong>

                      <small>
                        {tramite.tipo_oficio_nombre || ''}
                      </small>
                    </div>
                  </td>

                  <td>{tramite.municipio_nombre || '—'}</td>

                  <td>{tramite.region_nombre || '—'}</td>

                  <td>
                    <span
                      className={`hist-badge ${obtenerClaseDictamen(
                        persona
                      )}`}
                    >
                      {obtenerTextoDictamen(persona)}
                    </span>
                  </td>

                  <td>{obtenerNombreCompleto(persona)}</td>

                  <td>{persona.puesto_nombre || '—'}</td>

                  <td>
                    <div className="hist-analista-cell">
                      <span>
                        {tramite.analista_nombre || '—'}
                      </span>

                      {tramite.analista_extension && (
                        <small>
                          Ext. {tramite.analista_extension}
                        </small>
                      )}
                    </div>
                  </td>

                  <td>
                    {tramite.validador_c3_nombre || '—'}
                  </td>

                  <td>
                    <div className="hist-fecha-cell">
                      <span>
                        {formatearFecha(persona.updated_at)}
                      </span>

                      <small>
                        {formatearHora(persona.updated_at)}
                      </small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="hist-paginacion">
            <button
              type="button"
              className="hist-pag-btn"
              onClick={irPaginaAnterior}
              disabled={paginaActual === 1}
            >
              &lt; Anterior
            </button>

            <span className="hist-pag-info">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              className="hist-pag-btn"
              onClick={irPaginaSiguiente}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}