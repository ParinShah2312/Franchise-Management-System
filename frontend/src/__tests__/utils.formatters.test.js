import { describe, it, expect } from 'vitest';
import { formatINR, formatINRDecimal, formatDate, formatRole } from '../utils/formatters';

describe('formatINR', () => {
  it('formats zero as ₹0', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats null as ₹0', () => {
    expect(formatINR(null)).toBe('₹0');
  });

  it('formats a positive number in Indian locale', () => {
    const result = formatINR(150000);
    expect(result).toContain('₹');
    expect(result).toContain('1,50,000');
  });
});

describe('formatINRDecimal', () => {
  it('formats null as ₹0.00', () => {
    expect(formatINRDecimal(null)).toBe('₹0.00');
  });

  it('formats a decimal number with 2 decimal places', () => {
    const result = formatINRDecimal(1234.5);
    expect(result).toContain('₹');
    expect(result).toContain('1,234.50');
  });
});

describe('formatDate', () => {
  it('returns — for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2026-01-15T00:00:00.000Z');
    expect(result).toContain('2026');
  });
});

describe('formatRole', () => {
  it('converts BRANCH_OWNER to Branch Owner', () => {
    expect(formatRole('BRANCH_OWNER')).toBe('Branch Owner');
  });

  it('converts FRANCHISOR to Franchisor', () => {
    expect(formatRole('FRANCHISOR')).toBe('Franchisor');
  });

  it('returns — for null', () => {
    expect(formatRole(null)).toBe('—');
  });
});
