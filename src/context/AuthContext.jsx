import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { login as loginService, getProfile, heartbeatSession } from '../services/api';
import { ROLES } from '../constants/roles';

// Context para manejo de autenticación
const AuthContext = createContext(null);

const MIN_SESSION_IDLE_TIMEOUT_MINUTES = 30;
const DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES = Math.max(
  MIN_SESSION_IDLE_TIMEOUT_MINUTES,
  Number(import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MINUTES) || MIN_SESSION_IDLE_TIMEOUT_MINUTES
);
const HEARTBEAT_MIN_INTERVAL_MS = Math.max(
  30000,
  Number(import.meta.env.VITE_SESSION_HEARTBEAT_MS) || 120000
);
const HEARTBEAT_TICK_MS = 30000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [welcomePending, setWelcomePending] = useState(
    sessionStorage.getItem('welcome_pending') === '1'
  );
  const [sessionIdleTimeoutMinutes, setSessionIdleTimeoutMinutes] = useState(() => {
    const storedValue = Number(sessionStorage.getItem('session_idle_timeout_minutes'));
    if (Number.isFinite(storedValue) && storedValue >= MIN_SESSION_IDLE_TIMEOUT_MINUTES) {
      return storedValue;
    }

    return DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES;
  });
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatAtRef = useRef(0);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const closeSessionOnServer = useCallback((authToken) => {
    if (!authToken) return;

    try {
      void fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: '{}',
        keepalive: false,
        credentials: 'same-origin'
      });
    } catch {
      // Falla silenciosa: la sesión local debe cerrarse siempre.
    }
  }, []);

  const logout = useCallback((options = {}) => {
    const shouldNotifyServer = options.notifyServer !== false;
    const currentToken = tokenRef.current || localStorage.getItem('token');

    if (shouldNotifyServer && currentToken) {
      closeSessionOnServer(currentToken);
    }

    localStorage.removeItem('token');
    sessionStorage.removeItem('welcome_pending');
    sessionStorage.removeItem('session_idle_timeout_minutes');
    setWelcomePending(false);
    setSessionIdleTimeoutMinutes(DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES);
    setToken(null);
    setUser(null);
    lastActivityRef.current = Date.now();
    lastHeartbeatAtRef.current = 0;
    tokenRef.current = null;
  }, [closeSessionOnServer]);

  useEffect(() => {
    if (token) {
      getProfile()
        .then(res => {
          setUser(res.data.data);

          const timeoutMinutes = Number(res.data.session_idle_timeout_minutes);
          if (Number.isFinite(timeoutMinutes) && timeoutMinutes >= MIN_SESSION_IDLE_TIMEOUT_MINUTES) {
            setSessionIdleTimeoutMinutes(timeoutMinutes);
            sessionStorage.setItem('session_idle_timeout_minutes', String(timeoutMinutes));
          }

          lastActivityRef.current = Date.now();
        })
        .catch(() => logout({ notifyServer: false }))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (!token || !user) {
      return undefined;
    }

    const sessionIdleTimeoutMs = Math.max(
      MIN_SESSION_IDLE_TIMEOUT_MINUTES,
      Number(sessionIdleTimeoutMinutes) || DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES
    ) * 60 * 1000;

    let disposed = false;

    const maybeSendHeartbeat = async (force = false) => {
      if (disposed || document.hidden) {
        return;
      }

      const now = Date.now();
      const hasNewActivity = lastActivityRef.current > lastHeartbeatAtRef.current;
      const enoughInterval = now - lastHeartbeatAtRef.current >= HEARTBEAT_MIN_INTERVAL_MS;

      if (!force && (!hasNewActivity || !enoughInterval)) {
        return;
      }

      lastHeartbeatAtRef.current = now;

      try {
        await heartbeatSession();
      } catch {
        // El interceptor global en api.js maneja expiracion/autenticacion.
      }
    };

    const registerActivity = () => {
      lastActivityRef.current = Date.now();
      void maybeSendHeartbeat(false);
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        registerActivity();
      }
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const timerId = window.setInterval(() => {
      const now = Date.now();
      const inactiveMs = now - lastActivityRef.current;

      if (inactiveMs >= sessionIdleTimeoutMs) {
        logout();
        window.location.href = '/login';
        return;
      }

      void maybeSendHeartbeat(false);
    }, HEARTBEAT_TICK_MS);

    void maybeSendHeartbeat(true);

    return () => {
      disposed = true;
      window.clearInterval(timerId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [token, user, logout, sessionIdleTimeoutMinutes]);

  const login = async (username, password) => {
    const response = await loginService(username, password);
    const { token, usuario } = response.data;
    const timeoutMinutes = Number(response.data.session_idle_timeout_minutes);
    
    localStorage.setItem('token', token);
    sessionStorage.setItem('welcome_pending', '1');

    if (Number.isFinite(timeoutMinutes) && timeoutMinutes >= MIN_SESSION_IDLE_TIMEOUT_MINUTES) {
      sessionStorage.setItem('session_idle_timeout_minutes', String(timeoutMinutes));
      setSessionIdleTimeoutMinutes(timeoutMinutes);
    }

    setWelcomePending(true);
    setToken(token);
    setUser(usuario);
    lastActivityRef.current = Date.now();
    lastHeartbeatAtRef.current = 0;
    
    return response.data;
  };

  const consumeWelcomePending = () => {
    sessionStorage.removeItem('welcome_pending');
    setWelcomePending(false);
  };

  const updateUser = (patch) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const nextPatch = typeof patch === 'function' ? patch(prevUser) : patch;
      if (!nextPatch || typeof nextPatch !== 'object') {
        return prevUser;
      }

      return {
        ...prevUser,
        ...nextPatch
      };
    });
  };

  const isAdmin = () => {
    return user !== null && (user.rol === ROLES.ADMIN || user.rol === ROLES.SUPER_ADMIN);
  };

  const isSuperAdmin = () => {
    return user !== null && user.rol === ROLES.SUPER_ADMIN;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isSuperAdmin,
        welcomePending,
        consumeWelcomePending,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
