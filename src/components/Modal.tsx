import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  /** Extra classes for the panel, e.g. a wider max-width. */
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A dialog over the page: focus moves in and stays in (Tab wraps), Escape and the backdrop close
 * it when `onClose` is given, and focus returns to where it was afterwards.
 */
export function Modal({ title, onClose, children, className = '' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && close.current) {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`glass relative max-h-[90dvh] w-full max-w-lg animate-rise overflow-y-auto rounded-3xl p-5 sm:p-7 ${className}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-m-1 rounded-full p-2 text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="關閉"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
