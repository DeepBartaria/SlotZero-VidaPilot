/**
 * Date, time and number formatting helpers. Pure functions - safe on server
 * and client. Accept ISO strings, Date, or number timestamps.
 */

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `12 Jul 2026`. */
export function formatDate(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** `12 Jul 2026, 14:30`. */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '-';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `14:30`. */
export function formatTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '-';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

/** `2m ago`, `in 3 days`, `just now`. */
export function relativeTime(value: DateInput, now: DateInput = new Date()): string {
  const d = toDate(value);
  const base = toDate(now) ?? new Date();
  if (!d) return '-';

  const diffSeconds = Math.round((d.getTime() - base.getTime()) / 1000);
  if (Math.abs(diffSeconds) < 45) return 'just now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return 'just now';
}

/** `1,234`. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString('en-US');
}

/** `₹85,000` by default; pass a currency code to change it. */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'INR'
): string {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Initials for an Avatar fallback: `Priya Shah` -> `PS`. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}
