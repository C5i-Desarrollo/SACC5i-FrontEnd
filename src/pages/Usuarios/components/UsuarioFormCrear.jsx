import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import { FiUserPlus, FiSave, FiXCircle } from 'react-icons/fi';
import '../styles/UsuarioForm.css';

export default function UsuarioFormCrear({
  newUser,
  setNewUser,
  regiones,
  onSubmit,
  onCancelar,
  isSuperAdmin,
  isAdmin
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newUser);
  };

  return (
    <form onSubmit={handleSubmit} className="usuario-form form-crear">
      <div className="form-header crear-header">
        <h3 className="form-titulo crear">
          <FiUserPlus size={18} /> Nuevo Usuario
        </h3>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">
            Usuario: <span className="requerido">*</span>
          </label>
          <input
            placeholder="ej: juan.perez"
            value={newUser.usuario}
            onChange={(e) => setNewUser({...newUser, usuario: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Email: <span className="requerido">*</span>
          </label>
          <input
            type="email"
            placeholder="usuario@puebla.gob.mx"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Nombre: <span className="requerido">*</span>
          </label>
          <input
            placeholder="Nombre"
            value={newUser.nombre}
            onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Apellido: <span className="requerido">*</span>
          </label>
          <input
            placeholder="Apellido"
            value={newUser.apellido}
            onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Extension: <span className="requerido">*</span>
            <small className="form-hint"> (solo contacto interno)</small>
          </label>
          <input
            placeholder="ej: 12345"
            value={newUser.extension}
            onChange={(e) => setNewUser({...newUser, extension: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Rol: <span className="requerido">*</span>
          </label>
          <select
            value={newUser.rol}
            onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
            className="form-select"
          >
              <option value={ROLES.ANALISTA}>{ROLE_LABELS[ROLES.ANALISTA]}</option>
              <option value={ROLES.VALIDADOR_C3}>{ROLE_LABELS[ROLES.VALIDADOR_C3]}</option>
              <option value={ROLES.DEPENDENCIA}>{ROLE_LABELS[ROLES.DEPENDENCIA]}</option>
              <option value={ROLES.OPERADOR_CCP}>{ROLE_LABELS[ROLES.OPERADOR_CCP]}</option>
              <option value={ROLES.MUNICIPIO}>{ROLE_LABELS[ROLES.MUNICIPIO]}</option>
              <option value={ROLES.COORDINADOR}>{ROLE_LABELS[ROLES.COORDINADOR]}</option>
              {(isSuperAdmin || isAdmin) && (
                <option value={ROLES.DIRECCION}>{ROLE_LABELS[ROLES.DIRECCION]}</option>
              )}
              {(isSuperAdmin || isAdmin) && (
                <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
              )}
              {isSuperAdmin && (
                <option value={ROLES.SUPER_ADMIN}>{ROLE_LABELS[ROLES.SUPER_ADMIN]}</option>
              )}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">
            Region: <small className="form-hint">(opcional, solo para Analistas)</small>
          </label>
          <select
            value={newUser.region_id}
            onChange={(e) => setNewUser({...newUser, region_id: e.target.value})}
            className="form-select"
          >
            <option value="">Sin region asignada</option>
            {regiones.map(region => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-acciones crear-footer">
        <button type="submit" className="btn-submit crear">
          <FiSave size={15} /> Crear Usuario
        </button>
        <button type="button" onClick={onCancelar} className="btn-cancelar">
          <FiXCircle size={15} /> Cancelar
        </button>
      </div>
    </form>
  );
}