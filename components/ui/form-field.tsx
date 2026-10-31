import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  /** Pass to link the label to a control you render yourself. */
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + inline error wrapper. Errors are announced via aria-live
 * so screen readers pick up async/server validation failures.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const errorId = `${htmlFor ?? generatedId}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}

      {children}

      {hint && !error ? <p className="text-xs text-slate-400">{hint}</p> : null}

      {error ? (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
