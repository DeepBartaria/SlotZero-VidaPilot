import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 ' +
  'placeholder:text-slate-400 transition-colors outline-none focus:bg-white ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const BORDER_OK = 'border-slate-200 focus:border-emerald-500';
const BORDER_ERR = 'border-red-300 focus:border-red-500';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, invalid ? BORDER_ERR : BORDER_OK, className)}
      {...props}
    />
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, invalid, rows = 3, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'resize-none', invalid ? BORDER_ERR : BORDER_OK, className)}
      {...props}
    />
  );
});
