import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import {
  FiSearch,
  FiFilter,
  FiUserPlus,
  FiXCircle,
  FiRefreshCw,
  FiUsers
} from 'react-icons/fi';
import '../styles/UsuariosFiltros.css';

export default function UsuariosFiltros({
  buscar,
  setBuscar,
  filtroRol,
  setFiltroRol,
  filtroEstado,
  setFiltroEstado,
  filtroRegion,
  setFiltroRegion,
  regiones,
  onLimpiar,
  onCrearNuevo,
  totalUsuarios,
  showForm
}) {
  return (
    <div className="usuarios-filtros-container">
      <div className="filtros-header">
        <h3 className="filtros-titulo">
          <FiFilter size={16} /> <span>Filtros</span>
        </h3>
        <div className="filtros-total">
          <FiUsers size={14} />
          <span>Total: <strong>{totalUsuarios}</strong> usuarios</span>
        </div>
      </div>

      <div className="filtros-grid">
        <div className="filtro-grupo">
          <div className="input-con-icono">
            <FiSearch size={15} className="input-icono" />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario, email..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="filtro-input"
            />
          </div>
        </div>

        <div className="filtro-grupo">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los roles</option>
            <option value={ROLES.SUPER_ADMIN}>{ROLE_LABELS[ROLES.SUPER_ADMIN]}</option>
            <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
            <option value={ROLES.DIRECCION}>{ROLE_LABELS[ROLES.DIRECCION]}</option>
            <option value={ROLES.ANALISTA}>{ROLE_LABELS[ROLES.ANALISTA]}</option>
            <option value={ROLES.VALIDADOR_C3}>{ROLE_LABELS[ROLES.VALIDADOR_C3]}</option>
            <option value={ROLES.DEPENDENCIA}>{ROLE_LABELS[ROLES.DEPENDENCIA]}</option>
            <option value={ROLES.OPERADOR_CCP}>{ROLE_LABELS[ROLES.OPERADOR_CCP]}</option>
              <option value={ROLES.MUNICIPIO}>{ROLE_LABELS[ROLES.MUNICIPIO]}</option>
              <option value={ROLES.COORDINADOR}>{ROLE_LABELS[ROLES.COORDINADOR]}</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <select
            value={filtroRegion}
            onChange={(e) => setFiltroRegion(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todas las regiones</option>
            {regiones.map(region => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filtros-acciones">
        <button onClick={onCrearNuevo} className={`btn-crear ${showForm ? 'cancelar' : ''}`}>
          {showForm
            ? <><FiXCircle size={15} /> <span>Cancelar</span></>
            : <><FiUserPlus size={15} /> <span>Crear Usuario</span></>
          }
        </button>

        <button onClick={onLimpiar} className="btn-limpiar">
          <FiRefreshCw size={14} /> <span>Limpiar Filtros</span>
        </button>
      </div>
    </div>
  );
}