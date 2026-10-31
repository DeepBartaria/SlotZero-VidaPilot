import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlassPanel } from './glass-panel';

export interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned header slot (e.g. a range selector or export button). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Titled glass wrapper for charts (ApexCharts, gauges, etc.). */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <GlassPanel className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </GlassPanel>
  );
}
