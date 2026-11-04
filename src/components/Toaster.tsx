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

/**
 * Small cards under the header for achievements, rank ups and milestones. They never take
 * focus or block the game (the rush clock keeps running fairly), screen readers hear them
 * through the live region, and each one leaves after TOAST_MS or when closed.
 */
export function Toaster({ toasts, onDismiss }: { toasts: readonly Toast[]; onDismiss: (id: number) => void }) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  const first = toasts[0]?.id;
  useEffect(() => {
    if (first === undefined) return;
    const id = setTimeout(() => dismiss.current(first), TOAST_MS);
    return () => clearTimeout(id);
  }, [first]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.slice(0, 3).map((toast) => {
        const Icon = ICON[toast.kind];
        return (
          <div key={toast.id} className="glass pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-2xl p-3 pr-2">
            <span className="bg-mood grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-fuchsia-500/25">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{toast.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{toast.body}</p>
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
      })}
    </div>
  );
}
