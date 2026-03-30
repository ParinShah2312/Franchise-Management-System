/**
 * Format a number as Indian Rupee (no decimals) — e.g. ₹1,50,000
 * @param {number|string} value 
 * @returns {string}
 */
export function formatINR(value) {
  if (value === null || value === undefined) return '₹0';
  const num = Number(value);
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format a number as Indian Rupee (2 decimals) — e.g. ₹1,50,000.00
 * @param {number|string} value 
 * @returns {string}
 */
export function formatINRDecimal(value) {
  if (value === null || value === undefined) return '₹0.00';
  const num = Number(value);
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a datetime string or Date object as locale string — e.g. "3/23/2026, 10:30:00 AM"
 * @param {string|Date} value 
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

/**
 * Format a date string or Date object as medium date — e.g. "Mar 23, 2026"
 * @param {string|Date} isoDate 
 * @returns {string}
 */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const date = isoDate instanceof Date ? isoDate : new Date(isoDate);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

/**
 * Return today's date as YYYY-MM-DD string
 * @returns {string}
 */
export function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Return today's date and time as YYYY-MM-DDThh:mm string for datetime-local
 * @returns {string}
 */
export function getNowString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

/**
 * Format a number/string as locale string (Indian format by default)
 * @param {number|string} value 
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  return num.toLocaleString('en-IN');
}
