import type { SentencePack } from '../types.ts';

interface PackPickerProps {
  packs: readonly SentencePack[];
  /** The chosen pack id, or null for all packs. */
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Which sentence pack to play. The daily challenge ignores this and always uses every pack. */
export function PackPicker({ packs, value, onChange }: PackPickerProps) {
  const total = packs.reduce((sum, p) => sum + p.sentences.length, 0);
  const options = [{ id: null, title: '全部', count: total }, ...packs.map((p) => ({ id: p.id, title: p.title, count: p.sentences.length }))];
  return (
    <div className="flex flex-col items-center gap-2">
      <p id="pack-label" className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        題庫
      </p>
      <div role="radiogroup" aria-labelledby="pack-label" className="flex flex-wrap justify-center gap-2">
        {options.map((option) => {
          const checked = option.id === value;
          return (
            <button
              key={option.id ?? 'all'}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option.id)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                checked
                  ? 'bg-mood text-white shadow-md shadow-fuchsia-500/25'
                  : 'bg-white/70 text-slate-700 ring-1 ring-slate-900/10 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10'
              }`}
            >
              {option.title}
              <span className={`ml-1.5 tabular-nums ${checked ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{option.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
