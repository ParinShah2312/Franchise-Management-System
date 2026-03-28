// The three localStorage key constants
export const STORAGE_KEYS = {
  TOKEN: 'relay_token',
  USER: 'relay_user',
  SCOPE: 'relay_scope',
};

/**
 * Decode a JWT and return its payload object, or null if invalid
 * @param {string} token 
 * @returns {object|null}
 */
export function parseToken(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Return true if the token is expired or invalid
 * @param {string} token 
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  const payload = parseToken(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}
