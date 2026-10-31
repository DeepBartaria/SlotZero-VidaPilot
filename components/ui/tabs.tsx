'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled value. Omit to use `defaultValue` (uncontrolled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: 'segment' | 'underline';
  className?: string;
}

/**
 * Accessible tab strip. Renders the tabs only; the page renders the active
 * panel based on the current value (keeps the component composable).
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'segment',
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal;

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn('flex gap-1 border-b border-slate-200', className)}>
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => select(item.value)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {item.icon}
              {item.label}
              {item.count != null ? <TabCount active={isActive}>{item.count}</TabCount> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn('inline-flex w-fit rounded-xl border border-slate-200 bg-slate-100 p-1', className)}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => select(item.value)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              isActive
                ? 'border border-slate-200 bg-white text-accent shadow-sm'
                : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
            )}
          >
            {item.icon}
            {item.label}
            {item.count != null ? <TabCount active={isActive}>{item.count}</TabCount> : null}
          </button>
        );
      })}
    </div>
  );
}

function TabCount({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-bold',
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
      )}
    >
      {children}
    </span>
  );
}
