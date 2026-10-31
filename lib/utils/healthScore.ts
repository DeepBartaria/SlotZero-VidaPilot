/**
 * Asset Health Score (plans/DATABASE.md sec 7). Computed on read, 0-100,
 * higher = healthier. The gauge in the UI reads `band`/`color` from here.
 */

import type { Condition, HealthBand } from '@/lib/types';

export interface HealthScoreInput {
  acquisitionDate?: string | number | Date | null;
  condition?: Condition;
  maintenanceCount?: number;
  lastMaintenanceAt?: string | number | Date | null;
  /** Category maintenance interval in months; if the last service is older, -10. */
  maintenanceIntervalMonths?: number;
}

const CONDITION_PENALTY: Record<Condition, number> = {
  excellent: 0,
  good: 8,
  fair: 20,
  poor: 35,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function yearsSince(value: HealthScoreInput['acquisitionDate']): number {
  if (value == null) return 0;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = Date.now() - d.getTime();
  return ms <= 0 ? 0 : ms / (1000 * 60 * 60 * 24 * 365);
}

function monthsSince(value: HealthScoreInput['lastMaintenanceAt']): number | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return ms <= 0 ? 0 : ms / (1000 * 60 * 60 * 24 * 30);
}

/** Returns a clamped 0-100 score. */
export function computeHealthScore(input: HealthScoreInput): number {
  const agePenalty = Math.min(40, yearsSince(input.acquisitionDate) * 8);
  const conditionPenalty = CONDITION_PENALTY[input.condition ?? 'good'];
  const maintenancePenalty = Math.min(20, (input.maintenanceCount ?? 0) * 4);

  let overduePenalty = 0;
  const since = monthsSince(input.lastMaintenanceAt);
  if (
    input.maintenanceIntervalMonths != null &&
    since != null &&
    since > input.maintenanceIntervalMonths
  ) {
    overduePenalty = 10;
  }

  return Math.round(
    clamp(100 - agePenalty - conditionPenalty - maintenancePenalty - overduePenalty, 0, 100)
  );
}

export interface HealthBandInfo {
  band: HealthBand;
  /** Tailwind color family for chips/gauges. */
  color: 'emerald' | 'amber' | 'red';
  label: string;
}

/** Map a 0-100 score to a band: >=75 healthy, 45-74 watch, <45 at-risk. */
export function healthBand(score: number): HealthBandInfo {
  if (score >= 75) return { band: 'healthy', color: 'emerald', label: 'Healthy' };
  if (score >= 45) return { band: 'watch', color: 'amber', label: 'Watch' };
  return { band: 'at-risk', color: 'red', label: 'At risk' };
}
