import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { api, clearAuthToken, setAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('relay_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('relay_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
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
      id: data.id,
      email: data.email,
      role: data.role,
      franchise_id: data.franchise_id,
    };

    localStorage.setItem('relay_token', data.token);
    localStorage.setItem('relay_user', JSON.stringify(session));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(session);

    return session;
  };

  const logout = () => {
    localStorage.removeItem('relay_token');
    localStorage.removeItem('relay_user');
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user && token),
  }), [user, token, loading]);

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
