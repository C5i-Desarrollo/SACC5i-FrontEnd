import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { MdInsights } from 'react-icons/md';
import { useNotification } from '../../context/NotificationContext';
import {
  getPanelDireccionApi,
  getFinalizadosApi,
  verConstanciaFinalizadoApi,
  obtenerPersonasRechazadas,
  obtenerEnProcesoRevision,
  obtenerEnProcesoCuip
} from '../../services/api';
import './PanelDireccion.css';

const PANEL_INICIAL = {
  resumen_general: {
    total_tramites: 0,
    tramites_en_proceso: 0,
    tramites_finalizados: 0,
    tramites_rechazados: 0,
    total_personas: 0,
    personas_rechazadas: 0,
    personas_aprobadas: 0,
    personas_pendientes: 0,
    expedientes_finalizados: 0,
    analistas_activos: 0
  },
  estatus_tramites: [],
  desempeno_analistas: [],
  top_municipios: []
};

const numberFormatter = new Intl.NumberFormat('es-MX');

const formatearNumero = (valor) => numberFormatter.format(Number(valor) || 0);

const formatearFecha = (valor) => {
  if (!valor) return '---';
  const fecha = new Date(String(valor).includes('T') ? valor : `${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString('es-MX');
};

const calcularSegundos = (fechaInicio) => {
  if (!fechaInicio) return null;
  const inicio = new Date(fechaInicio);
  if (Number.isNaN(inicio.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 1000));
};

const formatearDuracion = (segundos) => {
  if (segundos === null || segundos === undefined) return '---';

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  if (dias > 0) {
    return `${dias}d ${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`;
  }

  return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`;
};

const mapearFaseEnProceso = (registro = {}) => {
  const faseRevision = registro.fase_revision;
  const faseCuip = registro.fase_cuip;

  if (faseCuip === 'en_proceso') return 'Validacion CUIP';
  if (['en_proceso', 'antecedentes', 'documentos'].includes(faseRevision)) return 'Revision de requisitos';
  return 'Seguimiento';
};

export default function PanelDireccion({ setPageTitle }) {
  const { showNotification } = useNotification();

  const [panel, setPanel] = useState(PANEL_INICIAL);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [loadingOperativo, setLoadingOperativo] = useState(false);
  const [loadingFinalizados, setLoadingFinalizados] = useState(false);

  const [enProceso, setEnProceso] = useState([]);
  const [rechazados, setRechazados] = useState([]);

  const [finalizados, setFinalizados] = useState([]);
  const [finalizadosBusquedaInput, setFinalizadosBusquedaInput] = useState('');
  const [finalizadosBusqueda, setFinalizadosBusqueda] = useState('');
  const [finalizadosPagina, setFinalizadosPagina] = useState(1);
  const [finalizadosPaginacion, setFinalizadosPaginacion] = useState({ total: 0, totalPaginas: 1, pagina: 1 });
  const [viewingConstanciaId, setViewingConstanciaId] = useState(null);

  useEffect(() => {
    setPageTitle?.({
      titulo: 'Panel Direccion',
      subtitulo: 'Vista unificada de seguimiento operativo',
      icon: <MdInsights className="nav-icon-highlight" />
    });

    return () => setPageTitle?.(null);
  }, [setPageTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFinalizadosBusqueda(finalizadosBusquedaInput.trim());
      setFinalizadosPagina(1);
    }, 260);

    return () => clearTimeout(timer);
  }, [finalizadosBusquedaInput]);

  const cargarPanel = useCallback(async () => {
    setLoadingPanel(true);

    try {
      const response = await getPanelDireccionApi();
      setPanel(response?.data?.data || PANEL_INICIAL);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo cargar el panel de direccion', 'error');
    } finally {
      setLoadingPanel(false);
    }
  }, [showNotification]);

  const cargarOperativo = useCallback(async () => {
    setLoadingOperativo(true);

    try {
      const [revisionRes, cuipRes, rechazadosRes] = await Promise.all([
        obtenerEnProcesoRevision(),
        obtenerEnProcesoCuip(),
        obtenerPersonasRechazadas({ page: 1, limit: 10 })
      ]);

      const revision = revisionRes?.data?.data || [];
      const cuip = cuipRes?.data?.data || [];
      const rechazadosLista = rechazadosRes?.data?.data || [];

      const mapaUnificado = new Map();

      revision.forEach((registro) => {
        mapaUnificado.set(registro.id, {
          id: registro.id,
          nombre_completo: registro.nombre_completo,
          numero_solicitud: registro.numero_solicitud,
          puesto_nombre: registro.puesto_nombre,
          municipio_nombre: registro.municipio_nombre,
          dependencia_nombre: registro.dependencia_nombre,
          fase_actual: mapearFaseEnProceso(registro),
          segundos: Number(registro.segundos_en_revision || 0)
        });
      });

      cuip.forEach((registro) => {
        const segundosCuip = calcularSegundos(registro.fecha_inicio_cuip);
        mapaUnificado.set(registro.id, {
          id: registro.id,
          nombre_completo: registro.nombre_completo,
          numero_solicitud: registro.numero_solicitud,
          puesto_nombre: registro.puesto_nombre,
          municipio_nombre: registro.municipio_nombre,
          dependencia_nombre: registro.dependencia_nombre,
          fase_actual: mapearFaseEnProceso(registro),
          segundos: segundosCuip ?? 0
        });
      });

      const enProcesoUnificado = Array.from(mapaUnificado.values())
        .sort((a, b) => Number(b.segundos || 0) - Number(a.segundos || 0))
        .slice(0, 14);

      setEnProceso(enProcesoUnificado);
      setRechazados(rechazadosLista);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo cargar seguimiento operativo', 'error');
      setEnProceso([]);
      setRechazados([]);
    } finally {
      setLoadingOperativo(false);
    }
  }, [showNotification]);

  const cargarFinalizados = useCallback(async () => {
    setLoadingFinalizados(true);

    try {
      const response = await getFinalizadosApi({
        busqueda: finalizadosBusqueda,
        pagina: finalizadosPagina,
        limit: 8
      });

      const registros = response?.data?.data?.registros || [];
      const paginacion = response?.data?.data?.paginacion || {
        total: 0,
        totalPaginas: 1,
        pagina: 1
      };

      setFinalizados(registros);
      setFinalizadosPaginacion(paginacion);

      if (finalizadosPagina > paginacion.totalPaginas) {
        setFinalizadosPagina(Math.max(1, paginacion.totalPaginas));
      }
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo cargar finalizados', 'error');
      setFinalizados([]);
      setFinalizadosPaginacion({ total: 0, totalPaginas: 1, pagina: 1 });
    } finally {
      setLoadingFinalizados(false);
    }
  }, [finalizadosBusqueda, finalizadosPagina, showNotification]);

  useEffect(() => {
    cargarPanel();
    cargarOperativo();
  }, [cargarPanel, cargarOperativo]);

  useEffect(() => {
    cargarFinalizados();
  }, [cargarFinalizados]);

  const resumenCards = useMemo(() => {
    const resumen = panel?.resumen_general || {};

    return [
      {
        key: 'tramites_en_proceso',
        label: 'Tramites en proceso',
        value: resumen.tramites_en_proceso,
        tone: 'amber'
      },
      {
        key: 'tramites_finalizados',
        label: 'Tramites finalizados',
        value: resumen.tramites_finalizados,
        tone: 'green'
      },
      {
        key: 'tramites_rechazados',
        label: 'Tramites rechazados',
        value: resumen.tramites_rechazados,
        tone: 'red'
      },
      {
        key: 'expedientes_finalizados',
        label: 'Expedientes con constancia',
        value: resumen.expedientes_finalizados,
        tone: 'blue'
      },
      {
        key: 'analistas_activos',
        label: 'Analistas activos',
        value: resumen.analistas_activos,
        tone: 'slate'
      }
    ];
  }, [panel]);

  const loadingGeneral = loadingPanel || loadingOperativo || loadingFinalizados;

  const verConstancia = useCallback(async (registro) => {
    if (!registro?.acuse_subido) {
      showNotification('Este registro no tiene constancia cargada', 'warning');
      return;
    }

    setViewingConstanciaId(registro.id);

    try {
      const response = await verConstanciaFinalizadoApi(registro.id);
      const mimeType = response?.headers?.['content-type'] || 'application/pdf';
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: mimeType });

      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error) {
      showNotification(error?.response?.data?.message || 'No se pudo abrir la constancia', 'error');
    } finally {
      setViewingConstanciaId(null);
    }
  }, [showNotification]);

  return (
    <main className="direccion-panel">
      <section className="direccion-toolbar-card">
        <div>
          <p className="direccion-eyebrow">Monitoreo integral</p>
          <h2>Seguimiento ejecutivo de tramites</h2>
          <p className="direccion-subtitle">Estatus global, en proceso, rechazados y finalizados en una sola vista.</p>
        </div>

        <button
          type="button"
          className="direccion-refresh"
          onClick={() => {
            cargarPanel();
            cargarOperativo();
            cargarFinalizados();
          }}
          disabled={loadingGeneral}
        >
          <FiRefreshCw className={loadingGeneral ? 'spin' : ''} />
          Actualizar
        </button>
      </section>

      <section className="direccion-kpis-grid">
        {resumenCards.map((card) => (
          <article key={card.key} className={`direccion-kpi-card tone-${card.tone}`}>
            <span className="kpi-label">{card.label}</span>
            <strong className="kpi-value">{formatearNumero(card.value)}</strong>
          </article>
        ))}
      </section>

      <section className="direccion-grid two-columns">
        <article className="direccion-card">
          <header className="direccion-card-header">
            <h3>Estatus de tramites</h3>
            <span>{formatearNumero(panel?.resumen_general?.total_tramites)} registrados</span>
          </header>

          <div className="direccion-table-wrap compact">
            <table className="direccion-table">
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingPanel ? (
                  <tr>
                    <td colSpan={2} className="empty-cell">Cargando estatus...</td>
                  </tr>
                ) : (panel?.estatus_tramites || []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-cell">Sin datos de estatus</td>
                  </tr>
                ) : (
                  panel.estatus_tramites.map((item) => (
                    <tr key={`${item.fase_actual}-${item.total}`}>
                      <td className="fase-cell">{item.fase_actual || 'Sin fase'}</td>
                      <td>{formatearNumero(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="direccion-card">
          <header className="direccion-card-header">
            <h3>Top municipios</h3>
            <span>Mayor volumen de tramites</span>
          </header>

          <div className="direccion-table-wrap compact">
            <table className="direccion-table">
              <thead>
                <tr>
                  <th>Municipio</th>
                  <th>Total</th>
                  <th>Finalizados</th>
                </tr>
              </thead>
              <tbody>
                {loadingPanel ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Cargando municipios...</td>
                  </tr>
                ) : (panel?.top_municipios || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Sin datos disponibles</td>
                  </tr>
                ) : (
                  panel.top_municipios.map((item) => (
                    <tr key={item.municipio_nombre}>
                      <td>{item.municipio_nombre}</td>
                      <td>{formatearNumero(item.total_tramites)}</td>
                      <td>{formatearNumero(item.finalizados)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="direccion-card">
        <header className="direccion-card-header">
          <h3>Desempeno de analistas</h3>
          <span>{formatearNumero(panel?.resumen_general?.analistas_activos)} activos</span>
        </header>

        <div className="direccion-table-wrap">
          <table className="direccion-table">
            <thead>
              <tr>
                <th>Analista</th>
                <th>Region</th>
                <th>Total</th>
                <th>En proceso</th>
                <th>Finalizados</th>
                <th>Rechazados</th>
              </tr>
            </thead>
            <tbody>
              {loadingPanel ? (
                <tr>
                  <td colSpan={6} className="empty-cell">Cargando desempeno...</td>
                </tr>
              ) : (panel?.desempeno_analistas || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">Sin analistas para mostrar</td>
                </tr>
              ) : (
                panel.desempeno_analistas.map((analista) => (
                  <tr key={analista.analista_id}>
                    <td>
                      <div className="cell-main">{analista.analista_nombre || analista.analista_usuario}</div>
                      <div className="cell-sub">@{analista.analista_usuario}</div>
                    </td>
                    <td>{analista.region_nombre || 'Sin region'}</td>
                    <td>{formatearNumero(analista.total_tramites)}</td>
                    <td>{formatearNumero(analista.tramites_en_proceso)}</td>
                    <td>{formatearNumero(analista.tramites_finalizados)}</td>
                    <td>{formatearNumero(analista.tramites_rechazados)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="direccion-grid two-columns">
        <article className="direccion-card">
          <header className="direccion-card-header">
            <h3>Expedientes en proceso</h3>
            <span>{formatearNumero(enProceso.length)} visibles</span>
          </header>

          <div className="direccion-table-wrap">
            <table className="direccion-table">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Fase</th>
                  <th>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {loadingOperativo ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Cargando expedientes...</td>
                  </tr>
                ) : enProceso.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Sin expedientes en proceso</td>
                  </tr>
                ) : (
                  enProceso.map((item) => (
                    <tr key={`enproceso-${item.id}`}>
                      <td>
                        <div className="cell-main">{item.nombre_completo}</div>
                        <div className="cell-sub">{item.numero_solicitud || 'Sin folio'} · {item.municipio_nombre || 'Sin municipio'}</div>
                      </td>
                      <td>
                        <span className={`fase-pill ${item.fase_actual === 'Validacion CUIP' ? 'cuip' : 'revision'}`}>
                          {item.fase_actual}
                        </span>
                      </td>
                      <td>{formatearDuracion(item.segundos)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="direccion-card">
          <header className="direccion-card-header">
            <h3>Rechazados recientes</h3>
            <span>{formatearNumero(rechazados.length)} visibles</span>
          </header>

          <div className="direccion-table-wrap">
            <table className="direccion-table">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Etapa</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loadingOperativo ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Cargando rechazados...</td>
                  </tr>
                ) : rechazados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-cell">Sin rechazados recientes</td>
                  </tr>
                ) : (
                  rechazados.map((item) => (
                    <tr key={`rechazado-${item.id}`}>
                      <td>
                        <div className="cell-main">{item.nombre_completo}</div>
                        <div className="cell-sub">{item.motivo_especifico || 'Sin motivo'}</div>
                      </td>
                      <td>{item.etapa_rechazo || 'Sin etapa'}</td>
                      <td>{formatearFecha(item.updated_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="direccion-card">
        <header className="direccion-card-header with-tools">
          <div>
            <h3>Finalizados con constancia</h3>
            <span>Descarga y visualizacion de archivos concluidos</span>
          </div>

          <label className="direccion-search">
            <FiSearch size={14} />
            <input
              type="text"
              placeholder="Buscar por nombre, oficio o CUIP"
              value={finalizadosBusquedaInput}
              onChange={(event) => setFinalizadosBusquedaInput(event.target.value)}
            />
          </label>
        </header>

        <div className="direccion-table-wrap">
          <table className="direccion-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>No. oficio</th>
                <th>CUIP</th>
                <th>Fecha termino</th>
                <th>Constancia</th>
              </tr>
            </thead>
            <tbody>
              {loadingFinalizados ? (
                <tr>
                  <td colSpan={5} className="empty-cell">Cargando finalizados...</td>
                </tr>
              ) : finalizados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">Sin registros finalizados</td>
                </tr>
              ) : (
                finalizados.map((registro) => {
                  const constanciaDisponible = Boolean(registro.acuse_subido);
                  const visualizando = viewingConstanciaId === registro.id;

                  return (
                    <tr key={`finalizado-${registro.id}`}>
                      <td>
                        <div className="cell-main">{registro.nombre_elemento || 'Sin nombre'}</div>
                        <div className="cell-sub">{registro.puesto_elemento || 'Sin puesto'}</div>
                      </td>
                      <td>{registro.numero_oficio || '---'}</td>
                      <td>{registro.cuip || '---'}</td>
                      <td>{formatearFecha(registro.fecha_termino)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-constancia"
                          disabled={!constanciaDisponible || visualizando}
                          onClick={() => verConstancia(registro)}
                          title={constanciaDisponible ? 'Abrir constancia PDF' : 'Sin constancia cargada'}
                        >
                          <FiDownload size={14} />
                          {visualizando ? 'Abriendo...' : 'Descargar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="direccion-pagination">
          <span>
            {formatearNumero(finalizadosPaginacion.total)} total · Pagina {formatearNumero(finalizadosPaginacion.pagina)} de {formatearNumero(finalizadosPaginacion.totalPaginas)}
          </span>

          <div className="pagination-actions">
            <button
              type="button"
              onClick={() => setFinalizadosPagina((prev) => Math.max(1, prev - 1))}
              disabled={finalizadosPaginacion.pagina <= 1 || loadingFinalizados}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setFinalizadosPagina((prev) => Math.min(finalizadosPaginacion.totalPaginas, prev + 1))}
              disabled={
                finalizadosPaginacion.pagina >= finalizadosPaginacion.totalPaginas
                || loadingFinalizados
              }
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
