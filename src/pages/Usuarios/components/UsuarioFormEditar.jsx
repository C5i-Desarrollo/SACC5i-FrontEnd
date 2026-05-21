import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import { FiEdit2, FiX, FiSave, FiXCircle } from 'react-icons/fi';
import '../styles/UsuarioForm.css';

export default function UsuarioFormEditar({
  editingUser,
  setEditingUser,
  regiones,
  onSubmit,
  onCancelar,
  isSuperAdmin,
  isAdmin
}) {
  if (!editingUser) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(editingUser);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <form onSubmit={handleSubmit} className="usuario-form form-editar modal-form">

          <div className="form-header modal-header">
            <h3 className="form-titulo editar">
              <FiEdit2 size={16} /> Editar Usuario: <strong>{editingUser.usuario}</strong>
            </h3>
            <button
              type="button"
              onClick={onCancelar}
              className="btn-cerrar"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="modal-body">
            <div className="form-grid">

              <div className="form-field">
                <label className="form-label">
                  Usuario: <span className="requerido">*</span>
                </label>
                <input
                  value={editingUser.usuario || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, usuario: e.target.value })
                  }
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
                  value={editingUser.email || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Nombre: <span className="requerido">*</span>
                </label>
                <input
                  value={editingUser.nombre || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nombre: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Apellido: <span className="requerido">*</span>
                </label>
                <input
                  value={editingUser.apellido || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, apellido: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Extension: <span className="requerido">*</span>
                </label>
                <input
                  value={editingUser.extension || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, extension: e.target.value })
                  }
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Rol: <span className="requerido">*</span>
                </label>
                <select
                  value={editingUser.rol}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, rol: e.target.value })
                  }
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
                  Region: <small className="form-hint">(opcional)</small>
                </label>
                <select
                  value={editingUser.region_id || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, region_id: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="">Sin region asignada</option>
                  {regiones.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.nombre}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="form-acciones modal-footer">
            <button type="submit" className="btn-submit editar">
              <FiSave size={15} /> Guardar Cambios
            </button>
            <button type="button" onClick={onCancelar} className="btn-cancelar">
              <FiXCircle size={15} /> Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
