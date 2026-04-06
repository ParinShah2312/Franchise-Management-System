import { describe, it, expect } from 'vitest';
import { sanitizePhone, isValidPhone, isValidEmail, isValidPassword } from '../utils/validators';

describe('sanitizePhone', () => {
  it('strips non-digit characters', () => {
    expect(sanitizePhone('(99) 123-4567')).toBe('991234567');
  });

  it('truncates to 10 digits', () => {
    expect(sanitizePhone('12345678901234')).toBe('1234567890');
  });

  it('returns empty string for null', () => {
    expect(sanitizePhone(null)).toBe('');
  });
});

describe('isValidPhone', () => {
  it('returns true for a valid 10-digit phone number', () => {
    expect(isValidPhone('9876543210')).toBe(true);
  });

  it('returns false for fewer than 10 digits', () => {
    expect(isValidPhone('987654')).toBe(false);
  });

  it('returns true for more than 10 digits (truncated by sanitize)', () => {
    expect(isValidPhone('98765432101234')).toBe(true);
  });
});

describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns false for email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('returns true for a strong password', () => {
    expect(isValidPassword('StrongPass1')).toBe(true);
  });

  it('returns false if shorter than 8 characters', () => {
    expect(isValidPassword('Ab1')).toBe(false);
  });

  it('returns false if no digit', () => {
    expect(isValidPassword('StrongPassword')).toBe(false);
  });

  it('returns false if no uppercase', () => {
    expect(isValidPassword('strongpass1')).toBe(false);
  });

  it('returns false if no lowercase', () => {
    expect(isValidPassword('STRONGPASS1')).toBe(false);
  });
});
