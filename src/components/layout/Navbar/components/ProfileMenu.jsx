import '../styles/ProfileMenu.css';

const ProfileMenu = ({
  profileRef,
  showProfileMenu,
  onToggleProfileMenu,
  user,
  isDarkMode,
  onToggleDarkMode,
  onProfileMenuClick
}) => {
  const getInitial = () => user?.nombre?.charAt(0).toUpperCase() || <i className='bx bxs-user'></i>;

  return (
    <div className="navbar-profile" ref={profileRef}>
      <button className="profile-trigger-btn" onClick={onToggleProfileMenu}>
        <div className="profile-icon-small">{getInitial()}</div>
      </button>

      <div className={`profile-menu-elegant ${showProfileMenu ? 'show' : ''}`}>
        <div className="profile-header-centered">
          <div className="profile-icon-large">{getInitial()}</div>
          <div className="profile-info-stack">
            <span className="profile-email">{user?.email || 'usuario@puebla.gob.mx'}</span>
            <span className="profile-role-badge">{user?.rol || 'Funcionario'}</span>
          </div>
        </div>
        <div className="profile-menu-divider"></div>
        <ul className="profile-options-list">
          <li><a href="#" onClick={(e) => { e.preventDefault(); onProfileMenuClick('Perfil'); }}><i className='bx bx-user-circle'></i> Mi Perfil</a></li>
          <li>
            <button type="button" className="profile-theme-toggle" onClick={onToggleDarkMode}>
              <span className="profile-theme-left">
                <i className={`bx ${isDarkMode ? 'bx-moon' : 'bx-sun'}`}></i>
                {isDarkMode ? 'Modo oscuro' : 'Modo claro'}
              </span>
              <span className={`profile-theme-switch ${isDarkMode ? 'is-on' : ''}`}>
                <span className="profile-theme-switch-ball"></span>
              </span>
            </button>
          </li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); onProfileMenuClick('logout'); }} className="logout-link"><i className='bx bx-log-out-circle'></i> Cerrar Sesion</a></li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileMenu;
