import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-mood text-white shadow-lg shadow-fuchsia-500/25 hover:brightness-110 active:brightness-95 disabled:shadow-none',
  secondary:
    'bg-white/80 text-slate-900 ring-1 ring-slate-900/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15',
  ghost: 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
};

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** A round icon-only button for the header; `label` is what screen readers and the tooltip say. */
export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      {...props}
    >
      {children}
    </button>
  );
}

/** The sad and happy faces at the ends of the scale (the 2018 version had the same two). */
export function Face({ mood, className = '' }: { mood: 'sad' | 'happy'; className?: string }) {
  const mouth = mood === 'happy' ? 'M9 15.5c1.8 2.2 4.2 2.2 6 0' : 'M9 17c1.8-2.2 4.2-2.2 6 0';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d={mouth} />
    </svg>
  );
}

/** The Word Net mark: a net in a circle. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`bg-mood grid place-items-center rounded-xl text-white shadow-md shadow-fuchsia-500/30 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth="1.6">
        <clipPath id="logo-net">
          <circle cx="12" cy="12" r="8" />
        </clipPath>
        <g clipPath="url(#logo-net)" strokeOpacity="0.85">
          <path d="M0 6 18 24M0 12 12 24M6 0 24 18M12 0 24 12M0 0 24 24M24 6 6 24M24 12 12 24M18 0 0 18M12 0 0 12M24 0 0 24" />
        </g>
        <circle cx="12" cy="12" r="8" strokeWidth="2" />
      </svg>
    </span>
  );
}
