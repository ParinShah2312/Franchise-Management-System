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
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
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
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

/**
 * Return today's date as YYYY-MM-DD string
 * @returns {string}
 */
export function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

/**
 * Convert a raw role string to a human-readable display name.
 * @param {string} role
 * @returns {string}
 */
export function formatRole(role) {
  const map = {
    BRANCH_OWNER: 'Branch Owner',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    FRANCHISOR: 'Franchisor',
    PENDING_APPLICANT: 'Pending Applicant',
  };
  if (!role) return '—';
  return map[role.toUpperCase()] || role;
}
