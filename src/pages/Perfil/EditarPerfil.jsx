import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { changePassword } from '../../services/api';
import { FiAlertTriangle, FiEye, FiEyeOff, FiInfo, FiUser } from 'react-icons/fi';
import './editarPerfil.css';

const PASSWORD_SECURITY_NOTIFICATION_ID = 'password-security-required';

const separarNombreCompleto = (nombreCompleto = '') => {
  const valor = String(nombreCompleto || '').trim();
  if (!valor) {
    return { nombre: '', apellido: '' };
  }

  const partes = valor.split(/\s+/);
  if (partes.length === 1) {
    return { nombre: partes[0], apellido: '' };
  }

  const apellido = partes.pop();
  return {
    nombre: partes.join(' '),
    apellido
  };
};

export default function EditarPerfil({ setPageTitle }) {
  const { user, logout, updateUser } = useAuth();
  const { showNotification, removeNotification, removeFromHistory } = useNotification();
  const isSesionTemporal = Boolean(user?.sesion_temporal);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [isNoticeCarouselPaused, setIsNoticeCarouselPaused] = useState(false);

  const profileData = useMemo(() => {
    let nombre = String(user?.nombre || '').trim();
    let apellido = String(user?.apellido || '').trim();

    if (!nombre || !apellido) {
      const partesNombre = separarNombreCompleto(user?.nombre_completo);
      if (!nombre) nombre = partesNombre.nombre;
      if (!apellido) apellido = partesNombre.apellido;
    }

    return {
      nombre,
      apellido,
      extension: String(user?.extension || '').trim(),
      usuario: String(user?.usuario || '').trim(),
      rol: String(user?.rol || '').trim(),
      email: String(user?.email || '').trim()
    };
  }, [user]);

  const nombreCompleto = [profileData.nombre, profileData.apellido].filter(Boolean).join(' ').trim() || profileData.usuario || 'Usuario';
  const iniciales = nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const noticeItems = useMemo(() => ([
    {
      id: 'aviso-sistema',
      title: 'Aviso del sistema',
      message: 'Si quieres cambiar algun dato, consultalo con el administrador del sistema.',
      tone: 'info',
      icon: FiInfo
    },
    {
      id: 'aviso-seguridad',
      title: 'Importante de seguridad',
      message: 'Debe cambiar su contrasena por seguridad.',
      tone: 'warning',
      icon: FiAlertTriangle
    }
  ]), []);

  useEffect(() => {
    if (setPageTitle) {
      setPageTitle({
        titulo: 'Mi Perfil',
        subtitulo: 'Configuracion de cuenta y seguridad',
        icon: <FiUser className="nav-icon-highlight" />
      });
    }

    return () => {
      if (setPageTitle) setPageTitle(null);
    };
  }, [setPageTitle]);

  useEffect(() => {
    if (noticeItems.length <= 1 || isNoticeCarouselPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNoticeIndex((prevIndex) => (prevIndex + 1) % noticeItems.length);
    }, 8500);

    return () => window.clearInterval(intervalId);
  }, [isNoticeCarouselPaused, noticeItems.length]);

  useEffect(() => {
    if (noticeIndex < noticeItems.length) {
      return;
    }
    setNoticeIndex(0);
  }, [noticeIndex, noticeItems.length]);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (isSesionTemporal) {
      showNotification('Sesion temporal activa. Solo el titular puede cambiar la contrasena.', 'warning', 6500);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showNotification('Las contrasenas no coinciden.', 'warning', 6000);
      return;
    }

    if (passwords.newPassword.length < 6) {
      showNotification('La nueva contrasena debe tener al menos 6 caracteres.', 'warning', 6000);
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);

      updateUser({
        password_changed: true,
        sesion_temporal: false
      });
      removeNotification(PASSWORD_SECURITY_NOTIFICATION_ID);
      removeFromHistory(PASSWORD_SECURITY_NOTIFICATION_ID);

      showNotification('Contrasena cambiada exitosamente. Se cerrara la sesion por seguridad.', 'success', 2200);

      window.setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2200);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al cambiar contrasena.', 'error', 7000);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <section className="perfil-page">
      <section className="perfil-shell">
        <header className="perfil-hero-card">
          <div className="perfil-cover" aria-hidden="true">
            <div className="perfil-cover-grid"></div>
            <div className="perfil-cover-glow"></div>
          </div>

          <div className="perfil-hero-content">
            <div className="perfil-avatar" aria-hidden="true">
              {iniciales || <FiUser size={42} />}
            </div>

            <div className="perfil-identidad-info">
              <h2>{nombreCompleto}</h2>
              <p className="perfil-identidad-email">{profileData.email || 'Sin correo institucional asignado'}</p>

              <div className="perfil-identidad-meta">
                {profileData.usuario && (
                  <span className="perfil-meta-chip"><strong>Usuario:</strong> {profileData.usuario}</span>
                )}
                {profileData.rol && (
                  <span className="perfil-meta-chip"><strong>Rol:</strong> {profileData.rol}</span>
                )}
                {profileData.extension && (
                  <span className="perfil-meta-chip"><strong>Extension:</strong> {profileData.extension}</span>
                )}
              </div>
            </div>

            <aside
              className="perfil-notice-card"
              aria-label="Aviso administrativo"
              onMouseEnter={() => setIsNoticeCarouselPaused(true)}
              onMouseLeave={() => setIsNoticeCarouselPaused(false)}
            >
              <div className="perfil-notice-stage" aria-live="polite">
                {noticeItems.map((notice, index) => {
                  const NoticeIcon = notice.icon;
                  const isActive = index === noticeIndex;

                  return (
                    <article
                      key={notice.id}
                      className={`perfil-notice-slide ${isActive ? 'active' : ''}`}
                      aria-hidden={!isActive}
                    >
                      <div className="perfil-notice-head">
                        <span
                          className={`perfil-notice-icon ${notice.tone === 'warning' ? 'is-warning' : 'is-info'}`}
                          aria-hidden="true"
                        >
                          <NoticeIcon />
                        </span>
                        <h3>{notice.title}</h3>
                      </div>
                      <p>{notice.message}</p>
                    </article>
                  );
                })}
              </div>

              {noticeItems.length > 1 && (
                <div className="perfil-notice-dots" role="tablist" aria-label="Carrusel de avisos">
                  {noticeItems.map((notice, index) => (
                    <button
                      key={notice.id}
                      type="button"
                      className={`perfil-notice-dot ${index === noticeIndex ? 'active' : ''}`}
                      onClick={() => setNoticeIndex(index)}
                      aria-label={`Mostrar aviso ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </aside>
          </div>
        </header>

        <section className="perfil-panel">
          <section className="perfil-security-card" aria-label="Seguridad de la cuenta">
            <div className="perfil-security-head">
              <h4>Seguridad de la cuenta</h4>
              <p>Cambia tu contrasena periodicamente para proteger tu cuenta.</p>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="perfil-grid perfil-security-grid">
                <div className="perfil-field">
                  <label>Contrasena actual <span className="perfil-required">*</span></label>
                  <div className="perfil-password-input">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="Ingrese contrasena actual"
                      disabled={isSesionTemporal}
                      required
                    />
                    <button
                      type="button"
                      className="perfil-password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                      aria-label={showPasswords.current ? 'Ocultar contrasena actual' : 'Mostrar contrasena actual'}
                    >
                      {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="perfil-field">
                  <label>Nueva contrasena <span className="perfil-required">*</span></label>
                  <div className="perfil-password-input">
                    <input
                      type={showPasswords.next ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="Minimo 6 caracteres"
                      disabled={isSesionTemporal}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="perfil-password-toggle"
                      onClick={() => togglePasswordVisibility('next')}
                      aria-label={showPasswords.next ? 'Ocultar nueva contrasena' : 'Mostrar nueva contrasena'}
                    >
                      {showPasswords.next ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="perfil-field perfil-field-full">
                  <label>Confirmar nueva contrasena <span className="perfil-required">*</span></label>
                  <div className="perfil-password-input">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Repita la nueva contraseña"
                      disabled={isSesionTemporal}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="perfil-password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                      aria-label={showPasswords.confirm ? 'Ocultar confirmacion de contrasena' : 'Mostrar confirmacion de contraseña'}
                    >
                      {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="perfil-card-footer">
                <button type="submit" disabled={loading || isSesionTemporal} className="perfil-btn perfil-btn-primary">
                  {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setShowPasswords({ current: false, next: false, confirm: false });
                  }}
                  className="perfil-btn perfil-btn-cancel"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </section>
        </section>
      </section>
    </section>
  );
}
