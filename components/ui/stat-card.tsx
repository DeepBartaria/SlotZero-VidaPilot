'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(target: number, enabled: boolean, duration = 800): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min(1, (ts - startTs) / duration);
      setDisplay(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, enabled, duration]);

  // When animation is disabled (reduced-motion / non-numeric), show the target
  // directly from render - no setState-in-effect needed.
  return enabled ? display : target;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  /** e.g. '+4', '-2', '0'. */
  trend?: string;
  icon?: ReactNode;
  className?: string;
}

/** KPI card with a GSAP-free count-up (respects reduced-motion). */
export function StatCard({ label, value, trend, icon, className }: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const isNumber = typeof value === 'number';
  const counted = useCountUp(isNumber ? (value as number) : 0, isNumber && !reduceMotion);
  const shown = isNumber ? counted.toLocaleString('en-US') : value;

  const trendTone =
    trend && trend.startsWith('+')
      ? 'text-emerald-600'
      : trend && trend.startsWith('-')
        ? 'text-red-600'
        : 'text-slate-400';

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6 card-shadow transition-all hover:-translate-y-0.5 hover:card-shadow-lg',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        {icon ? <span className="text-slate-300">{icon}</span> : null}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {shown}
        </span>
        {trend ? (
          <span className={cn('flex items-center gap-1 text-sm font-semibold', trendTone)}>
            {trend.startsWith('+') ? (
              <TrendingUp className="h-4 w-4" />
            ) : trend.startsWith('-') ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {trend === '0' ? '-' : trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}
