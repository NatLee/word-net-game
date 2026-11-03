import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui.tsx';

type Status = 'idle' | 'copied' | 'manual';

/**
 * "複製成績" puts the result text on the clipboard; "分享" opens the system share sheet where the
 * browser has one (most phones). If the clipboard is blocked, the text is shown to copy by hand.
 */
export function ShareButtons({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('manual');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ text });
    } catch {
      // Closing the share sheet rejects too; nothing to do.
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} className="flex-1">
          {status === 'copied' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {status === 'copied' ? '已複製' : '複製成績'}
        </Button>
        {canShare && (
          <Button onClick={share} className="flex-1">
            <Share2 className="size-4" aria-hidden="true" />
            分享
          </Button>
        )}
      </div>
      {status === 'manual' && (
        <label className="text-sm text-slate-600 dark:text-slate-300">
          瀏覽器不讓網頁複製，請自己選取下面的文字複製：
          <textarea readOnly value={text} rows={5} className="mt-2 w-full rounded-xl bg-white/70 p-3 font-mono text-xs dark:bg-black/30" />
        </label>
      )}
    </div>
  );
}
