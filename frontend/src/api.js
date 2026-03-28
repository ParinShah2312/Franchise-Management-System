const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = API_URL;
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

let authToken = null;
let _onUnauthorized = null;

/**
 * Register a callback to be called when the server returns 401 Unauthorized.
 * Usually used by AuthProvider to trigger a logout.
 */
export function registerUnauthorizedHandler(callback) {
  _onUnauthorized = callback;
}

export const setAuthToken = (token) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

/**
 * Normalize and handle API responses.
 * Triggers auto-logout on 401 and throws formatted errors for non-ok responses.
 */
function handleResponse(response, data, isJson) {
  if (response.ok) {
    return data;
  }

  const message = (isJson && (data.error || data.message)) || null;

  if (response.status === 401) {
    _onUnauthorized?.();
    throw new Error('Session expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error(message || 'You do not have permission to perform this action.');
  }

  if (response.status === 404) {
    throw new Error(message || 'Resource not found.');
  }

  if (response.status === 409) {
    throw new Error(message || 'A conflict occurred.');
  }

  if (response.status === 422 || response.status === 400) {
    throw new Error(message || 'Invalid request.');
  }

  if (response.status >= 500) {
    throw new Error(message || 'A server error occurred. Please try again.');
  }

  throw new Error(message || response.statusText || 'Request failed.');
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const { headers: incomingHeaders, body, ...rest } = options;
  const headers = new Headers(incomingHeaders || {});
  const isFormData = body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && body) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, { ...rest, body, headers });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  return handleResponse(response, data, isJson);
}

const prepareBody = (body) => {
  if (body instanceof FormData || body instanceof Blob) {
    return body;
  }

  return body ? JSON.stringify(body) : undefined;
};

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options = {}) =>
    request(path, { method: 'POST', body: prepareBody(body), ...options }),
  put: (path, body, options = {}) =>
    request(path, { method: 'PUT', body: prepareBody(body), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};
