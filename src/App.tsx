import { useMemo, useRef, useState } from 'react';
import { LEADERBOARD_SIZE, MILESTONE_EVERY, MODES, SOURCE_URL } from './config.ts';
import { Confetti } from './components/Confetti.tsx';
import { Leaderboard, Settings, Welcome } from './components/dialogs.tsx';
import { Header, type Panel } from './components/Header.tsx';
import { Home } from './components/Home.tsx';
import { Play } from './components/Play.tsx';
import { Profile } from './components/Profile.tsx';
import { Summary, type Gains } from './components/Summary.tsx';
import { Toaster, type Toast } from './components/Toaster.tsx';
import { Tutorial } from './components/Tutorial.tsx';
import { ACHIEVEMENTS, satisfied, type AchievementContext } from './game/achievements.ts';
import { MODE_INFO } from './game/labels.ts';
import { rankUp, xpOf } from './game/progress.ts';
import { localDateKey } from './game/random.ts';
import { distance, tierFor } from './game/scoring.ts';
import { dealSentences, lastResult, summarize, type Session } from './game/session.ts';
import { shareText } from './game/share.ts';
import { useColorMode } from './hooks/useColorMode.ts';
import { useReducedMotion } from './hooks/useMedia.ts';
import { useStored } from './hooks/useStored.ts';
import { parseName } from './lib/name.ts';
import { gameUrl } from './lib/paths.ts';
import { addRun, crossedMilestone, parseAnnotations, parseDaily, parseRuns, parseUnlocked, rankRuns } from './lib/records.ts';
import { playCue, type Cue } from './lib/sound.ts';
import type { Annotation, DailyRecord, ModeId, RunRecord, Sentence, SentencePack } from './types.ts';

type Screen =
  | { kind: 'home' }
  | { kind: 'play'; mode: ModeId; queue: Sentence[]; run: number; xpAtStart: number }
  | { kind: 'summary'; session: Session; best: boolean; gains: Gains };

const parseBool = (raw: unknown) => (typeof raw === 'boolean' ? raw : null);

interface AppProps {
  /** The sentence packs the game can deal from. */
  packs: readonly SentencePack[];
  /** The clock, replaceable in tests. */
  now?: () => Date;
}

export function App({ packs, now = () => new Date() }: AppProps) {
  const reducedMotion = useReducedMotion();
  const { mode: colorMode, setMode: setColorMode } = useColorMode();
  const [name, setName] = useStored('name', parseName, '');
  const [sound, setSound] = useStored('sound', parseBool, true);
  const [annotations, setAnnotations] = useStored<Annotation[]>('annotations', parseAnnotations, []);
  const [runs, setRuns] = useStored<RunRecord[]>('runs', parseRuns, []);
  const [daily, setDaily] = useStored<Record<string, DailyRecord>>('daily', parseDaily, {});
  const [unlocked, setUnlocked] = useStored<Record<string, string>>('achievements', parseUnlocked, {});
  // The chosen pack; null (or a pack that no longer exists) means all packs.
  const [packId, setPackId] = useStored<string | null>('pack', (raw) => (packs.some((p) => p.id === raw) ? (raw as string) : null), null);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState<number | null>(null);
  const runCounter = useRef(0);
  const toastCounter = useRef(0);
  /** Achievements unlocked during the current run, for the summary. */
  const runUnlocks = useRef<string[]>([]);

  const everything = useMemo(() => packs.flatMap((p) => p.sentences), [packs]);
  const byId = useMemo(() => new Map(everything.map((s) => [s.id, s])), [everything]);
  const packIds = useMemo(() => packs.map((p) => p.id), [packs]);

  const today = localDateKey(now());
  const total = annotations.length;
  const xp = xpOf(annotations);

  const notify = (toast: Omit<Toast, 'id'>) => {
    toastCounter.current += 1;
    setToasts((list) => [...list, { ...toast, id: toastCounter.current }]);
  };
  const celebrate = (seed: number) => {
    if (!reducedMotion) setConfetti(seed);
  };

  /** Unlocks every achievement the context newly satisfies; returns their ids. */
  const unlockFrom = (ctx: Omit<AchievementContext, 'sentences' | 'packIds' | 'daily'> & { daily?: AchievementContext['daily'] }) => {
    const fresh = satisfied({ sentences: byId, packIds, daily, ...ctx }).filter((id) => !unlocked[id] && !runUnlocks.current.includes(id));
    if (fresh.length === 0) return fresh;
    const at = now().toISOString();
    setUnlocked((map) => ({ ...map, ...Object.fromEntries(fresh.map((id) => [id, at])) }));
    runUnlocks.current.push(...fresh);
    for (const id of fresh) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id)!;
      notify({ kind: 'achievement', title: `解鎖成就：${achievement.title}`, body: achievement.description });
    }
    return fresh;
  };

  const start = (mode: ModeId) => {
    if (MODES[mode].seededByDate && daily[today]) return; // one daily run per day
    runCounter.current += 1;
    runUnlocks.current = [];
    // Date-seeded modes always deal from every pack, so everyone gets the same sentences that day.
    const chosen = packs.find((p) => p.id === packId);
    const pool = MODES[mode].seededByDate || !chosen ? everything : chosen.sentences;
    setScreen({ kind: 'play', mode, queue: dealSentences(mode, pool, today), run: runCounter.current, xpAtStart: xp });
  };

  const onAnswer = (session: Session) => {
    const result = lastResult(session)!;
    const answer: Annotation = {
      sentenceId: result.sentence.id,
      text: result.sentence.text,
      guess: result.guess,
      reference: result.sentence.score,
      mode: session.mode,
      name,
      points: result.points,
      at: now().toISOString(),
    };
    const answers = [...annotations, answer];
    setAnnotations(answers);

    let cue: Cue = result.tier;
    const reached = crossedMilestone(total, answers.length, MILESTONE_EVERY);
    if (reached) {
      notify({ kind: 'milestone', title: `恭喜！你已經判斷了 ${reached} 句`, body: '離下一個一百又更近一步了呢！' });
      celebrate(reached);
      cue = 'milestone';
    }
    const rank = rankUp(xp, xp + result.points);
    if (rank) {
      notify({ kind: 'rank', title: `升級！Lv.${rank.level} ${rank.title}`, body: `經驗值 ${xp + result.points} XP` });
      celebrate(rank.level * 1000);
      cue = 'milestone';
    }
    if (unlockFrom({ answers, session, finished: false }).length > 0 && cue === result.tier) cue = 'unlock';
    if (sound) playCue(cue);
  };

  const finish = (session: Session) => {
    const summary = summarize(session);
    const best = summary.rounds > 0 && summary.score > (rankRuns(runs, session.mode)[0]?.score ?? 0);
    if (summary.rounds > 0) {
      const run: RunRecord = { mode: session.mode, name, ...summary, at: now().toISOString() };
      setRuns((list) => addRun(list, run, LEADERBOARD_SIZE));
    }
    let days = daily;
    if (MODES[session.mode].seededByDate) {
      const record: DailyRecord = {
        date: today,
        score: summary.score,
        tiers: session.results.map((r) => r.tier),
        bestStreak: summary.bestStreak,
        averageDistance: summary.averageDistance,
      };
      days = { ...daily, [today]: record };
      setDaily(days);
    }
    unlockFrom({ answers: annotations, session, finished: true, daily: days });
    const xpAtStart = screen.kind === 'play' ? screen.xpAtStart : xp;
    const gains: Gains = {
      xp: summary.score,
      rank: rankUp(xpAtStart, xp),
      achievements: ACHIEVEMENTS.filter((a) => runUnlocks.current.includes(a.id)),
    };
    setScreen({ kind: 'summary', session, best, gains });
  };

  /** Leaving a run early: the daily challenge still counts what was answered, the others are dropped. */
  const quit = (session: Session) => {
    if (MODES[session.mode].seededByDate && session.results.length > 0) finish(session);
    else setScreen({ kind: 'home' });
  };

  const dateOf = (mode: ModeId) => (MODES[mode].seededByDate ? today : undefined);
  const shareFor = (mode: ModeId, result: Omit<DailyRecord, 'date'>) => shareText({ mode, date: dateOf(mode), ...result, url: gameUrl() });
  const todayRecord = daily[today];
  const finished = screen.kind === 'summary' ? { session: screen.session, summary: summarize(screen.session) } : null;
  const perfects = annotations.filter((a) => tierFor(distance(a.guess, a.reference)) === 'perfect').length;
  const bestStreak = runs.reduce((best, r) => Math.max(best, r.bestStreak), 0);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <Backdrop />
      <Header
        total={total}
        playing={screen.kind === 'play'}
        onOpen={setPanel}
        sound={sound}
        onSound={setSound}
        colorMode={colorMode}
        onColorMode={setColorMode}
      />

      <main className="relative flex flex-1 flex-col px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-10">
        {screen.kind === 'home' && (
          <Home
            name={name}
            total={total}
            xp={xp}
            runs={runs}
            dailyDone={todayRecord}
            dailyShareText={todayRecord && shareFor('daily', todayRecord)}
            packs={packs}
            packId={packId}
            onPack={setPackId}
            onStart={start}
          />
        )}
        {screen.kind === 'play' && (
          <Play
            key={screen.run}
            mode={screen.mode}
            queue={screen.queue}
            reducedMotion={reducedMotion}
            onAnswer={onAnswer}
            onFinish={finish}
            onQuit={quit}
          />
        )}
        {screen.kind === 'summary' && finished && (
          <Summary
            session={finished.session}
            title={[MODE_INFO[finished.session.mode].title, dateOf(finished.session.mode)].filter(Boolean).join(' ')}
            shareText={shareFor(finished.session.mode, { ...finished.summary, tiers: finished.session.results.map((r) => r.tier) })}
            best={screen.best}
            gains={screen.gains}
            onAgain={MODES[finished.session.mode].seededByDate ? null : () => start(finished.session.mode)}
            onHome={() => setScreen({ kind: 'home' })}
            reducedMotion={reducedMotion}
          />
        )}
      </main>

      <footer className="relative px-4 pb-6 text-center text-xs text-slate-600 dark:text-slate-400">
        句子和參考分數是為這個遊戲原創的，只是一種看法，不是標準答案。·{' '}
        <a className="underline decoration-dotted underline-offset-4 hover:text-slate-900 dark:hover:text-white" href={SOURCE_URL}>
          原始碼
        </a>
      </footer>

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((list) => list.filter((t) => t.id !== id))} />
      {confetti !== null && <Confetti seed={confetti} onDone={() => setConfetti(null)} />}

      {!name && (
        <Welcome
          onDone={(chosen, tutorial) => {
            setName(chosen);
            if (tutorial) setPanel('tutorial');
          }}
        />
      )}
      {name && panel === 'tutorial' && <Tutorial onClose={() => setPanel(null)} />}
      {name && panel === 'leaderboard' && <Leaderboard runs={runs} annotations={annotations} onClose={() => setPanel(null)} />}
      {name && panel === 'profile' && (
        <Profile name={name} xp={xp} answers={total} perfects={perfects} bestStreak={bestStreak} unlocked={unlocked} onClose={() => setPanel(null)} />
      )}
      {name && panel === 'settings' && (
        <Settings
          name={name}
          onName={setName}
          sound={sound}
          onSound={setSound}
          colorMode={colorMode}
          onColorMode={setColorMode}
          reducedMotion={reducedMotion}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}

/** The glowing blobs and the faint net behind every screen. */
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 -left-32 size-[34rem] animate-drift rounded-full bg-sad/25 blur-3xl dark:bg-sad/30" />
      <div className="absolute top-1/3 -right-40 size-[30rem] animate-drift rounded-full bg-happy/25 blur-3xl [animation-delay:-8s] dark:bg-warm/20" />
      <div className="absolute -bottom-48 left-1/4 size-[28rem] animate-drift rounded-full bg-calm/20 blur-3xl [animation-delay:-14s]" />
      <div className="bg-net absolute inset-0 text-slate-900/[0.06] dark:text-white/[0.05]" />
    </div>
  );
}
