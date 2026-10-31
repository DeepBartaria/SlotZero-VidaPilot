'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsClient } from './use-is-client';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

type Listener = () => void;

// Module-level store so `toast.*` can be called from anywhere (no hook needed),
// while <Toaster/> is just the viewport. If no viewport is mounted, calls are
// harmless no-ops for rendering purposes.
let store: ToastItem[] = [];
const EMPTY: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => store;
const getServerSnapshot = () => EMPTY;

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function remove(id: string) {
  store = store.filter((t) => t.id !== id);
  emit();
}

function add(item: Omit<ToastItem, 'id'>): string {
  const id = makeId();
  const toastItem: ToastItem = { id, duration: 4500, ...item };
  store = [...store, toastItem];
  emit();
  if (toastItem.duration && toastItem.duration > 0) {
    setTimeout(() => remove(id), toastItem.duration);
  }
  return id;
}

/** Fire toasts from anywhere: `toast.success('Saved')`. */
export const toast = {
  success: (message: string, title?: string) => add({ variant: 'success', message, title }),
  error: (message: string, title?: string) => add({ variant: 'error', message, title }),
  info: (message: string, title?: string) => add({ variant: 'info', message, title }),
  show: (item: Omit<ToastItem, 'id'>) => add(item),
  dismiss: remove,
};

/** Convenience hook returning the same API as the `toast` singleton. */
export function useToast() {
  return toast;
}

const VARIANT: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, ring: 'border-red-200', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'border-sky-200', iconColor: 'text-sky-600' },
};

/** Drop once near the app root (F1 mounts this in providers). */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const conf = VARIANT[t.variant];
          const Icon = conf.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg',
                conf.ring
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', conf.iconColor)} aria-hidden />
              <div className="min-w-0 flex-1">
                {t.title ? <p className="text-sm font-bold text-slate-900">{t.title}</p> : null}
                <p className="text-sm text-slate-600">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
