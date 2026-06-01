import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { FiDatabase, FiUsers } from 'react-icons/fi';
import NotificationCenter from './components/NotificationCenter';
import ProfileMenu from './components/ProfileMenu';
import './styles/NavbarBase.css';

const Navbar = ({
  onToggleSidebar,
  onSectionChange,
  pageTitle,
  isSidebarHidden,
  isDireccion = false,
  selectedAnalista = null
}) => {
  const { user, logout } = useAuth();
  const {
    notificationHistory,
    unreadCount,
    totalCount,
    removeNotification,
    removeFromHistory,
    clearHistory,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    markAllAsUnread
  } = useNotification();
  const navigate = useNavigate();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [activeNotificationMenuId, setActiveNotificationMenuId] = useState(null);
  const [bellAnimationTick, setBellAnimationTick] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const previousUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const enabled = saved === 'dark';
    setIsDarkMode(enabled);
    document.body.classList.toggle('dark', enabled);
  }, []);

  const triggerBellAnimation = useCallback(() => {
    setBellAnimationTick((prev) => prev + 1);
  }, []);

  const closeNotificationMenu = useCallback(() => {
    setShowNotificationMenu(false);
    setActiveNotificationMenuId(null);
  }, []);

  const closeProfileMenu = useCallback(() => {
    setShowProfileMenu(false);
  }, []);

  const handleToggleMenu = useCallback((menu) => {
    if (menu === 'notification') {
      setShowNotificationMenu((prev) => {
        const nextValue = !prev;
        if (nextValue) {
          triggerBellAnimation();
        }
        return nextValue;
      });
      closeProfileMenu();
      setActiveNotificationMenuId(null);
    } else if (menu === 'profile') {
      setShowProfileMenu((prev) => !prev);
      closeNotificationMenu();
    }
  }, [closeNotificationMenu, closeProfileMenu, triggerBellAnimation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        closeProfileMenu();
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        closeNotificationMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeProfileMenu();
        closeNotificationMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeNotificationMenu, closeProfileMenu]);

  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current) {
      triggerBellAnimation();
    }

    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount, triggerBellAnimation]);

  const handleDarkModeToggle = () => {
    const nextValue = !isDarkMode;
    setIsDarkMode(nextValue);
    document.body.classList.toggle('dark', nextValue);
    localStorage.setItem('theme', nextValue ? 'dark' : 'light');
  };

  const handleProfileMenuClick = (section) => {
    if (section === 'logout') {
      logout();
      navigate('/login');
    } else {
      onSectionChange(section);
      closeProfileMenu();
    }
  };

  const handleOpenRepositorioDigital = () => {
    onSectionChange('RepositorioDigital');
  };

  const handleOpenAnalistaSelector = () => {
    onSectionChange('Dashboard');
  };

  // ==========================================
  // LÓGICA DE VISUALIZACIÓN DINÁMICA POR ROL
  // ==========================================
  const isMunicipio = user?.rol === 'municipio' || user?.rol === 'MUNICIPIO';

  const regionText = user?.region_nombre || (user?.region_id ? `Region ${user.region_id}` : 'Sin region');
  const regionDisplayText = isDireccion
    ? (selectedAnalista?.region || 'Selecciona usuario')
    : regionText;

  // Extrae automáticamente el nombre del municipio del usuario logueado
  const obtenerNombreMunicipio = () => {
    // 1. Si el backend ya nos manda el nombre limpio y bonito
    if (user?.municipio_nombre) return user.municipio_nombre;
    
    // 2. Si el usuario es tipo "mun_acajete", le quitamos el "mun_" y lo capitalizamos
    const identificador = user?.usuario || user?.nombre || '';
    if (identificador.startsWith('mun_')) {
      const nombreLimpio = identificador.replace('mun_', '');
      return nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
    }
    
    // 3. Fallback en caso de que sea un usuario raro
    return user?.nombre || 'Desconocido';
  };

  const ubicacionText = isMunicipio 
    ? `Municipio: ${obtenerNombreMunicipio()}` 
    : `Region: ${regionDisplayText}`;

  return (
    <nav id="content-nav">
        <button type="button" className="nav-menu-toggle" onClick={onToggleSidebar} aria-label="Mostrar/Ocultar menu lateral">
          <i className={`bx ${isSidebarHidden ? 'bx-chevrons-right' : 'bx-chevrons-left'} bx-sm`}></i>
        </button>

        {pageTitle && (
          <div className="nav-page-title-container">
            <div className="nav-title-wrapper">
              {pageTitle.icon}
              <div className="nav-text-group">
                <span className="nav-main-title">{pageTitle.titulo}</span>
              </div>
            </div>
          </div>
        )}

        <div className="nav-spacer" style={{ flexGrow: 1 }}></div>

        <div className="nav-right-actions">
          {/* Lógica para Repositorio / Selector Analista */}
          {isDireccion ? (
            <button
              type="button"
              className="nav-user-picker-pill"
              title="Seleccionar analista"
              onClick={handleOpenAnalistaSelector}
            >
              <FiUsers size={14} />
              <span>{selectedAnalista?.nombre || 'Seleccionar usuario'}</span>
            </button>
          ) : !isMunicipio ? ( 
            /* Solo renderizamos este botón si NO es municipio */
            <button
              type="button"
              className="nav-repo-pill"
              title="Ir a Repositorio Digital"
              onClick={handleOpenRepositorioDigital}
            >
              <FiDatabase size={14} />
              <span>Repositorio Digital</span>
            </button>
          ) : null}

          {/* Pastilla dinámica (Región o Municipio) */}
          <div className="nav-region-pill" title={ubicacionText}>
            <i className={isMunicipio ? 'bx bx-buildings' : 'bx bx-map'}></i>
            <span>{ubicacionText}</span>
          </div>

          <NotificationCenter
            notificationRef={notificationRef}
            showNotificationMenu={showNotificationMenu}
            onToggleNotificationMenu={() => handleToggleMenu('notification')}
            onCloseNotificationMenu={closeNotificationMenu}
            bellAnimationTick={bellAnimationTick}
            unreadCount={unreadCount}
            totalCount={totalCount}
            notificationHistory={notificationHistory}
            activeNotificationMenuId={activeNotificationMenuId}
            setActiveNotificationMenuId={setActiveNotificationMenuId}
            markAllAsRead={markAllAsRead}
            markAllAsUnread={markAllAsUnread}
            clearHistory={clearHistory}
            markAsRead={markAsRead}
            markAsUnread={markAsUnread}
            removeNotification={removeNotification}
            removeFromHistory={removeFromHistory}
          />

          <ProfileMenu
            profileRef={profileRef}
            showProfileMenu={showProfileMenu}
            onToggleProfileMenu={() => handleToggleMenu('profile')}
            user={user}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleDarkModeToggle}
            onProfileMenuClick={handleProfileMenuClick}
          />
        </div>
      </nav>
  );
};

export default Navbar;