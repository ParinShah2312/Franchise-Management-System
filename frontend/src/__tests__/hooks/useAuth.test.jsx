import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  it('initializes with null user when storage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loads user from localStorage on mount', () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'FRANCHISOR', mustResetPassword: false };
    // Build a valid JWT-shaped token with a future exp so isTokenExpired() returns false.
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const payload = btoa(JSON.stringify({ sub: 1, exp: futureExp }));
    const mockToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.fake-signature`;
    const mockScope = { type: 'NETWORK' };

    localStorage.setItem('relay_user', JSON.stringify(mockUser));
    localStorage.setItem('relay_token', mockToken);
    localStorage.setItem('relay_scope', JSON.stringify(mockScope));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.scope).toEqual(mockScope);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears storage and state on logout', () => {
    localStorage.setItem('relay_token', 'mock-token');
    localStorage.setItem('relay_user', JSON.stringify({ id: 1 }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('relay_token')).toBeNull();
    expect(localStorage.getItem('relay_user')).toBeNull();
  });
});
