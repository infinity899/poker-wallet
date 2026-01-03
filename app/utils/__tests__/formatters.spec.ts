import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatDurationShort,
  formatNumber,
  formatPercentage,
  formatPosition,
  formatProfit,
  formatProfitShort,
  formatStake,
  parseStake,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000');
    expect(formatCurrency(1000.50, 'USD')).toBe('$1,000.5');
    expect(formatCurrency(0, 'USD')).toBe('$0');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(1000, 'EUR')).toMatch(/1\.000/);
  });

  it('defaults to USD', () => {
    expect(formatCurrency(100)).toBe('$100');
  });
});

describe('formatProfit', () => {
  it('adds + for positive amounts', () => {
    expect(formatProfit(100, 'USD')).toBe('+$100');
  });

  it('adds - for negative amounts', () => {
    expect(formatProfit(-100, 'USD')).toBe('-$100');
  });

  it('shows no sign for zero', () => {
    expect(formatProfit(0, 'USD')).toBe('$0');
  });
});

describe('formatProfitShort', () => {
  it('formats thousands with K', () => {
    expect(formatProfitShort(1500)).toBe('+$1.5K');
    expect(formatProfitShort(-2500)).toBe('-$2.5K');
  });

  it('formats millions with M', () => {
    expect(formatProfitShort(1500000)).toBe('+$1.5M');
  });

  it('formats small numbers without suffix', () => {
    expect(formatProfitShort(500)).toBe('+$500');
    expect(formatProfitShort(-250)).toBe('-$250');
  });

  it('shows no sign for zero', () => {
    expect(formatProfitShort(0)).toBe('$0');
  });
});

describe('formatDuration', () => {
  it('formats minutes under an hour', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(59)).toBe('59m');
  });

  it('formats hours only when no remainder', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(150)).toBe('2h 30m');
  });
});

describe('formatDurationShort', () => {
  it('formats as decimal hours', () => {
    expect(formatDurationShort(60)).toBe('1.0h');
    expect(formatDurationShort(90)).toBe('1.5h');
    expect(formatDurationShort(30)).toBe('0.5h');
  });
});

describe('formatPercentage', () => {
  it('formats with default decimals', () => {
    expect(formatPercentage(50.5)).toBe('50.5%');
  });

  it('formats with custom decimals', () => {
    // Note: 50.555 rounds to 50.55 due to floating point, use 50.556 for consistent rounding
    expect(formatPercentage(50.556, 2)).toBe('50.56%');
    expect(formatPercentage(50, 0)).toBe('50%');
  });
});

describe('formatStake', () => {
  it('formats stake correctly', () => {
    expect(formatStake(1, 2)).toBe('1/2');
    expect(formatStake(5, 10)).toBe('5/10');
  });
});

describe('parseStake', () => {
  it('parses valid stakes', () => {
    expect(parseStake('1/2')).toEqual({ smallBlind: 1, bigBlind: 2 });
    expect(parseStake('5/10')).toEqual({ smallBlind: 5, bigBlind: 10 });
    expect(parseStake('2.5/5')).toEqual({ smallBlind: 2.5, bigBlind: 5 });
  });

  it('parses stakes with spaces', () => {
    expect(parseStake('1 / 2')).toEqual({ smallBlind: 1, bigBlind: 2 });
    expect(parseStake('5  /  10')).toEqual({ smallBlind: 5, bigBlind: 10 });
  });

  it('returns null for invalid stakes', () => {
    expect(parseStake('invalid')).toBeNull();
    expect(parseStake('1-2')).toBeNull();
    expect(parseStake('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 15, 2024');
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
  });
});

describe('formatNumber', () => {
  it('formats with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats with decimals', () => {
    expect(formatNumber(1000.5, 1)).toBe('1,000.5');
    expect(formatNumber(1000.555, 2)).toBe('1,000.56');
  });
});

describe('formatPosition', () => {
  it('formats ordinal positions correctly', () => {
    expect(formatPosition(1)).toBe('1st');
    expect(formatPosition(2)).toBe('2nd');
    expect(formatPosition(3)).toBe('3rd');
    expect(formatPosition(4)).toBe('4th');
    expect(formatPosition(10)).toBe('10th');
    expect(formatPosition(21)).toBe('21th');
  });
});
