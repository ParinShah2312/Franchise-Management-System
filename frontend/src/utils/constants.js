// Validation error messages — kept in sync with backend validators.py
export const PASSWORD_ERROR = 'Password must be 8+ chars with uppercase, lowercase, and a number.';
export const EMAIL_ERROR = 'Please enter a valid email address.';
export const PHONE_ERROR = 'Please enter a valid phone number.';

export const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other'];

export const ROLE_REDIRECTS = {
  FRANCHISOR: '/admin',
  BRANCH_OWNER: '/franchisee',
  MANAGER: '/manager',
  STAFF: '/staff',
  PENDING_APPLICANT: '/pending',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);
