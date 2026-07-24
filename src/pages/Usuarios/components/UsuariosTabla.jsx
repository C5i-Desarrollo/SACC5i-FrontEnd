import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import {
  FiEdit2,
  FiSlash,
  FiTrash2,
  FiKey,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiInbox,
  FiGrid,
  FiAlertTriangle,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';
import '../styles/UsuariosTabla.css';

const ROLE_ORDER = [
  ROLES.ANALISTA,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DIRECCION,
  ROLES.VALIDADOR_C3,
  ROLES.OPERADOR_CCP,
  ROLES.DEPENDENCIA
];

const ROLES_CON_REGION_REQUERIDA = new Set([
  ROLES.ANALISTA,
  ROLES.OPERADOR_CCP
]);

const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return Number.MAX_SAFE_INTEGER;
  }

  const digits = String(value).replace(/[^0-9]/g, '');
  if (!digits) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number.parseInt(digits, 10);
};

const ordenarUsuarios = (items = []) => {
  return [...items].sort((a, b) => {
    const regionA = parseNumericValue(a.region_id);
    const regionB = parseNumericValue(b.region_id);
    if (regionA !== regionB) return regionA - regionB;

    const extensionA = parseNumericValue(a.extension);
    const extensionB = parseNumericValue(b.extension);
    if (extensionA !== extensionB) return extensionA - extensionB;

    const nombreA = String(a.nombre_completo || '').toLowerCase();
    const nombreB = String(b.nombre_completo || '').toLowerCase();
    if (nombreA !== nombreB) return nombreA.localeCompare(nombreB, 'es');

    return Number(a.id || 0) - Number(b.id || 0);
  });
};

const construirSecciones = (usuarios = []) => {
  const secciones = ROLE_ORDER.map((rol) => ({
    rol,
    usuarios: ordenarUsuarios(usuarios.filter((usuario) => usuario.rol === rol))
  })).filter((seccion) => seccion.usuarios.length > 0);

  const extras = ordenarUsuarios(
    usuarios.filter((usuario) => !ROLE_ORDER.includes(usuario.rol))
  );

  if (extras.length > 0) {
    secciones.push({
      rol: 'otros',
      usuarios: extras
    });
  }

  return secciones;
};

export default function UsuariosTabla({
  usuarios,
  loading,
  onEditar,
  onActivar,
  onDesactivar,
  onEliminar,
  onBorrarRegistros, // <-- Cambiado de onBorrarRegistrosAnalista a onBorrarRegistros
  onResetPassword,
  onAbrirPasswordTemporalModal,
  currentUserId,
  isSuperAdmin
}) {

  const secciones = construirSecciones(usuarios);

  if (loading) {
    return (
      <div className="usuarios-lista">
        <div className="lista-estado">
          <div className="spinner" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="usuarios-lista">
        <div className="lista-estado">
          <FiInbox size={40} />
          <p className="estado-titulo">No se encontraron usuarios</p>
          <p>Intenta ajustar los filtros de busqueda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-lista">
      {secciones.map((seccion) => {
        return (
          <section key={seccion.rol} className="usuarios-seccion">
            <header className="seccion-header">
              <div className="seccion-title-wrap">
                <h4 className="seccion-titulo">
                  <FiGrid size={15} /> {ROLE_LABELS[seccion.rol] || 'Otros'}
                </h4>
                <span className="seccion-total">{seccion.usuarios.length} usuario(s)</span>
              </div>
            </header>

            <div className="usuarios-grid">
              {seccion.usuarios.map((usuario) => {
                const sesionesActivas = Number(usuario?.sesiones_activas || 0);
                const enLinea = Boolean(usuario?.en_linea) || sesionesActivas > 0;
                const regionRequeridaUsuario = ROLES_CON_REGION_REQUERIDA.has(usuario.rol);
                const tieneRegion = Boolean(usuario.region_id || usuario.region_nombre);
                const regionEstadoClass = regionRequeridaUsuario
                  ? (tieneRegion ? 'ok' : 'pendiente')
                  : (tieneRegion ? 'ok' : 'no-aplica');
                const regionTexto = tieneRegion
                  ? (usuario.region_nombre || `Region ${usuario.region_id}`)
                  : (regionRequeridaUsuario ? 'Region pendiente' : 'Region no aplica');

                return (
                  <article key={usuario.id} className={`usuario-card ${!usuario.activo ? 'card-inactivo' : ''}`}>
                    <div className="card-top">
                      <span className="card-id">#{usuario.id}</span>
                      <div className="card-statuses">
                        <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                          {usuario.activo
                            ? <><FiCheckCircle size={12} /> Activo</>
                            : <><FiXCircle size={12} /> Inactivo</>
                          }
                        </span>
                        <span className={`online-badge ${enLinea ? 'online' : 'offline'}`}>
                          {enLinea
                            ? <><FiWifi size={12} /> En linea</>
                            : <><FiWifiOff size={12} /> Offline</>
                          }
                        </span>
                      </div>
                    </div>

                    <div className="card-info">
                      <div className="info-principal">
                        <h4 className="info-nombre">{usuario.nombre_completo}</h4>
                        <code className="info-usuario">{usuario.usuario}</code>
                        
                        {/* 👇 NUEVA ETIQUETA DE DELEGADO */}
                        {usuario.delegado_a && (
                          <div style={{
                            marginTop: '8px',
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #ffeeba'
                          }}>
                            <FiClock size={12} /> Delegado a: {usuario.delegado_a}
                          </div>
                        )}
                      </div>

                      <div className="info-detalles">
                        <div className="detalle">
                          <FiMail size={14} />
                          <span>{usuario.email}</span>
                        </div>
                        <div className="detalle">
                          <FiPhone size={14} />
                          <span>{usuario.extension || 'Sin ext.'}</span>
                        </div>
                      </div>

                      <div className={`region-status ${regionEstadoClass}`}>
                        {!tieneRegion && regionRequeridaUsuario ? <FiAlertTriangle size={13} /> : <FiMapPin size={13} />}
                        <span>{regionTexto}</span>
                      </div>
                    </div>

                    <div className="card-rol">
                      <FiShield size={13} />
                      <span className={`rol-badge rol-${usuario.rol}`}>
                        {ROLE_LABELS[usuario.rol] || usuario.rol}
                      </span>
                    </div>

                    <div className="card-acciones">
                      {usuario.activo ? (
                        <>
                          {(isSuperAdmin || usuario.rol !== ROLES.SUPER_ADMIN) && (
                            <button onClick={() => onEditar(usuario)} className="btn-accion btn-editar" title="Editar">
                              <FiEdit2 size={14} /> Editar
                            </button>
                          )}
                          {usuario.rol !== ROLES.SUPER_ADMIN && (
                            <button onClick={() => onDesactivar(usuario.id)} className="btn-accion btn-desactivar" title="Desactivar">
                              <FiSlash size={14} /> Desactivar
                            </button>
                          )}
                          {isSuperAdmin && Number(usuario.id) !== Number(currentUserId) && (
                            <button onClick={() => onEliminar(usuario.id)} className="btn-accion btn-eliminar" title="Eliminar">
                              <FiTrash2 size={14} /> Eliminar
                            </button>
                          )}
                          {/* CORRECCIÓN: Quitamos usuario.extension para que el Reset Pass siempre salga */}
                          {(isSuperAdmin || usuario.rol !== ROLES.SUPER_ADMIN) && (
                            <button onClick={() => onResetPassword(usuario.id)} className="btn-accion btn-reset" title="Reset">
                              <FiKey size={14} /> Reset Pass
                            </button>
                          )}
                          {usuario.rol !== ROLES.SUPER_ADMIN && (
                            <button
                              onClick={() => onAbrirPasswordTemporalModal(usuario)}
                              className="btn-accion btn-temporal"
                              title="Gestionar contraseña temporal"
                            >
                              <FiClock size={14} /> Temporal
                            </button>
                          )}
                          {/* CORRECCIÓN: Quitamos usuario.rol === ROLES.ANALISTA para que aparezca en todos si eres SuperAdmin */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => onBorrarRegistros(usuario)}
                              className="btn-accion btn-purge-records"
                              title="Borrar todos los registros del usuario"
                            >
                              <FiAlertTriangle size={14} /> Borrar Registros
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button onClick={() => onActivar(usuario.id)} className="btn-accion btn-activar" title="Activar">
                            <FiCheckCircle size={14} /> Activar
                          </button>
                          {/* CORRECCIÓN: Lo mismo para los usuarios inactivos */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => onBorrarRegistros(usuario)}
                              className="btn-accion btn-purge-records"
                              title="Borrar todos los registros del usuario"
                            >
                              <FiAlertTriangle size={14} /> Borrar Registros
                            </button>
                          )}
                          {isSuperAdmin && Number(usuario.id) !== Number(currentUserId) && (
                            <button onClick={() => onEliminar(usuario.id)} className="btn-accion btn-eliminar" title="Eliminar">
                              <FiTrash2 size={14} /> Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

    </div>
  );
}