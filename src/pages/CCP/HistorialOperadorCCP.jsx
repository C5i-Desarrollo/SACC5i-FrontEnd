import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorialRegistrosCcpApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { buildAsunto, buildCompactPagination, formatFecha, formatReferenciaVolante } from './Components/ccpHelpers';
import './styles/TablaCCP.css';

const HISTORIAL_PAGE_SIZE = 20;

export default function HistorialOperadorCCP({ setPageTitle }) {
  const navigate = useNavigate();
  const { error } = useNotification();
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 });

  const paginasVisibles = useMemo(
    () => buildCompactPagination(pagina, paginacion.totalPaginas),
    [pagina, paginacion.totalPaginas]
  );

  useEffect(() => {
    setPageTitle?.({
      titulo: 'Historial CCP',
      icon: <i className="bx bx-history nav-icon-highlight" />
    });

    return () => setPageTitle?.(null);
  }, [setPageTitle]);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const { data } = await getHistorialRegistrosCcpApi({ pagina, limit: HISTORIAL_PAGE_SIZE, busqueda });
        setHistorial(data.data || []);
        setPaginacion({ total: data.total || 0, totalPaginas: data.totalPaginas || 1 });
      } catch (err) {
        error(err?.response?.data?.message || 'No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [pagina, busqueda, error]);

  return (
    <div className="ccp-historial-page">
      <div className="ccp-historial-topbar">
        <div className="ccp-search-alta">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Buscar por oficio, área o funcionario"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
          {busqueda && (
            <button className="ccp-search-alta-clear" onClick={() => { setBusqueda(''); setPagina(1); }}>
              <i className="bx bx-x"></i>
            </button>
          )}
        </div>

        <button className="ccp-btn-dl ccp-btn-history" onClick={() => navigate('/dashboard/ccp')}>
          <i className="bx bx-arrow-back"></i>
          <span className="ccp-btn-text">Volver a CCP</span>
        </button>
      </div>

      <div className="ccp-tabla-card ccp-historial-card">
        <div className="ccp-toolbar">
          <div className="ccp-toolbar-row">
            <div className="ccp-toolbar-left">
              <h3 style={{ margin: 0, color: 'var(--ccp-primary)' }}>Historial de registros archivados</h3>
            </div>
          </div>
        </div>

        <div className="ccp-table-scroll ccp-historial-table-scroll">
        <table className="ccp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>No. Oficio</th>
              <th>Fecha</th>
              <th>Área</th>
              <th>Funcionario</th>
              <th>Cargo</th>
              <th>Asunto</th>
              <th>Ref. Volante</th>
              <th>Acciones</th>
              <th>Archivado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="ccp-td-state">Cargando historial...</td>
              </tr>
            ) : historial.length === 0 ? (
              <tr>
                <td colSpan={10} className="ccp-td-state">Sin registros archivados.</td>
              </tr>
            ) : (
              historial.map((registro, idx) => (
                <tr key={registro.id}>
                  <td className="ccp-td-idx">{(pagina - 1) * HISTORIAL_PAGE_SIZE + idx + 1}</td>
                  <td><span className="ccp-badge-oficio">{registro.numero_oficio}</span></td>
                  <td className="ccp-td-nowrap">{formatFecha(registro.fecha)}</td>
                  <td className="ccp-td-ellipsis ccp-td-area" title={registro.area}>{registro.area}</td>
                  <td className="ccp-td-ellipsis" title={registro.funcionario}>{registro.funcionario}</td>
                  <td className="ccp-td-ellipsis ccp-td-muted" title={registro.cargo}>{registro.cargo}</td>
                  <td className="ccp-td-ellipsis ccp-td-asunto" title={buildAsunto(registro)}>{buildAsunto(registro)}</td>
                  <td className="ccp-td-center">
                    <span className="ccp-badge ccp-badge-folio">
                      {formatReferenciaVolante(registro.referencia_volante, registro.folio_numero, registro.volante_numero)}
                    </span>
                  </td>
                  <td className="ccp-td-center">
                    <span className="ccp-badge ccp-badge-accion">{registro.accion_historial}</span>
                  </td>
                  <td className="ccp-td-nowrap">{new Date(registro.archived_at).toLocaleString('es-MX')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

        {paginacion.totalPaginas > 1 && (
          <div className="ccp-paginacion">
            <button disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
              <i className="bx bx-chevron-left"></i>
            </button>
            {paginasVisibles.map((item, idx) => (
              item === '...'
                ? <span key={`ellipsis-${idx}`} className="ccp-pag-ellipsis">...</span>
                : <button key={item} className={item === pagina ? 'ccp-pag-active' : ''} onClick={() => setPagina(item)}>{item}</button>
            ))}
            <button disabled={pagina === paginacion.totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              <i className="bx bx-chevron-right"></i>
            </button>
            <span className="ccp-pag-total">{paginacion.total} registro(s) archivado(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}
