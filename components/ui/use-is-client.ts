'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR and the first client render, then true.
 * Uses useSyncExternalStore so we avoid setState-in-effect for the common
 * "only render portals on the client" guard.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
