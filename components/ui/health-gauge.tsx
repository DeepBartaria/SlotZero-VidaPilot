import { cn, healthBand } from '@/lib/utils';

export interface HealthGaugeProps {
  /** 0-100 health score. */
  score: number;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

const STROKE: Record<'emerald' | 'amber' | 'red', string> = {
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};

/**
 * Pure-SVG radial gauge for the Asset Health Score. Dependency-free so it
 * renders anywhere; the arc animates via CSS (reduced-motion safe globally).
 */
export function HealthGauge({ score, size = 132, showLabel = true, className }: HealthGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = healthBand(clamped);
  const stroke = STROKE[band.color];

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Health score ${clamped} out of 100, ${band.label}`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tabular-nums text-slate-900">{clamped}</span>
        {showLabel ? (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {band.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
