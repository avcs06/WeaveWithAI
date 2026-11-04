import { createStore, utilifyStore } from '@packages/utils/state';

import type { ToastConfig, ToastEntry } from './Toast.types';

/** The exit animation's length: a closed toast leaves the store after it. */
const exitDuration = 60;

type ToastAnnouncement = {
  text: string;
  /** Read at once, interrupting: errors and warnings. */
  isUrgent: boolean;
  /** New for every announcement, so the same text is read again. */
  key: number;
};

export const useToastStore = createStore<{
  toasts: ToastEntry[];
  announcement: ToastAnnouncement | undefined;
}>(() => ({
  toasts: [],
  announcement: undefined,
}));

const getToastState = utilifyStore(useToastStore);

const setToasts = (update: (toasts: ToastEntry[]) => ToastEntry[]) =>
  useToastStore.setState(({ toasts }) => ({ toasts: update(toasts) }));

let lastId = 0;

/**
 * Shows a short message at the corner of the screen, like "Session saved",
 * that closes on its own. Callable from anywhere, React or not; returns the
 * toast's id for updateToast and dismissToast.
 *
 * @invalidAlternative import('@radix-ui/react-toast')
 */
export const toast = (config: ToastConfig) => {
  lastId += 1;
  const id = `toast-${lastId}`;
  setToasts((toasts) => [{ id, open: true, config }, ...toasts]);
  return id;
};

/**
 * Changes a showing toast, like a `loading` one that becomes `success`. An
 * unknown or closed toast stays as it is.
 */
export const updateToast = (id: string, patch: Partial<ToastConfig>) =>
  setToasts((toasts) =>
    toasts.map((entry) =>
      entry.id === id && entry.open
        ? { ...entry, config: { ...entry.config, ...patch } }
        : entry,
    ),
  );

/**
 * Closes a toast: it plays its exit, then leaves. An unknown or closed toast
 * stays as it is.
 */
export const dismissToast = (id: string) => {
  const entry = getToastState('toasts').find((toast) => toast.id === id);
  if (!entry?.open) return;

  setToasts((toasts) =>
    toasts.map((toast) =>
      toast.id === id ? { ...toast, open: false } : toast,
    ),
  );
  entry.config.onClose?.();
  setTimeout(
    () => setToasts((toasts) => toasts.filter((toast) => toast.id !== id)),
    exitDuration,
  );
};

/**
 * Reads a toast's update to screen readers: Radix announces a toast only
 * when it shows.
 */
export const announceToast = (text: string, isUrgent: boolean) =>
  useToastStore.setState(({ announcement }) => ({
    announcement: { text, isUrgent, key: (announcement?.key ?? 0) + 1 },
  }));

export const clearToasts = () =>
  getToastState('toasts').forEach(({ id }) => dismissToast(id));
