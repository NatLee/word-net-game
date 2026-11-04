import { useRef, useState } from 'react';
import { LEADERBOARD_SIZE, MILESTONE_EVERY, MODES, SOURCE_URL } from './config.ts';
import { Celebration } from './components/Celebration.tsx';
import { Leaderboard, Settings, Welcome } from './components/dialogs.tsx';
import { Header, type Panel } from './components/Header.tsx';
import { Home } from './components/Home.tsx';
import { Play } from './components/Play.tsx';
import { Summary } from './components/Summary.tsx';
import { Tutorial } from './components/Tutorial.tsx';
import { MODE_INFO } from './game/labels.ts';
import { localDateKey } from './game/random.ts';
import { dealSentences, summarize, type RoundResult, type Session } from './game/session.ts';
import { shareText } from './game/share.ts';
import { useColorMode } from './hooks/useColorMode.ts';
import { useReducedMotion } from './hooks/useMedia.ts';
import { useStored } from './hooks/useStored.ts';
import { parseName } from './lib/name.ts';
import { gameUrl } from './lib/paths.ts';
import { addRun, crossedMilestone, parseAnnotations, parseDaily, parseRuns, rankRuns } from './lib/records.ts';
import { playCue } from './lib/sound.ts';
import type { Annotation, DailyRecord, ModeId, RunRecord, Sentence } from './types.ts';

type Screen =
  | { kind: 'home' }
  | { kind: 'play'; mode: ModeId; queue: Sentence[]; run: number }
  | { kind: 'summary'; session: Session; best: boolean };

const parseBool = (raw: unknown) => (typeof raw === 'boolean' ? raw : null);

interface AppProps {
  /** Every sentence the game can deal. */
  pool: readonly Sentence[];
  /** The clock, replaceable in tests. */
  now?: () => Date;
}

export function App({ pool, now = () => new Date() }: AppProps) {
  const reducedMotion = useReducedMotion();
  const { mode: colorMode, setMode: setColorMode } = useColorMode();
  const [name, setName] = useStored('name', parseName, '');
  const [sound, setSound] = useStored('sound', parseBool, true);
  const [annotations, setAnnotations] = useStored<Annotation[]>('annotations', parseAnnotations, []);
  const [runs, setRuns] = useStored<RunRecord[]>('runs', parseRuns, []);
  const [daily, setDaily] = useStored<Record<string, DailyRecord>>('daily', parseDaily, {});
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [panel, setPanel] = useState<Panel | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const runCounter = useRef(0);

  const today = localDateKey(now());
  const total = annotations.length;

  const start = (mode: ModeId) => {
    if (MODES[mode].seededByDate && daily[today]) return; // one daily run per day
    runCounter.current += 1;
    setScreen({ kind: 'play', mode, queue: dealSentences(mode, pool, today), run: runCounter.current });
  };

  const onAnswer = (result: RoundResult, mode: ModeId) => {
    const annotation: Annotation = {
      sentenceId: result.sentence.id,
      text: result.sentence.text,
      guess: result.guess,
      reference: result.sentence.score,
      mode,
      name,
      at: now().toISOString(),
    };
    setAnnotations((list) => [...list, annotation]);
    const reached = crossedMilestone(total, total + 1, MILESTONE_EVERY);
    if (reached) setMilestone(reached);
    if (sound) playCue(reached ? 'milestone' : result.tier);
  };

  const finish = (session: Session) => {
    const summary = summarize(session);
    const best = summary.rounds > 0 && summary.score > (rankRuns(runs, session.mode)[0]?.score ?? 0);
    if (summary.rounds > 0) {
      const run: RunRecord = { mode: session.mode, name, ...summary, at: now().toISOString() };
      setRuns((list) => addRun(list, run, LEADERBOARD_SIZE));
    }
    if (MODES[session.mode].seededByDate) {
      const record: DailyRecord = {
        date: today,
        score: summary.score,
        tiers: session.results.map((r) => r.tier),
        bestStreak: summary.bestStreak,
        averageDistance: summary.averageDistance,
      };
      setDaily((days) => ({ ...days, [today]: record }));
    }
    setScreen({ kind: 'summary', session, best });
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
            runs={runs}
            dailyDone={todayRecord}
            dailyShareText={todayRecord && shareFor('daily', todayRecord)}
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
      {milestone !== null && <Celebration milestone={milestone} reducedMotion={reducedMotion} onClose={() => setMilestone(null)} />}
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
