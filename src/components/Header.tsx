import { CircleHelp, Monitor, Moon, NotebookPen, Settings, Sun, Trophy, Volume2, VolumeX } from 'lucide-react';
import { GAME_TITLE } from '../config.ts';
import { nextMode } from '../lib/color-mode.ts';
import type { ColorMode } from '../types.ts';
import { IconButton, Logo } from './ui.tsx';

export type Panel = 'tutorial' | 'leaderboard' | 'annotations' | 'settings';

const COLOR_ICON = { system: Monitor, light: Sun, dark: Moon };
const COLOR_LABEL = { system: '跟系統', light: '淺色', dark: '深色' };

interface HeaderProps {
  /** Answers so far; the 2018 version showed this count at the top of the page. */
  total: number;
  /** Hide the panels while a run is on, so a dialog never covers a running clock. */
  playing: boolean;
  onOpen: (panel: Panel) => void;
  sound: boolean;
  onSound: (on: boolean) => void;
  colorMode: ColorMode;
  onColorMode: (mode: ColorMode) => void;
}

export function Header({ total, playing, onOpen, sound, onSound, colorMode, onColorMode }: HeaderProps) {
  const ColorIcon = COLOR_ICON[colorMode];
  const next = nextMode(colorMode);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/5 bg-[var(--page)]/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl dark:border-white/5">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
        <span className="flex items-center gap-2.5">
          <Logo className="size-9" />
          <span className="hidden font-display text-lg font-bold tracking-tight min-[420px]:inline">{GAME_TITLE}</span>
        </span>
        <span
          className="ml-1 rounded-full bg-slate-900/5 px-2.5 py-1 font-display text-sm font-semibold tabular-nums dark:bg-white/10"
          title="已經判斷的句數"
          aria-label={`已經判斷 ${total} 句`}
        >
          {total}
        </span>
        <nav className="ml-auto flex items-center" aria-label="選單">
          {!playing && (
            <>
              <IconButton label="怎麼玩" onClick={() => onOpen('tutorial')}>
                <CircleHelp className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton label="排行榜" onClick={() => onOpen('leaderboard')}>
                <Trophy className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton label="我的標註" onClick={() => onOpen('annotations')}>
                <NotebookPen className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton label="設定" onClick={() => onOpen('settings')}>
                <Settings className="size-5" aria-hidden="true" />
              </IconButton>
            </>
          )}
          <IconButton label={sound ? '關掉音效' : '打開音效'} aria-pressed={sound} onClick={() => onSound(!sound)}>
            {sound ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
          </IconButton>
          <IconButton label={`外觀：${COLOR_LABEL[colorMode]}（按一下換成${COLOR_LABEL[next]}）`} onClick={() => onColorMode(next)}>
            <ColorIcon className="size-5" aria-hidden="true" />
          </IconButton>
        </nav>
      </div>
    </header>
  );
}
