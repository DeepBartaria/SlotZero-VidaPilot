'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from './select';

/**
 * Read/write URL search params so filters are shareable and back-button
 * friendly. Uses router.replace (no history spam, no scroll jump).
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? '',
    [searchParams]
  );

  const setMany = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const set = useCallback(
    (key: string, value: string | null | undefined) => setMany({ [key]: value }),
    [setMany]
  );

  const reset = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [router, pathname]
  );

  return { get, set, setMany, reset, searchParams };
}

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

/** A styled container that lays out filter controls in a wrapping row. */
export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 card-shadow md:flex-row md:items-center',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface FilterSelectProps {
  /** URL search-param key this control binds to. */
  param: string;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/** A Select whose value is synced to a URL search param. */
export function FilterSelect({
  param,
  options,
  allLabel = 'All',
  className,
  'aria-label': ariaLabel,
}: FilterSelectProps) {
  const { get, set } = useUrlFilters();
  return (
    <Select
      aria-label={ariaLabel ?? param}
      value={get(param)}
      onChange={(e) => set(param, e.target.value || null)}
      className={className}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/** Debounced search box. Pair with useUrlFilters to sync `q` to the URL. */
export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // Sync to the external value during render (React's recommended pattern for
  // adjusting state on prop change - no effect, no setState-in-effect).
  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  const onChangeRef = useRef(onChange);
  const lastEmitted = useRef(value);

  // Ref writes happen in effects, never during render.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    lastEmitted.current = value;
  }, [value]);

  useEffect(() => {
    if (local === lastEmitted.current) return;
    const timer = window.setTimeout(() => {
      lastEmitted.current = local;
      onChangeRef.current(local);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [local, debounceMs]);

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        role="searchbox"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
      />
    </div>
  );
}
