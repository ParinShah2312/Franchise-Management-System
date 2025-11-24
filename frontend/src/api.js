const BASE_URL = 'http://localhost:5000/api';
export const API_ORIGIN = BASE_URL.replace(/\/api$/, '');

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
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

  if (!response.ok) {
    const errorMessage = (isJson && (data.error || data.message)) || response.statusText;
    throw new Error(errorMessage || 'Request failed');
  }

  return data;
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
