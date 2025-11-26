import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { api, clearAuthToken, setAuthToken } from '../api';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'relay_token';
const STORAGE_USER_KEY = 'relay_user';
const STORAGE_SCOPE_KEY = 'relay_scope';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [scope, setScope] = useState(() => {
    const storedScope = localStorage.getItem(STORAGE_SCOPE_KEY);
    return storedScope ? JSON.parse(storedScope) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem(STORAGE_USER_KEY);
      const storedScope = localStorage.getItem(STORAGE_SCOPE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedScope) {
        setScope(JSON.parse(storedScope));
      }
      setAuthToken(token);
    } else {
      clearAuthToken();
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    const session = {
      id: data?.user?.id ?? data?.id ?? null,
      name: data?.user?.name ?? data?.name ?? null,
      email: data?.user?.email ?? data?.email ?? email,
      role: data?.role ?? null,
    };
    const sessionScope = data?.scope ?? null;

    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
    if (sessionScope) {
      localStorage.setItem(STORAGE_SCOPE_KEY, JSON.stringify(sessionScope));
    } else {
      localStorage.removeItem(STORAGE_SCOPE_KEY);
    }

    setAuthToken(data.token);
    setToken(data.token);
    setUser(session);
    setScope(sessionScope);

    return { ...session, scope: sessionScope, token: data.token };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_SCOPE_KEY);
    clearAuthToken();
    setToken(null);
    setUser(null);
    setScope(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    scope,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user && token),
    getBranchId: () => (scope?.type === 'BRANCH' ? scope.id ?? null : null),
  }), [user, token, scope, loading]);

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
