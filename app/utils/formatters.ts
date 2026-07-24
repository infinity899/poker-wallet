import type { Currency } from '~/types';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  CAD: 'C$',
  RON: 'lei',
};

export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency];
}

const currencyLocales: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  RON: 'ro-RO',
};

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatProfit(amount: number, currency: Currency = 'USD'): string {
  const formatted = formatCurrency(Math.abs(amount), currency);
  if (amount > 0) {
    return `+${formatted}`;
  }
  if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

const currencySymbolsShort: Record<Currency, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  CAD: 'C$',
  RON: 'L',
};

export function formatProfitShort(amount: number, currency: Currency = 'USD'): string {
  const absAmount = Math.abs(amount);
  const symbol = currencySymbolsShort[currency];
  let formatted: string;

  if (absAmount >= 1000000) {
    formatted = `${(absAmount / 1000000).toFixed(1)}M`;
  }
  else if (absAmount >= 1000) {
    formatted = `${(absAmount / 1000).toFixed(1)}K`;
  }
  else {
    formatted = absAmount.toFixed(0);
  }

  if (amount > 0) {
    return `+${symbol}${formatted}`;
  }
  if (amount < 0) {
    return `-${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export function formatDurationShort(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatStake(smallBlind: number, bigBlind: number): string {
  return `${smallBlind}/${bigBlind}`;
}

export function parseStake(stake: string): { smallBlind: number; bigBlind: number } | null {
  const match = stake.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  return {
    smallBlind: Number.parseFloat(match[1]!),
    bigBlind: Number.parseFloat(match[2]!),
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format a date range compactly: "Aug 12 – 24, 2026" when both dates share a month,
 * "Aug 28 – Sep 3, 2026" within one year, otherwise two full dates.
 *
 * Note: this uses the same local-time Intl formatting as formatDate, so it agrees
 * with the rest of the app (see the known UTC-parsing caveat there).
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start);
    return `${month} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    const from = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start);
    const to = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(end);
    return `${from} – ${to}, ${end.getFullYear()}`;
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
  if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`;
  }
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatHourlyRate(amount: number, currency: Currency = 'USD'): string {
  return `${formatCurrency(amount, currency)}/hr`;
}

export function formatPosition(position: number): string {
  if (position === 1) {
    return '1st';
  }
  if (position === 2) {
    return '2nd';
  }
  if (position === 3) {
    return '3rd';
  }
  return `${position}th`;
}
