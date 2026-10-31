import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Add default panel padding (p-5 sm:p-6). */
  padded?: boolean;
}

/**
 * The base surface of the app: a clean white card with a hairline border and
 * a soft shadow. Named `GlassPanel` for parity with the design spec; in the
 * light theme it renders as a frosted-white card.
 */
export function GlassPanel({ className, padded = false, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white card-shadow',
        padded && 'p-5 sm:p-6',
        className
      )}
      {...props}
    />
  );
}

/** Alias so screens can import either name. */
export const Card = GlassPanel;
