/**
 * HistorialC3 — Historial de trámites procesados por C3
 * Muestra todos los trámites que el validador C3 ha dictaminado
 * con filtros, estadísticas y tabla detallada.
 */

import * as XLSX from 'xlsx';
import { useNotification } from '../../../context/NotificationContext';
import { useEffect, useMemo, useState } from 'react';
import { MdHistory } from 'react-icons/md';
import { useHistorialC3 } from '../../../hooks/historial';
import { ocultarHistorialC3PorMesApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
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
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const rolActual = user?.rol || user?.role;
const puedeBorrarHistorial = ['admin', 'super_admin', 'validador_c3'].includes(rolActual);

  const obtenerMesActual = () => {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  };

  const [modalBorrarMes, setModalBorrarMes] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(obtenerMesActual);
  const [borrandoMes, setBorrandoMes] = useState(false);
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

  const descargarExcel = () => {
    if (filasFiltradas.length === 0) {
      showNotification('No hay registros para descargar.', 'warning');
      return;
    }

    const filasExcel = filasFiltradas.map(({ tramite, persona }) => ({
      'No. Solicitud': tramite.numero_solicitud || '—',
      Municipio: tramite.municipio_nombre || '—',
      Región: tramite.region_nombre || '—',
      Resultado: obtenerTextoDictamen(persona),
      'Nombre Persona': obtenerNombreCompleto(persona),
      Puesto: persona.puesto_nombre || '—',
      'Analista C5': tramite.analista_extension
        ? `${tramite.analista_nombre || '—'} - Ext. ${tramite.analista_extension}`
        : (tramite.analista_nombre || '—'),
      'Validador C3': tramite.validador_c3_nombre || '—',
      'Fecha Dictamen': persona.updated_at
        ? `${formatearFecha(persona.updated_at)} ${formatearHora(persona.updated_at)}`
        : '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(filasExcel);

    worksheet['!cols'] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 34 },
      { wch: 26 },
      { wch: 32 },
      { wch: 24 },
      { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial C3');

    const fechaArchivo = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Historial_Dictamenes_C3_${fechaArchivo}.xlsx`);

    showNotification('Archivo Excel generado correctamente.', 'success');
  };

  const borrarHistorialPorMes = async () => {
    const [anio, mes] = String(mesSeleccionado || '').split('-');

    if (!anio || !mes) {
      showNotification('Selecciona un mes válido.', 'warning');
      return;
    }

    setBorrandoMes(true);

    try {
      const response = await ocultarHistorialC3PorMesApi({
        anio: Number(anio),
        mes: Number(mes)
      });

      showNotification(
        response.data?.message || 'Historial C3 borrado correctamente.',
        'success'
      );

      setModalBorrarMes(false);
      await cargarHistorial();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Error al borrar historial C3.',
        'error'
      );
    } finally {
      setBorrandoMes(false);
    }
  };

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

      <div className="hist-actions-bar">
        <button
          type="button"
          className="hist-action-btn hist-action-excel"
          onClick={descargarExcel}
          disabled={filasFiltradas.length === 0}
        >
          <i className="bx bx-download"></i>
          Descargar Excel
        </button>

        {puedeBorrarHistorial && (
          <button
            type="button"
            className="hist-action-btn hist-action-delete"
            onClick={() => setModalBorrarMes(true)}
          >
            <i className="bx bx-trash"></i>
            Borrar por mes
          </button>
        )}

        {modalBorrarMes && (
          <div className="hist-modal-backdrop">
            <div className="hist-modal-card">
              <div className="hist-modal-header">
                <h3>Borrar historial por mes</h3>
                <button
                  type="button"
                  onClick={() => setModalBorrarMes(false)}
                  disabled={borrandoMes}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <p className="hist-modal-text">
                Esta acción ocultará del Historial C3 los dictámenes del mes seleccionado.
                Los trámites reales no se eliminarán.
              </p>

              <label className="hist-modal-field">
                Mes a borrar
                <input
                  type="month"
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  disabled={borrandoMes}
                />
              </label>

              <div className="hist-modal-actions">
                <button
                  type="button"
                  className="hist-modal-btn hist-modal-cancel"
                  onClick={() => setModalBorrarMes(false)}
                  disabled={borrandoMes}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="hist-modal-btn hist-modal-delete"
                  onClick={borrarHistorialPorMes}
                  disabled={borrandoMes}
                >
                  {borrandoMes ? 'Borrando...' : 'Confirmar borrado'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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