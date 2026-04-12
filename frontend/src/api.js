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

  const message = (isJson && data.error) || null;

  if (response.status === 401) {
    if (authToken) {
      _onUnauthorized?.();
    }
    throw new Error(message || 'Session expired. Please log in again.');
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
  const { headers: incomingHeaders, body, timeout = 15000, ...rest } = options;
  const headers = new Headers(incomingHeaders || {});
  const isFormData = body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && body) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...rest, body, headers, signal: controller.signal });
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    return handleResponse(response, data, isJson);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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
  patch: (path, body, options = {}) =>
    request(path, { method: 'PATCH', body: prepareBody(body), ...options }),
  delete: (path, body, options = {}) =>
    request(path, { method: 'DELETE', body: body ? prepareBody(body) : undefined, ...options }),
};

/**
 * Convenience method to securely load and display a file 
 * in a new tab using the current authentication context.
 */
export async function viewAuthenticatedFile(urlPath) {
  const url = urlPath.startsWith('http') ? urlPath : `${API_ORIGIN}${urlPath}`;
  const headers = new Headers();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch the file.');
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  // Revoke to prevent memory leaks
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}
