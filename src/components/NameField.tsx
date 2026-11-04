import { useId } from 'react';
import { NAME_MAX_LENGTH } from '../config.ts';

export function NameField({
  value,
  onChange,
  autoFocus = false,
  label = '你的名字',
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NAME_MAX_LENGTH}
        autoComplete="nickname"
        placeholder="例如：小明"
        data-autofocus={autoFocus || undefined}
        className="min-h-12 rounded-2xl border border-slate-900/10 bg-white/80 px-4 text-lg outline-none focus:border-calm focus:ring-4 focus:ring-calm/20 dark:border-white/15 dark:bg-white/5"
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">最多 {NAME_MAX_LENGTH} 個字，排行榜和成績卡會用這個名字。</p>
    </div>
  );
}
