import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { api, clearAuthToken, registerUnauthorizedHandler, setAuthToken } from '../api';
import { STORAGE_KEYS, parseToken, isTokenExpired } from '../utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [scope, setScope] = useState(() => {
    const storedScope = localStorage.getItem(STORAGE_KEYS.SCOPE);
    return storedScope ? JSON.parse(storedScope) : null;
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SCOPE);
    clearAuthToken();
    setToken(null);
    setUser(null);
    setScope(null);
  }, []);

  // Register the API logout handler on mount
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        // Token expired — auto-logout
        logout();
        setLoading(false);
        return;
      }
      setAuthToken(token);
    } else {
      clearAuthToken();
    }
    setLoading(false);
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    const session = {
      user_id: data?.user?.user_id ?? data?.user_id ?? null,
      user_name: data?.user?.user_name ?? data?.user_name ?? null,
      email: data?.user?.email ?? data?.email ?? email,
      role: data?.role ?? null,
      mustResetPassword: Boolean(data?.user?.must_reset_password ?? data?.must_reset_password),
    };
    const sessionScope = data?.scope ?? null;

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session));
    if (sessionScope) {
      localStorage.setItem(STORAGE_KEYS.SCOPE, JSON.stringify(sessionScope));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SCOPE);
    }

    setAuthToken(data.token);
    setToken(data.token);
    setUser(session);
    setScope(sessionScope);

    return { ...session, scope: sessionScope, token: data.token };
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((previous) => {
      if (!previous) {
        return previous;
      }
      const next = { ...previous, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    scope,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: Boolean(user && token && !isTokenExpired(token)),
    getBranchId: () => (scope?.type === 'BRANCH' ? scope.id ?? null : null),
  }), [user, token, scope, loading, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
