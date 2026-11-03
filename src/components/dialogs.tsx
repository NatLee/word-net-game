import { Download, Monitor, Moon, Send, Sun, Volume2, VolumeX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ANNOTATION_FORM, LEADERBOARD_SIZE } from '../config.ts';
import { MODE_INFO, MODE_ORDER } from '../game/labels.ts';
import { downloadText } from '../lib/download.ts';
import { sendAnnotations } from '../lib/google-form.ts';
import { annotationsToCSV, annotationsToJSON, labelCounts, rankRuns } from '../lib/records.ts';
import type { Annotation, ColorMode, ModeId, RunRecord } from '../types.ts';
import { Modal } from './Modal.tsx';
import { validName } from '../lib/name.ts';
import { NameField } from './NameField.tsx';
import { Button } from './ui.tsx';


/** First visit: ask for a name (the 2018 version opened with the same request). */
export function Welcome({ onDone }: { onDone: (name: string, tutorial: boolean) => void }) {
  const [value, setValue] = useState('');
  const name = validName(value);
  const submit = (tutorial: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    if (name) onDone(name, tutorial);
  };
  return (
    <Modal title="歡迎來到 Word Net">
      <form onSubmit={submit(false)} className="flex flex-col gap-5">
        <p className="text-slate-600 dark:text-slate-300">先取個名字吧！玩法很簡單，不確定的話可以先看 3 步驟教學。</p>
        <NameField value={value} onChange={setValue} autoFocus />
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit(true)} disabled={!name} className="flex-1">
            先看教學
          </Button>
          <Button type="submit" variant="primary" disabled={!name} className="flex-1">
            開始玩
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const dateFormat = new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

type Board = ModeId | 'labels';

/** Best runs per mode, and the 2018 ranking: different sentences labelled per name. On this device only. */
export function Leaderboard({ runs, annotations, onClose }: { runs: readonly RunRecord[]; annotations: readonly Annotation[]; onClose: () => void }) {
  const [board, setBoard] = useState<Board>('classic');
  const tabs: { id: Board; label: string }[] = [...MODE_ORDER.map((id) => ({ id, label: MODE_INFO[id].title })), { id: 'labels', label: '標註數' }];
  const rows =
    board === 'labels'
      ? labelCounts(annotations).map((r) => ({ key: r.name, name: r.name, value: `${r.count} 句`, when: '' }))
      : rankRuns(runs, board).map((r) => ({ key: r.at, name: r.name, value: `${r.score} 分`, when: dateFormat.format(new Date(r.at)) }));

  return (
    <Modal title="排行榜" onClose={onClose}>
      <div role="tablist" aria-label="排行榜種類" className="mb-4 flex gap-1 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={board === tab.id}
            onClick={() => setBoard(tab.id)}
            className={`min-h-10 flex-1 rounded-xl text-sm font-semibold transition ${board === tab.id ? 'bg-white shadow dark:bg-white/15' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-slate-500 dark:text-slate-400">還沒有紀錄，玩一局就會出現在這裡。</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <li key={row.key} className="flex items-center gap-3 rounded-2xl bg-slate-900/[0.03] px-4 py-2.5 dark:bg-white/[0.04]">
              <span className={`w-6 text-center font-display font-bold ${i < 3 ? 'text-mood' : 'text-slate-400'}`}>{i + 1}</span>
              <span className="flex-1 truncate font-medium">{row.name}</span>
              {row.when && <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">{row.when}</span>}
              <span className="font-display font-bold tabular-nums">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        {board === 'labels'
          ? '跟 2018 年的排行一樣，算的是每個名字判斷過幾個不同的句子。'
          : `每種模式保留最高分的 ${LEADERBOARD_SIZE} 次。`}
        排行榜只存在這台裝置的瀏覽器裡，清除網站資料就會消失。
      </p>
    </Modal>
  );
}

type SendState = { step: 'idle' } | { step: 'confirm' } | { step: 'sending' } | { step: 'done'; sent: number; failed: number };

/** The player's answers: download them, or send the unsent ones to the Google Form like the 2018 version did. */
export function Annotations({
  annotations,
  onSent,
  onClose,
  now = () => new Date(),
}: {
  annotations: readonly Annotation[];
  onSent: (sent: Annotation[]) => void;
  onClose: () => void;
  now?: () => Date;
}) {
  const [state, setState] = useState<SendState>({ step: 'idle' });
  const unsent = annotations.filter((a) => !a.sentAt);
  const stamp = () => now().toISOString().slice(0, 10);

  const send = async () => {
    if (!ANNOTATION_FORM) return;
    setState({ step: 'sending' });
    const result = await sendAnnotations(ANNOTATION_FORM, unsent, fetch, now);
    onSent(result.sent);
    setState({ step: 'done', sent: result.sent.length, failed: result.failed });
  };

  return (
    <Modal title="我的標註" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-slate-600 dark:text-slate-300">
          你在這台裝置上判斷過 <b className="font-display text-lg text-slate-900 dark:text-white">{annotations.length}</b> 句
          {ANNOTATION_FORM && <>，其中 {unsent.length} 句還沒送出</>}。每一句都記下了句子、你給的分數和參考分數。
        </p>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">下載</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={annotations.length === 0}
              onClick={() => downloadText(`word-net-${stamp()}.json`, annotationsToJSON(annotations, now().toISOString()), 'application/json')}
              className="flex-1"
            >
              <Download className="size-4" aria-hidden="true" />
              JSON
            </Button>
            <Button
              disabled={annotations.length === 0}
              onClick={() => downloadText(`word-net-${stamp()}.csv`, annotationsToCSV(annotations), 'text/csv;charset=utf-8')}
              className="flex-1"
            >
              <Download className="size-4" aria-hidden="true" />
              CSV（Excel 可開）
            </Button>
          </div>
        </section>

        {ANNOTATION_FORM && (
          <section className="flex flex-col gap-3 rounded-2xl bg-slate-900/[0.03] p-4 dark:bg-white/[0.04]">
            <h3 className="font-semibold">送出標註</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              跟 2018 年的版本一樣，可以把你的名字、句子和你給的分數送到作者的 Google 表單，幫忙累積情緒標註資料。只有按下面的按鈕才會送出。
            </p>
            {state.step === 'idle' && (
              <Button variant="primary" disabled={unsent.length === 0} onClick={() => setState({ step: 'confirm' })}>
                <Send className="size-4" aria-hidden="true" />
                送出 {unsent.length} 句
              </Button>
            )}
            {state.step === 'confirm' && (
              <div className="flex flex-col gap-3" role="alertdialog" aria-label="確認送出">
                <p className="font-semibold">你確定嗎？一旦按下確定，這 {unsent.length} 句就會送出，不能收回。</p>
                <div className="flex gap-2">
                  <Button onClick={() => setState({ step: 'idle' })} className="flex-1" data-autofocus>
                    不要
                  </Button>
                  <Button variant="primary" onClick={send} className="flex-1">
                    確定送出
                  </Button>
                </div>
              </div>
            )}
            {state.step === 'sending' && <p role="status">送出中…</p>}
            {state.step === 'done' && (
              <div role="status" className="flex flex-col gap-1 text-sm">
                <p className="font-semibold">已送出 {state.sent} 句，請繼續努力！</p>
                {state.failed > 0 && <p className="text-miss-ink dark:text-miss">有 {state.failed} 句沒送出去（可能是網路斷了），稍後可以再送一次。</p>}
                <p className="text-slate-500 dark:text-slate-400">Google 表單不會告訴其他網站有沒有收到，所以這裡只能確認資料送出去了。</p>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

const COLOR_CHOICES: { mode: ColorMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'system', label: '跟系統', Icon: Monitor },
  { mode: 'light', label: '淺色', Icon: Sun },
  { mode: 'dark', label: '深色', Icon: Moon },
];

export function Settings({
  name,
  onName,
  sound,
  onSound,
  colorMode,
  onColorMode,
  reducedMotion,
  onClose,
}: {
  name: string;
  onName: (name: string) => void;
  sound: boolean;
  onSound: (on: boolean) => void;
  colorMode: ColorMode;
  onColorMode: (mode: ColorMode) => void;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState(name);
  const cleaned = validName(value);
  return (
    <Modal title="設定" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (cleaned) onName(cleaned);
          }}
        >
          <NameField value={value} onChange={setValue} />
          <Button type="submit" disabled={!cleaned || cleaned === name} className="self-end">
            {cleaned === name ? '已儲存' : '儲存名字'}
          </Button>
        </form>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">音效</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">揭曉和里程碑的短音效。</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-label="音效"
            onClick={() => onSound(!sound)}
            className={`flex h-9 w-16 items-center rounded-full p-1 transition ${sound ? 'bg-mood' : 'bg-slate-300 dark:bg-white/15'}`}
          >
            <span className={`grid size-7 place-items-center rounded-full bg-white text-slate-700 shadow transition ${sound ? 'translate-x-7' : ''}`}>
              {sound ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
            </span>
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">外觀</legend>
          <div className="flex gap-1 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
            {COLOR_CHOICES.map(({ mode, label, Icon }) => (
              <label
                key={mode}
                className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition has-[:focus-visible]:outline-2 ${colorMode === mode ? 'bg-white shadow dark:bg-white/15' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <input type="radio" name="color-mode" value={mode} checked={colorMode === mode} onChange={() => onColorMode(mode)} className="sr-only" />
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          減少動態：跟著系統設定，目前{reducedMotion ? '已開啟，動畫和彩帶都會關掉' : '沒有開啟'}。
        </p>
      </div>
    </Modal>
  );
}
