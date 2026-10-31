import { cn, statusColor, statusLabel, type StatusColorFamily } from '@/lib/utils';

export interface StatusChipProps {
  /** A status/verification/priority token (e.g. 'under_maintenance'). */
  status: string;
  /** Override the auto-formatted label. */
  label?: string;
  withDot?: boolean;
  className?: string;
}

// Full literal class strings so Tailwind's JIT keeps them in the build.
const CHIP: Record<StatusColorFamily, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const DOT: Record<StatusColorFamily, string> = {
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  zinc: 'bg-zinc-400',
};

/**
 * Status conveyed by label + color (never color alone) for accessibility.
 * Color comes from the single `statusColor()` source.
 */
export function StatusChip({ status, label, withDot = true, className }: StatusChipProps) {
  const family = statusColor(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        CHIP[family],
        className
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[family])} aria-hidden />}
      {label ?? statusLabel(status)}
    </span>
  );
}
