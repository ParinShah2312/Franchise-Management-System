import { describe, it, expect } from 'vitest';
import { parseToken, isTokenExpired } from '../utils/auth';

describe('parseToken', () => {
  it('returns null for null input', () => {
    expect(parseToken(null)).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(parseToken('not.a.token')).toBeNull();
  });

  it('returns the payload for a valid JWT structure', () => {
    // A real JWT with payload { sub: 1, exp: 9999999999, typ: "user" }
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOjEsImV4cCI6OTk5OTk5OTk5OX0.' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const payload = parseToken(token);
    expect(payload).not.toBeNull();
    expect(payload.sub).toBe(1);
  });
});

describe('isTokenExpired', () => {
  it('returns true for null token', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it('returns true for a malformed token', () => {
    expect(isTokenExpired('garbage')).toBe(true);
  });
});
