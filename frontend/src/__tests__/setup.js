import '@testing-library/jest-dom';

// jsdom v29 changed localStorage behaviour — provide a robust mock
// that always exposes .clear(), .getItem(), .setItem(), .removeItem().
const store = {};
const storageMock = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });
