import { Award, ChevronsUp, PartyPopper, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TOAST_MS } from '../config.ts';

export interface Toast {
  id: number;
  kind: 'achievement' | 'rank' | 'milestone';
  title: string;
  body: string;
}

const ICON = { achievement: Award, rank: ChevronsUp, milestone: PartyPopper };
/** At most this many toasts show at once; the rest wait their turn. */
const VISIBLE = 3;

/**
 * Small cards for achievements, rank ups and milestones: under the header, or in the top-right
 * corner on screens wide enough (1280 px) for them to sit beside the game column. They never take focus or block the
 * game (the rush clock keeps running fairly), screen readers hear them through the live region,
 * and each one leaves TOAST_MS after it appears, or when closed.
 */
export function Toaster({ toasts, onDismiss }: { toasts: readonly Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 xl:left-auto xl:w-60"
    >
      {toasts.slice(0, VISIBLE).map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    const id = setTimeout(() => dismiss.current(toast.id), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.id]);

  const Icon = ICON[toast.kind];
  return (
    <div className="glass pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-2xl p-2.5 pr-1.5">
      <span className="bg-mood grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-fuchsia-500/25">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{toast.title}</p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-300">{toast.body}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="關閉通知"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
