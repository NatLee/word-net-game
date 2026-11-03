import { useState, type ReactNode } from 'react';
import { SCORING } from '../config.ts';
import { TIER_INFO } from '../game/labels.ts';
import { basePoints, round, TIERS } from '../game/scoring.ts';
import type { Tier } from '../types.ts';
import { Modal } from './Modal.tsx';
import { TIER_STYLE } from './tiers.ts';
import { Button, Face } from './ui.tsx';

/** The points range of each tier, worked out from the scoring rules so the table never goes stale. */
function pointsRange(tier: Tier): string {
  const limits = Object.values(SCORING.tiers);
  const i = TIERS.indexOf(tier);
  const best = i === 0 ? SCORING.maxPoints : basePoints(round(limits[i - 1] + 0.01));
  const worst = i < limits.length ? basePoints(limits[i]) : 0;
  return best === worst ? String(best) : `${worst}–${best}`;
}

function Mock({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-36 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900/[0.04] px-5 dark:bg-white/[0.05]" aria-hidden="true">
      {children}
    </div>
  );
}

function MiniSpectrum({ sway }: { sway: boolean }) {
  return (
    <div className="flex w-full max-w-xs items-center gap-2">
      <Face mood="sad" className="size-5 text-sad" />
      <div className="bg-mood relative h-2 flex-1 rounded-full">
        <span className={`absolute top-1/2 left-[70%] size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 ring-[3px] ring-white ${sway ? 'motion-safe:animate-[sway_2.4s_ease-in-out_infinite_alternate]' : ''}`} />
      </div>
      <Face mood="happy" className="size-5 text-happy" />
    </div>
  );
}

const STEPS: { title: string; body: ReactNode; art: ReactNode }[] = [
  {
    title: '第一步：取名字',
    body: '先輸入你的名字。排行榜和送出的標註都會用這個名字，之後可以在設定裡改。',
    art: (
      <Mock>
        <div className="flex h-11 w-52 items-center rounded-xl border border-slate-900/15 bg-white px-3 text-lg dark:border-white/20 dark:bg-white/10">
          小明<span className="ml-0.5 h-5 w-px bg-current motion-safe:animate-pulse" />
        </div>
        <p className="text-xs text-slate-500">你的名字</p>
      </Mock>
    ),
  },
  {
    title: '第二步：讀句子、撒網',
    body: '讀完句子，憑感覺把網子拖到你覺得的位置：越左越難過，越右越開心。鍵盤可以用 ← → 移動，或按 1–9 直接跳。',
    art: (
      <Mock>
        <p className="text-lg font-bold">今天天氣好嗎？</p>
        <MiniSpectrum sway />
      </Mock>
    ),
  },
  {
    title: '第三步：撒網，看參考分數',
    body: (
      <>
        按「撒網！」或 Enter 鎖定答案，參考分數就會落下。越接近分數越高；連續拿到「很接近」以上，從第 2 句起每句多 ×{SCORING.comboStep}，最多 ×{SCORING.comboMax}。
      </>
    ),
    art: (
      <table className="w-full overflow-hidden rounded-2xl text-sm">
        <caption className="sr-only">計分方式</caption>
        <thead className="bg-slate-900/[0.04] text-left text-xs text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">結果</th>
            <th className="px-3 py-2 font-medium">差距</th>
            <th className="px-3 py-2 text-right font-medium">分數</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => (
            <tr key={tier} className="border-t border-slate-900/5 dark:border-white/5">
              <td className={`px-3 py-1.5 font-bold ${TIER_STYLE[tier].text}`}>
                {TIER_INFO[tier].symbol} {TIER_INFO[tier].label}
              </td>
              <td className="px-3 py-1.5 tabular-nums">{TIER_INFO[tier].range}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{pointsRange(tier)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
];

/** The 3-step tutorial of the 2018 version (name → slider → submit), redrawn for the new game. */
export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const done = step === STEPS.length;

  return (
    <Modal title={done ? '做得好！' : '怎麼玩'} onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <p className="text-mood font-display text-5xl font-black">All done!</p>
          <p className="text-lg">做得好！我們可以開始了！</p>
          <Button variant="primary" onClick={onClose} className="w-full max-w-xs" data-autofocus>
            Go！
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <ol className="flex items-center justify-center gap-2" aria-label={`第 ${step + 1} 步，共 ${STEPS.length} 步`}>
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={`grid size-8 place-items-center rounded-full text-sm font-bold transition ${i <= step ? 'bg-mood text-white' : 'bg-slate-900/10 text-slate-500 dark:bg-white/10'}`}
                aria-current={i === step ? 'step' : undefined}
              >
                {i + 1}
              </li>
            ))}
          </ol>
          <div key={step} className="flex animate-rise flex-col gap-4">
            {STEPS[step].art}
            <h3 className="font-display text-lg font-bold">{STEPS[step].title}</h3>
            <p className="text-slate-600 dark:text-slate-300">{STEPS[step].body}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(step - 1)} disabled={step === 0} className="flex-1">
              上一步
            </Button>
            <Button variant="primary" onClick={() => setStep(step + 1)} className="flex-1" data-autofocus>
              {step === STEPS.length - 1 ? '完成' : '下一步 →'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
