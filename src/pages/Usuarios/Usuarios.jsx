import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { HiUsers } from 'react-icons/hi';
import { ROLES } from '../../constants/roles';
// Hooks personalizados
import { useUsuariosList, useUsuariosFilters, useUsuarioForm } from '../../hooks/usuarios';

// Componentes
import UsuariosHeader from './components/UsuariosHeader';
import UsuariosFiltros from './components/UsuariosFiltros';
import UsuariosTabla from './components/UsuariosTabla';
import UsuarioFormCrear from './components/UsuarioFormCrear';
import UsuarioFormEditar from './components/UsuarioFormEditar';
import PasswordTemporalModal from './components/PasswordTemporalModal';
import PurgeAnalistaRecordsModal from './components/PurgeAnalistaRecordsModal';
import UsuarioActionModal from './components/UsuarioActionModal';
import './styles/Usuarios.css';

const ONLINE_REFRESH_INTERVAL_MS = Math.max(
  2000,
  Number(import.meta.env.VITE_USERS_ONLINE_REFRESH_MS) || 2000
);

/**
 * Componente Container de Usuarios
 * Orquesta la gestión completa de usuarios del sistema
 */
export default function Usuarios({ setPageTitle }) {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [mensaje, setMensaje] = useState(null);
  const [temporalModalOpen, setTemporalModalOpen] = useState(false);
  const [usuarioTemporal, setUsuarioTemporal] = useState(null);
  const [temporalEstado, setTemporalEstado] = useState({
    usuario: null,
    acceso_activo: null,
    bitacora: []
  });
  const [temporalLoading, setTemporalLoading] = useState(false);
  const [temporalProcessing, setTemporalProcessing] = useState(false);
  const [passwordTemporalGenerada, setPasswordTemporalGenerada] = useState('');
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [usuarioPurge, setUsuarioPurge] = useState(null);
  const [purgeProcessing, setPurgeProcessing] = useState(false);
  const [actionModal, setActionModal] = useState({
    open: false,
    actionType: null,
    usuario: null
  });
  const [actionProcessing, setActionProcessing] = useState(false);

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: "Gestión de Usuarios",
        subtitulo: "Administración de cuentas y permisos del sistema",
        icon: <HiUsers className="nav-icon-highlight" />
      });
    }
    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);

  // Hooks especializados
  const {
    usuarios,
    regiones,
    loading,
    cargarRegiones,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    borrarRegistrosAnalista,
    activarUsuario,
    desactivarUsuario,
    resetearPassword,
    generarPasswordTemporal,
    obtenerPasswordTemporal,
    revocarPasswordTemporal
  } = useUsuariosList();

  const {
    buscar,
    setBuscar,
    filtroRol,
    setFiltroRol,
    filtroEstado,
    setFiltroEstado,
    filtroRegion,
    setFiltroRegion,
    limpiarFiltros,
    obtenerFiltros
  } = useUsuariosFilters();

  const {
    showForm,
    editingUser,
    newUser,
    setNewUser,
    setEditingUser,
    abrirFormularioCrear,
    cerrarFormularioCrear,
    abrirFormularioEditar,
    cerrarFormularioEditar
  } = useUsuarioForm();

  // Cargar regiones al montar
  useEffect(() => {
    cargarRegiones();
  }, [cargarRegiones]);

  // Cargar usuarios cuando cambien los filtros
  useEffect(() => {
    const cargar = async () => {
      try {
        await cargarUsuarios(obtenerFiltros());
      } catch {
        // Los errores se manejan en el hook y notificaciones del flujo.
      }
    };

    void cargar();
  }, [buscar, filtroRol, filtroEstado, filtroRegion, cargarUsuarios, obtenerFiltros]);

  // Refresco automático para estado online/offline sin recargar la página.
  useEffect(() => {
    let disposed = false;

    const refrescarOnline = async () => {
      if (disposed || document.hidden) return;

      try {
        await cargarUsuarios(obtenerFiltros(), { silent: true });
      } catch {
        // Evitar ruido en polling continuo.
      }
    };

    const timerId = window.setInterval(() => {
      void refrescarOnline();
    }, ONLINE_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      void refrescarOnline();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      disposed = true;
      window.clearInterval(timerId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [cargarUsuarios, obtenerFiltros]);

  /**
   * Mostrar mensaje de notificación
   */
  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  const cargarEstadoPasswordTemporal = async (usuarioId) => {
    if (!usuarioId) return;

    setTemporalLoading(true);
    try {
      const response = await obtenerPasswordTemporal(usuarioId, { limit: 80 });
      setTemporalEstado(response.data || { usuario: null, acceso_activo: null, bitacora: [] });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al consultar contraseña temporal';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    } finally {
      setTemporalLoading(false);
    }
  };

  /**
   * Handler: Crear nuevo usuario
   */
  const handleCreate = async (userData) => {
    try {
      // Limpiar region_id si está vacío
      const payload = { ...userData };
      if (!payload.region_id) {
        delete payload.region_id;
      }
      console.log('Payload a enviar:', payload);
      const response = await crearUsuario(payload);
      const passwordInicial = response.data.password_inicial;
      mostrarMensaje(`Usuario creado exitosamente. Contraseña inicial: ${passwordInicial}`, 'success');
      showNotification(`Usuario creado: ${payload.usuario}`, 'success');
      cerrarFormularioCrear();
      cargarUsuarios(obtenerFiltros());
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al crear usuario';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    }
  };

  /**
   * Handler: Actualizar usuario existente
   */
  const handleUpdate = async (userData) => {
    try {
      await actualizarUsuario(userData.id, userData);
      mostrarMensaje('Usuario actualizado exitosamente', 'success');
      showNotification(`Usuario actualizado: ${userData.usuario}`, 'success');
      cerrarFormularioEditar();
      cargarUsuarios(obtenerFiltros());
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al actualizar usuario';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    }
  };

  /**
   * Handler: Activar usuario
   */
  const handleActivate = async (id) => {
    const usuario = usuarios.find((item) => Number(item.id) === Number(id));
    if (!usuario) return;

    setActionModal({
      open: true,
      actionType: 'activate',
      usuario
    });
  };

  const handleConfirmActivate = async () => {
    if (!actionModal.usuario?.id || actionProcessing) return;

    setActionProcessing(true);
    try {
      await activarUsuario(actionModal.usuario.id);
      mostrarMensaje('Usuario activado exitosamente', 'success');
      showNotification('Usuario activado', 'success');
      await cargarUsuarios(obtenerFiltros());
      setActionModal({ open: false, actionType: null, usuario: null });
    } catch (error) {
      mostrarMensaje('Error al activar usuario', 'error');
      showNotification('Error al activar usuario', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  /**
   * Handler: Desactivar usuario
   */
  const handleDeactivate = async (id) => {
    const usuario = usuarios.find((item) => Number(item.id) === Number(id));
    if (!usuario) return;

    setActionModal({
      open: true,
      actionType: 'deactivate',
      usuario
    });
  };

  const handleConfirmDeactivate = async () => {
    if (!actionModal.usuario?.id || actionProcessing) return;

    setActionProcessing(true);
    try {
      await desactivarUsuario(actionModal.usuario.id);
      mostrarMensaje('Usuario desactivado exitosamente', 'success');
      showNotification('Usuario desactivado', 'success');
      await cargarUsuarios(obtenerFiltros());
      setActionModal({ open: false, actionType: null, usuario: null });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al desactivar usuario';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  /**
   * Handler: Eliminar usuario (solo Super Admin)
   */
  const handleDelete = async (id) => {
    if (!isSuperAdmin()) {
      const errorMsg = 'Solo Super Admin puede eliminar usuarios';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      return;
    }

    if (Number(id) === Number(user?.id)) {
      const errorMsg = 'No puedes eliminar el usuario con el que iniciaste sesion';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      return;
    }

    if (!confirm('¿Eliminar este usuario de forma permanente? Esta acción no se puede deshacer.')) return;

    try {
      await eliminarUsuario(id);
      mostrarMensaje('Usuario eliminado exitosamente', 'success');
      showNotification('Usuario eliminado', 'success');
      cargarUsuarios(obtenerFiltros());
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al eliminar usuario';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    }
  };

  /**
   * Handler: Resetear contraseña
   */
  const handleResetPassword = async (id) => {
    const usuario = usuarios.find((item) => Number(item.id) === Number(id));
    if (!usuario) return;

    setActionModal({
      open: true,
      actionType: 'reset_password',
      usuario
    });
  };

  const handleConfirmResetPassword = async () => {
    if (!actionModal.usuario?.id || actionProcessing) return;

    setActionProcessing(true);
    try {
      const response = await resetearPassword(actionModal.usuario.id);
      const passwordTemporal = response.data.password_temporal;
      mostrarMensaje(`Contraseña reseteada exitosamente. Nueva contraseña temporal: ${passwordTemporal}`, 'success');
      showNotification('Contraseña reseteada', 'success');
      await cargarUsuarios(obtenerFiltros());
      setActionModal({ open: false, actionType: null, usuario: null });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al resetear contraseña';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleCloseActionModal = () => {
    if (actionProcessing) return;
    setActionModal({ open: false, actionType: null, usuario: null });
  };

  const handleConfirmActionModal = async () => {
    if (actionModal.actionType === 'activate') {
      await handleConfirmActivate();
      return;
    }

    if (actionModal.actionType === 'deactivate') {
      await handleConfirmDeactivate();
      return;
    }

    if (actionModal.actionType === 'reset_password') {
      await handleConfirmResetPassword();
    }
  };

  /**
   * Handler: Generar contraseña temporal de delegación
   */
  const handleAbrirPasswordTemporalModal = async (usuario) => {
    if (!usuario?.id || !usuario?.activo) return;

    setUsuarioTemporal(usuario);
    setPasswordTemporalGenerada('');
    setTemporalModalOpen(true);
    await cargarEstadoPasswordTemporal(usuario.id);
  };

  const handleCerrarPasswordTemporalModal = () => {
    setTemporalModalOpen(false);
    setUsuarioTemporal(null);
    setTemporalEstado({ usuario: null, acceso_activo: null, bitacora: [] });
    setPasswordTemporalGenerada('');
  };

  const handleGenerarPasswordTemporal = async ({ duracion_dias, motivo }) => {
    if (!usuarioTemporal?.id) return;

    setTemporalProcessing(true);
    try {
      const response = await generarPasswordTemporal(usuarioTemporal.id, {
        duracion_dias,
        motivo
      });

      const passwordTemporal = response?.data?.password_temporal || '';
      const expiraEn = response?.data?.expira_en
        ? new Date(response.data.expira_en).toLocaleString('es-MX')
        : `en ${duracion_dias} día(s)`;

      setPasswordTemporalGenerada(passwordTemporal);

      mostrarMensaje(`Contraseña temporal generada. Vigencia hasta: ${expiraEn}`, 'success');
      showNotification('Contraseña temporal generada', 'success');

      await cargarEstadoPasswordTemporal(usuarioTemporal.id);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al generar contraseña temporal';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');

      if (error.response?.status === 409) {
        await cargarEstadoPasswordTemporal(usuarioTemporal.id);
      }
    } finally {
      setTemporalProcessing(false);
    }
  };

  const handleRevocarPasswordTemporal = async ({ motivo }) => {
    if (!usuarioTemporal?.id) return;

    setTemporalProcessing(true);
    try {
      await revocarPasswordTemporal(usuarioTemporal.id, {
        motivo
      });

      setPasswordTemporalGenerada('');
      mostrarMensaje('Contraseña temporal revocada exitosamente', 'success');
      showNotification('Contraseña temporal revocada', 'success');

      await cargarEstadoPasswordTemporal(usuarioTemporal.id);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al revocar contraseña temporal';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    } finally {
      setTemporalProcessing(false);
    }
  };

  const handleCopiarPasswordTemporal = async (password) => {
    if (!password) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      showNotification('Contraseña temporal copiada al portapapeles', 'success');
    } catch (error) {
      showNotification('No se pudo copiar la contraseña temporal', 'error');
    }
  };

  const handleAbrirPurgeModal = (usuario) => {
    if (!isSuperAdmin()) {
      const errorMsg = 'Solo Super Admin puede borrar registros de analistas';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      return;
    }

    if (!usuario?.id) {
      const errorMsg = 'No se pudo identificar el analista seleccionado';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      return;
    }

    if (usuario.rol !== ROLES.ANALISTA) {
      const errorMsg = 'La limpieza de registros solo aplica para usuarios con rol analista';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
      return;
    }

    setUsuarioPurge(usuario);
    setPurgeModalOpen(true);
  };

  const handleCerrarPurgeModal = () => {
    if (purgeProcessing) return;
    setPurgeModalOpen(false);
    setUsuarioPurge(null);
  };

  const handleConfirmarPurge = async () => {
    if (!usuarioPurge?.id || purgeProcessing) return;

    setPurgeProcessing(true);
    try {
      const response = await borrarRegistrosAnalista(usuarioPurge.id);
      const totalEliminados = Number(response?.data?.total_eliminados || 0);
      const mensajeExito = response?.message || 'Registros del analista eliminados exitosamente';

      mostrarMensaje(`${mensajeExito} (Total: ${totalEliminados})`, 'success');
      showNotification(`${mensajeExito} (${totalEliminados})`, 'success');

      setPurgeModalOpen(false);
      setUsuarioPurge(null);
      await cargarUsuarios(obtenerFiltros());
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al borrar registros del analista';
      mostrarMensaje(errorMsg, 'error');
      showNotification(errorMsg, 'error');
    } finally {
      setPurgeProcessing(false);
    }
  };

  /**
   * Handler: Toggle formulario de creación
   */
  const handleToggleFormulario = () => {
    if (showForm) {
      cerrarFormularioCrear();
    } else {
      abrirFormularioCrear();
      cerrarFormularioEditar();
    }
  };

  // Loading inicial
  if (loading && usuarios.length === 0) {
    return (
      <main className="usuarios-container">
        <div className="usuarios-loading">
          <div className="spinner" />
          <p>Cargando usuarios...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="usuarios-container">
      {/* Header */}
      <UsuariosHeader />

      {/* Mensaje de notificación */}
      {mensaje && (
        <div className={`usuarios-mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtros */}
      <UsuariosFiltros
        buscar={buscar}
        setBuscar={setBuscar}
        filtroRol={filtroRol}
        setFiltroRol={setFiltroRol}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroRegion={filtroRegion}
        setFiltroRegion={setFiltroRegion}
        regiones={regiones}
        onLimpiar={limpiarFiltros}
        onCrearNuevo={handleToggleFormulario}
        totalUsuarios={usuarios.length}
        showForm={showForm}
      />

      {/* Formulario de crear usuario */}
      {showForm && (
        <UsuarioFormCrear
          newUser={newUser}
          setNewUser={setNewUser}
          regiones={regiones}
          onSubmit={handleCreate}
          onCancelar={cerrarFormularioCrear}
          isSuperAdmin={isSuperAdmin()}
          isAdmin={isAdmin()}
        />
      )}

      {/* Formulario de editar usuario */}
      {editingUser && (
        <UsuarioFormEditar
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          regiones={regiones}
          onSubmit={handleUpdate}
          onCancelar={cerrarFormularioEditar}
          isSuperAdmin={isSuperAdmin()}
          isAdmin={isAdmin()}
        />
      )}

      {/* Tabla de usuarios */}
      <UsuariosTabla
        usuarios={usuarios}
        loading={loading}
        onEditar={abrirFormularioEditar}
        onActivar={handleActivate}
        onDesactivar={handleDeactivate}
        onEliminar={handleDelete}
        onBorrarRegistrosAnalista={handleAbrirPurgeModal}
        onResetPassword={handleResetPassword}
        onAbrirPasswordTemporalModal={handleAbrirPasswordTemporalModal}
        currentUserId={user?.id}
        isSuperAdmin={isSuperAdmin()}
      />

      <PurgeAnalistaRecordsModal
        open={purgeModalOpen}
        usuario={usuarioPurge}
        processing={purgeProcessing}
        onClose={handleCerrarPurgeModal}
        onConfirm={handleConfirmarPurge}
      />

      <PasswordTemporalModal
        open={temporalModalOpen}
        usuario={usuarioTemporal}
        estado={temporalEstado}
        loading={temporalLoading}
        processing={temporalProcessing}
        generatedPassword={passwordTemporalGenerada}
        onClose={handleCerrarPasswordTemporalModal}
        onRefresh={() => cargarEstadoPasswordTemporal(usuarioTemporal?.id)}
        onGenerate={handleGenerarPasswordTemporal}
        onRevoke={handleRevocarPasswordTemporal}
        onCopyPassword={handleCopiarPasswordTemporal}
      />

      <UsuarioActionModal
        open={actionModal.open}
        actionType={actionModal.actionType}
        usuario={actionModal.usuario}
        processing={actionProcessing}
        onClose={handleCloseActionModal}
        onConfirm={handleConfirmActionModal}
      />
    </div>
  );
}
