import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean;
  /** 'date' (default) or 'datetime-local' for slot pickers. */
  withTime?: boolean;
}

/**
 * Native date / datetime control styled to match the design system.
 * Kept dependency-free; screens needing a richer calendar can compose one.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { className, invalid, withTime = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={withTime ? 'datetime-local' : 'date'}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900',
        'outline-none transition-colors focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
        invalid ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500',
        className
      )}
      {...props}
    />
  );
});
