/**
 * Single source of truth for status -> color mapping (plans/FRONTEND.md sec 5).
 * statusColor() returns a Tailwind color *family*; StatusChip maps that family
 * to full literal class strings so every chip looks identical across screens.
 */

export type StatusColorFamily = 'emerald' | 'sky' | 'indigo' | 'amber' | 'red' | 'zinc';

const STATUS_COLOR: Record<string, StatusColorFamily> = {
  // asset lifecycle
  available: 'emerald',
  allocated: 'sky',
  reserved: 'indigo',
  under_maintenance: 'amber',
  lost: 'red',
  retired: 'zinc',
  disposed: 'zinc',
  // allocation / request / verification reuse the same palette
  active: 'emerald',
  overdue: 'red',
  returned: 'zinc',
  pending: 'amber',
  approved: 'emerald',
  rejected: 'red',
  technician_assigned: 'sky',
  in_progress: 'sky',
  resolved: 'emerald',
  verified: 'emerald',
  missing: 'red',
  damaged: 'amber',
  // booking
  upcoming: 'sky',
  ongoing: 'emerald',
  completed: 'zinc',
  cancelled: 'zinc',
  // priority (used by maintenance)
  low: 'zinc',
  medium: 'sky',
  high: 'amber',
  critical: 'red',
};

export const statusColor = (s: string): StatusColorFamily => STATUS_COLOR[s] ?? 'zinc';

/** Turn an enum token into a display label: `under_maintenance` -> `Under maintenance`. */
export function statusLabel(s: string): string {
  if (!s) return '';
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
