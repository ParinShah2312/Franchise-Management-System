/**
 * Strip all non-digit characters and truncate to 10 digits
 * @param {string} value 
 * @returns {string}
 */
export function sanitizePhone(value) {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Return true if the sanitized phone is exactly 10 digits
 * @param {string} value 
 * @returns {boolean}
 */
export function isValidPhone(value) {
  const sanitized = sanitizePhone(value);
  return sanitized.length === 10;
}

/**
 * Return true if email matches basic valid format
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Return true if password meets strength requirements (8+ chars, upper, lower, digit)
 * @param {string} password 
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password) return false;
  // Combine both patterns into one robust one
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}

/**
 * Common email domain typos to warn users about.
 * @type {string[]}
 */
const EMAIL_TYPO_DOMAINS = [
  '@gamil.com',
  '@gnail.com',
  '@gmial.com',
  '@gmai.com',
  '@gmal.com',
  '@gmail.con',
  '@gmail.co',
  '@yahooo.com',
  '@yaho.com',
  '@yahoo.con',
  '@outlok.com',
  '@outllok.com',
  '@outlook.con',
  '@hotmal.com',
  '@hotmai.com',
  '@hotmail.con',
];

/**
 * Typo check — return true if email looks like a common domain typo (e.g. @gamil.com)
 * @param {string} email
 * @returns {boolean}
 */
export function hasEmailTypo(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return EMAIL_TYPO_DOMAINS.some((typo) => lower.endsWith(typo));
}
