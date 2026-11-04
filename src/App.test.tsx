import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { DUO, MODES, RUSH_REVEAL_MS } from './config.ts';
import { storageKey, writeStored } from './lib/storage.ts';
import { media } from './test/setup.ts';
import type { Annotation, Sentence, SentencePack } from './types.ts';

// Every sentence scores +0.5, so pressing 7 (= +0.5) is always perfect, whatever order they are dealt in.
const pool: Sentence[] = Array.from({ length: 12 }, (_, i) => ({ id: `t-${i}`, text: `測試句子 ${i}`, score: 0.5, tags: [], pack: 'test' }));
const pack = (id: string, title: string, sentences: Sentence[]): SentencePack => ({ id, title, language: 'zh-TW', source: 'test', license: 'CC0-1.0', sentences });
const packs = [pack('test', '測試', pool)];
const now = () => new Date(2026, 10, 4, 9, 30);

const saved = (name: string) => JSON.parse(localStorage.getItem(storageKey(name)) ?? 'null');

function setup({ named = true }: { named?: boolean } = {}) {
  if (named) writeStored('name', '小明');
  const user = userEvent.setup();
  render(<App packs={packs} now={now} />);
  return user;
}

async function answer(user: ReturnType<typeof userEvent.setup>, key: string) {
  await user.keyboard(key); // the slider has focus while guessing
  await user.keyboard('{Enter}'); // lock
}

beforeEach(() => {
  media.reducedMotion = true; // scores show at once instead of counting up
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('first visit', () => {
  it('asks for a name before anything else and remembers it', async () => {
    const user = setup({ named: false });
    const dialog = screen.getByRole('dialog', { name: '歡迎來到 Word Net' });
    const play = within(dialog).getByRole('button', { name: '開始玩' });
    expect(play).toBeDisabled();
    await user.type(within(dialog).getByLabelText('你的名字'), '  小明  ');
    await user.click(play);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saved('name')).toBe('小明');
    expect(screen.getByText(/嗨/)).toHaveTextContent('嗨，小明');
  });

  it('can start with the 3-step tutorial, which ends like the 2018 one', async () => {
    const user = setup({ named: false });
    await user.type(screen.getByLabelText('你的名字'), '阿華');
    await user.click(screen.getByRole('button', { name: '先看教學' }));
    const tutorial = screen.getByRole('dialog', { name: '怎麼玩' });
    expect(within(tutorial).getByText('第一步：取名字')).toBeInTheDocument();
    await user.click(within(tutorial).getByRole('button', { name: '下一步 →' }));
    expect(within(tutorial).getByText('第二步：讀句子、撒網')).toBeInTheDocument();
    await user.click(within(tutorial).getByRole('button', { name: '下一步 →' }));
    expect(within(tutorial).getByRole('table', { name: '計分方式' })).toHaveTextContent('75–89');
    await user.click(within(tutorial).getByRole('button', { name: '完成' }));
    expect(screen.getByText('做得好！我們可以開始了！')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go！' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('a classic run', () => {
  it('plays 10 sentences with the keyboard, builds a combo and lands on the leaderboard', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /開始經典/ }));

    const slider = screen.getByRole('slider', { name: '這句話的情緒' });
    expect(slider).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '0.1');
    expect(slider).toHaveAttribute('aria-valuetext', '普通（+0.10）');

    await answer(user, '7');
    expect(screen.getByText('完美！')).toBeInTheDocument();
    expect(screen.getByText('參考 +0.50｜你 +0.50｜差距 0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一句' })).toHaveFocus();

    for (let i = 1; i < MODES.classic.rounds; i++) {
      await user.keyboard('{Enter}'); // next
      await answer(user, '7');
    }
    // Perfect every time: 100, 125, 150, 175, then ×2 for the other six = 1750.
    expect(screen.getByLabelText('目前 1750 分')).toBeInTheDocument();
    await user.keyboard('{Enter}'); // 看結算

    expect(screen.getByRole('img', { name: /成績卡：1750 分，10 句/ })).toBeInTheDocument();
    expect(screen.getByText('新紀錄！')).toBeInTheDocument();
    expect(screen.getByLabelText(`已經判斷 ${MODES.classic.rounds} 句`)).toBeInTheDocument();
    expect(saved('annotations')).toHaveLength(MODES.classic.rounds);

    await user.click(screen.getByRole('button', { name: '回首頁' }));
    expect(screen.getByText('最佳 1750 分')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '排行榜' }));
    const board = screen.getByRole('dialog', { name: '排行榜' });
    expect(within(board).getByText('1750 分')).toBeInTheDocument();
    await user.click(within(board).getByRole('tab', { name: '標註數' }));
    expect(within(board).getByText(`${MODES.classic.rounds} 句`)).toBeInTheDocument();
  });

  it('moves the net where the player taps the scale', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /開始經典/ }));
    const slider = screen.getByRole('slider');
    const track = slider.firstElementChild as HTMLElement;
    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 400, top: 0, height: 10, right: 500, bottom: 10, x: 100, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(slider, { clientX: 400, pointerId: 1 }); // 3/4 of the way → +0.5
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
  });

  it('drops a run left halfway', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /開始經典/ }));
    await answer(user, '1');
    await user.click(screen.getByRole('button', { name: '離開' }));
    expect(screen.getByRole('button', { name: /開始經典/ })).toBeInTheDocument(); // back home
    expect(screen.getAllByText('還沒有紀錄')).toHaveLength(Object.keys(MODES).length); // no run was recorded in any mode
    expect(saved('annotations')).toHaveLength(1); // the answer itself still counts
  });
});

describe('sentence packs', () => {
  it('deal only from the chosen pack, remember the choice, and leave the daily challenge on every pack', async () => {
    const sad = Array.from({ length: 3 }, (_, i) => ({ id: `sad-${i}`, text: `難過的句子 ${i}`, score: -0.5, tags: [], pack: 'sad' }));
    writeStored('name', '小明');
    const user = userEvent.setup();
    render(<App packs={[pack('test', '測試', pool), pack('sad', '難過', sad)]} now={now} />);

    const picker = screen.getByRole('radiogroup', { name: '題庫' });
    expect(within(picker).getByRole('radio', { name: /全部/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(picker).getByRole('radio', { name: /^難過s*3$/ })).toBeInTheDocument();
    await user.click(within(picker).getByRole('radio', { name: /難過/ }));
    expect(saved('pack')).toBe('sad');

    await user.click(screen.getByRole('button', { name: /開始經典/ }));
    expect(screen.getByText(/^難過的句子/)).toBeInTheDocument();
    expect(screen.getByText('第 1 / 3 句', { exact: false })).toBeInTheDocument(); // the pack only has 3

    await user.click(screen.getByRole('button', { name: '離開' }));
    await user.click(screen.getByRole('button', { name: /開始每日挑戰/ }));
    expect(screen.getByText(`第 1 / ${MODES.daily.rounds} 句`, { exact: false })).toBeInTheDocument(); // dealt from both packs
  });
});

describe('the daily challenge', () => {
  it('can be played once a day and shared as text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await user.click(screen.getByRole('button', { name: /開始每日挑戰/ }));
    for (let i = 0; i < MODES.daily.rounds; i++) {
      await answer(user, i === 0 ? '1' : '7');
      await user.keyboard('{Enter}');
    }
    expect(screen.getByRole('heading', { name: '每日挑戰 2026-11-04' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '再玩一次' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '複製成績' }));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toMatch(/^Word Net 每日挑戰 2026-11-04\n\d+ 分（5 句）\n×◎◎◎◎\n/);
    expect(screen.getByRole('button', { name: '已複製' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '回首頁' }));
    expect(screen.queryByRole('button', { name: /開始每日挑戰/ })).not.toBeInTheDocument();
    expect(screen.getByText(/今天完成了/)).toBeInTheDocument();
  });
});

describe('the timed mode', () => {
  // Synchronous fireEvent here: Testing Library's async helpers wait on a real setTimeout(0),
  // which never fires while Vitest's fake timers are on.
  it('counts down only while guessing, moves on by itself and ends when time is up', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    writeStored('name', '小明');
    render(<App packs={packs} now={now} />);
    fireEvent.click(screen.getByRole('button', { name: /開始限時/ }));
    expect(screen.getByRole('timer')).toHaveAccessibleName(`剩下 ${MODES.rush.seconds} 秒`);

    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByRole('timer')).toHaveAccessibleName(`剩下 ${MODES.rush.seconds - 5} 秒`);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: '7' });
    fireEvent.keyDown(slider, { key: 'Enter' });
    expect(screen.getByText('完美！')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(RUSH_REVEAL_MS + 100)); // the reveal is free, then the next sentence comes
    expect(screen.getByText('第 2 句', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveAccessibleName(`剩下 ${MODES.rush.seconds - 5} 秒`);

    act(() => vi.advanceTimersByTime(MODES.rush.seconds * 1000));
    expect(screen.getByRole('heading', { name: '限時' })).toBeInTheDocument(); // summary title
    expect(screen.getByRole('button', { name: '再玩一次' })).toBeInTheDocument();
  });
});

describe('survival', () => {
  it('ends when the hearts run out', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /開始生存/ }));
    expect(screen.getByRole('img', { name: `剩下 ${MODES.survival.lives} 顆心，共 ${MODES.survival.lives} 顆` })).toBeInTheDocument();
    for (let i = 0; i < MODES.survival.lives; i++) {
      await answer(user, '1'); // -1 against +0.5: a miss
      expect(screen.getByText('失手，扣一顆心')).toBeInTheDocument();
      if (i < MODES.survival.lives - 1) await user.keyboard('{Enter}');
    }
    expect(screen.getByRole('button', { name: '看結算' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: '生存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再玩一次' })).toBeInTheDocument();
  });
});

const old = (over: Partial<Annotation> = {}): Annotation => ({ sentenceId: 'x', text: 'x', guess: 1, reference: 0, mode: 'classic', name: '小明', points: 0, at: 'then', ...over });

describe('duo', () => {
  it('lets two players take turns, hides the first net, and keeps the guest out of the owner count', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /開始雙人對戰/ }));
    const dialog = screen.getByRole('dialog', { name: '雙人對戰' });
    await user.type(within(dialog).getByLabelText('對手的名字'), '阿華');
    await user.click(within(dialog).getByRole('button', { name: '開始對戰' }));

    for (let i = 0; i < DUO.rounds; i++) {
      expect(screen.getByText(/輪到/)).toHaveTextContent('輪到 小明 撒網');
      await answer(user, '7'); // 小明: spot on
      expect(screen.getByText(/輪到/)).toHaveTextContent('輪到 阿華 撒網（小明 的網子先藏起來了）');
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0'); // the second net starts in the middle
      await answer(user, '5'); // 阿華: 0.5 off
      expect(screen.getByText(/這句/)).toHaveTextContent('這句 小明 贏！');
      await user.keyboard('{Enter}');
    }
    expect(screen.getByRole('heading', { name: '雙人對戰' })).toBeInTheDocument();
    expect(screen.getByText(/贏了！/)).toHaveTextContent('小明 贏了！');
    expect(screen.getByRole('button', { name: '再來一場' })).toBeInTheDocument();

    const stored: Annotation[] = saved('annotations');
    expect(stored.filter((a) => !a.guest)).toHaveLength(DUO.rounds);
    expect(stored.filter((a) => a.guest).map((a) => a.name)).toEqual(Array(DUO.rounds).fill('阿華'));
    expect(screen.getByLabelText(`已經判斷 ${DUO.rounds} 句`)).toBeInTheDocument(); // only the owner's answers
    expect(Object.keys(saved('achievements'))).toContain('duel');

    await user.click(screen.getByRole('button', { name: '回首頁' }));
    await user.click(screen.getByRole('button', { name: '排行榜' }));
    const board = screen.getByRole('dialog', { name: '排行榜' });
    await user.click(within(board).getByRole('tab', { name: '標註數' }));
    expect(within(board).getByText('阿華')).toBeInTheDocument(); // the guest still shows in the per-name ranking
  });
});

describe('milestones', () => {
  it('congratulates on the hundredth answer, like the 2018 version, without stopping the game', async () => {
    writeStored('annotations', Array.from({ length: 99 }, () => old()));
    const user = setup();
    expect(screen.getByText('再 1 句就到 100 句，每滿 100 句有小驚喜。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /開始經典/ }));
    await answer(user, '7');
    const toasts = screen.getByRole('status');
    expect(toasts).toHaveTextContent('恭喜！你已經判斷了 100 句');
    expect(toasts).toHaveTextContent('離下一個一百又更近一步了呢！');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一句' })).toHaveFocus(); // the game keeps going
  });
});

describe('ranks and achievements', () => {
  it('unlocks achievements as they happen and lists them in the profile', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /開始經典/ }));
    await answer(user, '7');
    const toasts = screen.getByRole('status');
    expect(toasts).toHaveTextContent('解鎖成就：第一網');
    expect(toasts).toHaveTextContent('解鎖成就：正中紅心');
    // The test game has a single pack, so answering once from it also visits every pack.
    expect(Object.keys(saved('achievements'))).toEqual(['first-cast', 'bullseye', 'explorer']);

    await user.click(screen.getByRole('button', { name: '離開' }));
    await user.click(screen.getByRole('button', { name: '我的檔案' }));
    const profile = screen.getByRole('dialog', { name: '小明 的檔案' });
    expect(within(profile).getByText('第一網').closest('li')).toHaveTextContent('（已解鎖）');
    expect(within(profile).getByText('零失誤').closest('li')).toHaveTextContent('（還沒解鎖）');
    expect(within(profile).getByText('Lv.1')).toBeInTheDocument();
  });

  it('turns points into experience and announces a new rank', async () => {
    writeStored('annotations', [old({ points: 450 })]); // 450 XP; the next rank starts at 500
    const user = setup();
    expect(screen.getByText('450 / 500 XP')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /開始經典/ }));
    await answer(user, '7'); // +100
    expect(screen.getByRole('status')).toHaveTextContent('升級！Lv.2 捕語學徒');
    for (let i = 1; i < MODES.classic.rounds; i++) {
      await user.keyboard('{Enter}');
      await answer(user, '7');
    }
    await user.keyboard('{Enter}');
    const gains = screen.getByRole('list', { name: '這一局的收穫' });
    expect(gains).toHaveTextContent('+1750 XP');
    expect(gains).toHaveTextContent('升到 Lv.3 情緒漁夫'); // 450 + 1750 = 2200
    expect(gains).toHaveTextContent('零失誤');
  });
});

describe('settings', () => {
  it('saves the sound switch, the colour mode and a new name', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '設定' }));
    const dialog = screen.getByRole('dialog', { name: '設定' });

    await user.click(within(dialog).getByRole('switch', { name: '音效' }));
    expect(saved('sound')).toBe(false);

    await user.click(within(dialog).getByLabelText('深色'));
    expect(saved('color-mode')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');

    const field = within(dialog).getByLabelText('你的名字');
    await user.clear(field);
    await user.type(field, '小美');
    await user.click(within(dialog).getByRole('button', { name: '儲存名字' }));
    expect(saved('name')).toBe('小美');
  });

  it('follows the OS colour scheme by default', () => {
    media.prefersDark = true;
    setup();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('closes dialogs with Escape', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: '排行榜' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
