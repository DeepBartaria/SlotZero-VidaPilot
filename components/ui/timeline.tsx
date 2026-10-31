import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TimelineTone = 'accent' | 'sky' | 'amber' | 'red' | 'neutral';

export interface TimelineItem {
  id?: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: string;
  tone?: TimelineTone;
}

const DOT: Record<TimelineTone, string> = {
  accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  neutral: 'bg-slate-100 text-slate-500 border-slate-200',
};

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/** Vertical history/activity timeline (allocation & maintenance history). */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative ml-3 space-y-5 border-l border-slate-200 pl-6', className)}>
      {items.map((item, idx) => (
        <li key={item.id ?? idx} className="relative">
          <span
            className={cn(
              'absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full border shadow-sm',
              DOT[item.tone ?? 'neutral']
            )}
            aria-hidden
          >
            {item.icon ?? <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </span>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              ) : null}
            </div>
            {item.timestamp ? (
              <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                {item.timestamp}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
